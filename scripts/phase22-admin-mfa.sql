-- ============================================================
-- HerRide — Phase 22: server-side second factor for admins (audit finding S8)
--
-- The client gate in AdminMfaGate stops someone using the console UI. It does
-- not stop them calling the admin RPCs directly with a stolen password and a
-- curl command, which is what an attacker would actually do. This is the half
-- that matters.
--
-- ROLLOUT ORDER MATTERS. `enforce_admin_mfa` defaults to FALSE so applying this
-- cannot lock you out of your own console. Enrol an authenticator first, verify
-- you can reach /admin, and only then flip it:
--
--   UPDATE public.pricing_config SET enforce_admin_mfa = true WHERE id = 'default';
--
-- Idempotent: safe to re-run. Apply after phase21.
-- ============================================================

ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS enforce_admin_mfa BOOLEAN NOT NULL DEFAULT false;

/**
 * True when the CURRENT session presented a second factor.
 *
 * Supabase puts the assurance level in the JWT as `aal`. aal1 is
 * password-only; aal2 means a TOTP code was verified in this session. Reading
 * the claim is the only way to know — an enrolled factor that was never used
 * this session proves nothing.
 */
CREATE OR REPLACE FUNCTION public.session_has_mfa()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal',
    'aal1'
  ) = 'aal2';
$$;
REVOKE EXECUTE ON FUNCTION public.session_has_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_has_mfa() TO authenticated;

/**
 * Gate for anything an admin can do that a rider cannot.
 *
 * Raises rather than returning false: a caller who forgets to check a boolean
 * gets a silent security hole, whereas a caller who forgets to call this at
 * all is at least no worse off than before.
 */
CREATE OR REPLACE FUNCTION public.require_admin_mfa()
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF COALESCE((SELECT enforce_admin_mfa FROM public.pricing_config WHERE id = 'default'), false)
     AND NOT public.session_has_mfa() THEN
    RAISE EXCEPTION 'This action needs two-factor authentication — sign in again and enter your code';
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.require_admin_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_admin_mfa() TO authenticated;

-- ------------------------------------------------------------
-- Adopt it in the admin functions that carry real power: money, verification
-- status, and identity review. Each keeps its original behaviour and gains the
-- factor check in front.
-- ------------------------------------------------------------

-- Approving or suspending a driver decides who may carry riders.
CREATE OR REPLACE FUNCTION public.set_driver_status(
  _driver_user_id UUID, _status public.driver_verification_status, _reason TEXT DEFAULT NULL
) RETURNS public.drivers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.drivers;
BEGIN
  PERFORM public.require_admin_mfa();

  UPDATE public.drivers
    SET verification_status = _status,
        verified_at = CASE WHEN _status = 'verified' THEN now() ELSE verified_at END,
        verified_by = CASE WHEN _status = 'verified' THEN auth.uid() ELSE verified_by END,
        rejection_reason = _reason,
        updated_at = now()
    WHERE user_id = _driver_user_id
    RETURNING * INTO d;
  IF d.user_id IS NULL THEN RAISE EXCEPTION 'Driver not found'; END IF;

  -- The driver role follows verification, both directions.
  IF _status = 'verified' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_driver_user_id, 'driver')
      ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _driver_user_id AND role = 'driver';
    UPDATE public.driver_locations SET is_available = false, updated_at = now()
      WHERE driver_user_id = _driver_user_id;
  END IF;

  PERFORM public.log_audit('set_driver_status', 'drivers', _driver_user_id::text,
    jsonb_build_object('status', _status, 'reason', _reason));
  RETURN d;
END; $$;
REVOKE EXECUTE ON FUNCTION
  public.set_driver_status(uuid, public.driver_verification_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.set_driver_status(uuid, public.driver_verification_status, text) TO authenticated;

-- Refunds move money out of the platform.
CREATE OR REPLACE FUNCTION public.refund_ride(
  _ride_id UUID, _amount NUMERIC, _reason TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  bal NUMERIC(12,2);
BEGIN
  PERFORM public.require_admin_mfa();
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Refund amount must be positive'; END IF;

  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;

  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.passenger_id, r.id, 'refund', 'completed', _amount, bal,
            COALESCE(_reason, 'Refund'));

  PERFORM public.log_audit('refund_ride', 'rides', _ride_id::text,
    jsonb_build_object('amount', _amount, 'reason', _reason));
END; $$;
REVOKE EXECUTE ON FUNCTION public.refund_ride(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_ride(uuid, numeric, text) TO authenticated;

-- Identity review decides whether a face still matches the account.
CREATE OR REPLACE FUNCTION public.review_driver_check(
  _check_id UUID, _passed BOOLEAN, _reason TEXT DEFAULT NULL
) RETURNS public.driver_checks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.driver_checks;
BEGIN
  PERFORM public.require_admin_mfa();

  UPDATE public.driver_checks
    SET status = CASE WHEN _passed THEN 'passed' ELSE 'failed' END,
        reviewed_at = now(), reviewed_by = auth.uid(),
        reject_reason = CASE WHEN _passed THEN NULL ELSE _reason END
    WHERE id = _check_id AND status = 'pending'
    RETURNING * INTO c;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Check not found or already reviewed'; END IF;

  IF _passed THEN
    UPDATE public.drivers SET last_checked_at = now(), updated_at = now()
      WHERE user_id = c.driver_user_id;
    PERFORM public.push_notification(c.driver_user_id, 'driver',
      'Identity confirmed', 'You are cleared to go back online.', NULL);
  ELSE
    UPDATE public.driver_locations SET is_available = false, updated_at = now()
      WHERE driver_user_id = c.driver_user_id;
    INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
      VALUES (c.driver_user_id, NULL, 'identity_check_failed', 'high',
              jsonb_build_object('check_id', c.id, 'reason', _reason));
    PERFORM public.push_notification(c.driver_user_id, 'driver',
      'Identity check not passed',
      COALESCE(_reason, 'We could not match your photo. Contact support.'), NULL);
  END IF;

  PERFORM public.log_audit('review_driver_check', 'driver_checks', c.id::text,
    jsonb_build_object('passed', _passed, 'reason', _reason));
  RETURN c;
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_driver_check(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_driver_check(uuid, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.require_admin_mfa() IS
  'Admin role AND a second factor in this session. Gated on pricing_config.enforce_admin_mfa so it can be switched on after enrolment rather than locking the owner out.';
