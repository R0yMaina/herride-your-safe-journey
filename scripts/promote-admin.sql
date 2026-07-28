-- ============================================================
-- HerRide — promote an existing account to ADMIN
-- Sign up normally in the app FIRST, then edit the email below and run
-- this in the Supabase SQL Editor.
--
-- Grants the 'admin' role, which unlocks:
--   /admin/drivers  — the driver verification desk
--   /admin/finance  — revenue, commission and payouts
-- The app resolves the highest-privilege role a user holds, so an admin
-- keeps full rider access too. Idempotent: safe to re-run.
-- ============================================================

DO $$
DECLARE
  v_email TEXT := 'CHANGE_ME@example.com';  -- <-- edit this
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(trim(v_email));
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No account with email % — sign up in the app first', v_email;
  END IF;

  -- Confirm the email so the account can sign in without the inbox step.
  UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
   WHERE id = v_uid;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin granted to % (%). Sign out and back in, then open /admin/drivers.',
    v_email, v_uid;
END $$;

-- Verify it took:
--   SELECT u.email, r.role
--   FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id
--   WHERE r.role = 'admin';
