
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_female(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_verified_female_driver(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.nearest_available_drivers(double precision, double precision, double precision, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_ride(uuid) FROM anon;
