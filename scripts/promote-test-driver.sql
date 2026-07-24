-- ============================================================
-- HerRide — promote an existing account to an APPROVED female driver
-- (test/dev helper). Sign up the driver account in the app FIRST, then
-- edit the email below and run this in the Supabase SQL Editor.
-- It: confirms the email, sets gender=female, grants the driver role,
-- and creates a verified drivers row with a seeded vehicle.
-- ============================================================

DO $$
DECLARE
  v_email TEXT := 'CHANGE_ME@example.com';  -- <-- edit this
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No auth user with email %', v_email;
  END IF;

  -- Confirm email so the account can sign in.
  UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = v_uid;

  -- Female profile (required for the female-only driver check).
  UPDATE public.profiles SET gender = 'female' WHERE id = v_uid;

  -- Grant driver role (keep any existing roles).
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'driver')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Verified driver + vehicle.
  INSERT INTO public.drivers (
    user_id, license_number, national_id,
    vehicle_make, vehicle_model, vehicle_plate, vehicle_color, vehicle_year,
    verification_status, verified_at
  ) VALUES (
    v_uid, 'DL-TEST-0001', 'ID-TEST-0001',
    'Toyota', 'Vitz', 'KDA 001A', 'Silver', 2019,
    'verified', now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET verification_status = 'verified', verified_at = now();

  RAISE NOTICE 'Promoted % (%) to approved driver', v_email, v_uid;
END $$;
