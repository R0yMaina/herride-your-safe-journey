-- ============================================================
-- HerRide — Phase 17: admin dashboard + owner bootstrap
-- Run ONCE in the Supabase SQL Editor after phase15c-driver-earnings.sql.
--
-- 1. admin_overview() — one RPC powering the dashboard hub: the live health
--    of the platform (verification queue, active trips, today's money,
--    open safety incidents) read straight from the source tables.
-- 2. Owner bootstrap — the founder's email always holds the admin role,
--    granted server-side now AND on sign-up if the account doesn't exist
--    yet, so the dashboard is never locked out.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. admin_overview — admin-only aggregate. Returns zeros rather than
--    raising for a non-admin, so the UI can fail closed quietly (the RLS
--    on each underlying table is still the real gate).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS TABLE (
  pending_drivers INT,
  verified_drivers INT,
  suspended_drivers INT,
  drivers_online INT,
  active_rides INT,
  rides_today INT,
  completed_today INT,
  cancelled_today INT,
  gross_today NUMERIC,
  commission_today NUMERIC,
  open_sos INT,
  open_fraud_signals INT,
  passengers_total INT,
  currency TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT count(*) FROM public.drivers WHERE verification_status = 'pending'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.drivers WHERE verification_status = 'verified'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.drivers WHERE verification_status = 'suspended'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.driver_locations
              WHERE is_available = true AND updated_at > now() - interval '10 minutes'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.rides
              WHERE status IN ('requested','matched','accepted','arrived','in_progress')), 0)::INT,
    COALESCE((SELECT count(*) FROM public.rides
              WHERE requested_at >= date_trunc('day', now())), 0)::INT,
    COALESCE((SELECT count(*) FROM public.rides
              WHERE status = 'completed' AND completed_at >= date_trunc('day', now())), 0)::INT,
    COALESCE((SELECT count(*) FROM public.rides
              WHERE status = 'cancelled' AND updated_at >= date_trunc('day', now())), 0)::INT,
    COALESCE((SELECT sum(gross_fare) FROM public.platform_ledger
              WHERE created_at >= date_trunc('day', now())), 0)::NUMERIC,
    COALESCE((SELECT sum(commission) FROM public.platform_ledger
              WHERE created_at >= date_trunc('day', now())), 0)::NUMERIC,
    COALESCE((SELECT count(*) FROM public.sos_alerts WHERE status = 'active'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.fraud_signals
              WHERE created_at >= now() - interval '7 days'), 0)::INT,
    COALESCE((SELECT count(*) FROM public.user_roles WHERE role = 'passenger'), 0)::INT,
    'KES'::TEXT
  WHERE public.has_role(auth.uid(), 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM anon;

-- ------------------------------------------------------------
-- 2. Owner bootstrap.
--    The founder's account always holds 'admin'. Kept in a table so the
--    list can grow without another migration.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_owners (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No RLS grants to authenticated: this table is read only by the trigger
-- below, which runs as SECURITY DEFINER. Admins manage it via SQL.
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.platform_owners TO service_role;

INSERT INTO public.platform_owners (email) VALUES ('herizonimpact@gmail.com')
  ON CONFLICT (email) DO NOTHING;

-- Grant admin to any owner account that already exists.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
  FROM auth.users u
  JOIN public.platform_owners o ON lower(o.email) = lower(u.email)
ON CONFLICT (user_id, role) DO NOTHING;

-- Confirm the owner's email so sign-in is never blocked on the inbox step.
UPDATE auth.users u SET email_confirmed_at = COALESCE(u.email_confirmed_at, now())
  FROM public.platform_owners o
 WHERE lower(o.email) = lower(u.email);

-- ...and grant it automatically if the owner signs up later. Runs AFTER the
-- existing handle_new_user trigger, so the profile/passenger role exist first.
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.platform_owners o WHERE lower(o.email) = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_owner_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

-- Verify:
--   SELECT u.email, r.role FROM auth.users u
--   JOIN public.user_roles r ON r.user_id = u.id WHERE r.role = 'admin';
