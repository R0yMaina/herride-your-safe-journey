-- ============================================================
-- HerRide — Phase 5 hardening
-- Run ONCE in the Supabase SQL Editor after phase4-database.sql.
-- Closes the dev-time hole where a driver could self-approve. After
-- this, verification_status can only be changed by an admin; drivers
-- may still register (insert) but always land as 'pending', and may
-- edit their own vehicle details without touching their status.
-- ============================================================

-- Drivers self-insert must always be 'pending' (never self-verified).
DROP POLICY IF EXISTS "Drivers own insert" ON public.drivers;
CREATE POLICY "Drivers own insert" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND verification_status = 'pending');

-- Split update rights:
--   * a driver may update their OWN row but NOT change verification_status
--   * an admin may update anything (approve/suspend/reject)
DROP POLICY IF EXISTS "Drivers own update" ON public.drivers;
CREATE POLICY "Drivers admin update" ON public.drivers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers self update non-status" ON public.drivers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND verification_status = (SELECT d.verification_status FROM public.drivers d WHERE d.id = drivers.id)
  );

-- Admin-only approval helper (SECURITY DEFINER so it runs above RLS but
-- checks the caller is an admin first).
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
  PERFORM public.push_notification(_driver_user_id, 'driver',
    CASE WHEN _status = 'verified' THEN 'You are approved to drive'
         WHEN _status = 'rejected' THEN 'Driver application rejected'
         ELSE 'Driver status updated' END,
    COALESCE(_reason, 'Your driver status is now ' || _status), NULL);
  RETURN d;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_driver_status(uuid, public.driver_verification_status, text) FROM anon;
