-- ============================================================
-- HerRide — Phase 13: growth — promo codes & referral program
-- Run ONCE in the Supabase SQL Editor after phase12-chat.sql.
-- Promo discounts and referral credit are SERVER-AUTHORITATIVE: codes are
-- validated and locked in by SECURITY DEFINER functions, the discount is
-- stored on the ride, and complete_ride settles net of it. Referral credit
-- lands in both wallets only when the referred rider finishes her first
-- trip. The client can never invent a discount. Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Promo codes + redemptions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY CHECK (code = upper(code)),
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  -- percent: 0–100; fixed: absolute KES amount.
  value NUMERIC(10,2) NOT NULL CHECK (value > 0),
  max_discount NUMERIC(10,2),           -- cap for percent codes (NULL = uncapped)
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_redemptions INT,                  -- global cap (NULL = unlimited)
  per_user_limit INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_codes TO authenticated;   -- validation goes via RPC; direct reads are harmless metadata
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo admin write" ON public.promo_codes;
CREATE POLICY "Promo admin write" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Promo read active" ON public.promo_codes;
CREATE POLICY "Promo read active" ON public.promo_codes
  FOR SELECT TO authenticated USING (active = true);

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL REFERENCES public.promo_codes(code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL UNIQUE REFERENCES public.rides(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON public.promo_redemptions(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON public.promo_redemptions(user_id);
GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own redemptions" ON public.promo_redemptions;
CREATE POLICY "Own redemptions" ON public.promo_redemptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- The locked-in discount lives on the ride itself.
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Seed a launch code so the flow is testable end-to-end.
INSERT INTO public.promo_codes (code, description, discount_type, value, max_discount, per_user_limit)
VALUES ('HERIDE10', 'Welcome — 10% off your ride (up to KES 200)', 'percent', 10, 200, 1)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- 2. validate_promo — pure check + discount preview for a subtotal.
--    Raises with a human-readable reason when invalid.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_promo(_code TEXT, _subtotal NUMERIC)
RETURNS TABLE (code TEXT, label TEXT, discount NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.promo_codes;
  uses INT;
  my_uses INT;
  d NUMERIC(10,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO p FROM public.promo_codes pc WHERE pc.code = upper(trim(_code));
  IF p.code IS NULL OR NOT p.active THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
  IF now() < p.starts_at THEN RAISE EXCEPTION 'This code is not active yet'; END IF;
  IF p.expires_at IS NOT NULL AND now() > p.expires_at THEN RAISE EXCEPTION 'This code has expired'; END IF;
  SELECT count(*) INTO uses FROM public.promo_redemptions pr WHERE pr.code = p.code;
  IF p.max_redemptions IS NOT NULL AND uses >= p.max_redemptions THEN
    RAISE EXCEPTION 'This code has been fully redeemed';
  END IF;
  SELECT count(*) INTO my_uses FROM public.promo_redemptions pr
    WHERE pr.code = p.code AND pr.user_id = auth.uid();
  IF my_uses >= p.per_user_limit THEN RAISE EXCEPTION 'You already used this code'; END IF;

  IF p.discount_type = 'percent' THEN
    d := round(GREATEST(COALESCE(_subtotal, 0), 0) * p.value / 100.0, 2);
    IF p.max_discount IS NOT NULL THEN d := LEAST(d, p.max_discount); END IF;
  ELSE
    d := p.value;
  END IF;
  d := LEAST(d, GREATEST(COALESCE(_subtotal, 0), 0));
  RETURN QUERY SELECT p.code, COALESCE(p.description, p.code), d;
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, numeric) TO authenticated;

-- ------------------------------------------------------------
-- 3. apply_promo — locks a code onto the caller's own requested ride:
--    re-validates, records the redemption, stores the absolute discount
--    (upfront-pricing style: fixed at booking, honoured at settlement).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_promo(_ride_id UUID, _code TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  v RECORD;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.passenger_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the passenger can apply a promo';
  END IF;
  IF r.status NOT IN ('requested', 'matched', 'accepted') THEN
    RAISE EXCEPTION 'Too late to apply a promo to this ride';
  END IF;
  IF r.promo_code IS NOT NULL THEN RAISE EXCEPTION 'A promo is already applied'; END IF;

  SELECT * INTO v FROM public.validate_promo(_code, COALESCE(r.fare_estimate, 0));
  INSERT INTO public.promo_redemptions (code, user_id, ride_id, amount)
    VALUES (v.code, auth.uid(), r.id, v.discount);
  UPDATE public.rides SET promo_code = v.code, discount = v.discount WHERE id = r.id;
  PERFORM public.log_audit('promo_applied', 'ride', r.id,
    jsonb_build_object('code', v.code, 'discount', v.discount));
  RETURN v.discount;
END; $$;
GRANT EXECUTE ON FUNCTION public.apply_promo(uuid, text) TO authenticated;

-- ------------------------------------------------------------
-- 4. Referral program: every user has a code; a new rider redeems one
--    BEFORE her first trip; both sides are credited when that first trip
--    completes (handled in complete_ride below).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own referral code" ON public.referral_codes;
CREATE POLICY "Own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.referral_signups (
  referee_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credited BOOLEAN NOT NULL DEFAULT false,
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON public.referral_signups(referrer_id);
GRANT SELECT ON public.referral_signups TO authenticated;
GRANT ALL ON public.referral_signups TO service_role;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own referral signups" ON public.referral_signups;
CREATE POLICY "Own referral signups" ON public.referral_signups
  FOR SELECT TO authenticated USING (referee_id = auth.uid() OR referrer_id = auth.uid());

-- Reward paid to each side when the referred rider completes her first trip.
-- Lives in pricing_config so admins can tune it without a migration.
ALTER TABLE public.pricing_config ADD COLUMN IF NOT EXISTS referral_reward NUMERIC(10,2) NOT NULL DEFAULT 200;

CREATE OR REPLACE FUNCTION public.get_referral_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT rc.code INTO c FROM public.referral_codes rc WHERE rc.user_id = auth.uid();
  IF c IS NULL THEN
    -- Short, readable, collision-checked (HER-XXXXXX).
    LOOP
      c := 'HER-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes rc WHERE rc.code = c);
    END LOOP;
    INSERT INTO public.referral_codes (user_id, code) VALUES (auth.uid(), c);
  END IF;
  RETURN c;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_referral_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_referral(_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT rc.user_id INTO ref FROM public.referral_codes rc WHERE rc.code = upper(trim(_code));
  IF ref IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
  IF ref = auth.uid() THEN RAISE EXCEPTION 'You cannot refer yourself'; END IF;
  IF EXISTS (SELECT 1 FROM public.referral_signups rs WHERE rs.referee_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already used a referral code';
  END IF;
  IF EXISTS (SELECT 1 FROM public.rides r
             WHERE r.passenger_id = auth.uid() AND r.status = 'completed') THEN
    RAISE EXCEPTION 'Referral codes are for riders before their first trip';
  END IF;
  INSERT INTO public.referral_signups (referee_id, referrer_id) VALUES (auth.uid(), ref);
  PERFORM public.log_audit('referral_redeemed', 'user', auth.uid(),
    jsonb_build_object('referrer', ref, 'code', upper(trim(_code))));
END; $$;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;

-- ------------------------------------------------------------
-- 5. complete_ride v3 — same signature; now settles NET OF the locked-in
--    promo discount and pays referral rewards on the referee's first
--    completed trip. All other mechanics match phase 9.
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
  reward NUMERIC(10,2);
  s public.referral_signups;
  bal NUMERIC(12,2);
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

  IF r.distance_km IS NOT NULL THEN
    fare := public.quote_fare(r.distance_km, r.duration_min, COALESCE(r.category_multiplier, 1));
  ELSE
    fare := COALESCE(r.fare_estimate, 0);
  END IF;
  -- Honour the promo locked in at booking (never below zero).
  fare := GREATEST(fare - COALESCE(r.discount, 0), 0);
  payout := round(fare * (1 - commission), 2);

  UPDATE public.wallets SET balance = balance - fare, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO pass_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.passenger_id, r.id, 'ride_payment', 'completed', -fare, pass_bal,
      CASE WHEN COALESCE(r.discount, 0) > 0
        THEN 'Ride payment (promo ' || r.promo_code || ' −' || r.discount::TEXT || ')'
        ELSE 'Ride payment' END);

  UPDATE public.wallets SET balance = balance + payout, updated_at = now()
    WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.driver_id, r.id, 'ride_payout', 'completed', payout, drv_bal, 'Ride payout');

  INSERT INTO public.platform_ledger (ride_id, gross_fare, commission, driver_payout, commission_rate, currency)
    VALUES (r.id, fare, fare - payout, payout, commission, 'KES')
    ON CONFLICT (ride_id) DO NOTHING;

  UPDATE public.rides SET status = 'completed', completed_at = now(), fare_final = fare
    WHERE id = r.id RETURNING * INTO r;

  -- Referral reward: referee's FIRST completed trip credits both wallets.
  SELECT * INTO s FROM public.referral_signups rs
    WHERE rs.referee_id = r.passenger_id AND rs.credited = false FOR UPDATE;
  IF s.referee_id IS NOT NULL THEN
    reward := COALESCE((SELECT referral_reward FROM public.pricing_config WHERE id = 'default'), 200);
    IF reward > 0 THEN
      UPDATE public.wallets SET balance = balance + reward, updated_at = now()
        WHERE user_id = s.referee_id RETURNING balance INTO bal;
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
        VALUES (s.referee_id, r.id, 'adjustment', 'completed', reward, bal, 'Referral reward — welcome to HeRide');
      UPDATE public.wallets SET balance = balance + reward, updated_at = now()
        WHERE user_id = s.referrer_id RETURNING balance INTO bal;
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
        VALUES (s.referrer_id, r.id, 'adjustment', 'completed', reward, bal, 'Referral reward — your friend completed her first trip');
      PERFORM public.push_notification(s.referrer_id, 'wallet', 'Referral reward earned',
        'Your friend finished her first HeRide trip — KES ' || reward::TEXT || ' added to your wallet.', r.id);
      PERFORM public.push_notification(s.referee_id, 'wallet', 'Welcome reward added',
        'KES ' || reward::TEXT || ' referral reward added to your wallet.', r.id);
    END IF;
    UPDATE public.referral_signups SET credited = true, credited_at = now()
      WHERE referee_id = s.referee_id;
    PERFORM public.log_audit('referral_credited', 'user', s.referee_id,
      jsonb_build_object('referrer', s.referrer_id, 'reward', reward, 'ride', r.id));
  END IF;

  RETURN r;
END; $$;
