-- ============================================================
-- HerRide — Phase 25: rider identity verification, and closing the
--                     self-declared-gender hole underneath it
--
-- Drivers prove who they are: ID, selfie, a human review, and since phase 19 a
-- periodic re-check. Riders prove nothing. `profiles.gender` is whatever the
-- signup form was told, and — worse — the `Profiles own update` policy lets any
-- signed-in user rewrite their own row. Two lines of PostgREST is all it takes:
--
--     update profiles set gender = 'female' where id = auth.uid();
--     -- and now the female-only trigger waves him through
--
-- The same policy lets a blacklisted account clear its own `is_blacklisted`
-- flag. Both are fixed here by a trigger, because a policy cannot express
-- "you may edit this row but not these two columns".
--
-- On top of that: a real rider verification flow, mirroring the driver one
-- (submit → human review → approved), with enforcement that can be switched on
-- without locking out the riders who are already using the app.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Gender and blacklist stop being self-service.
--
--    Gender may still be set ONCE while it is NULL — an account that signed up
--    without choosing needs a way to finish its profile, and that is no weaker
--    than the signup form itself. Changing an existing value, in either
--    direction, is a support action. Admins are exempt; so is the signup
--    trigger, which runs before there is any auth.uid() to check.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_profiles_protect_identity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.gender IS DISTINCT FROM OLD.gender AND OLD.gender IS NOT NULL THEN
    RAISE EXCEPTION
      'Gender cannot be changed here. Contact support at heride@gmail.com if it is wrong.';
  END IF;

  IF NEW.is_blacklisted IS DISTINCT FROM OLD.is_blacklisted THEN
    RAISE EXCEPTION 'Account standing is not self-service';
  END IF;

  -- Verification state is set by the review desk, never by the person being
  -- reviewed. Without this line the whole of section 5 is decoration.
  IF NEW.identity_verified IS DISTINCT FROM OLD.identity_verified
     OR NEW.identity_verified_at IS DISTINCT FROM OLD.identity_verified_at THEN
    RAISE EXCEPTION 'Verification status is set by the verification desk';
  END IF;

  RETURN NEW;
END; $$;

-- ------------------------------------------------------------
-- 2. Verification state lives on the profile; the evidence lives in its own
--    table so the history survives a re-submission.
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- Created after the columns exist, or the function above references nothing.
DROP TRIGGER IF EXISTS trg_profiles_protect_identity ON public.profiles;
CREATE TRIGGER trg_profiles_protect_identity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_protect_identity();

DO $$ BEGIN
  CREATE TYPE public.rider_verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Storage paths in the private `rider-docs` bucket, not public URLs.
  selfie_url TEXT NOT NULL,
  id_document_url TEXT NOT NULL,
  -- Kept so the desk can match the document to the name on the account. Under
  -- the Kenya Data Protection Act this is personal data: it is readable only by
  -- its owner and an admin, and enforce_retention() clears it with the account.
  id_number TEXT,
  status public.rider_verification_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reject_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_rider_verifications_user
  ON public.rider_verifications(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_verifications_pending
  ON public.rider_verifications(status) WHERE status = 'pending';

GRANT SELECT ON public.rider_verifications TO authenticated;
GRANT ALL ON public.rider_verifications TO service_role;
ALTER TABLE public.rider_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rider reads own verification" ON public.rider_verifications;
CREATE POLICY "Rider reads own verification" ON public.rider_verifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policy exists on purpose: every write goes through
-- the SECURITY DEFINER functions below. A rider setting her own row to
-- 'verified' would make the review desk theatre.

-- ------------------------------------------------------------
-- 3. Private bucket for rider documents, same shape as `driver-docs`:
--    each user may only touch her own folder; only she and an admin can read.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
  VALUES ('rider-docs', 'rider-docs', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Rider docs own upload" ON storage.objects;
CREATE POLICY "Rider docs own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rider-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Rider docs own update" ON storage.objects;
CREATE POLICY "Rider docs own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'rider-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Rider docs read own or admin" ON storage.objects;
CREATE POLICY "Rider docs read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rider-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

-- ------------------------------------------------------------
-- 4. When verification is required.
--
--    Defaults to OFF with a grace of 3 rides. Switching it on for everybody the
--    moment it ships would strand every rider already using the app behind a
--    review queue that has nobody in it yet. Turn it on when the desk is
--    staffed:
--
--      UPDATE public.pricing_config
--         SET require_rider_verification = true WHERE id = 'default';
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS require_rider_verification BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rider_verification_grace_rides INT NOT NULL DEFAULT 3;

/**
 * May this rider book? Verified riders always may. Unverified ones may until
 * they have used up the grace, and only while the requirement is switched on
 * does the grace mean anything at all.
 */
CREATE OR REPLACE FUNCTION public.rider_may_book(_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cfg public.pricing_config; used INT;
BEGIN
  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';
  IF NOT COALESCE(cfg.require_rider_verification, false) THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND identity_verified) THEN
    RETURN true;
  END IF;

  -- Cancelled requests do not burn the grace — she got no ride out of them.
  SELECT COUNT(*) INTO used FROM public.rides
    WHERE passenger_id = _user_id AND status = 'completed';
  RETURN used < COALESCE(cfg.rider_verification_grace_rides, 0);
END; $$;
GRANT EXECUTE ON FUNCTION public.rider_may_book(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rider_may_book(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.tg_rides_require_verified_rider()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.rider_may_book(NEW.passenger_id) THEN
    RAISE EXCEPTION 'Verify your identity before booking another ride';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_rides_require_verified_rider ON public.rides;
CREATE TRIGGER trg_rides_require_verified_rider
  BEFORE INSERT ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.tg_rides_require_verified_rider();

-- ------------------------------------------------------------
-- 5. Submitting, and reading back your own state.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_rider_verification(
  _selfie_url TEXT, _id_document_url TEXT, _id_number TEXT DEFAULT NULL
) RETURNS public.rider_verifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.rider_verifications;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _selfie_url IS NULL OR length(trim(_selfie_url)) = 0 THEN
    RAISE EXCEPTION 'A selfie is required';
  END IF;
  IF _id_document_url IS NULL OR length(trim(_id_document_url)) = 0 THEN
    RAISE EXCEPTION 'A photo of your ID is required';
  END IF;
  PERFORM public.check_rate_limit('submit_rider_verification', 5, interval '1 hour');

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND identity_verified) THEN
    RAISE EXCEPTION 'You are already verified';
  END IF;
  IF EXISTS (SELECT 1 FROM public.rider_verifications
               WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'Your documents are still being reviewed';
  END IF;

  INSERT INTO public.rider_verifications (user_id, selfie_url, id_document_url, id_number)
    VALUES (auth.uid(), trim(_selfie_url), trim(_id_document_url), NULLIF(trim(_id_number), ''))
  RETURNING * INTO v;

  PERFORM public.push_notification(auth.uid(), 'account',
    'Documents received',
    'We are reviewing them now. You will hear from us within a day.', NULL);
  RETURN v;
END; $$;
REVOKE EXECUTE ON FUNCTION public.submit_rider_verification(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_rider_verification(text, text, text) TO authenticated;

/** Everything the client needs to decide what to show her. */
CREATE OR REPLACE FUNCTION public.my_rider_verification()
RETURNS TABLE (
  is_verified BOOLEAN,
  status TEXT,
  reject_reason TEXT,
  submitted_at TIMESTAMPTZ,
  required BOOLEAN,
  rides_remaining INT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg public.pricing_config;
  v public.rider_verifications;
  verified BOOLEAN;
  used INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO cfg FROM public.pricing_config WHERE id = 'default';
  SELECT p.identity_verified INTO verified FROM public.profiles p WHERE p.id = auth.uid();
  SELECT * INTO v FROM public.rider_verifications rv
    WHERE rv.user_id = auth.uid() ORDER BY rv.submitted_at DESC LIMIT 1;
  SELECT COUNT(*) INTO used FROM public.rides
    WHERE passenger_id = auth.uid() AND status = 'completed';

  RETURN QUERY SELECT
    COALESCE(verified, false),
    COALESCE(v.status::TEXT, 'none'),
    v.reject_reason,
    v.submitted_at,
    COALESCE(cfg.require_rider_verification, false),
    GREATEST(COALESCE(cfg.rider_verification_grace_rides, 0) - used, 0);
END; $$;
REVOKE EXECUTE ON FUNCTION public.my_rider_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_rider_verification() TO authenticated;

-- ------------------------------------------------------------
-- 6. The review desk (admin, second factor required).
--
--    Approving means the reviewer has seen an ID that matches the selfie AND
--    belongs to a woman. Everything the product promises rests on that one
--    judgement, which is why it needs MFA and why it is logged.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_pending_rider_verifications()
RETURNS TABLE (
  id UUID, user_id UUID, full_name TEXT, phone TEXT,
  gender TEXT, selfie_url TEXT, id_document_url TEXT, id_number TEXT,
  submitted_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT v.id, v.user_id, p.full_name, p.phone, p.gender::TEXT,
         v.selfie_url, v.id_document_url, v.id_number, v.submitted_at
  FROM public.rider_verifications v
  LEFT JOIN public.profiles p ON p.id = v.user_id
  WHERE v.status = 'pending'
  ORDER BY v.submitted_at ASC;
END; $$;
REVOKE EXECUTE ON FUNCTION public.list_pending_rider_verifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_pending_rider_verifications() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_rider_verification(
  _verification_id UUID, _approve BOOLEAN, _reason TEXT DEFAULT NULL
) RETURNS public.rider_verifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.rider_verifications;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins review rider verifications';
  END IF;
  PERFORM public.require_admin_mfa();
  IF NOT _approve AND (_reason IS NULL OR length(trim(_reason)) = 0) THEN
    RAISE EXCEPTION 'A rejection needs a reason she can act on';
  END IF;

  UPDATE public.rider_verifications
    SET status = CASE WHEN _approve THEN 'verified' ELSE 'rejected' END,
        reviewed_at = now(), reviewed_by = auth.uid(),
        reject_reason = CASE WHEN _approve THEN NULL ELSE trim(_reason) END
    WHERE id = _verification_id AND status = 'pending'
    RETURNING * INTO v;
  IF v.id IS NULL THEN RAISE EXCEPTION 'Verification not found or already reviewed'; END IF;

  IF _approve THEN
    UPDATE public.profiles
      SET identity_verified = true, identity_verified_at = now(), updated_at = now()
      WHERE id = v.user_id;
    PERFORM public.push_notification(v.user_id, 'account',
      'You are verified', 'Thank you — your account is fully verified.', NULL);
  ELSE
    INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
      VALUES (v.user_id, NULL, 'rider_verification_rejected', 'medium',
              jsonb_build_object('verification_id', v.id, 'reason', trim(_reason)));
    PERFORM public.push_notification(v.user_id, 'account',
      'We could not verify your documents', trim(_reason), NULL);
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(),
            CASE WHEN _approve THEN 'rider_verification.approve' ELSE 'rider_verification.reject' END,
            'rider_verification', v.id::TEXT,
            jsonb_build_object('user_id', v.user_id, 'reason', _reason));

  RETURN v;
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_rider_verification(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_rider_verification(uuid, boolean, text) TO authenticated;

-- ------------------------------------------------------------
-- 7. Deletion and retention have to cover the new evidence, or the privacy
--    page is telling her something that is not true.
--
--    delete_my_account (phase 21) predates this table, so it would have left
--    an ID number and two storage paths behind. The rows go entirely rather
--    than being anonymised: unlike a ride, a verification submission has no
--    value once the account is gone. The files themselves are removed by the
--    client before it calls the RPC — storage is not reachable from SQL.
-- ------------------------------------------------------------
-- phase 21 adds this; declared again so this script still applies if the two
-- are run out of order.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.tg_delete_rider_verifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    DELETE FROM public.rider_verifications WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_delete_rider_verifications ON public.profiles;
CREATE TRIGGER trg_delete_rider_verifications
  AFTER UPDATE OF deleted_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_delete_rider_verifications();

COMMENT ON FUNCTION public.tg_delete_rider_verifications() IS
  'Hangs off the deleted_at stamp that delete_my_account sets, so erasure '
  'covers verification evidence without phase 21 needing to know this table '
  'exists.';

COMMENT ON FUNCTION public.tg_profiles_protect_identity() IS
  'Gender, blacklist state and verification state are not self-service. The '
  'row-level policy allows a user to edit her own profile; this trigger carves '
  'out the columns that decide whether she is allowed on the platform at all.';

COMMENT ON FUNCTION public.rider_may_book(uuid) IS
  'Verification gate for booking. Off by default; grace of N completed rides so '
  'switching it on does not strand existing riders behind an empty review queue.';
