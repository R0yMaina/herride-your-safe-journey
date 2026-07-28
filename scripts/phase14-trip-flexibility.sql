-- ============================================================
-- HerRide — Phase 14: trip flexibility — scheduled rides & multiple stops
-- Run ONCE in the Supabase SQL Editor after phase13-growth.sql.
-- Scheduled rides: the ride row carries scheduled_for; it stays INVISIBLE to
-- the driver open-rides feed until 30 minutes before pickup (no cron needed —
-- the release window is part of the drivers' RLS-safe query + policy below).
-- Multiple stops: rides.waypoints holds intermediate stops as JSONB; the
-- client's OSRM routing already prices the full multi-leg path into
-- distance_km/duration_min, which quote_fare settles on. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS waypoints JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_rides_scheduled ON public.rides(scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Confirmation notification when a ride is reserved in advance.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_scheduled_ride()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.scheduled_for IS NOT NULL AND NEW.scheduled_for > now() THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Ride reserved',
      'Your HeRide is booked for ' || to_char(NEW.scheduled_for AT TIME ZONE 'Africa/Nairobi', 'Dy DD Mon, HH24:MI') ||
      '. A driver will be matched closer to pickup time.', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_scheduled_ride ON public.rides;
CREATE TRIGGER trg_notify_scheduled_ride
  AFTER INSERT ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.notify_scheduled_ride();

-- ------------------------------------------------------------
-- 3. Release window helper — a scheduled ride becomes claimable when we are
--    within 30 minutes of its pickup time. Used by the drivers' open feed;
--    also enforced in claim_ride-style paths via this single definition.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ride_is_released(_scheduled_for TIMESTAMPTZ)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT _scheduled_for IS NULL OR _scheduled_for <= now() + interval '30 minutes'
$$;
GRANT EXECUTE ON FUNCTION public.ride_is_released(timestamptz) TO authenticated;
