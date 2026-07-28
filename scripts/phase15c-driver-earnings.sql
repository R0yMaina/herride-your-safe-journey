-- ============================================================
-- HerRide — Phase 15C: driver earnings
-- Run ONCE in the Supabase SQL Editor after phase15b-pickup-pin.sql.
-- One RPC powering the driver's Earnings tab: today / this week / lifetime,
-- trips driven, tips received, and the commission she paid — read straight
-- from the immutable transaction rows written by complete_ride and
-- submit_rating, so the numbers always reconcile with the wallet.
-- Idempotent: safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.driver_earnings()
RETURNS TABLE (
  today NUMERIC,
  week NUMERIC,
  lifetime NUMERIC,
  trips_today INT,
  trips_week INT,
  trips_lifetime INT,
  tips_week NUMERIC,
  commission_week NUMERIC,
  currency TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  -- Payouts + tips credited to this driver (positive amounts only).
  earn AS (
    SELECT t.amount, t.type, t.created_at
    FROM public.transactions t, me
    WHERE t.user_id = me.uid
      AND t.status = 'completed'
      AND t.type IN ('ride_payout', 'tip')
      AND t.amount > 0
  ),
  rides_done AS (
    SELECT r.completed_at
    FROM public.rides r, me
    WHERE r.driver_id = me.uid AND r.status = 'completed'
  )
  SELECT
    COALESCE((SELECT sum(amount) FROM earn
              WHERE created_at >= date_trunc('day', now())), 0)::NUMERIC,
    COALESCE((SELECT sum(amount) FROM earn
              WHERE created_at >= date_trunc('week', now())), 0)::NUMERIC,
    COALESCE((SELECT sum(amount) FROM earn), 0)::NUMERIC,
    COALESCE((SELECT count(*) FROM rides_done
              WHERE completed_at >= date_trunc('day', now())), 0)::INT,
    COALESCE((SELECT count(*) FROM rides_done
              WHERE completed_at >= date_trunc('week', now())), 0)::INT,
    COALESCE((SELECT count(*) FROM rides_done), 0)::INT,
    COALESCE((SELECT sum(amount) FROM earn
              WHERE type = 'tip' AND created_at >= date_trunc('week', now())), 0)::NUMERIC,
    COALESCE((SELECT sum(pl.commission) FROM public.platform_ledger pl
              JOIN public.rides r ON r.id = pl.ride_id, me
              WHERE r.driver_id = me.uid
                AND pl.created_at >= date_trunc('week', now())), 0)::NUMERIC,
    'KES'::TEXT
$$;
GRANT EXECUTE ON FUNCTION public.driver_earnings() TO authenticated;
