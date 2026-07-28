-- ============================================================
-- HerRide — Phase 10: financial completion
-- Run ONCE in the Supabase SQL Editor after phase9-pricing-authority.sql.
-- Adds the remaining financial surface on top of the existing wallet /
-- ledger / payouts / pricing layers: receipts, analytics, time-bucketed
-- reports, an immutable audit log (with fraud-signal seam), and pricing
-- events. Money still moves ONLY inside the existing SECURITY DEFINER
-- settlement functions — nothing here changes balances.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- B. RECEIPTS — itemised, access-controlled. Recomputes the fare
--    components from pricing_config + the ride's stored inputs (same
--    formula as quote_fare) and pulls the driver/vehicle. Readable only
--    by that ride's passenger, its driver, or an admin.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_receipt(_ride_id UUID)
RETURNS TABLE (
  ride_id UUID, currency TEXT,
  base_fare NUMERIC, distance_cost NUMERIC, time_cost NUMERIC, booking_fee NUMERIC,
  total NUMERIC, commission NUMERIC, driver_earnings NUMERIC,
  distance_km NUMERIC, duration_min NUMERIC,
  driver_name TEXT, vehicle TEXT, plate TEXT,
  pickup_address TEXT, drop_address TEXT, completed_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rides; c public.pricing_config; m NUMERIC;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF auth.uid() NOT IN (r.passenger_id, r.driver_id) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised to view this receipt';
  END IF;
  SELECT * INTO c FROM public.pricing_config WHERE id = 'default';
  m := GREATEST(COALESCE(r.category_multiplier, 1), 0);

  RETURN QUERY
  SELECT
    r.id, c.currency,
    round((c.base_fare * m) / c.rounding) * c.rounding,
    round((GREATEST(COALESCE(r.distance_km, 0), 0) * c.per_km * m) / c.rounding) * c.rounding,
    round((GREATEST(COALESCE(r.duration_min, 0), 0) * c.per_min * m) / c.rounding) * c.rounding,
    c.booking_fee,
    COALESCE(r.fare_final, r.fare_estimate, 0),
    COALESCE(pl.commission, round(COALESCE(r.fare_final, 0) * c.commission_rate, 2)),
    COALESCE(pl.driver_payout, round(COALESCE(r.fare_final, 0) * (1 - c.commission_rate), 2)),
    r.distance_km, r.duration_min,
    p.full_name, NULLIF(concat_ws(' ', d.vehicle_make, d.vehicle_model), ''), d.vehicle_plate,
    r.pickup_address, r.drop_address, r.completed_at
  FROM (SELECT 1) _
  LEFT JOIN public.platform_ledger pl ON pl.ride_id = r.id
  LEFT JOIN public.profiles p ON p.id = r.driver_id
  LEFT JOIN public.drivers d ON d.user_id = r.driver_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_receipt(uuid) TO authenticated;

-- ------------------------------------------------------------
-- C/D. ANALYTICS + REPORTS (admin-only). One time-bucketed rollup
--     function serves both the revenue trend and the daily/monthly
--     reports, plus top-N leaderboards.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.financial_report(
  _bucket TEXT DEFAULT 'day', _since TIMESTAMPTZ DEFAULT now() - interval '30 days'
) RETURNS TABLE (
  period TIMESTAMPTZ, gross_revenue NUMERIC, commission_revenue NUMERIC,
  driver_earnings NUMERIC, rides BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _bucket NOT IN ('day', 'week', 'month') THEN _bucket := 'day'; END IF;
  RETURN QUERY
  SELECT date_trunc(_bucket, pl.created_at) AS period,
         SUM(pl.gross_fare), SUM(pl.commission), SUM(pl.driver_payout), COUNT(*)
  FROM public.platform_ledger pl
  WHERE pl.created_at >= _since
  GROUP BY 1 ORDER BY 1;
END; $$;
REVOKE EXECUTE ON FUNCTION public.financial_report(text, timestamptz) FROM anon;

CREATE OR REPLACE FUNCTION public.get_top_drivers(
  _since TIMESTAMPTZ DEFAULT now() - interval '30 days', _limit INT DEFAULT 5
) RETURNS TABLE (driver_id UUID, name TEXT, rides BIGINT, earnings NUMERIC) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT r.driver_id, p.full_name, COUNT(*), SUM(pl.driver_payout)
  FROM public.platform_ledger pl JOIN public.rides r ON r.id = pl.ride_id
  LEFT JOIN public.profiles p ON p.id = r.driver_id
  WHERE pl.created_at >= _since AND r.driver_id IS NOT NULL
  GROUP BY r.driver_id, p.full_name ORDER BY SUM(pl.driver_payout) DESC LIMIT _limit;
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_top_drivers(timestamptz, int) FROM anon;

CREATE OR REPLACE FUNCTION public.get_top_customers(
  _since TIMESTAMPTZ DEFAULT now() - interval '30 days', _limit INT DEFAULT 5
) RETURNS TABLE (passenger_id UUID, name TEXT, rides BIGINT, spend NUMERIC) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT r.passenger_id, p.full_name, COUNT(*), SUM(pl.gross_fare)
  FROM public.platform_ledger pl JOIN public.rides r ON r.id = pl.ride_id
  LEFT JOIN public.profiles p ON p.id = r.passenger_id
  WHERE pl.created_at >= _since
  GROUP BY r.passenger_id, p.full_name ORDER BY SUM(pl.gross_fare) DESC LIMIT _limit;
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_top_customers(timestamptz, int) FROM anon;

CREATE OR REPLACE FUNCTION public.get_top_routes(
  _since TIMESTAMPTZ DEFAULT now() - interval '30 days', _limit INT DEFAULT 5
) RETURNS TABLE (pickup TEXT, dropoff TEXT, rides BIGINT, revenue NUMERIC) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT COALESCE(r.pickup_address, '—'), COALESCE(r.drop_address, '—'), COUNT(*), SUM(pl.gross_fare)
  FROM public.platform_ledger pl JOIN public.rides r ON r.id = pl.ride_id
  WHERE pl.created_at >= _since
  GROUP BY r.pickup_address, r.drop_address ORDER BY COUNT(*) DESC LIMIT _limit;
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_top_routes(timestamptz, int) FROM anon;

-- ------------------------------------------------------------
-- E. AUDIT LOG — immutable record of sensitive financial actions, plus a
--    fraud-signal seam (architecture only; no rules yet).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit admin read" ON public.audit_log;
CREATE POLICY "Audit admin read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_audit_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_immutable
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.forbid_ledger_mutation();

CREATE OR REPLACE FUNCTION public.log_audit(_action TEXT, _entity TEXT, _entity_id UUID, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
  VALUES (auth.uid(), _action, _entity, _entity_id, COALESCE(_metadata, '{}'::jsonb));
$$;

CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  signal TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fraud_signals TO authenticated;
GRANT ALL ON public.fraud_signals TO service_role;
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Fraud admin read" ON public.fraud_signals;
CREATE POLICY "Fraud admin read" ON public.fraud_signals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seam for future detectors to record a signal (no automatic rules yet).
CREATE OR REPLACE FUNCTION public.flag_fraud_signal(_user_id UUID, _ride_id UUID, _signal TEXT, _severity TEXT DEFAULT 'low', _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
  VALUES (_user_id, _ride_id, _signal, _severity, COALESCE(_metadata, '{}'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.flag_fraud_signal(uuid, uuid, text, text, jsonb) FROM anon, authenticated;

-- Audit trail on pricing_config changes (rate/commission edits are sensitive).
CREATE OR REPLACE FUNCTION public.audit_pricing_config()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_audit('pricing_config_update', 'pricing_config', NULL,
    jsonb_build_object('commission_rate', NEW.commission_rate, 'base_fare', NEW.base_fare,
                       'per_km', NEW.per_km, 'per_min', NEW.per_min, 'booking_fee', NEW.booking_fee));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_audit_pricing_config ON public.pricing_config;
CREATE TRIGGER trg_audit_pricing_config
  AFTER UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_pricing_config();

-- Add audit logging to the existing refund + payout functions.
CREATE OR REPLACE FUNCTION public.refund_ride(_ride_id UUID, _amount NUMERIC, _reason TEXT DEFAULT NULL)
RETURNS public.transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rides; tx public.transactions; bal NUMERIC(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can issue refunds'; END IF;
  SELECT * INTO r FROM public.rides WHERE id = _ride_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Refund amount must be positive'; END IF;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description, metadata)
    VALUES (r.passenger_id, r.id, 'refund', 'completed', _amount, bal,
            COALESCE(_reason, 'Refund'), jsonb_build_object('reason', _reason, 'issued_by', auth.uid()))
    RETURNING * INTO tx;
  PERFORM public.log_audit('refund', 'ride', _ride_id,
    jsonb_build_object('amount', _amount, 'reason', _reason, 'passenger_id', r.passenger_id));
  RETURN tx;
END; $$;
REVOKE EXECUTE ON FUNCTION public.refund_ride(uuid, numeric, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_payout(_amount NUMERIC, _method public.payment_method DEFAULT 'mpesa', _destination TEXT DEFAULT NULL)
RETURNS public.payouts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.payouts; bal NUMERIC(12,2); newbal NUMERIC(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'driver') THEN RAISE EXCEPTION 'Only drivers can request payouts'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Payout amount must be positive'; END IF;
  SELECT balance INTO bal FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF bal IS NULL OR bal < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
    WHERE user_id = auth.uid() RETURNING balance INTO newbal;
  INSERT INTO public.transactions (user_id, type, status, amount, balance_after, description)
    VALUES (auth.uid(), 'withdrawal', 'completed', -_amount, newbal, 'Payout requested');
  INSERT INTO public.payouts (driver_user_id, amount, method, destination)
    VALUES (auth.uid(), _amount, _method, _destination) RETURNING * INTO p;
  PERFORM public.log_audit('payout', 'payout', p.id,
    jsonb_build_object('amount', _amount, 'method', _method));
  RETURN p;
END; $$;
REVOKE EXECUTE ON FUNCTION public.request_payout(numeric, public.payment_method, text) FROM anon;

CREATE OR REPLACE FUNCTION public.list_audit_log(_limit INT DEFAULT 50)
RETURNS SETOF public.audit_log LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.audit_log
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY created_at DESC LIMIT _limit;
$$;
REVOKE EXECUTE ON FUNCTION public.list_audit_log(int) FROM anon;

-- ------------------------------------------------------------
-- F. PRICING EVENTS — one row per booked quote, for pricing analytics.
--    Written by a trigger on ride creation, so no client change is needed.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID,
  distance_km NUMERIC(10,2), duration_min NUMERIC(10,2), category_multiplier NUMERIC(6,3),
  fare_estimate NUMERIC(12,2), currency TEXT NOT NULL DEFAULT 'KES',
  pricing_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_quotes_created ON public.pricing_quotes(created_at DESC);
GRANT SELECT ON public.pricing_quotes TO authenticated;
GRANT ALL ON public.pricing_quotes TO service_role;
ALTER TABLE public.pricing_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PricingQuotes admin read" ON public.pricing_quotes;
CREATE POLICY "PricingQuotes admin read" ON public.pricing_quotes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_pricing_quote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.pricing_quotes (ride_id, passenger_id, distance_km, duration_min, category_multiplier, fare_estimate)
  VALUES (NEW.id, NEW.passenger_id, NEW.distance_km, NEW.duration_min, NEW.category_multiplier, NEW.fare_estimate);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_log_pricing_quote ON public.rides;
CREATE TRIGGER trg_log_pricing_quote
  AFTER INSERT ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.log_pricing_quote();
