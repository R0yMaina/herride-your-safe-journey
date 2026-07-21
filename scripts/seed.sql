-- ============================================================
-- HerRide — demo seed (idempotent)
-- Run in the Supabase SQL Editor after phase5-hardening.sql.
-- Creates: 1 admin, 3 approved female drivers (with vehicles + live
-- locations around Nairobi), 2 female passengers (with saved places +
-- trusted contacts), and 2 completed historical rides with wallet
-- transactions. All demo accounts use password:  HerRide!2026#Safe
-- Fixed UUIDs make re-runs a no-op.
-- Requires pgcrypto (enabled by default on Supabase).
-- ============================================================

DO $$
DECLARE
  pw TEXT := crypt('HerRide!2026#Safe', gen_salt('bf'));
  admin_id  UUID := '00000000-0000-4000-a000-000000000001';
  drv1_id   UUID := '00000000-0000-4000-a000-000000000011';
  drv2_id   UUID := '00000000-0000-4000-a000-000000000012';
  drv3_id   UUID := '00000000-0000-4000-a000-000000000013';
  pax1_id   UUID := '00000000-0000-4000-a000-000000000021';
  pax2_id   UUID := '00000000-0000-4000-a000-000000000022';
  r RECORD;
BEGIN
  -- ---- auth users ----
  FOR r IN SELECT * FROM (VALUES
    (admin_id, 'admin@heride.test',   'Admin HeRide',  'female'),
    (drv1_id,  'driver1@heride.test', 'Grace Wanjiku', 'female'),
    (drv2_id,  'driver2@heride.test', 'Mercy Achieng', 'female'),
    (drv3_id,  'driver3@heride.test', 'Faith Kamau',   'female'),
    (pax1_id,  'rider1@heride.test',  'Amina Njoroge', 'female'),
    (pax2_id,  'rider2@heride.test',  'Zawadi Otieno', 'female')
  ) AS t(id, email, name, gender) LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated',
      r.email, pw, now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', r.name, 'gender', r.gender, 'email', r.email)
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (r.id, r.id, r.id::text,
      jsonb_build_object('sub', r.id::text, 'email', r.email), 'email', now(), now(), now())
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END LOOP;

  -- profiles + wallets are created by triggers; ensure gender is set
  UPDATE public.profiles SET gender = 'female'
    WHERE id IN (admin_id, drv1_id, drv2_id, drv3_id, pax1_id, pax2_id);

  -- ---- roles ----
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES
    (drv1_id, 'driver'), (drv2_id, 'driver'), (drv3_id, 'driver') ON CONFLICT DO NOTHING;

  -- ---- approved drivers + vehicles ----
  INSERT INTO public.drivers (user_id, license_number, national_id, vehicle_make, vehicle_model, vehicle_plate, vehicle_color, vehicle_year, verification_status, verified_at, rating)
  VALUES
    (drv1_id, 'DL-1001', 'ID-1001', 'Toyota', 'Vitz',  'KDA 100A', 'Silver', 2019, 'verified', now(), 4.90),
    (drv2_id, 'DL-1002', 'ID-1002', 'Mazda',  'Demio', 'KDB 200B', 'White',  2020, 'verified', now(), 4.80),
    (drv3_id, 'DL-1003', 'ID-1003', 'Honda',  'Fit',   'KDC 300C', 'Blue',   2018, 'verified', now(), 4.95)
  ON CONFLICT (user_id) DO UPDATE SET verification_status = 'verified';

  -- ---- live driver locations (spread around Nairobi) ----
  INSERT INTO public.driver_locations (driver_user_id, lat, lng, is_available, updated_at)
  VALUES
    (drv1_id, -1.2833, 36.7833, true, now()),
    (drv2_id, -1.2606, 36.8025, true, now()),
    (drv3_id, -1.2921, 36.8219, true, now())
  ON CONFLICT (driver_user_id) DO UPDATE SET is_available = true, updated_at = now();

  -- ---- passenger saved places + trusted contacts ----
  INSERT INTO public.saved_places (user_id, label, address, lat, lng) VALUES
    (pax1_id, 'Home', 'Kileleshwa, Nairobi', -1.2833, 36.7833),
    (pax1_id, 'Work', 'GTC Tower, Westlands', -1.2646, 36.8028),
    (pax2_id, 'Home', 'Kilimani, Nairobi',   -1.2929, 36.7856)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.trusted_contacts (user_id, name, phone, relationship) VALUES
    (pax1_id, 'Mum',    '+254700111222', 'Mother'),
    (pax2_id, 'Sister', '+254700333444', 'Sister')
  ON CONFLICT DO NOTHING;

  -- ---- historical completed rides + transactions ----
  IF NOT EXISTS (SELECT 1 FROM public.rides WHERE passenger_id = pax1_id AND status = 'completed') THEN
    WITH new_ride AS (
      INSERT INTO public.rides (passenger_id, driver_id, pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address, status, fare_estimate, fare_final, distance_km,
        requested_at, accepted_at, started_at, completed_at)
      VALUES (pax1_id, drv1_id, -1.2833, 36.7833, 'Kileleshwa', -1.2606, 36.8025, 'Sarit Centre',
        'completed', 530, 530, 4.0, now() - interval '2 days', now() - interval '2 days',
        now() - interval '2 days', now() - interval '2 days')
      RETURNING id
    )
    INSERT INTO public.transactions (user_id, ride_id, type, status, amount, description)
    SELECT pax1_id, id, 'ride_payment', 'completed', -530, 'Ride payment' FROM new_ride
    UNION ALL
    SELECT drv1_id, id, 'ride_payout', 'completed', 424, 'Ride payout' FROM new_ride;
  END IF;

  RAISE NOTICE 'Seed complete. Demo login password: HerRide!2026#Safe';
END $$;
