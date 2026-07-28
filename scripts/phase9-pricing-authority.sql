-- ============================================================
-- HerRide — Phase 9: server-side fare authority + 10% commission
-- Run ONCE in the Supabase SQL Editor after phase8-financials.sql.
-- Closes the trust gap where the client-computed fare was believed at
-- settlement. Now the DATABASE recomputes the authoritative fare from the
-- ride's stored inputs using the same formula as the Pricing Engine, and
-- complete_ride settles on THAT — a tampered client estimate can no longer
-- move money. Commission moves to a configurable pricing_config (default 10%).
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. pricing_config — the DB-backed rate card (the "Pricing Repository").
--    Single active row for now; add a city/region key later for
--    multi-market pricing. Values mirror the client engine's env defaults.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT NOT NULL DEFAULT 'KES',
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 180,
  per_km NUMERIC(10,2) NOT NULL DEFAULT 55,
  per_min NUMERIC(10,2) NOT NULL DEFAULT 8,
  booking_fee NUMERIC(10,2) NOT NULL DEFAULT 50,
  min_fare NUMERIC(10,2) NOT NULL DEFAULT 150,
  max_fare NUMERIC(10,2) NOT NULL DEFAULT 100000,
  rounding NUMERIC(10,2) NOT NULL DEFAULT 10,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,  -- platform keeps 10%
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.pricing_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
-- Ensure the default commission is 10% even if the row already existed at 20%.
UPDATE public.pricing_config SET commission_rate = 0.10 WHERE id = 'default';

GRANT SELECT ON public.pricing_config TO authenticated;
GRANT ALL ON public.pricing_config TO service_role;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PricingConfig read" ON public.pricing_config;
CREATE POLICY "PricingConfig read" ON public.pricing_config
  FOR SELECT TO authenticated USING (true);   -- rate card is public info
DROP POLICY IF EXISTS "PricingConfig admin write" ON public.pricing_config;
CREATE POLICY "PricingConfig admin write" ON public.pricing_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- 2. Persist the pricing inputs on the ride so the fare can be recomputed
--    server-side. distance_km already exists; add duration + tier multiplier.
-- ------------------------------------------------------------
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS duration_min NUMERIC(10,2);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS category_multiplier NUMERIC(6,3) DEFAULT 1;

-- ------------------------------------------------------------
-- 3. quote_fare — the single server-side fare calculator. Mirrors the client
--    engine's v1 formula (base + per-km + per-min, each scaled by the tier
--    multiplier and rounded to the nearest step, + flat booking fee, clamped
--    to [min,max]). Reads all rates from pricing_config — nothing hardcoded.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.quote_fare(
  _distance_km NUMERIC, _duration_min NUMERIC, _category_multiplier NUMERIC DEFAULT 1
) RETURNS NUMERIC LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.pricing_config;
  m NUMERIC; km NUMERIC; mins NUMERIC;
  base NUMERIC; dist NUMERIC; tcost NUMERIC; subtotal NUMERIC;
BEGIN
  SELECT * INTO c FROM public.pricing_config WHERE id = 'default';
  IF c.id IS NULL THEN RAISE EXCEPTION 'pricing_config not initialised'; END IF;
  m    := GREATEST(COALESCE(_category_multiplier, 1), 0);
  km   := GREATEST(COALESCE(_distance_km, 0), 0);
  mins := GREATEST(COALESCE(_duration_min, 0), 0);
  base  := round((c.base_fare * m) / c.rounding) * c.rounding;
  dist  := round((km * c.per_km * m) / c.rounding) * c.rounding;
  tcost := round((mins * c.per_min * m) / c.rounding) * c.rounding;
  subtotal := base + dist + tcost + c.booking_fee;
  RETURN LEAST(GREATEST(subtotal, c.min_fare), c.max_fare);
END; $$;
GRANT EXECUTE ON FUNCTION public.quote_fare(numeric, numeric, numeric) TO authenticated;

-- ------------------------------------------------------------
-- 4. complete_ride recomputes the fare server-side and settles on it.
--    Commission comes from pricing_config (10%); an explicit _commission
--    override is still honoured. The client's fare_estimate is used only as
--    a fallback when the ride predates the stored pricing inputs. Passenger/
--    driver legs + immutable platform_ledger are unchanged in shape.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_ride(_ride_id UUID, _commission NUMERIC DEFAULT NULL)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  commission NUMERIC(5,4);
  fare NUMERIC(12,2);
  payout NUMERIC(12,2);
  pass_bal NUMERIC(12,2);
  drv_bal NUMERIC(12,2);
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned driver can complete this ride';
  END IF;
  IF r.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Ride must be in progress to complete (is %)', r.status;
  END IF;

  commission := COALESCE(_commission, (SELECT commission_rate FROM public.pricing_config WHERE id = 'default'), 0.10);

  -- Server-authoritative fare. Fall back to the stored estimate only for
  -- legacy rides that lack the pricing inputs.
  IF r.distance_km IS NOT NULL THEN
    fare := public.quote_fare(r.distance_km, r.duration_min, COALESCE(r.category_multiplier, 1));
  ELSE
    fare := COALESCE(r.fare_estimate, 0);
  END IF;
  payout := round(fare * (1 - commission), 2);

  UPDATE public.wallets SET balance = balance - fare, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO pass_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.passenger_id, r.id, 'ride_payment', 'completed', -fare, pass_bal, 'Ride payment');

  UPDATE public.wallets SET balance = balance + payout, updated_at = now()
    WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.driver_id, r.id, 'ride_payout', 'completed', payout, drv_bal, 'Ride payout');

  INSERT INTO public.platform_ledger (ride_id, gross_fare, commission, driver_payout, commission_rate, currency)
    VALUES (r.id, fare, fare - payout, payout, commission, 'KES')
    ON CONFLICT (ride_id) DO NOTHING;

  UPDATE public.rides SET status = 'completed', completed_at = now(), fare_final = fare
    WHERE id = r.id RETURNING * INTO r;
  RETURN r;
END; $$;
