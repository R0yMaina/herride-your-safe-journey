-- HerRide — Phase 24: receipts that actually reconcile
--
-- `get_receipt` (phase 10) itemised base + distance + time + booking fee and
-- then printed the charged total underneath. That was true in phase 10. Since
-- then phase 13 added promo discounts, phase 18 added a waiting charge and a
-- cancellation fee, phase 23 added the no-show fee, and phase 11 added tips —
-- none of which appeared on the receipt. The lines stopped adding up to the
-- total, which is the one thing a receipt has to do.
--
-- This replaces it with a breakdown that always balances:
--
--   base + distance + time + booking fee      (the metered fare)
--   ± adjustment                              (min-fare floor / max-fare cap)
--   − discount                                (promo)
--   + waiting fee                             (arrival → start, past the grace)
--   ─────────────────────────────────────
--   = total charged
--
-- A cancelled ride reports the cancellation (or no-show) fee as its total with
-- the fare lines zeroed — she was not driven anywhere, so there is no fare to
-- itemise. The tip is reported separately because it is paid after settlement
-- and is not part of the fare.
--
-- Idempotent. Safe to re-run.

-- The return signature changes, so CREATE OR REPLACE is not enough.
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

  -- Same authorisation as before: the two people on the trip, plus admin.
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

  SELECT COALESCE(SUM(rr.tip_amount), 0) INTO v_tip
    FROM public.ride_ratings rr WHERE rr.ride_id = r.id;

  IF r.status = 'cancelled' THEN
    -- Nothing was driven, so nothing is metered. The fee is the whole bill and
    -- it goes to the driver who was already on her way (see cancel_ride).
    v_base := 0; v_dist := 0; v_time := 0; v_booking := 0;
    v_adjust := 0; v_discount := 0; v_wait_fee := 0; v_wait_min := 0;
    v_total := v_cancel_fee;
    v_commission := 0;
    v_payout := v_cancel_fee;
  ELSE
    v_mult    := GREATEST(COALESCE(r.category_multiplier, 1), 0);
    v_base    := round((c.base_fare * v_mult) / c.rounding) * c.rounding;
    v_dist    := round((GREATEST(COALESCE(r.distance_km, 0), 0) * c.per_km * v_mult) / c.rounding) * c.rounding;
    v_time    := round((GREATEST(COALESCE(r.duration_min, 0), 0) * c.per_min * v_mult) / c.rounding) * c.rounding;
    v_booking := c.booking_fee;

    -- Whatever the metered lines do not explain. Normally the min-fare floor
    -- on a very short trip; on a legacy ride booked before the pricing inputs
    -- were stored it absorbs the difference against the quoted estimate. Either
    -- way the column exists so the receipt can never fail to balance.
    v_adjust := v_total - (v_base + v_dist + v_time + v_booking - v_discount + v_wait_fee);

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

-- EXECUTE is granted to PUBLIC on creation; revoking from anon alone leaves
-- that grant in place (the phase 20 lesson), so revoke from PUBLIC first.
REVOKE EXECUTE ON FUNCTION public.get_receipt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_receipt(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_receipt(uuid) IS
  'Itemised, self-reconciling receipt for one ride. Readable by the passenger, '
  'the driver, or an admin. The adjustment line absorbs the min/max fare clamp '
  'so the printed lines always sum to the total charged.';
