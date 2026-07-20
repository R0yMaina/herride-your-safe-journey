-- ============================================================
-- HerRide — database RESET (destructive!)
-- Drops everything scripts/setup-database.sql creates, so setup
-- can be re-run cleanly. Only touches HerRide objects.
-- Run in the Supabase SQL Editor, then run setup-database.sql.
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.saved_places CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.trip_shares CASCADE;
DROP TABLE IF EXISTS public.trusted_contacts CASCADE;
DROP TABLE IF EXISTS public.sos_alerts CASCADE;
DROP TABLE IF EXISTS public.ride_ratings CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.driver_locations CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.claim_ride(uuid);
DROP FUNCTION IF EXISTS public.nearest_available_drivers(double precision, double precision, double precision, int);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.tg_set_updated_at();
DROP FUNCTION IF EXISTS public.enforce_female_only_ride();
DROP FUNCTION IF EXISTS public.is_verified_female_driver(uuid);
DROP FUNCTION IF EXISTS public.is_female(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

DROP TYPE IF EXISTS public.sos_status;
DROP TYPE IF EXISTS public.ride_status;
DROP TYPE IF EXISTS public.driver_verification_status;
DROP TYPE IF EXISTS public.gender;
DROP TYPE IF EXISTS public.app_role;
