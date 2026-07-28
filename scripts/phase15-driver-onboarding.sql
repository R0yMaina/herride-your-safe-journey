-- ============================================================
-- HerRide — Phase 15: driver onboarding & verification (HerShield layer 1)
-- Run ONCE in the Supabase SQL Editor after phase14-trip-flexibility.sql.
-- A woman applies to drive from inside the app (license, national ID,
-- vehicle, documents). The application sits in 'pending' until an admin
-- verifies her identity documents; only then is the 'driver' role granted
-- and only then can she appear in the pool (the female-only ride trigger
-- from setup-database.sql keeps enforcing at the row level regardless).
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. apply_as_driver — the single application path.
--    * caller must be signed in, female, not blacklisted
--    * creates (or re-submits after rejection) her drivers row as 'pending'
--    * a re-application resets status + clears the rejection reason
--    * admins are notified so the review queue moves
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_as_driver(
  _license_number TEXT,
  _national_id TEXT,
  _vehicle_make TEXT,
  _vehicle_model TEXT,
  _vehicle_plate TEXT,
  _vehicle_color TEXT DEFAULT NULL,
  _vehicle_year INT DEFAULT NULL,
  _selfie_url TEXT DEFAULT NULL,
  _id_document_url TEXT DEFAULT NULL
) RETURNS public.drivers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  p public.profiles;
  d public.drivers;
  admin_id UUID;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = me;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p.gender IS DISTINCT FROM 'female' THEN
    RAISE EXCEPTION 'HeRide drivers are women — applications are open to female members only';
  END IF;
  IF p.is_blacklisted THEN RAISE EXCEPTION 'This account cannot apply'; END IF;
  IF length(trim(_license_number)) < 4 THEN RAISE EXCEPTION 'Enter a valid licence number'; END IF;
  IF length(trim(_national_id)) < 4 THEN RAISE EXCEPTION 'Enter a valid national ID number'; END IF;
  IF length(trim(coalesce(_vehicle_plate, ''))) < 4 THEN RAISE EXCEPTION 'Enter a valid number plate'; END IF;

  SELECT * INTO d FROM public.drivers WHERE user_id = me;
  IF d.id IS NOT NULL AND d.verification_status IN ('verified', 'pending') THEN
    RAISE EXCEPTION 'You already have a % application', d.verification_status;
  END IF;

  INSERT INTO public.drivers (
    user_id, license_number, national_id,
    vehicle_make, vehicle_model, vehicle_plate, vehicle_color, vehicle_year,
    selfie_url, id_document_url, verification_status
  ) VALUES (
    me, trim(_license_number), trim(_national_id),
    trim(_vehicle_make), trim(_vehicle_model), upper(trim(_vehicle_plate)),
    NULLIF(trim(coalesce(_vehicle_color, '')), ''), _vehicle_year,
    _selfie_url, _id_document_url, 'pending'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    license_number = EXCLUDED.license_number,
    national_id = EXCLUDED.national_id,
    vehicle_make = EXCLUDED.vehicle_make,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_plate = EXCLUDED.vehicle_plate,
    vehicle_color = EXCLUDED.vehicle_color,
    vehicle_year = EXCLUDED.vehicle_year,
    selfie_url = COALESCE(EXCLUDED.selfie_url, drivers.selfie_url),
    id_document_url = COALESCE(EXCLUDED.id_document_url, drivers.id_document_url),
    verification_status = 'pending',
    rejection_reason = NULL,
    updated_at = now()
  RETURNING * INTO d;

  PERFORM public.push_notification(me, 'driver', 'Application received',
    'Thanks — our team is reviewing your documents. You''ll hear from us soon.');
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.push_notification(admin_id, 'admin', 'New driver application',
      'A new driver application is waiting for verification.');
  END LOOP;
  PERFORM public.log_audit('driver_applied', 'driver', d.id,
    jsonb_build_object('plate', d.vehicle_plate));
  RETURN d;
END; $$;
GRANT EXECUTE ON FUNCTION public.apply_as_driver(text, text, text, text, text, text, int, text, text) TO authenticated;

-- ------------------------------------------------------------
-- 2. get_my_driver_application — the applicant's own row (drives the
--    pending / rejected / verified status card in the app).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_driver_application()
RETURNS public.drivers LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.drivers WHERE user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_my_driver_application() TO authenticated;

-- ------------------------------------------------------------
-- 3. set_driver_status v2 — same contract as phase 5, now also:
--    * grants the 'driver' role when the application is verified
--      (role unlocks the driver app; ride rows stay guarded by the
--      female-only trigger either way)
--    * revokes the role on suspension/rejection
--    * notifies the applicant of the outcome
--    * writes the audit trail
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_driver_status(
  _driver_user_id UUID, _status public.driver_verification_status, _reason TEXT DEFAULT NULL
) RETURNS public.drivers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.drivers;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change driver verification status';
  END IF;
  UPDATE public.drivers
    SET verification_status = _status,
        verified_at = CASE WHEN _status = 'verified' THEN now() ELSE verified_at END,
        verified_by = CASE WHEN _status = 'verified' THEN auth.uid() ELSE verified_by END,
        rejection_reason = _reason
    WHERE user_id = _driver_user_id
    RETURNING * INTO d;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Driver not found'; END IF;

  IF _status = 'verified' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_driver_user_id, 'driver')
      ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM public.push_notification(_driver_user_id, 'driver', 'You''re approved to drive',
      'Welcome to HeRide. Open the app, go online, and take your first trip.');
  ELSIF _status IN ('rejected', 'suspended') THEN
    DELETE FROM public.user_roles WHERE user_id = _driver_user_id AND role = 'driver';
    PERFORM public.push_notification(_driver_user_id, 'driver',
      CASE WHEN _status = 'rejected' THEN 'Application update' ELSE 'Account suspended' END,
      COALESCE(_reason, 'Contact support for details.'));
  END IF;

  PERFORM public.log_audit('driver_status_' || _status::TEXT, 'driver', d.id,
    jsonb_build_object('driver_user_id', _driver_user_id, 'reason', _reason));
  RETURN d;
END; $$;
GRANT EXECUTE ON FUNCTION public.set_driver_status(uuid, public.driver_verification_status, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_driver_status(uuid, public.driver_verification_status, text) FROM anon;

-- ------------------------------------------------------------
-- 4. list_driver_applications — the admin review queue (15D UI).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_driver_applications(_status public.driver_verification_status DEFAULT 'pending')
RETURNS TABLE (
  user_id UUID, full_name TEXT, phone TEXT,
  license_number TEXT, national_id TEXT,
  vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT,
  vehicle_color TEXT, vehicle_year INT,
  selfie_url TEXT, id_document_url TEXT,
  verification_status public.driver_verification_status,
  rejection_reason TEXT, applied_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.user_id, p.full_name, p.phone,
         d.license_number, d.national_id,
         d.vehicle_make, d.vehicle_model, d.vehicle_plate,
         d.vehicle_color, d.vehicle_year,
         d.selfie_url, d.id_document_url,
         d.verification_status, d.rejection_reason, d.created_at
  FROM public.drivers d
  JOIN public.profiles p ON p.id = d.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND d.verification_status = _status
  ORDER BY d.created_at ASC
$$;
GRANT EXECUTE ON FUNCTION public.list_driver_applications(public.driver_verification_status) TO authenticated;

-- ------------------------------------------------------------
-- 5. Private storage bucket for identity documents (selfie + ID photo).
--    Applicants write only inside their own folder; admins can read all.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-docs', 'driver-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Driver docs own upload" ON storage.objects;
CREATE POLICY "Driver docs own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Driver docs own update" ON storage.objects;
CREATE POLICY "Driver docs own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Driver docs read own or admin" ON storage.objects;
CREATE POLICY "Driver docs read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
