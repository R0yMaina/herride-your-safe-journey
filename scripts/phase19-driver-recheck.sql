-- ============================================================
-- HerRide — Phase 19: periodic driver identity re-check (audit finding S3)
--
-- A driver passed verification once, forever. Nothing stopped a verified woman
-- lending, selling or sharing her account — which defeats the single promise the
-- whole product is sold on. This makes verification something she keeps
-- proving rather than something she earned once.
--
-- No face-match provider is configured, so the comparison is done by a human at
-- the verification desk. That is slower than an API but it is honest: a check
-- nobody performs is worse than a check that takes a few hours, and the flow is
-- identical once a provider is wired in.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. driver_checks — one row per submitted re-check.
--    History is kept rather than overwritten: "when did we last actually look
--    at her face" is the question a safety incident will ask.
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.driver_check_status AS ENUM ('pending', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.driver_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  status public.driver_check_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reject_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_driver_checks_driver ON public.driver_checks(driver_user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_checks_pending ON public.driver_checks(status) WHERE status = 'pending';

GRANT SELECT ON public.driver_checks TO authenticated;
GRANT ALL ON public.driver_checks TO service_role;
ALTER TABLE public.driver_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Driver reads own checks" ON public.driver_checks;
CREATE POLICY "Driver reads own checks" ON public.driver_checks
  FOR SELECT TO authenticated
  USING (driver_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Writes go through the functions below only — a driver marking her own check
-- 'passed' would make the whole mechanism theatre.
DROP POLICY IF EXISTS "No direct driver check writes" ON public.driver_checks;

-- ------------------------------------------------------------
-- 2. How often. Configurable, because the right cadence is a policy decision
--    and will change once there is real fleet data.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS driver_recheck_days INT NOT NULL DEFAULT 30;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Existing verified drivers are treated as checked at the moment they were
-- verified, so this does not lock the whole fleet out on the day it ships.
UPDATE public.drivers
  SET last_checked_at = COALESCE(last_checked_at, verified_at)
  WHERE verification_status = 'verified' AND last_checked_at IS NULL;

-- ------------------------------------------------------------
-- 3. Is her check current?
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_check_is_current(_driver_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    d.last_checked_at > now() - make_interval(days =>
      COALESCE((SELECT driver_recheck_days FROM public.pricing_config WHERE id = 'default'), 30)),
    false)
  FROM public.drivers d
  WHERE d.user_id = _driver_user_id;
$$;
GRANT EXECUTE ON FUNCTION public.driver_check_is_current(uuid) TO authenticated;

/** What the driver app needs to decide whether to prompt her. */
CREATE OR REPLACE FUNCTION public.my_driver_check_state()
RETURNS TABLE (
  is_current BOOLEAN,
  last_checked_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  pending_review BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(public.driver_check_is_current(auth.uid()), false),
    d.last_checked_at,
    d.last_checked_at + make_interval(days =>
      COALESCE((SELECT driver_recheck_days FROM public.pricing_config WHERE id = 'default'), 30)),
    EXISTS (SELECT 1 FROM public.driver_checks c
              WHERE c.driver_user_id = auth.uid() AND c.status = 'pending')
  FROM public.drivers d
  WHERE d.user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_driver_check_state() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.my_driver_check_state() FROM anon;

-- ------------------------------------------------------------
-- 4. Submitting a re-check.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_driver_check(_selfie_url TEXT)
RETURNS public.driver_checks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.driver_checks;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only drivers submit identity checks';
  END IF;
  IF _selfie_url IS NULL OR length(trim(_selfie_url)) = 0 THEN
    RAISE EXCEPTION 'A selfie is required';
  END IF;
  PERFORM public.check_rate_limit('submit_driver_check', 5, interval '1 hour');

  -- One open submission at a time, so the review queue cannot be flooded.
  IF EXISTS (SELECT 1 FROM public.driver_checks
               WHERE driver_user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'Your last check is still being reviewed';
  END IF;

  INSERT INTO public.driver_checks (driver_user_id, selfie_url)
    VALUES (auth.uid(), trim(_selfie_url))
  RETURNING * INTO c;

  PERFORM public.push_notification(auth.uid(), 'driver',
    'Identity check submitted',
    'We are reviewing your photo. You can go back online as soon as it passes.', NULL);
  RETURN c;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_driver_check(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_driver_check(text) FROM anon;

-- ------------------------------------------------------------
-- 5. Reviewing one (admin only).
--    A failed check takes her offline immediately — the point of the mechanism
--    is that a face we could not match stops driving now, not at renewal.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_driver_check(
  _check_id UUID, _passed BOOLEAN, _reason TEXT DEFAULT NULL
) RETURNS public.driver_checks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.driver_checks;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins review identity checks';
  END IF;

  UPDATE public.driver_checks
    SET status = CASE WHEN _passed THEN 'passed' ELSE 'failed' END,
        reviewed_at = now(), reviewed_by = auth.uid(),
        reject_reason = CASE WHEN _passed THEN NULL ELSE _reason END
    WHERE id = _check_id AND status = 'pending'
    RETURNING * INTO c;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Check not found or already reviewed'; END IF;

  IF _passed THEN
    UPDATE public.drivers SET last_checked_at = now(), updated_at = now()
      WHERE user_id = c.driver_user_id;
    PERFORM public.push_notification(c.driver_user_id, 'driver',
      'Identity confirmed', 'You are cleared to go back online.', NULL);
  ELSE
    -- Offline now, and unavailable for matching until a check passes.
    UPDATE public.driver_locations SET is_available = false, updated_at = now()
      WHERE driver_user_id = c.driver_user_id;
    INSERT INTO public.fraud_signals (user_id, ride_id, kind, severity, detail)
      VALUES (c.driver_user_id, NULL, 'identity_check_failed', 'high',
              jsonb_build_object('check_id', c.id, 'reason', _reason));
    PERFORM public.push_notification(c.driver_user_id, 'driver',
      'Identity check not passed',
      COALESCE(_reason, 'We could not match your photo. Contact support.'), NULL);
  END IF;

  PERFORM public.log_audit('review_driver_check', 'driver_checks', c.id::text,
    jsonb_build_object('passed', _passed, 'reason', _reason));
  RETURN c;
END; $$;
GRANT EXECUTE ON FUNCTION public.review_driver_check(uuid, boolean, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.review_driver_check(uuid, boolean, text) FROM anon;

/** The admin queue. */
CREATE OR REPLACE FUNCTION public.list_pending_driver_checks()
RETURNS TABLE (
  id UUID, driver_user_id UUID, full_name TEXT, selfie_url TEXT,
  verification_selfie_url TEXT, submitted_at TIMESTAMPTZ, last_checked_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
    SELECT c.id, c.driver_user_id, p.full_name, c.selfie_url,
           -- The original verification photo, so the reviewer compares against
           -- the face we actually approved rather than the last one submitted.
           d.selfie_url, c.submitted_at, d.last_checked_at
    FROM public.driver_checks c
    JOIN public.drivers d ON d.user_id = c.driver_user_id
    LEFT JOIN public.profiles p ON p.id = c.driver_user_id
    WHERE c.status = 'pending'
    ORDER BY c.submitted_at ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.list_pending_driver_checks() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.list_pending_driver_checks() FROM anon;

-- ------------------------------------------------------------
-- 6. The gate. This is the part that makes it real.
--    set_driver_availability now refuses to bring a driver online on a stale
--    check, and nearest_available_drivers excludes her regardless — belt and
--    braces, because "cannot go online" and "cannot be matched" are different
--    failures and only the second one protects the rider.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_driver_availability(
  _available BOOLEAN, _lat DOUBLE PRECISION DEFAULT NULL, _lng DOUBLE PRECISION DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _available THEN
    IF NOT public.is_verified_female_driver(auth.uid()) THEN
      RAISE EXCEPTION 'Only verified female drivers can go online';
    END IF;
    IF NOT public.driver_check_is_current(auth.uid()) THEN
      RAISE EXCEPTION 'Identity check due — take a new selfie to go back online';
    END IF;
  END IF;

  INSERT INTO public.driver_locations
    (driver_user_id, lat, lng, is_available, updated_at, last_ping_at)
    VALUES (auth.uid(), COALESCE(_lat, 0), COALESCE(_lng, 0), _available, now(), now())
    ON CONFLICT (driver_user_id) DO UPDATE
      SET is_available = _available,
          lat = COALESCE(EXCLUDED.lat, public.driver_locations.lat),
          lng = COALESCE(EXCLUDED.lng, public.driver_locations.lng),
          updated_at = now(),
          last_ping_at = now();
END; $$;
GRANT EXECUTE ON FUNCTION
  public.set_driver_availability(boolean, double precision, double precision) TO authenticated;
REVOKE EXECUTE ON FUNCTION
  public.set_driver_availability(boolean, double precision, double precision) FROM anon;

-- nearest_available_drivers v2 — same contract, plus the recheck condition.
CREATE OR REPLACE FUNCTION public.nearest_available_drivers(
  _lat DOUBLE PRECISION, _lng DOUBLE PRECISION,
  _radius_km DOUBLE PRECISION DEFAULT 5, _limit INT DEFAULT 10
) RETURNS TABLE (
  driver_user_id UUID, lat DOUBLE PRECISION, lng DOUBLE PRECISION, distance_km DOUBLE PRECISION,
  rating NUMERIC, vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT
      dl.driver_user_id, dl.lat, dl.lng,
      (6371 * acos(cos(radians(_lat)) * cos(radians(dl.lat))
        * cos(radians(dl.lng) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(dl.lat)))) AS distance_km,
      d.rating, d.vehicle_make, d.vehicle_model, d.vehicle_plate
    FROM public.driver_locations dl
    JOIN public.drivers d ON d.user_id = dl.driver_user_id
    JOIN public.profiles p ON p.id = dl.driver_user_id
    WHERE dl.is_available = true
      AND d.verification_status = 'verified'
      AND p.gender = 'female'
      AND p.is_blacklisted = false
      AND dl.updated_at > now() - interval '2 minutes'
      -- Phase 19: a stale identity check takes her out of matching, not just
      -- out of the online toggle.
      AND d.last_checked_at > now() - make_interval(days =>
            COALESCE((SELECT driver_recheck_days FROM public.pricing_config WHERE id = 'default'), 30))
  ) s
  WHERE s.distance_km <= _radius_km
  ORDER BY s.distance_km ASC
  LIMIT _limit;
$$;

COMMENT ON TABLE public.driver_checks IS
  'Periodic identity re-checks. History is kept because "when did we last verify her face" is what a safety incident asks.';
COMMENT ON FUNCTION public.set_driver_availability(boolean, double precision, double precision) IS
  'Going online requires verified-female status AND a current identity check.';
