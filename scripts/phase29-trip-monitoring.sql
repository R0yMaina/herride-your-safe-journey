-- ============================================================
-- HerRide — Phase 29: in-trip anomaly detection
--
-- Three things that mean "something may be wrong" and that nobody is currently
-- watching for: the car going the wrong way, the car stopping for a long time,
-- and the car falling off the network mid-trip.
--
-- WHY IT IS NOT "distance from the planned route"
--
-- The obvious design compares the driver's position to the route polyline. We
-- do not have one: `rides` stores pickup, drop and waypoints, and
-- `driver_locations` stores ONE current row per driver with no history. Storing
-- a polyline per ride and a location trail per trip is a bigger change than the
-- detection is worth, and a corridor around a polyline false-positives on every
-- legitimate diversion — roadworks, a one-way system, traffic.
--
-- So deviation is measured by PROGRESS instead: we remember the closest the car
-- has ever got to the destination, and flag when it is materially further away
-- than that. Roads curve, but they do not normally take you two kilometres
-- further from where you are going than you had already reached. That is
-- route-agnostic, needs no polyline, and is quiet during ordinary detours.
--
-- All three notify the RIDER and admins, never the driver — same reasoning as
-- phase 28. If the danger is the driver, telling her she is being watched is
-- the worst available move.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Thresholds. Every one is a false-positive/false-negative trade, so all
--    of them are configuration rather than constants baked into a function.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  -- How much further from the destination than her best-so-far before we ask.
  ADD COLUMN IF NOT EXISTS deviation_km NUMERIC(6,2) NOT NULL DEFAULT 2.00,
  -- Stationary for this long is worth a question. Long enough not to fire at
  -- every traffic light on Mombasa Road.
  ADD COLUMN IF NOT EXISTS long_stop_min INT NOT NULL DEFAULT 6,
  -- Movement under this counts as standing still (GPS jitter is ~20-40m).
  ADD COLUMN IF NOT EXISTS long_stop_radius_m INT NOT NULL DEFAULT 80,
  -- Ignore the first minutes of a trip: pulling out of a car park looks like
  -- both a long stop and a deviation.
  ADD COLUMN IF NOT EXISTS monitor_grace_min INT NOT NULL DEFAULT 3,
  -- No ping for this long during a live trip means we have lost the car.
  ADD COLUMN IF NOT EXISTS signal_lost_min INT NOT NULL DEFAULT 8;

-- ------------------------------------------------------------
-- 2. Monitor state, carried on the ride itself.
--
--    Four columns beat a location-history table here: the detector only ever
--    needs "where was it last, when did it last actually move, and what is the
--    closest it has been", and a trail of every ping during every trip is a
--    large amount of precise location data to hold on a platform whose privacy
--    policy promises to keep as little as possible.
-- ------------------------------------------------------------
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS monitor_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS monitor_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS monitor_moved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monitor_min_dest_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS monitor_checked_at TIMESTAMPTZ;

DO $$ BEGIN
  CREATE TYPE public.trip_anomaly_kind AS ENUM ('route_deviation', 'long_stop', 'signal_lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.trip_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  kind public.trip_anomaly_kind NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- She tapped "I'm fine". Null means nobody has said the trip is okay.
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- One open anomaly of each kind per ride. Without this the monitor would raise
-- the same long stop every minute the car sat still, and a rider being asked
-- "are you okay?" sixty times learns to ignore the question.
CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_anomaly_open
  ON public.trip_anomalies(ride_id, kind) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trip_anomaly_ride ON public.trip_anomalies(ride_id, created_at DESC);

GRANT SELECT ON public.trip_anomalies TO authenticated;
GRANT ALL ON public.trip_anomalies TO service_role;
ALTER TABLE public.trip_anomalies ENABLE ROW LEVEL SECURITY;

-- The rider and an admin can see them. The DRIVER cannot: an anomaly is a
-- question about her behaviour, and showing it to her turns a safety net into
-- a warning that she is being watched.
DROP POLICY IF EXISTS "Trip anomalies rider or admin" ON public.trip_anomalies;
CREATE POLICY "Trip anomalies rider or admin" ON public.trip_anomalies
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = trip_anomalies.ride_id AND r.passenger_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3. The monitor. Runs on cron; see phase27.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.monitor_active_trips()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg public.pricing_config;
  r RECORD;
  dl public.driver_locations;
  dist_dest DOUBLE PRECISION;
  moved_km DOUBLE PRECISION;
  stale_min DOUBLE PRECISION;
  raised INT := 0;
BEGIN
  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';

  FOR r IN
    SELECT ri.id, ri.passenger_id, ri.driver_id, ri.drop_lat, ri.drop_lng,
           ri.started_at, ri.monitor_lat, ri.monitor_lng, ri.monitor_moved_at,
           ri.monitor_min_dest_km
    FROM public.rides ri
    WHERE ri.status = 'in_progress'
      AND ri.driver_id IS NOT NULL
      AND ri.started_at < now() - make_interval(mins => COALESCE(cfg.monitor_grace_min, 3))
  LOOP
    SELECT * INTO dl FROM public.driver_locations WHERE driver_user_id = r.driver_id;
    IF dl.driver_user_id IS NULL THEN CONTINUE; END IF;

    stale_min := EXTRACT(EPOCH FROM (now() - dl.updated_at)) / 60;

    -- (a) Signal lost. Dead zones and danger overlap, so a car that stopped
    --     reporting mid-trip is worth a question even though it is usually
    --     just poor coverage.
    IF stale_min >= COALESCE(cfg.signal_lost_min, 8) THEN
      INSERT INTO public.trip_anomalies (ride_id, kind, detail)
        VALUES (r.id, 'signal_lost', jsonb_build_object('minutes', round(stale_min)))
        ON CONFLICT DO NOTHING;
      IF FOUND THEN raised := raised + 1; END IF;
      -- A stale position tells us nothing about movement or progress, so the
      -- other two checks would be reasoning about a location that is minutes
      -- old. Skip them rather than raise something we cannot stand behind.
      CONTINUE;
    END IF;

    dist_dest := public.km_between(dl.lat, dl.lng, r.drop_lat, r.drop_lng);

    -- (b) Route deviation, measured as lost progress rather than distance from
    --     a route we do not store.
    IF r.monitor_min_dest_km IS NULL OR dist_dest < r.monitor_min_dest_km THEN
      UPDATE public.rides SET monitor_min_dest_km = dist_dest WHERE id = r.id;
    ELSIF dist_dest - r.monitor_min_dest_km > COALESCE(cfg.deviation_km, 2) THEN
      INSERT INTO public.trip_anomalies (ride_id, kind, detail)
        VALUES (r.id, 'route_deviation', jsonb_build_object(
          'closest_km', round(r.monitor_min_dest_km::numeric, 2),
          'now_km', round(dist_dest::numeric, 2)))
        ON CONFLICT DO NOTHING;
      IF FOUND THEN raised := raised + 1; END IF;
    END IF;

    -- (c) Long stop.
    IF r.monitor_lat IS NULL THEN
      UPDATE public.rides
        SET monitor_lat = dl.lat, monitor_lng = dl.lng, monitor_moved_at = now()
        WHERE id = r.id;
    ELSE
      moved_km := public.km_between(r.monitor_lat, r.monitor_lng, dl.lat, dl.lng);
      IF moved_km * 1000 > COALESCE(cfg.long_stop_radius_m, 80) THEN
        UPDATE public.rides
          SET monitor_lat = dl.lat, monitor_lng = dl.lng, monitor_moved_at = now()
          WHERE id = r.id;
      ELSIF COALESCE(r.monitor_moved_at, r.started_at)
            < now() - make_interval(mins => COALESCE(cfg.long_stop_min, 6)) THEN
        INSERT INTO public.trip_anomalies (ride_id, kind, detail)
          VALUES (r.id, 'long_stop', jsonb_build_object(
            'minutes', round(EXTRACT(EPOCH FROM (now() - COALESCE(r.monitor_moved_at, r.started_at))) / 60)))
          ON CONFLICT DO NOTHING;
        IF FOUND THEN raised := raised + 1; END IF;
      END IF;
    END IF;

    UPDATE public.rides SET monitor_checked_at = now() WHERE id = r.id;
  END LOOP;

  -- Notify once per newly raised anomaly, outside the detection loop so a
  -- notification failure cannot leave the monitor state half-written.
  PERFORM public.notify_trip_anomalies();
  RETURN raised;
END; $$;
REVOKE EXECUTE ON FUNCTION public.monitor_active_trips() FROM PUBLIC, anon, authenticated;

/**
 * Tells the rider and the admins about anomalies nobody has been told about.
 * Split out so monitor_active_trips stays a detector and this stays a notifier.
 */
CREATE OR REPLACE FUNCTION public.notify_trip_anomalies()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a RECORD; admin_id UUID; title TEXT; body TEXT;
BEGIN
  FOR a IN
    SELECT ta.id, ta.ride_id, ta.kind, ta.detail, ri.passenger_id
    FROM public.trip_anomalies ta
    JOIN public.rides ri ON ri.id = ta.ride_id
    WHERE ta.acknowledged_at IS NULL
      AND NOT (ta.detail ? 'notified')
  LOOP
    title := CASE a.kind
      WHEN 'route_deviation' THEN 'Is everything okay?'
      WHEN 'long_stop' THEN 'Your trip has been stopped a while'
      ELSE 'We have lost contact with your car'
    END;
    body := CASE a.kind
      WHEN 'route_deviation' THEN
        'Your car is heading away from your destination. If anything feels wrong, press the shield.'
      WHEN 'long_stop' THEN
        'Your car has not moved for ' || COALESCE(a.detail->>'minutes', 'several') ||
        ' minutes. Tap to tell us you are fine, or press the shield.'
      ELSE
        'Your driver''s phone has stopped reporting its position. This is usually poor coverage.'
    END;

    PERFORM public.push_notification(a.passenger_id, 'safety', title, body, a.ride_id);

    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.push_notification(admin_id, 'safety',
        'Trip anomaly: ' || a.kind::TEXT, body, a.ride_id);
    END LOOP;

    -- Marked on the row itself so a retry cannot notify her twice.
    UPDATE public.trip_anomalies
      SET detail = a.detail || jsonb_build_object('notified', now())
      WHERE id = a.id;
  END LOOP;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_trip_anomalies() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 4. What the rider does about it.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_trip_anomalies(_ride_id UUID)
RETURNS TABLE (id UUID, kind TEXT, detail JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = _ride_id AND r.passenger_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not your ride'; END IF;

  RETURN QUERY
  SELECT ta.id, ta.kind::TEXT, ta.detail, ta.created_at
  FROM public.trip_anomalies ta
  WHERE ta.ride_id = _ride_id AND ta.acknowledged_at IS NULL
  ORDER BY ta.created_at DESC;
END; $$;
REVOKE EXECUTE ON FUNCTION public.my_trip_anomalies(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_trip_anomalies(uuid) TO authenticated;

/** "I'm fine." Only the rider may say it — not the driver, not an admin. */
CREATE OR REPLACE FUNCTION public.acknowledge_trip_anomaly(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.trip_anomalies ta
    JOIN public.rides r ON r.id = ta.ride_id
    WHERE ta.id = _id AND r.passenger_id = auth.uid()
  ) INTO ok;
  IF NOT ok THEN RAISE EXCEPTION 'Not your trip'; END IF;

  UPDATE public.trip_anomalies
    SET acknowledged_at = now(), acknowledged_by = auth.uid()
    WHERE id = _id AND acknowledged_at IS NULL;
END; $$;
REVOKE EXECUTE ON FUNCTION public.acknowledge_trip_anomaly(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_trip_anomaly(uuid) TO authenticated;

COMMENT ON FUNCTION public.monitor_active_trips() IS
  'Deviation is measured as lost progress toward the destination, not distance '
  'from a planned route: no polyline is stored, and a corridor around one would '
  'fire on every legitimate diversion. Notifies the rider and admins, never the '
  'driver.';
