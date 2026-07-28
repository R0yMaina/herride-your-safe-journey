-- ============================================================
-- HerRide — Phase 15B: pickup PIN (HerShield layer 2)
-- Run ONCE in the Supabase SQL Editor after phase15-driver-onboarding.sql.
-- When a driver is assigned, the ride gets a 4-digit PIN that ONLY the
-- passenger can read (separate table — RLS is row-level, so the pin can't
-- live on rides where the driver could select it). The trip cannot start
-- until the driver types the PIN her passenger gives her: this proves the
-- right woman got into the right car, and makes a lent/stolen driver
-- account useless. Enforced at the database, not the UI. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ride_pins — passenger-visible only.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_pins (
  ride_id UUID PRIMARY KEY REFERENCES public.rides(id) ON DELETE CASCADE,
  pin TEXT NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
  failed_attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ride_pins TO authenticated;
GRANT ALL ON public.ride_pins TO service_role;
ALTER TABLE public.ride_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pin visible to passenger only" ON public.ride_pins;
CREATE POLICY "Pin visible to passenger only" ON public.ride_pins
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.passenger_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- 2. Generate the PIN the moment a driver is assigned.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_ride_pin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    INSERT INTO public.ride_pins (ride_id, pin)
    VALUES (NEW.id, lpad(floor(random() * 10000)::int::text, 4, '0'))
    ON CONFLICT (ride_id) DO NOTHING;
    PERFORM public.push_notification(NEW.passenger_id, 'safety', 'Your pickup PIN is ready',
      'For your safety, give the 4-digit PIN on your trip screen to your driver before the trip starts.', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_issue_ride_pin ON public.rides;
CREATE TRIGGER trg_issue_ride_pin
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.issue_ride_pin();

-- ------------------------------------------------------------
-- 3. start_trip_with_pin — the ONLY path from arrived → in_progress when a
--    PIN exists. Verifies driver + PIN, then flips the status with a
--    transaction-local flag the guard trigger (below) checks.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_trip_with_pin(_ride_id UUID, _pin TEXT)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  stored public.ride_pins;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Ride not found'; END IF;
  IF r.driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned driver can start this trip';
  END IF;
  IF r.status <> 'arrived' THEN
    RAISE EXCEPTION 'Trip can start only after arrival (is %)', r.status;
  END IF;

  SELECT * INTO stored FROM public.ride_pins WHERE ride_id = _ride_id;
  IF stored.ride_id IS NOT NULL THEN
    IF stored.failed_attempts >= 5 THEN
      RAISE EXCEPTION 'Too many wrong attempts — contact support';
    END IF;
    IF stored.pin <> trim(_pin) THEN
      UPDATE public.ride_pins SET failed_attempts = failed_attempts + 1 WHERE ride_id = _ride_id;
      -- 3+ wrong PINs is a safety signal, not a typo.
      IF stored.failed_attempts + 1 >= 3 THEN
        INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
        VALUES (auth.uid(), _ride_id, 'pin_failures', 'high',
                jsonb_build_object('attempts', stored.failed_attempts + 1));
      END IF;
      RAISE EXCEPTION 'Wrong PIN — ask your rider for the 4-digit code on her trip screen';
    END IF;
  END IF;

  PERFORM set_config('heride.pin_ok', 'true', true);  -- transaction-local
  UPDATE public.rides SET status = 'in_progress', started_at = now()
    WHERE id = _ride_id RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.start_trip_with_pin(uuid, text) TO authenticated;

-- ------------------------------------------------------------
-- 4. Guard: a ride WITH a PIN cannot move arrived → in_progress except
--    through start_trip_with_pin. Legacy/PIN-less rides are unaffected.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_pin_gate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'arrived' AND NEW.status = 'in_progress'
     AND EXISTS (SELECT 1 FROM public.ride_pins WHERE ride_id = NEW.id)
     AND COALESCE(current_setting('heride.pin_ok', true), '') <> 'true' THEN
    RAISE EXCEPTION 'This trip needs the pickup PIN — use Start trip and enter the rider''s code';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_enforce_pin_gate ON public.rides;
CREATE TRIGGER trg_enforce_pin_gate
  BEFORE UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pin_gate();
