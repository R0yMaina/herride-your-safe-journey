-- ============================================================
-- HerRide — Phase 26: surge pricing
--
-- The client-side Pricing Engine has accepted a `demandMultiplier` since it
-- was written, and `FareBreakdown.surge` has been rendering a dash on every
-- receipt because nothing ever produced one. Meanwhile `quote_fare` — the
-- authoritative formula — has no concept of surge at all. Wiring the client
-- alone would have been the worst outcome: a rider quoted 1.8x and settled at
-- 1.0x, or the reverse.
--
-- So surge is computed here, from real supply and demand, and LOCKED ONTO THE
-- RIDE at the moment she books. Settlement multiplies by the locked value, not
-- by whatever the market is doing twenty minutes later when her driver taps
-- Complete. She pays the number she was shown.
--
-- Off by default. Turning it on is a pricing decision:
--   UPDATE public.pricing_config SET surge_enabled = true WHERE id = 'default';
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Configuration. Every number here is a policy choice, not a constant.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS surge_enabled BOOLEAN NOT NULL DEFAULT false,
  -- A hard ceiling. Uncapped surge is how a ride-hailing app ends up on the
  -- news after a crisis, and this one is sold to women who may be leaving a
  -- bad situation at 2am. 2.0x is the most this platform will ever charge.
  ADD COLUMN IF NOT EXISTS surge_max NUMERIC(4,2) NOT NULL DEFAULT 2.00,
  -- How far around the pickup we look for supply and demand.
  ADD COLUMN IF NOT EXISTS surge_radius_km NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  -- Unmet requests per available driver before the multiplier moves at all.
  ADD COLUMN IF NOT EXISTS surge_free_ratio NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  -- How much each further unmet request per driver adds.
  ADD COLUMN IF NOT EXISTS surge_step NUMERIC(4,2) NOT NULL DEFAULT 0.25,
  -- Requests older than this are stale and no longer count as live demand.
  ADD COLUMN IF NOT EXISTS surge_demand_window_min INT NOT NULL DEFAULT 10;

-- Shared haversine. nearest_available_drivers inlines the same arithmetic;
-- this gives the surge query one honest copy instead of a second inline one.
CREATE OR REPLACE FUNCTION public.km_between(
  _lat1 DOUBLE PRECISION, _lng1 DOUBLE PRECISION,
  _lat2 DOUBLE PRECISION, _lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT 6371 * acos(
    LEAST(1, GREATEST(-1,
      cos(radians(_lat1)) * cos(radians(_lat2)) * cos(radians(_lng2) - radians(_lng1))
      + sin(radians(_lat1)) * sin(radians(_lat2))
    ))
  );
$$;
GRANT EXECUTE ON FUNCTION public.km_between(double precision, double precision, double precision, double precision) TO authenticated;

-- ------------------------------------------------------------
-- 2. The multiplier for a point, right now.
--
--    demand  = ride requests near the point that no driver has taken yet
--    supply  = verified drivers near the point, available, pinged recently
--
--    ratio   = demand / supply, with supply floored at 1 so an empty area does
--              not divide by zero and does not surge on a single request.
--
--    Rounded to one decimal so the rider sees 1.4x, not 1.3871x — a precise
--    number invites the belief that it is precise about anything.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_surge(
  _lat DOUBLE PRECISION, _lng DOUBLE PRECISION
) RETURNS NUMERIC LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg public.pricing_config;
  demand INT;
  supply INT;
  ratio NUMERIC;
  mult NUMERIC;
BEGIN
  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';
  IF cfg.id IS NULL OR NOT COALESCE(cfg.surge_enabled, false) THEN RETURN 1.0; END IF;
  IF _lat IS NULL OR _lng IS NULL THEN RETURN 1.0; END IF;

  SELECT COUNT(*) INTO demand
  FROM public.rides r
  WHERE r.status = 'requested'
    AND r.driver_id IS NULL
    AND r.requested_at > now() - make_interval(mins => COALESCE(cfg.surge_demand_window_min, 10))
    -- Scheduled rides are not competing for a car right now.
    AND r.scheduled_for IS NULL
    AND public.km_between(_lat, _lng, r.pickup_lat, r.pickup_lng)
        <= COALESCE(cfg.surge_radius_km, 3);

  SELECT COUNT(*) INTO supply
  FROM public.driver_locations dl
  JOIN public.drivers d ON d.user_id = dl.driver_user_id
  JOIN public.profiles p ON p.id = dl.driver_user_id
  WHERE dl.is_available = true
    AND d.verification_status = 'verified'
    AND p.gender = 'female'
    AND p.is_blacklisted = false
    AND dl.updated_at > now() - interval '2 minutes'
    AND public.km_between(_lat, _lng, dl.lat, dl.lng) <= COALESCE(cfg.surge_radius_km, 3);

  ratio := demand::NUMERIC / GREATEST(supply, 1)::NUMERIC;
  mult := 1 + GREATEST(ratio - COALESCE(cfg.surge_free_ratio, 1), 0) * COALESCE(cfg.surge_step, 0.25);
  mult := LEAST(GREATEST(mult, 1.0), COALESCE(cfg.surge_max, 2.0));
  RETURN round(mult, 1);
END; $$;
REVOKE EXECUTE ON FUNCTION public.current_surge(double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_surge(double precision, double precision) TO authenticated;


/** What the rider's app shows before she books. */
CREATE OR REPLACE FUNCTION public.surge_at(_lat DOUBLE PRECISION, _lng DOUBLE PRECISION)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_surge(_lat, _lng);
$$;
REVOKE EXECUTE ON FUNCTION public.surge_at(double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.surge_at(double precision, double precision) TO authenticated;

-- ------------------------------------------------------------
-- 3. Lock it onto the ride at booking time.
--
--    The column is set by a trigger, never by the client — a rider who could
--    PATCH her own surge_multiplier to 0.5 would be writing her own prices.
-- ------------------------------------------------------------
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS surge_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS surge_amount NUMERIC(10,2);

CREATE OR REPLACE FUNCTION public.tg_rides_lock_surge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A scheduled ride is priced when it is released to drivers, not weeks
    -- ahead against a market that has nothing to do with her pickup time.
    NEW.surge_multiplier := CASE
      WHEN NEW.scheduled_for IS NOT NULL THEN 1.00
      ELSE public.current_surge(NEW.pickup_lat, NEW.pickup_lng)
    END;
    RETURN NEW;
  END IF;

  -- Immutable afterwards, in either direction.
  IF NEW.surge_multiplier IS DISTINCT FROM OLD.surge_multiplier THEN
    NEW.surge_multiplier := OLD.surge_multiplier;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_rides_lock_surge ON public.rides;
CREATE TRIGGER trg_rides_lock_surge
  BEFORE INSERT OR UPDATE OF surge_multiplier ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.tg_rides_lock_surge();

-- ------------------------------------------------------------
-- 4. Settlement honours the locked multiplier.
--
--    complete_ride v5. Everything else — promo discount, waiting fee, referral
--    reward, ledger — is carried forward from the phase 18 version unchanged;
--    only the surge line is new. Order matters: surge applies to the metered
--    fare, then the discount comes off, then the waiting fee goes on. Surging
--    a promo code would make the promo worth less exactly when she needs it,
--    and surging the time she was kept waiting would charge her twice for the
--    driver being late.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_ride(_ride_id UUID, _commission NUMERIC DEFAULT NULL)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  commission NUMERIC(5,4);
  fare NUMERIC(12,2);
  metered NUMERIC(12,2);
  surge_mult NUMERIC(4,2);
  surge_amt NUMERIC(10,2);
  payout NUMERIC(12,2);
  pass_bal NUMERIC(12,2);
  drv_bal NUMERIC(12,2);
  reward NUMERIC(10,2);
  s public.referral_signups;
  bal NUMERIC(12,2);
  waited_min INT;
  billable_min INT;
  wait_fee NUMERIC(10,2);
  cfg public.pricing_config;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned driver can complete this ride';
  END IF;
  IF r.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Ride must be in progress to complete (is %)', r.status;
  END IF;

  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';
  commission := COALESCE(_commission, cfg.commission_rate, 0.10);

  IF r.distance_km IS NOT NULL THEN
    metered := public.quote_fare(r.distance_km, r.duration_min, COALESCE(r.category_multiplier, 1));
  ELSE
    metered := COALESCE(r.fare_estimate, 0);
  END IF;

  -- Locked at booking (section 3), clamped again here so a stale row written
  -- before the ceiling existed cannot settle above it.
  surge_mult := LEAST(GREATEST(COALESCE(r.surge_multiplier, 1), 1), COALESCE(cfg.surge_max, 2.0));
  surge_amt := round(metered * (surge_mult - 1), 2);

  waited_min := 0;
  wait_fee := 0;
  IF r.arrived_at IS NOT NULL AND r.started_at IS NOT NULL AND r.started_at > r.arrived_at THEN
    waited_min := FLOOR(EXTRACT(EPOCH FROM (r.started_at - r.arrived_at)) / 60);
    billable_min := GREATEST(waited_min - COALESCE(cfg.free_waiting_min, 3), 0);
    wait_fee := round(billable_min * COALESCE(cfg.waiting_fee_per_min, 0), 2);
  END IF;

  fare := GREATEST(metered + surge_amt - COALESCE(r.discount, 0), 0) + wait_fee;
  payout := round(fare * (1 - commission), 2);

  UPDATE public.wallets SET balance = balance - fare, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO pass_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.passenger_id, r.id, 'ride_payment', 'completed', -fare, pass_bal,
      'Ride payment'
      || CASE WHEN surge_amt > 0
           THEN ' (' || surge_mult::TEXT || 'x busy period)' ELSE '' END
      || CASE WHEN COALESCE(r.discount, 0) > 0
           THEN ' (promo ' || r.promo_code || ' −' || r.discount::TEXT || ')' ELSE '' END
      || CASE WHEN wait_fee > 0
           THEN ' (+' || wait_fee::TEXT || ' waiting, ' || waited_min::TEXT || ' min)' ELSE '' END);

  UPDATE public.wallets SET balance = balance + payout, updated_at = now()
    WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.driver_id, r.id, 'ride_payout', 'completed', payout, drv_bal, 'Ride payout');

  INSERT INTO public.platform_ledger (ride_id, gross_fare, commission, driver_payout, commission_rate, currency)
    VALUES (r.id, fare, fare - payout, payout, commission, 'KES')
    ON CONFLICT (ride_id) DO NOTHING;

  UPDATE public.rides
    SET status = 'completed', completed_at = now(), fare_final = fare,
        waiting_minutes = waited_min, waiting_fee = wait_fee,
        surge_amount = surge_amt
    WHERE id = r.id RETURNING * INTO r;

  -- Referral reward: referee's FIRST completed trip credits both wallets.
  SELECT * INTO s FROM public.referral_signups rs
    WHERE rs.referee_id = r.passenger_id AND rs.credited = false FOR UPDATE;
  IF s.referee_id IS NOT NULL THEN
    reward := COALESCE(cfg.referral_reward, 200);
    IF reward > 0 THEN
      UPDATE public.wallets SET balance = balance + reward, updated_at = now()
        WHERE user_id = s.referee_id RETURNING balance INTO bal;
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
        VALUES (s.referee_id, r.id, 'adjustment', 'completed', reward, bal,
                'Referral reward — welcome to HeRide');
      UPDATE public.wallets SET balance = balance + reward, updated_at = now()
        WHERE user_id = s.referrer_id RETURNING balance INTO bal;
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
        VALUES (s.referrer_id, r.id, 'adjustment', 'completed', reward, bal,
                'Referral reward — your friend completed her first trip');
    END IF;
    UPDATE public.referral_signups SET credited = true, credited_at = now()
      WHERE referee_id = s.referee_id;
  END IF;

  RETURN r;
END; $$;

-- ------------------------------------------------------------
-- 5. The receipt gains a surge line, or it stops adding up.
--    Same self-reconciling contract as phase 24: the printed lines sum to the
--    total, and `adjustment` absorbs whatever the components cannot explain.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_receipt(uuid);

CREATE FUNCTION public.get_receipt(_ride_id UUID)
RETURNS TABLE (
  ride_id UUID,
  status TEXT,
  currency TEXT,
  base_fare NUMERIC,
  distance_cost NUMERIC,
  time_cost NUMERIC,
  booking_fee NUMERIC,
  surge_multiplier NUMERIC,
  surge_amount NUMERIC,
  adjustment NUMERIC,
  discount NUMERIC,
  promo_code TEXT,
  waiting_minutes INT,
  waiting_fee NUMERIC,
  cancellation_fee NUMERIC,
  total NUMERIC,
  tip NUMERIC,
  commission NUMERIC,
  driver_earnings NUMERIC,
  distance_km NUMERIC,
  duration_min NUMERIC,
  driver_name TEXT,
  vehicle TEXT,
  plate TEXT,
  pickup_address TEXT,
  drop_address TEXT,
  requested_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  c public.pricing_config;
  pl public.platform_ledger;
  v_mult NUMERIC;
  v_base NUMERIC;
  v_dist NUMERIC;
  v_time NUMERIC;
  v_booking NUMERIC;
  v_surge_mult NUMERIC;
  v_surge_amt NUMERIC;
  v_discount NUMERIC;
  v_wait_fee NUMERIC;
  v_wait_min INT;
  v_cancel_fee NUMERIC;
  v_total NUMERIC;
  v_adjust NUMERIC;
  v_tip NUMERIC;
  v_commission NUMERIC;
  v_payout NUMERIC;
  v_driver_name TEXT;
  v_vehicle TEXT;
  v_plate TEXT;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;

  IF auth.uid() NOT IN (r.passenger_id, r.driver_id)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised to view this receipt';
  END IF;

  SELECT * INTO c FROM public.pricing_config WHERE id = 'default';
  SELECT * INTO pl FROM public.platform_ledger WHERE platform_ledger.ride_id = r.id;

  v_total      := COALESCE(r.fare_final, r.fare_estimate, 0);
  v_cancel_fee := COALESCE(r.cancellation_fee, 0);
  v_wait_min   := COALESCE(r.waiting_minutes, 0);
  v_wait_fee   := COALESCE(r.waiting_fee, 0);
  v_discount   := COALESCE(r.discount, 0);
  v_surge_mult := COALESCE(r.surge_multiplier, 1);
  v_surge_amt  := COALESCE(r.surge_amount, 0);

  SELECT COALESCE(SUM(rr.tip_amount), 0) INTO v_tip
    FROM public.ride_ratings rr WHERE rr.ride_id = r.id;

  IF r.status = 'cancelled' THEN
    v_base := 0; v_dist := 0; v_time := 0; v_booking := 0;
    v_adjust := 0; v_discount := 0; v_wait_fee := 0; v_wait_min := 0;
    v_surge_mult := 1; v_surge_amt := 0;
    v_total := v_cancel_fee;
    v_commission := 0;
    v_payout := v_cancel_fee;
  ELSE
    v_mult    := GREATEST(COALESCE(r.category_multiplier, 1), 0);
    v_base    := round((c.base_fare * v_mult) / c.rounding) * c.rounding;
    v_dist    := round((GREATEST(COALESCE(r.distance_km, 0), 0) * c.per_km * v_mult) / c.rounding) * c.rounding;
    v_time    := round((GREATEST(COALESCE(r.duration_min, 0), 0) * c.per_min * v_mult) / c.rounding) * c.rounding;
    v_booking := c.booking_fee;

    v_adjust := v_total
      - (v_base + v_dist + v_time + v_booking + v_surge_amt - v_discount + v_wait_fee);

    v_commission := COALESCE(pl.commission, round(v_total * COALESCE(c.commission_rate, 0.10), 2));
    v_payout     := COALESCE(pl.driver_payout, v_total - v_commission);
  END IF;

  SELECT p.full_name,
         NULLIF(concat_ws(' ', d.vehicle_make, d.vehicle_model), ''),
         d.vehicle_plate
    INTO v_driver_name, v_vehicle, v_plate
    FROM public.profiles p
    LEFT JOIN public.drivers d ON d.user_id = p.id
    WHERE p.id = r.driver_id;

  RETURN QUERY SELECT
    r.id,
    r.status::TEXT,
    COALESCE(c.currency, 'KES'),
    v_base, v_dist, v_time, v_booking,
    v_surge_mult, v_surge_amt,
    v_adjust,
    v_discount,
    r.promo_code,
    v_wait_min,
    v_wait_fee,
    v_cancel_fee,
    v_total,
    v_tip,
    v_commission,
    v_payout,
    r.distance_km,
    r.duration_min,
    v_driver_name, v_vehicle, v_plate,
    r.pickup_address, r.drop_address,
    r.requested_at, r.completed_at;
END; $$;

REVOKE EXECUTE ON FUNCTION public.get_receipt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_receipt(uuid) TO authenticated;

COMMENT ON FUNCTION public.current_surge(double precision, double precision) IS
  'Live demand/supply multiplier around a point, capped at pricing_config.surge_max. '
  'Off unless surge_enabled. Rounded to 0.1 — a precise number would imply a '
  'precision this estimate does not have.';

COMMENT ON FUNCTION public.tg_rides_lock_surge() IS
  'Locks the multiplier onto the ride at booking and freezes it. She pays the '
  'number she was shown, not whatever the market does before her driver taps '
  'Complete.';
