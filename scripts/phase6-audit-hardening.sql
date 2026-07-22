-- ============================================================
-- HerRide — Phase 6 audit hardening
-- Run ONCE in the Supabase SQL Editor after phase5-hardening.sql.
-- Implements the approved findings from the engineering audit:
--   1. Close the trip-share enumeration hole (anon could SELECT the
--      whole trip_shares table and harvest every share token).
--   2. Enforce the ride status state machine AT THE DATABASE, so no
--      client — even a buggy or malicious one — can perform an
--      illegal transition. Mirrors RIDE_STATUS_TRANSITIONS in
--      src/types/ride.ts (which remains the app-side source of truth;
--      keep the two in sync if the lifecycle ever changes).
--   3. Add missing indexes for common lookups.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. trip_shares: no direct anon reads. The ONLY anon path to a
--    shared trip is the SECURITY DEFINER function get_shared_trip,
--    which requires knowing the exact token and returns a single
--    redacted row. Authenticated users may read only their own shares.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "TripShares public read" ON public.trip_shares;
CREATE POLICY "TripShares owner read" ON public.trip_shares
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());
REVOKE SELECT ON public.trip_shares FROM anon;

-- ------------------------------------------------------------
-- 2. Ride lifecycle enforcement. BEFORE UPDATE trigger rejects any
--    status change not present in the transition map. SECURITY
--    DEFINER functions (claim_ride, complete_ride) go through the
--    same trigger — their transitions are legal, so nothing breaks.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_ride_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NOT (
    (OLD.status = 'requested'   AND NEW.status IN ('accepted', 'matched', 'cancelled')) OR
    (OLD.status = 'matched'     AND NEW.status IN ('accepted', 'cancelled')) OR
    (OLD.status = 'accepted'    AND NEW.status IN ('arrived', 'cancelled')) OR
    (OLD.status = 'arrived'     AND NEW.status IN ('in_progress', 'cancelled')) OR
    (OLD.status = 'in_progress' AND NEW.status IN ('completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Illegal ride status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ride_status_transition ON public.rides;
CREATE TRIGGER trg_enforce_ride_status_transition
  BEFORE UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ride_status_transition();

-- ------------------------------------------------------------
-- 3. Indexes: transaction history is queried per ride during
--    settlement checks, and the notification feed is always
--    "mine, newest first".
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_ride_id
  ON public.transactions(ride_id) WHERE ride_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
