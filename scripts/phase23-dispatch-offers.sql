-- ============================================================
-- HerRide — Phase 23: sequential dispatch + no-show
--
-- Today every verified driver sees every open request and races to claim it.
-- That is the cheapest possible matcher and it has two costs: the nearest
-- driver often loses the race to whoever tapped fastest, and a rider's wait is
-- decided by luck rather than proximity. Uber and Bolt offer a ride to ONE
-- driver at a time on a timer, which is what keeps ETAs honest.
--
-- Also adds the no-show flow: a driver who waited and left had no way to say
-- so, and ate the trip.
--
-- Idempotent: safe to re-run. Apply after phase22.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Offers.
--    One row per driver per ride. History is kept, not overwritten: "who did we
--    ask, in what order, and what did they say" is how you debug a rider
--    complaining she waited nine minutes with drivers all around her.
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'superseded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.offer_status NOT NULL DEFAULT 'pending',
  distance_km DOUBLE PRECISION,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_offers_driver_open ON public.ride_offers(driver_user_id, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_offers_ride ON public.ride_offers(ride_id, offered_at DESC);

GRANT SELECT ON public.ride_offers TO authenticated;
GRANT ALL ON public.ride_offers TO service_role;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

-- A driver sees her own offers. A rider sees offers on her own ride, which is
-- what lets the app say "finding you a driver" honestly rather than guessing.
DROP POLICY IF EXISTS "Offers own or ride party" ON public.ride_offers;
CREATE POLICY "Offers own or ride party" ON public.ride_offers
  FOR SELECT TO authenticated
  USING (
    driver_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.passenger_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS offer_seconds INT NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS offer_radius_km DOUBLE PRECISION NOT NULL DEFAULT 6;

-- ------------------------------------------------------------
-- 2. Offer the ride to the next-best driver.
--
--    Skips anyone already asked (so a decline is final for that ride), anyone
--    holding another pending offer (nobody gets two at once), and anyone on a
--    live trip. Returns the offer, or NULL when nobody is left — which the
--    caller should treat as "no drivers available", not as an error.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.offer_next_driver(_ride_id UUID)
RETURNS public.ride_offers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  cfg public.pricing_config;
  cand RECORD;
  o public.ride_offers;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.status <> 'requested' THEN RETURN NULL; END IF;

  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';

  -- Retire anything that timed out before looking for the next driver.
  UPDATE public.ride_offers SET status = 'expired', responded_at = now()
    WHERE ride_id = _ride_id AND status = 'pending' AND expires_at < now();

  -- Someone is still deciding — do not stack a second offer on the same ride.
  IF EXISTS (SELECT 1 FROM public.ride_offers
               WHERE ride_id = _ride_id AND status = 'pending' AND expires_at >= now()) THEN
    RETURN NULL;
  END IF;

  SELECT d.driver_user_id, d.distance_km INTO cand
  FROM public.nearest_available_drivers(r.pickup_lat, r.pickup_lng,
         COALESCE(cfg.offer_radius_km, 6), 20) d
  WHERE NOT EXISTS (
          SELECT 1 FROM public.ride_offers o2
          WHERE o2.ride_id = _ride_id AND o2.driver_user_id = d.driver_user_id)
    AND NOT EXISTS (
          SELECT 1 FROM public.ride_offers o3
          WHERE o3.driver_user_id = d.driver_user_id
            AND o3.status = 'pending' AND o3.expires_at >= now())
    AND NOT EXISTS (
          SELECT 1 FROM public.rides r2
          WHERE r2.driver_id = d.driver_user_id
            AND r2.status IN ('accepted', 'arrived', 'in_progress'))
  ORDER BY d.distance_km ASC
  LIMIT 1;

  IF cand.driver_user_id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.ride_offers (ride_id, driver_user_id, distance_km, expires_at)
    VALUES (_ride_id, cand.driver_user_id, cand.distance_km,
            now() + make_interval(secs => COALESCE(cfg.offer_seconds, 20)))
    RETURNING * INTO o;

  PERFORM public.push_notification(cand.driver_user_id, 'ride',
    'New ride request', 'A rider needs you nearby. Tap to accept.', _ride_id);
  RETURN o;
END; $$;
REVOKE EXECUTE ON FUNCTION public.offer_next_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_next_driver(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 3. Accepting an offer. Replaces the free-for-all claim.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_offer(_offer_id UUID)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.ride_offers;
  r public.rides;
BEGIN
  SELECT * INTO o FROM public.ride_offers WHERE id = _offer_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF o.driver_user_id <> auth.uid() THEN RAISE EXCEPTION 'That offer is not yours'; END IF;
  IF o.status <> 'pending' THEN RAISE EXCEPTION 'This offer is no longer open'; END IF;
  IF o.expires_at < now() THEN
    UPDATE public.ride_offers SET status = 'expired', responded_at = now() WHERE id = o.id;
    RAISE EXCEPTION 'This offer timed out';
  END IF;
  IF NOT public.is_verified_female_driver(auth.uid()) THEN
    RAISE EXCEPTION 'Only verified female drivers can accept rides';
  END IF;

  UPDATE public.rides
    SET driver_id = auth.uid(), status = 'accepted', accepted_at = now()
    WHERE id = o.ride_id AND status = 'requested' AND driver_id IS NULL
    RETURNING * INTO r;
  IF r.id IS NULL THEN
    UPDATE public.ride_offers SET status = 'superseded', responded_at = now() WHERE id = o.id;
    RAISE EXCEPTION 'Ride is no longer available';
  END IF;

  UPDATE public.ride_offers SET status = 'accepted', responded_at = now() WHERE id = o.id;
  -- Everyone else asked about this ride is done being asked.
  UPDATE public.ride_offers SET status = 'superseded', responded_at = now()
    WHERE ride_id = o.ride_id AND status = 'pending' AND id <> o.id;

  UPDATE public.driver_locations SET is_available = false, updated_at = now()
    WHERE driver_user_id = auth.uid();
  RETURN r;
END; $$;
REVOKE EXECUTE ON FUNCTION public.accept_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_offer(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_offer(_offer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.ride_offers;
BEGIN
  SELECT * INTO o FROM public.ride_offers WHERE id = _offer_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF o.driver_user_id <> auth.uid() THEN RAISE EXCEPTION 'That offer is not yours'; END IF;

  UPDATE public.ride_offers SET status = 'declined', responded_at = now()
    WHERE id = _offer_id AND status = 'pending';
  -- Move on immediately rather than making the rider wait out the timer.
  PERFORM public.offer_next_driver(o.ride_id);
END; $$;
REVOKE EXECUTE ON FUNCTION public.decline_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_offer(uuid) TO authenticated;

/** The offer this driver is currently being asked to answer, if any. */
CREATE OR REPLACE FUNCTION public.my_pending_offer()
RETURNS TABLE (
  offer_id UUID, ride_id UUID, distance_km DOUBLE PRECISION, expires_at TIMESTAMPTZ,
  pickup_address TEXT, drop_address TEXT, fare_estimate NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.ride_id, o.distance_km, o.expires_at,
         r.pickup_address, r.drop_address, r.fare_estimate
  FROM public.ride_offers o
  JOIN public.rides r ON r.id = o.ride_id
  WHERE o.driver_user_id = auth.uid()
    AND o.status = 'pending'
    AND o.expires_at >= now()
    AND r.status = 'requested'
  ORDER BY o.offered_at DESC
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.my_pending_offer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_pending_offer() TO authenticated;

-- ------------------------------------------------------------
-- 4. Keep the queue moving.
--    Called on a schedule: expires timed-out offers and asks the next driver.
--    Without this a declined-by-silence ride would sit forever.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_dispatch()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ride RECORD;
  moved INT := 0;
BEGIN
  UPDATE public.ride_offers SET status = 'expired', responded_at = now()
    WHERE status = 'pending' AND expires_at < now();

  FOR ride IN
    SELECT r.id FROM public.rides r
    WHERE r.status = 'requested'
      AND r.driver_id IS NULL
      AND (r.scheduled_for IS NULL OR r.scheduled_for <= now() + interval '30 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM public.ride_offers o
        WHERE o.ride_id = r.id AND o.status = 'pending' AND o.expires_at >= now())
  LOOP
    IF public.offer_next_driver(ride.id) IS NOT NULL THEN moved := moved + 1; END IF;
  END LOOP;
  RETURN moved;
END; $$;
REVOKE EXECUTE ON FUNCTION public.advance_dispatch() FROM PUBLIC, anon, authenticated;

-- Offer the first driver the moment a ride is requested, so the rider is not
-- waiting on the next scheduler tick.
CREATE OR REPLACE FUNCTION public.tg_offer_on_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'requested' AND NEW.driver_id IS NULL
     AND (NEW.scheduled_for IS NULL OR NEW.scheduled_for <= now() + interval '30 minutes') THEN
    PERFORM public.offer_next_driver(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_rides_offer_on_request ON public.rides;
CREATE TRIGGER trg_rides_offer_on_request AFTER INSERT ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.tg_offer_on_request();

-- ------------------------------------------------------------
-- 5. No-show.
--    A driver who arrived, waited and left had no way to say so and ate the
--    trip. The wait is enforced server-side against the arrival stamp, so
--    "no-show" cannot be claimed the second she pulls up.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS no_show_wait_min INT NOT NULL DEFAULT 5;

CREATE OR REPLACE FUNCTION public.report_no_show(_ride_id UUID)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  cfg public.pricing_config;
  waited_min INT;
  fee NUMERIC(10,2);
  bal NUMERIC(12,2);
  drv_bal NUMERIC(12,2);
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned driver can report a no-show';
  END IF;
  IF r.status <> 'arrived' THEN
    RAISE EXCEPTION 'Mark yourself arrived first (ride is %)', r.status;
  END IF;

  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';
  waited_min := FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(r.arrived_at, now()))) / 60);
  IF waited_min < COALESCE(cfg.no_show_wait_min, 5) THEN
    RAISE EXCEPTION 'Wait % more minute(s) before reporting a no-show',
      COALESCE(cfg.no_show_wait_min, 5) - waited_min;
  END IF;

  -- Same fee as a late cancellation, and for the same reason: her time and
  -- fuel are gone either way.
  fee := COALESCE(cfg.cancellation_fee, 0);
  IF fee > 0 THEN
    UPDATE public.wallets SET balance = balance - fee, updated_at = now()
      WHERE user_id = r.passenger_id RETURNING balance INTO bal;
    INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
      VALUES (r.passenger_id, r.id, 'cancellation_fee', 'completed', -fee, bal, 'No-show fee');
    UPDATE public.wallets SET balance = balance + fee, updated_at = now()
      WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
    INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
      VALUES (r.driver_id, r.id, 'adjustment', 'completed', fee, drv_bal, 'No-show compensation');
  END IF;

  UPDATE public.rides
    SET status = 'cancelled', cancellation_reason = 'Rider did not show', cancellation_fee = fee
    WHERE id = r.id RETURNING * INTO r;

  UPDATE public.driver_locations SET is_available = true, updated_at = now()
    WHERE driver_user_id = auth.uid();

  -- Repeated no-shows are a pattern worth seeing before it becomes a habit.
  INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
    VALUES (r.passenger_id, r.id, 'rider_no_show', 'low',
            jsonb_build_object('waited_min', waited_min));

  PERFORM public.push_notification(r.passenger_id, 'ride', 'Trip cancelled',
    'Your driver waited and had to move on. A no-show fee was charged.', r.id);
  RETURN r;
END; $$;
REVOKE EXECUTE ON FUNCTION public.report_no_show(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_no_show(uuid) TO authenticated;

COMMENT ON TABLE public.ride_offers IS
  'One row per driver asked, kept as history: who did we ask, in what order, and what did they say.';
COMMENT ON FUNCTION public.advance_dispatch() IS
  'Schedule this (pg_cron or an external tick). Without it a ride nobody answers waits forever.';
