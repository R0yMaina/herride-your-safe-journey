-- ============================================================
-- HerRide — investor demo seed (idempotent)
-- Run AFTER seed.sql and all phase scripts through phase15c.
-- seed.sql creates the accounts; this fills the NEW screens so a live demo
-- never shows an empty state:
--   * a PENDING driver application waiting in the admin verification desk
--   * completed trips with ratings, compliments and tips (driver rating and
--     earnings become real numbers, not zeros)
--   * wallet float for the demo rider so a booking can actually settle
--   * a referral code for the Invite & earn card
-- Fixed UUIDs and guards make re-runs a no-op.
-- Demo accounts (from seed.sql) use password:  HerRide!2026#Safe
-- ============================================================

DO $$
DECLARE
  pw TEXT := crypt('HerRide!2026#Safe', gen_salt('bf'));
  drv1_id    UUID := '00000000-0000-4000-a000-000000000011';  -- Grace Wanjiku
  drv2_id    UUID := '00000000-0000-4000-a000-000000000012';  -- Mercy Achieng
  pax1_id    UUID := '00000000-0000-4000-a000-000000000021';  -- Amina Njoroge
  pax2_id    UUID := '00000000-0000-4000-a000-000000000022';  -- Zawadi Otieno
  applicant  UUID := '00000000-0000-4000-a000-000000000014';  -- pending applicant
  ride_id    UUID;
  i INT;
  fare NUMERIC;
  payout NUMERIC;
BEGIN
  -- ------------------------------------------------------------
  -- 1. A pending applicant so the admin verification desk has a real
  --    application to approve on stage.
  -- ------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', applicant, 'authenticated', 'authenticated',
    'applicant@heride.test', pw, now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', 'Naserian Leteipa', 'gender', 'female',
                       'email', 'applicant@heride.test')
  ) ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles
     SET gender = 'female', full_name = 'Naserian Leteipa', phone = '+254712004455'
   WHERE id = applicant;

  INSERT INTO public.drivers (
    user_id, license_number, national_id, vehicle_make, vehicle_model,
    vehicle_plate, vehicle_color, vehicle_year, verification_status
  ) VALUES (
    applicant, 'DL-7781234', '29774512', 'Mazda', 'Demio',
    'KDK 884Q', 'Pearl White', 2019, 'pending'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- ------------------------------------------------------------
  -- 2. Wallet float so a demo booking can settle end-to-end.
  -- ------------------------------------------------------------
  UPDATE public.wallets SET balance = GREATEST(balance, 8000), updated_at = now()
   WHERE user_id IN (pax1_id, pax2_id);

  -- ------------------------------------------------------------
  -- 3. Trip history with ratings + tips, so the driver's Earnings and
  --    rating are populated. Six completed trips spread over this week.
  -- ------------------------------------------------------------
  IF (SELECT count(*) FROM public.rides WHERE driver_id = drv1_id AND status = 'completed') < 5 THEN
    FOR i IN 1..6 LOOP
      fare   := 480 + (i * 70);
      payout := round(fare * 0.90, 2);
      ride_id := gen_random_uuid();

      INSERT INTO public.rides (
        id, passenger_id, driver_id,
        pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address,
        status, fare_estimate, fare_final, distance_km, duration_min,
        category_multiplier, requested_at, accepted_at, started_at, completed_at
      ) VALUES (
        ride_id,
        CASE WHEN i % 2 = 0 THEN pax1_id ELSE pax2_id END,
        CASE WHEN i % 3 = 0 THEN drv2_id ELSE drv1_id END,
        -1.2921, 36.8219, 'Westlands, Nairobi',
        -1.3005 - (i * 0.004), 36.7820 + (i * 0.003),
        (ARRAY['Sarit Centre','Yaya Centre','The Village Market','JKIA Terminal 1A',
               'Two Rivers Mall','Kilimani'])[i],
        'completed', fare, fare, 3.4 + i, 11 + i, 1,
        now() - ((7 - i) || ' hours')::interval,
        now() - ((7 - i) || ' hours')::interval + interval '3 minutes',
        now() - ((7 - i) || ' hours')::interval + interval '9 minutes',
        now() - ((7 - i) || ' hours')::interval + interval '31 minutes'
      );

      -- Settlement rows mirroring complete_ride, so Earnings reconciles.
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, description, created_at)
      VALUES (
        (SELECT passenger_id FROM public.rides WHERE id = ride_id),
        ride_id, 'ride_payment', 'completed', -fare, 'Ride payment',
        now() - ((7 - i) || ' hours')::interval + interval '31 minutes'
      );
      INSERT INTO public.transactions (user_id, ride_id, type, status, amount, description, created_at)
      VALUES (
        (SELECT driver_id FROM public.rides WHERE id = ride_id),
        ride_id, 'ride_payout', 'completed', payout, 'Ride payout',
        now() - ((7 - i) || ' hours')::interval + interval '31 minutes'
      );
      INSERT INTO public.platform_ledger (ride_id, gross_fare, commission, driver_payout, commission_rate, currency, created_at)
      VALUES (ride_id, fare, fare - payout, payout, 0.10, 'KES',
              now() - ((7 - i) || ' hours')::interval + interval '31 minutes')
      ON CONFLICT (ride_id) DO NOTHING;

      -- Rating (+ a tip on two of them) — drives the driver's star average.
      INSERT INTO public.ride_ratings (ride_id, rater_id, ratee_id, rating, comment, compliments, tip_amount, created_at)
      VALUES (
        ride_id,
        (SELECT passenger_id FROM public.rides WHERE id = ride_id),
        (SELECT driver_id FROM public.rides WHERE id = ride_id),
        CASE WHEN i = 4 THEN 4 ELSE 5 END,
        CASE WHEN i = 2 THEN 'Felt completely safe the whole way. Thank you!' ELSE NULL END,
        CASE WHEN i % 2 = 0 THEN ARRAY['felt_safe','excellent_driving']
             ELSE ARRAY['felt_safe','clean_car'] END,
        CASE WHEN i IN (2, 5) THEN 100 ELSE 0 END,
        now() - ((7 - i) || ' hours')::interval + interval '35 minutes'
      ) ON CONFLICT (ride_id, rater_id) DO NOTHING;

      -- Tip transactions for the two tipped trips.
      IF i IN (2, 5) THEN
        INSERT INTO public.transactions (user_id, ride_id, type, status, amount, description, created_at)
        VALUES (
          (SELECT driver_id FROM public.rides WHERE id = ride_id),
          ride_id, 'tip', 'completed', 100, 'Tip received',
          now() - ((7 - i) || ' hours')::interval + interval '35 minutes'
        );
      END IF;
    END LOOP;
  END IF;

  -- ------------------------------------------------------------
  -- 4. Referral codes so the Invite & earn card shows a real code.
  -- ------------------------------------------------------------
  INSERT INTO public.referral_codes (user_id, code) VALUES
    (pax1_id, 'HER-AMINA1'),
    (pax2_id, 'HER-ZAWADI')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Demo seed complete: 1 pending application, 6 rated trips, tips, wallet float, referral codes.';
END $$;
