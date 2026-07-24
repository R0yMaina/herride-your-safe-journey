-- ============================================================
-- HerRide — Phase 4: wallet, transactions, notifications
-- Run ONCE in the Supabase SQL Editor after phase3-database.sql.
-- Money mutations happen ONLY inside SECURITY DEFINER functions so
-- balances can never be edited directly by clients. Idempotent-ish:
-- safe to re-run (guards with IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- ---------- enums ----------
DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM
    ('ride_payment', 'ride_payout', 'topup', 'refund', 'commission');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- wallets ----------
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wallet owner read" ON public.wallets;
CREATE POLICY "Wallet owner read" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- transactions ----------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'completed',
  amount NUMERIC(12,2) NOT NULL,          -- signed: negative = debit, positive = credit
  balance_after NUMERIC(12,2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON public.transactions(user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tx owner read" ON public.transactions;
CREATE POLICY "Tx owner read" ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notif owner read" ON public.notifications;
CREATE POLICY "Notif owner read" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Notif owner update" ON public.notifications;
CREATE POLICY "Notif owner update" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- auto-create a wallet for every user ----------
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- backfill wallets for existing users
INSERT INTO public.wallets (user_id)
  SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

-- ---------- helper: create a notification (bypasses RLS) ----------
CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id UUID, _type TEXT, _title TEXT, _body TEXT, _ride_id UUID DEFAULT NULL
) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, title, body, ride_id)
  VALUES (_user_id, _type, _title, _body, _ride_id);
$$;

-- ---------- emit notifications on ride status changes ----------
CREATE OR REPLACE FUNCTION public.notify_ride_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'accepted' THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Driver assigned',
      'A verified driver is on the way.', NEW.id);
  ELSIF NEW.status = 'arrived' THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Driver has arrived',
      'Your driver is at the pickup point.', NEW.id);
  ELSIF NEW.status = 'in_progress' THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Trip started',
      'Enjoy your safe ride.', NEW.id);
  ELSIF NEW.status = 'completed' THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Trip complete',
      'Thanks for riding with HeRide.', NEW.id);
    IF NEW.driver_id IS NOT NULL THEN
      PERFORM public.push_notification(NEW.driver_id, 'ride', 'Trip complete',
        'Your payout has been credited.', NEW.id);
    END IF;
  ELSIF NEW.status = 'cancelled' THEN
    PERFORM public.push_notification(NEW.passenger_id, 'ride', 'Ride cancelled',
      'Your ride was cancelled.', NEW.id);
    IF NEW.driver_id IS NOT NULL THEN
      PERFORM public.push_notification(NEW.driver_id, 'ride', 'Ride cancelled',
        'A ride you accepted was cancelled.', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_ride_status ON public.rides;
CREATE TRIGGER trg_notify_ride_status AFTER UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.notify_ride_status();

-- ---------- atomic ride settlement ----------
-- Debits the passenger the fare, credits the driver (1 - commission), writes a
-- transaction row for each, and completes the ride — all in one transaction.
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

  UPDATE public.rides SET status = 'completed', completed_at = now(), fare_final = fare
    WHERE id = r.id RETURNING * INTO r;
  RETURN r;
END; $$;

-- ---------- dev-only wallet top-up ----------
CREATE OR REPLACE FUNCTION public.wallet_topup(_amount NUMERIC)
RETURNS public.wallets LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.wallets; bal NUMERIC(12,2);
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = auth.uid() RETURNING balance INTO bal;
  IF bal IS NULL THEN RAISE EXCEPTION 'No wallet for current user'; END IF;
  INSERT INTO public.transactions (user_id, type, status, amount, balance_after, description)
    VALUES (auth.uid(), 'topup', 'completed', _amount, bal, 'Wallet top-up');
  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid();
  RETURN w;
END; $$;

-- ---------- SOS: raise an incident + flag the ride ----------
CREATE OR REPLACE FUNCTION public.raise_sos(_ride_id UUID, _lat DOUBLE PRECISION DEFAULT NULL, _lng DOUBLE PRECISION DEFAULT NULL, _notes TEXT DEFAULT NULL)
RETURNS public.sos_alerts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.sos_alerts;
BEGIN
  INSERT INTO public.sos_alerts (user_id, ride_id, lat, lng, notes, status)
    VALUES (auth.uid(), _ride_id, _lat, _lng, _notes, 'active')
  RETURNING * INTO a;
  PERFORM public.push_notification(auth.uid(), 'sos', 'SOS raised',
    'Your emergency alert is active. Stay safe.', _ride_id);
  RETURN a;
END; $$;

-- ---------- public trip-share read (anon) ----------
-- Given a share token, returns coarse trip info for the public share page.
-- Coarse only: addresses + status, never exact live coordinates.
CREATE OR REPLACE FUNCTION public.get_shared_trip(_token TEXT)
RETURNS TABLE (
  status public.ride_status,
  pickup_address TEXT,
  drop_address TEXT,
  has_driver BOOLEAN,
  expires_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.status, r.pickup_address, r.drop_address, (r.driver_id IS NOT NULL), s.expires_at
  FROM public.trip_shares s
  JOIN public.rides r ON r.id = s.ride_id
  WHERE s.share_token = _token AND s.expires_at > now();
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_trip(text) TO anon, authenticated;

-- ---------- realtime ----------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lock down execution
REVOKE EXECUTE ON FUNCTION public.complete_ride(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_topup(numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.raise_sos(uuid, double precision, double precision, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.push_notification(uuid, text, text, text, uuid) FROM anon, authenticated;
