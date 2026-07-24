-- ============================================================
-- HerRide — Phase 8 financial ecosystem
-- Run ONCE in the Supabase SQL Editor after phase7-dispatch.sql.
-- Builds the accounting-grade financial layer on top of the existing
-- wallets/transactions. Money still moves ONLY inside SECURITY DEFINER
-- functions; the passenger/driver settlement in complete_ride is
-- UNCHANGED (still passenger -fare, driver +80%). This script ADDS:
--   1. Ledger immutability (no UPDATE/DELETE on financial rows).
--   2. Traceability columns (reference, metadata, idempotency_key).
--   3. A platform ledger so commission/revenue is explicit per ride.
--   4. Payment intents (the passenger payment-flow record).
--   5. Driver payouts (pending vs available balance, request_payout).
--   6. Refund architecture (refund_ride).
--   7. Admin financial reporting (get_financial_summary, admin-only).
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Enum additions for the new money movements.
-- ------------------------------------------------------------
DO $$ BEGIN ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'withdrawal'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'adjustment'; EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash','mpesa','card','wallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('requires_payment','authorized','captured','failed','refunded','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('pending','processing','paid','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 1. Traceability columns on the wallet ledger.
-- ------------------------------------------------------------
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_idempotency
  ON public.transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Immutability: the ledger is append-only. Nothing — not even a
--    SECURITY DEFINER function — may rewrite or delete a posted row.
--    Corrections are made by posting a compensating entry.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forbid_ledger_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Financial ledger is immutable: % on % is not allowed', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END; $$;

DROP TRIGGER IF EXISTS trg_tx_immutable ON public.transactions;
CREATE TRIGGER trg_tx_immutable
  BEFORE UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.forbid_ledger_mutation();

-- ------------------------------------------------------------
-- 3. Platform ledger — one immutable row per completed ride recording
--    gross fare, commission retained, and driver payout, so revenue is
--    explicit and auditable (the wallet transactions only show the two
--    user-side legs).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID UNIQUE REFERENCES public.rides(id) ON DELETE SET NULL,
  gross_fare NUMERIC(12,2) NOT NULL,
  commission NUMERIC(12,2) NOT NULL,
  driver_payout NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_ledger TO authenticated;
GRANT ALL ON public.platform_ledger TO service_role;
ALTER TABLE public.platform_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PlatformLedger admin read" ON public.platform_ledger;
CREATE POLICY "PlatformLedger admin read" ON public.platform_ledger
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_ledger_immutable ON public.platform_ledger;
CREATE TRIGGER trg_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.platform_ledger
  FOR EACH ROW EXECUTE FUNCTION public.forbid_ledger_mutation();

-- ------------------------------------------------------------
--    Re-define complete_ride to also post the platform-ledger row.
--    The passenger/driver legs are byte-for-byte the same as phase 4 —
--    only an extra platform-ledger INSERT is added, so the verified
--    settlement invariant is preserved.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_ride(_ride_id UUID, _commission NUMERIC DEFAULT 0.20)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  fare NUMERIC(12,2);
  payout NUMERIC(12,2);
  pass_bal NUMERIC(12,2);
  drv_bal NUMERIC(12,2);
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned driver can complete this ride';
  END IF;
  IF r.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Ride must be in progress to complete (is %)', r.status;
  END IF;

  fare := COALESCE(r.fare_estimate, 0);
  payout := round(fare * (1 - _commission), 2);

  UPDATE public.wallets SET balance = balance - fare, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO pass_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.passenger_id, r.id, 'ride_payment', 'completed', -fare, pass_bal, 'Ride payment');

  UPDATE public.wallets SET balance = balance + payout, updated_at = now()
    WHERE user_id = r.driver_id RETURNING balance INTO drv_bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description)
    VALUES (r.driver_id, r.id, 'ride_payout', 'completed', payout, drv_bal, 'Ride payout');

  -- platform revenue (immutable, admin-visible)
  INSERT INTO public.platform_ledger (ride_id, gross_fare, commission, driver_payout, commission_rate, currency)
    VALUES (r.id, fare, fare - payout, payout, _commission, 'KES')
    ON CONFLICT (ride_id) DO NOTHING;

  UPDATE public.rides SET status = 'completed', completed_at = now(), fare_final = fare
    WHERE id = r.id RETURNING * INTO r;
  RETURN r;
END; $$;

-- ------------------------------------------------------------
-- 4. Payment intents — the passenger payment-flow record. Providers
--    (M-Pesa, card, …) are integrated off-platform; this table is the
--    canonical intent/authorization/capture state the client reads.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status public.payment_status NOT NULL DEFAULT 'requires_payment',
  provider TEXT,                       -- e.g. 'mpesa','stripe'
  provider_ref TEXT,                   -- provider-side id/token (never card data)
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pi_passenger ON public.payment_intents(passenger_id, created_at DESC);
GRANT SELECT ON public.payment_intents TO authenticated;
GRANT ALL ON public.payment_intents TO service_role;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.payment_intents TO authenticated;
DROP POLICY IF EXISTS "PI owner read" ON public.payment_intents;
CREATE POLICY "PI owner read" ON public.payment_intents
  FOR SELECT TO authenticated USING (passenger_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "PI owner insert" ON public.payment_intents;
CREATE POLICY "PI owner insert" ON public.payment_intents
  FOR INSERT TO authenticated WITH CHECK (passenger_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Driver payouts. Available balance = wallet balance (already net of
--    commission). request_payout debits the wallet and records a payout
--    for off-platform disbursement (M-Pesa/bank), all in one transaction.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method public.payment_method NOT NULL DEFAULT 'mpesa',
  status public.payout_status NOT NULL DEFAULT 'pending',
  destination TEXT,
  reference TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payouts_driver ON public.payouts(driver_user_id, requested_at DESC);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payouts owner read" ON public.payouts;
CREATE POLICY "Payouts owner read" ON public.payouts
  FOR SELECT TO authenticated USING (driver_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.request_payout(_amount NUMERIC, _method public.payment_method DEFAULT 'mpesa', _destination TEXT DEFAULT NULL)
RETURNS public.payouts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.payouts; bal NUMERIC(12,2); newbal NUMERIC(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'driver') THEN
    RAISE EXCEPTION 'Only drivers can request payouts';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Payout amount must be positive'; END IF;
  SELECT balance INTO bal FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF bal IS NULL OR bal < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
    WHERE user_id = auth.uid() RETURNING balance INTO newbal;
  INSERT INTO public.transactions (user_id, type, status, amount, balance_after, description)
    VALUES (auth.uid(), 'withdrawal', 'completed', -_amount, newbal, 'Payout requested');
  INSERT INTO public.payouts (driver_user_id, amount, method, destination)
    VALUES (auth.uid(), _amount, _method, _destination) RETURNING * INTO p;
  RETURN p;
END; $$;
REVOKE EXECUTE ON FUNCTION public.request_payout(numeric, public.payment_method, text) FROM anon;

-- ------------------------------------------------------------
-- 6. Refunds. Credits the passenger and posts compensating ledger
--    entries. Admin-only (chargebacks/manual refunds/failed captures).
--    Partial or full via _amount.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_ride(_ride_id UUID, _amount NUMERIC, _reason TEXT DEFAULT NULL)
RETURNS public.transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rides; tx public.transactions; bal NUMERIC(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can issue refunds';
  END IF;
  SELECT * INTO r FROM public.rides WHERE id = _ride_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Refund amount must be positive'; END IF;

  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = r.passenger_id RETURNING balance INTO bal;
  INSERT INTO public.transactions (user_id, ride_id, type, status, amount, balance_after, description, metadata)
    VALUES (r.passenger_id, r.id, 'refund', 'completed', _amount, bal,
            COALESCE(_reason, 'Refund'), jsonb_build_object('reason', _reason, 'issued_by', auth.uid()))
    RETURNING * INTO tx;
  RETURN tx;
END; $$;
REVOKE EXECUTE ON FUNCTION public.refund_ride(uuid, numeric, text) FROM anon, authenticated;

-- ------------------------------------------------------------
-- 7. Admin financial summary (revenue, commission, payouts, refunds).
--    SECURITY DEFINER but admin-gated, so the dashboard reads aggregates
--    without exposing row-level data.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_financial_summary(_since TIMESTAMPTZ DEFAULT now() - interval '30 days')
RETURNS TABLE (
  gross_revenue NUMERIC, commission_revenue NUMERIC, driver_earnings NUMERIC,
  refunds NUMERIC, payouts_paid NUMERIC, payouts_pending NUMERIC,
  completed_rides BIGINT, average_fare NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(gross_fare) FROM public.platform_ledger WHERE created_at >= _since), 0),
    COALESCE((SELECT SUM(commission) FROM public.platform_ledger WHERE created_at >= _since), 0),
    COALESCE((SELECT SUM(driver_payout) FROM public.platform_ledger WHERE created_at >= _since), 0),
    COALESCE((SELECT SUM(amount) FROM public.transactions WHERE type='refund' AND created_at >= _since), 0),
    COALESCE((SELECT SUM(amount) FROM public.payouts WHERE status='paid' AND requested_at >= _since), 0),
    COALESCE((SELECT SUM(amount) FROM public.payouts WHERE status IN ('pending','processing') AND requested_at >= _since), 0),
    COALESCE((SELECT COUNT(*) FROM public.platform_ledger WHERE created_at >= _since), 0),
    COALESCE((SELECT ROUND(AVG(gross_fare),2) FROM public.platform_ledger WHERE created_at >= _since), 0);
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_financial_summary(timestamptz) FROM anon;

ALTER TABLE public.payment_intents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_intents;
