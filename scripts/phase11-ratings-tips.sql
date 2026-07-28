-- ============================================================
-- HerRide — Phase 11: post-trip ratings, compliments & tips
-- Run ONCE in the Supabase SQL Editor after phase10-financial-completion.sql.
-- Closes the trip loop: after a completed ride each party can rate the other
-- (1–5 stars + compliments + comment), and the passenger can add a tip. The
-- tip moves wallet→wallet ONLY inside the SECURITY DEFINER function (hard
-- rule: money never mutates from the client). A trigger keeps
-- drivers.rating / total per-driver aggregates in sync.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend ride_ratings (created in setup-database.sql) with compliments
--    and the tip actually paid alongside this rating.
-- ------------------------------------------------------------
ALTER TABLE public.ride_ratings ADD COLUMN IF NOT EXISTS compliments TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ride_ratings ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 'tip' as a first-class transaction type (enum extension is idempotent).
DO $$ BEGIN ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'tip'; EXCEPTION WHEN others THEN NULL; END $$;

-- Participants may READ ratings on their own rides (their given + received).
-- There is intentionally NO insert/update policy: writes go through
-- submit_rating below, which validates everything.
DROP POLICY IF EXISTS "Ratings visible to participants" ON public.ride_ratings;
CREATE POLICY "Ratings visible to participants" ON public.ride_ratings
  FOR SELECT TO authenticated
  USING (rater_id = auth.uid() OR ratee_id = auth.uid());

-- ------------------------------------------------------------
-- 2. submit_rating — the single write path. Validates that:
--      * the ride exists and is completed
--      * the caller was on the ride (passenger or driver)
--      * the caller hasn't already rated this ride
--    Tips are passenger→driver only, bounded, and settle atomically through
--    both wallets with a transactions row on each side.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_rating(
  _ride_id UUID,
  _stars SMALLINT,
  _comment TEXT DEFAULT NULL,
  _compliments TEXT[] DEFAULT '{}',
  _tip NUMERIC DEFAULT 0
) RETURNS public.ride_ratings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  me UUID := auth.uid();
  other UUID;
  tip NUMERIC(10,2);
  pass_bal NUMERIC(12,2);
  drv_bal NUMERIC(12,2);
  row public.ride_ratings;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _stars IS NULL OR _stars < 1 OR _stars > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5 stars';
  END IF;

  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.status <> 'completed' THEN
    RAISE EXCEPTION 'You can only rate a completed ride (is %)', r.status;
  END IF;
  IF me = r.passenger_id THEN other := r.driver_id;
  ELSIF me = r.driver_id THEN other := r.passenger_id;
  ELSE RAISE EXCEPTION 'Only ride participants can rate this ride';
  END IF;
  IF other IS NULL THEN RAISE EXCEPTION 'Ride has no counterparty to rate'; END IF;
  IF EXISTS (SELECT 1 FROM public.ride_ratings WHERE ride_id = _ride_id AND rater_id = me) THEN
    RAISE EXCEPTION 'You already rated this ride';
  END IF;

  -- Tip: passenger → driver only, sane bounds, wallet-funded.
  tip := round(GREATEST(COALESCE(_tip, 0), 0), 2);
  IF tip > 0 THEN
    IF me <> r.passenger_id THEN RAISE EXCEPTION 'Only the passenger can tip'; END IF;
    IF tip > 10000 THEN RAISE EXCEPTION 'Tip too large'; END IF;
    UPDATE public.wallets SET balance = balance - tip, updated_at = now()
      WHERE user_id = r.passenger_id RETURNING balance INTO pass_bal;
    IF pass_bal IS NULL THEN RAISE EXCEPTION 'No wallet for passenger'; END IF;
    IF pass_bal < 0 THEN RAISE EXCEPTION 'Insufficient balance for tip'; END IF;
    INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
      VALUES (r.passenger_id, r.id, 'tip', 'completed', -tip, pass_bal, 'Tip to driver');
    UPDATE public.wallets SET balance = balance + tip, updated_at = now()
      WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
    INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
      VALUES (r.driver_id, r.id, 'tip', 'completed', tip, drv_bal, 'Tip received');
    PERFORM public.push_notification(r.driver_id, 'wallet', 'You received a tip',
      'A rider added a tip of KES ' || tip::TEXT || ' — thank you for a great trip.', r.id);
  END IF;

  INSERT INTO public.ride_ratings (ride_id, rater_id, ratee_id, rating, comment, compliments, tip_amount)
    VALUES (_ride_id, me, other, _stars, NULLIF(trim(_comment), ''), COALESCE(_compliments, '{}'), tip)
    RETURNING * INTO row;
  RETURN row;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_rating(uuid, smallint, text, text[], numeric) TO authenticated;

-- ------------------------------------------------------------
-- 3. Keep drivers.rating in sync: average of all ratings received by the
--    driver, rounded to 2dp; 5.00 while unrated (matches the column default).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_driver_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.drivers d
     SET rating = COALESCE((
           SELECT round(avg(rr.rating)::NUMERIC, 2)
           FROM public.ride_ratings rr WHERE rr.ratee_id = NEW.ratee_id
         ), 5.00),
         updated_at = now()
   WHERE d.user_id = NEW.ratee_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_refresh_driver_rating ON public.ride_ratings;
CREATE TRIGGER trg_refresh_driver_rating
  AFTER INSERT OR UPDATE OF rating ON public.ride_ratings
  FOR EACH ROW EXECUTE FUNCTION public.refresh_driver_rating();

-- ------------------------------------------------------------
-- 4. has_rated helper — cheap check so the UI knows whether to show the
--    rating sheet for a completed ride.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_rated(_ride_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ride_ratings
    WHERE ride_id = _ride_id AND rater_id = auth.uid()
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_rated(uuid) TO authenticated;
