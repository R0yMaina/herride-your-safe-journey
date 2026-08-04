-- ============================================================
-- HerRide — Phase 20: fixes found by re-auditing the live database
--
-- Five defects, three of which were live and two of which I introduced in
-- phases 18 and 19. Every one was found by testing against the running
-- database rather than reading the scripts.
--
-- Idempotent: safe to re-run. Apply AFTER phase18 and phase19.
-- ============================================================

-- ------------------------------------------------------------
-- 1. HIGH — every authenticated user could read every available driver's
--    live coordinates.
--
--    setup-database.sql granted:
--      USING (is_available = true OR driver_user_id = auth.uid() OR is_admin)
--
--    so anyone with an account could poll driver_locations and follow a
--    specific woman's real-time position without ever booking a ride. On a
--    women-only safety product that is a stalking vector, not a data-tidiness
--    problem. Confirmed live: a passenger account read two real drivers'
--    coordinates.
--
--    phase7 tried to fix this by ADDING a narrower counterparty policy, which
--    cannot work: RLS policies are OR'd, so a permissive policy alongside a
--    strict one still grants access. The permissive one has to go.
--
--    Riders lose nothing. Proximity comes from nearest_available_drivers
--    (SECURITY DEFINER, returns only what a rider needs), and the assigned
--    driver's live position during a trip comes from the counterparty policy
--    recreated below.
-- ------------------------------------------------------------

-- Recreate the counterparty policy FIRST, so dropping the permissive one can
-- never leave a live trip unable to see its driver.
DROP POLICY IF EXISTS "DriverLoc ride counterparty read" ON public.driver_locations;
CREATE POLICY "DriverLoc ride counterparty read" ON public.driver_locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.driver_id = driver_locations.driver_user_id
        AND r.passenger_id = auth.uid()
        AND r.status IN ('accepted', 'arrived', 'in_progress')
    )
  );

-- Her own row, and admins.
DROP POLICY IF EXISTS "DriverLoc self read" ON public.driver_locations;
CREATE POLICY "DriverLoc self read" ON public.driver_locations
  FOR SELECT TO authenticated
  USING (driver_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- The leak.
DROP POLICY IF EXISTS "DriverLoc passengers read available" ON public.driver_locations;

-- "DriverLoc own write" was FOR ALL, which also granted SELECT on her own row
-- and, more importantly, kept a write path open alongside phase 18's REVOKE.
-- Writes belong to ping_driver_location / set_driver_availability only.
DROP POLICY IF EXISTS "DriverLoc own write" ON public.driver_locations;

-- ------------------------------------------------------------
-- 2. HIGH — the GPS spoofing detector could not record anything.
--
--    My phase 18 ping_driver_location wrote fraud_signals(kind, detail).
--    Those columns do not exist; the table has (signal, metadata). plpgsql
--    bodies are not validated at creation, so the script applied cleanly and
--    the error only fires the moment a teleport is detected — at which point
--    the INSERT throws, no signal is recorded, and the driver sees an opaque
--    SQL error instead of a clear rejection.
--
--    Also adds the driver guard that was missing: any authenticated user could
--    call this and create themselves a driver_locations row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ping_driver_location(
  _lat DOUBLE PRECISION, _lng DOUBLE PRECISION, _heading DOUBLE PRECISION DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prev public.driver_locations;
  moved_km DOUBLE PRECISION;
  elapsed_s DOUBLE PRECISION;
  speed_kmh DOUBLE PRECISION;
  max_kmh CONSTANT DOUBLE PRECISION := 200;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  -- Only drivers have a position worth recording.
  IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only drivers report a location';
  END IF;
  IF _lat IS NULL OR _lng IS NULL OR _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'Invalid coordinates';
  END IF;

  SELECT * INTO prev FROM public.driver_locations
    WHERE driver_user_id = auth.uid() FOR UPDATE;

  IF prev.driver_user_id IS NULL THEN
    INSERT INTO public.driver_locations
      (driver_user_id, lat, lng, heading, is_available, updated_at, last_ping_at)
      VALUES (auth.uid(), _lat, _lng, _heading, false, now(), now());
    RETURN;
  END IF;

  elapsed_s := GREATEST(
    EXTRACT(EPOCH FROM (now() - COALESCE(prev.last_ping_at, prev.updated_at))), 1);
  moved_km := 6371 * acos(LEAST(1, GREATEST(-1,
    cos(radians(prev.lat)) * cos(radians(_lat)) * cos(radians(_lng) - radians(prev.lng))
    + sin(radians(prev.lat)) * sin(radians(_lat)))));
  speed_kmh := (moved_km / elapsed_s) * 3600;

  IF speed_kmh > max_kmh AND moved_km > 1 THEN
    -- Correct column names this time: signal + metadata.
    INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
      VALUES (auth.uid(), NULL, 'impossible_movement', 'high',
              jsonb_build_object('km', round(moved_km::numeric, 2),
                                 'seconds', round(elapsed_s::numeric, 1),
                                 'kmh', round(speed_kmh::numeric, 1),
                                 'from', jsonb_build_object('lat', prev.lat, 'lng', prev.lng),
                                 'to', jsonb_build_object('lat', _lat, 'lng', _lng)));
    RAISE EXCEPTION 'Location rejected — implausible movement (% km in % s)',
      round(moved_km::numeric, 1), round(elapsed_s::numeric, 0);
  END IF;

  UPDATE public.driver_locations
    SET lat = _lat, lng = _lng, heading = _heading, updated_at = now(), last_ping_at = now()
    WHERE driver_user_id = auth.uid();
END; $$;

-- Same bug, worse consequence: failing a driver's identity check threw before
-- taking her offline, so the reject path of the whole S3 mechanism was dead.
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
    UPDATE public.driver_locations SET is_available = false, updated_at = now()
      WHERE driver_user_id = c.driver_user_id;
    INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
      VALUES (c.driver_user_id, NULL, 'identity_check_failed', 'high',
              jsonb_build_object('check_id', c.id, 'reason', _reason));
    PERFORM public.push_notification(c.driver_user_id, 'driver',
      'Identity check not passed',
      COALESCE(_reason, 'We could not match your photo. Contact support.'), NULL);
  END IF;

  PERFORM public.log_audit('review_driver_check', 'driver_checks', c.id,
    jsonb_build_object('passed', _passed, 'reason', _reason));
  RETURN c;
END; $$;

-- ------------------------------------------------------------
-- 3. MEDIUM — the promo rate limit was never in effect.
--
--    Verified live: 15 consecutive validate_promo calls with junk codes all
--    returned "Invalid promo code" and rate_limits stayed empty, so the
--    phase 18 replacement did not take. DROP then CREATE, rather than
--    CREATE OR REPLACE, so there is no ambiguity about which body is live.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.validate_promo(text, numeric);
CREATE FUNCTION public.validate_promo(_code TEXT, _subtotal NUMERIC)
RETURNS TABLE (code TEXT, label TEXT, discount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.promo_codes;
  uses INT;
  my_uses INT;
  d NUMERIC(10,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM public.check_rate_limit('validate_promo', 12, interval '10 minutes');

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
REVOKE EXECUTE ON FUNCTION public.validate_promo(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, numeric) TO authenticated;

-- ------------------------------------------------------------
-- 4. MEDIUM — 31 of 35 function REVOKEs across every script were ineffective.
--
--    Postgres grants EXECUTE to PUBLIC on every new function, and `authenticated`
--    inherits it. `REVOKE ... FROM anon, authenticated` leaves the PUBLIC grant
--    untouched, so the function stays callable. Only expire_stale_ride_requests
--    got this right.
--
--    Confirmed live: check_rate_limit, refund_ride and flag_fraud_signal were
--    all callable by a plain passenger account. refund_ride was saved by its own
--    internal admin check — defence in depth doing its job — but
--    flag_fraud_signal let a user forge a fraud signal against another user, and
--    check_rate_limit let one burn its own counters.
--
--    The lesson is the pattern, not these four: REVOKE FROM PUBLIC first, then
--    GRANT to exactly who needs it.
-- ------------------------------------------------------------
DO $$
DECLARE f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('check_rate_limit', 'push_notification', 'flag_fraud_signal',
                        'refund_ride', 'log_audit')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    RAISE NOTICE 'locked down %', f.sig;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. Housekeeping — remove location rows for accounts that are not drivers.
--    The missing guard in (2) let a passenger create one.
-- ------------------------------------------------------------
DELETE FROM public.driver_locations dl
  WHERE NOT EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = dl.driver_user_id);

COMMENT ON POLICY "DriverLoc ride counterparty read" ON public.driver_locations IS
  'A rider sees her assigned driver''s position only while the trip is live. Proximity before that comes from nearest_available_drivers, never a direct read.';
