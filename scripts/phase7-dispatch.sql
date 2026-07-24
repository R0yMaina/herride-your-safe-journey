-- ============================================================
-- HerRide — Phase 7 real-time dispatch
-- Run ONCE in the Supabase SQL Editor after phase6-audit-hardening.sql.
-- Adds the server-side pieces of live dispatch:
--   1. Claiming a ride marks the driver BUSY (out of the dispatch pool
--      and out of nearest_available_drivers) for the duration of the trip.
--   2. The passenger on an active ride may read (and live-stream) their
--      OWN driver's location even while that driver is busy.
--   3. When a ride ends (completed or cancelled), the driver's
--      availability is restored automatically — even if their app is
--      closed when the passenger cancels.
--   4. Stale 'requested' rides expire automatically so passengers are
--      never stuck "searching" forever and drivers never see dead
--      requests. Uses pg_cron when available.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. claim_ride also flips the driver to busy, atomically with the
--    claim itself (same transaction — no window where a busy driver
--    is still broadcast as available).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_ride(_ride_id UUID)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rides;
BEGIN
  IF NOT public.is_verified_female_driver(auth.uid()) THEN
    RAISE EXCEPTION 'Only verified female drivers can claim rides';
  END IF;
  UPDATE public.rides
    SET driver_id = auth.uid(), status = 'accepted', accepted_at = now()
    WHERE id = _ride_id AND status = 'requested' AND driver_id IS NULL
    RETURNING * INTO r;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Ride is no longer available';
  END IF;
  UPDATE public.driver_locations
    SET is_available = false, updated_at = now()
    WHERE driver_user_id = auth.uid();
  RETURN r;
END; $$;

-- ------------------------------------------------------------
-- 2. Passenger may read their assigned driver's location while the
--    ride is live (the driver is busy then, so the existing
--    "passengers read available" policy no longer matches).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 3. Availability restore when a ride leaves the active set. Runs as a
--    trigger so it works even when the driver's app is closed at the
--    moment the passenger cancels.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_driver_availability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL
     AND NEW.status IN ('completed', 'cancelled')
     AND OLD.status NOT IN ('completed', 'cancelled') THEN
    UPDATE public.driver_locations
      SET is_available = true, updated_at = now()
      WHERE driver_user_id = NEW.driver_id AND is_available = false;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_restore_driver_availability ON public.rides;
CREATE TRIGGER trg_restore_driver_availability
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.restore_driver_availability();

-- ------------------------------------------------------------
-- 4. Expire stale requests. Any ride still 'requested' after the
--    max age is cancelled with a distinct reason (the enum stays
--    unchanged; RIDE_STATUS_TRANSITIONS already allows
--    requested -> cancelled, and the phase6 transition trigger permits
--    it). The notify trigger tells the passenger automatically.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_ride_requests(_max_age_minutes INT DEFAULT 10)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE expired INT;
BEGIN
  UPDATE public.rides
    SET status = 'cancelled',
        cancellation_reason = 'Expired: no driver accepted in time'
    WHERE status = 'requested'
      AND requested_at < now() - make_interval(mins => _max_age_minutes);
  GET DIAGNOSTICS expired = ROW_COUNT;
  RETURN expired;
END; $$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_ride_requests(int) FROM anon, authenticated;

-- Schedule it every minute where pg_cron is available (Supabase:
-- Dashboard -> Database -> Extensions -> enable pg_cron first).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-stale-ride-requests',
      '* * * * *',
      $job$ SELECT public.expire_stale_ride_requests(10); $job$
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled — enable it and re-run this block, or call expire_stale_ride_requests() from an edge function schedule.';
  END IF;
END $$;
