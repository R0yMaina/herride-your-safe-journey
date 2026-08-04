-- ============================================================
-- HerRide — Phase 21: data rights and retention (audit finding S9)
--
-- Kenya's Data Protection Act 2019 gives a person the right to have her data
-- erased, and obliges a controller to keep personal data no longer than the
-- purpose requires. You hold national IDs, selfies and continuous location —
-- sensitive personal data under the Act.
--
-- The hard part is that erasure and financial integrity pull against each
-- other. 24 tables cascade from auth.users, so deleting the auth row would
-- take rides, transactions and ledger references with it, destroying records
-- you are separately required to keep. So this ANONYMISES: every piece of
-- personal data is destroyed, while the financial skeleton survives with no
-- name attached to it.
--
-- Idempotent: safe to re-run. Apply after phase20.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A record that a deletion happened.
--    Deliberately holds no personal data — only the user id (already
--    meaningless once the profile is scrubbed) and a timestamp. It exists so a
--    regulator's "prove you honoured the request" has an answer.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_deletions (
  user_id UUID PRIMARY KEY,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);
GRANT ALL ON public.account_deletions TO service_role;
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deletions admin read" ON public.account_deletions;
CREATE POLICY "Deletions admin read" ON public.account_deletions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 2. delete_my_account — the rider's own right, exercised by her.
--
--    Refuses while a trip is live: erasing a passenger mid-ride would strand a
--    driver with no counterparty and no way to be paid.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_my_account(_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  live INT;
  owed NUMERIC(12,2);
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT count(*) INTO live FROM public.rides
    WHERE (passenger_id = me OR driver_id = me)
      AND status IN ('requested', 'matched', 'accepted', 'arrived', 'in_progress');
  IF live > 0 THEN
    RAISE EXCEPTION 'Finish or cancel your active trip before deleting your account';
  END IF;

  -- A positive balance is her money. Silently destroying it would be theft
  -- dressed up as a privacy feature.
  SELECT balance INTO owed FROM public.wallets WHERE user_id = me;
  IF COALESCE(owed, 0) > 0 THEN
    RAISE EXCEPTION 'You have % in your wallet — withdraw it before deleting your account', owed;
  END IF;

  -- Personal data: destroyed outright.
  DELETE FROM public.trusted_contacts WHERE user_id = me;
  DELETE FROM public.saved_places WHERE user_id = me;
  DELETE FROM public.driver_locations WHERE driver_user_id = me;
  DELETE FROM public.notifications WHERE user_id = me;
  DELETE FROM public.driver_checks WHERE driver_user_id = me;
  DELETE FROM public.rate_limits WHERE user_id = me;

  -- Message bodies are personal data; the rows are kept so the other party's
  -- history does not develop holes, with the content gone.
  UPDATE public.ride_messages SET body = '[deleted]'
    WHERE sender_id = me;

  -- Identity documents. The storage objects themselves must be removed by the
  -- caller (Storage is not reachable from SQL) — see deleteAccount() in the
  -- profile service, which clears the folder before calling this.
  UPDATE public.drivers
    SET national_id = '[deleted]', license_number = '[deleted]',
        selfie_url = NULL, id_document_url = NULL,
        vehicle_plate = '[deleted]', updated_at = now()
    WHERE user_id = me;

  -- The profile becomes a tombstone: no name, no phone, no face. Kept rather
  -- than deleted so rides and transactions still resolve to *someone*, which
  -- is what makes the financial history readable without identifying her.
  UPDATE public.profiles
    SET full_name = 'Deleted user', phone = NULL, avatar_url = NULL,
        date_of_birth = NULL, deleted_at = now(), updated_at = now()
    WHERE id = me;

  -- Roles go, so a deleted account cannot act even if the auth row lingers.
  DELETE FROM public.user_roles WHERE user_id = me;

  INSERT INTO public.account_deletions (user_id, reason)
    VALUES (me, _reason) ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.log_audit('delete_my_account', 'profiles', me,
    jsonb_build_object('reason', _reason));
END; $$;
REVOKE EXECUTE ON FUNCTION public.delete_my_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account(text) TO authenticated;

-- ------------------------------------------------------------
-- 3. Retention — keeping data no longer than the purpose requires.
--
--    Continuous location is the most invasive thing collected here, and its
--    purpose expires the moment a trip ends. Run this on a schedule (pg_cron,
--    or a GitHub Action calling it) rather than hoping someone remembers.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS location_retention_days INT NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS message_retention_days INT NOT NULL DEFAULT 365;

CREATE OR REPLACE FUNCTION public.enforce_retention()
RETURNS TABLE (what TEXT, removed BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loc_days INT;
  msg_days INT;
  n BIGINT;
BEGIN
  SELECT COALESCE(location_retention_days, 90), COALESCE(message_retention_days, 365)
    INTO loc_days, msg_days FROM public.pricing_config WHERE id = 'default';

  -- Expired share links: the whole point is that they stop working.
  DELETE FROM public.trip_shares WHERE expires_at < now() - interval '7 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  what := 'expired trip shares'; removed := n; RETURN NEXT;

  -- Offline drivers' last known position, once stale. A live driver's row is
  -- left alone — it is operational, not historical.
  DELETE FROM public.driver_locations
    WHERE is_available = false AND updated_at < now() - make_interval(days => loc_days);
  GET DIAGNOSTICS n = ROW_COUNT;
  what := 'stale driver positions'; removed := n; RETURN NEXT;

  -- Chat bodies age out; the rows stay so a trip's history stays coherent.
  UPDATE public.ride_messages SET body = '[expired]'
    WHERE created_at < now() - make_interval(days => msg_days) AND body <> '[expired]';
  GET DIAGNOSTICS n = ROW_COUNT;
  what := 'expired message bodies'; removed := n; RETURN NEXT;

  -- Spent rate-limit windows are pure noise after their window closes.
  DELETE FROM public.rate_limits WHERE window_started_at < now() - interval '1 day';
  GET DIAGNOSTICS n = ROW_COUNT;
  what := 'spent rate-limit windows'; removed := n; RETURN NEXT;
END; $$;
REVOKE EXECUTE ON FUNCTION public.enforce_retention() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.delete_my_account(text) IS
  'Anonymises rather than deletes: personal data is destroyed, the financial skeleton survives with no name attached. Deleting the auth row would cascade through 24 tables and take the ledger with it.';
COMMENT ON FUNCTION public.enforce_retention() IS
  'Data minimisation under the Kenya DPA 2019. Schedule it — retention nobody runs is a policy, not a control.';
