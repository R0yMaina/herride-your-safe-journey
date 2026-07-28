-- ============================================================
-- HerRide — Phase 12: in-ride chat (rider ↔ driver), privacy-first
-- Run ONCE in the Supabase SQL Editor after phase11-ratings-tips.sql.
-- Adds Uber/Bolt-style in-app messaging so the two parties never need to
-- exchange phone numbers. Messages are scoped to a ride, readable only by
-- its two participants, writable only while the ride is live, and streamed
-- over Supabase Realtime. Chat closes automatically when the ride ends.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ride_messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ride_messages_ride ON public.ride_messages(ride_id, created_at);
GRANT SELECT, INSERT ON public.ride_messages TO authenticated;
GRANT ALL ON public.ride_messages TO service_role;
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Participant check reused by both policies.
CREATE OR REPLACE FUNCTION public.is_ride_participant(_ride_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rides
    WHERE id = _ride_id AND (passenger_id = _user_id OR driver_id = _user_id)
  )
$$;

DROP POLICY IF EXISTS "Messages visible to participants" ON public.ride_messages;
CREATE POLICY "Messages visible to participants" ON public.ride_messages
  FOR SELECT TO authenticated
  USING (public.is_ride_participant(ride_id, auth.uid()));

-- Send only as yourself, only on your own ride, only while it is live.
DROP POLICY IF EXISTS "Participants send while ride live" ON public.ride_messages;
CREATE POLICY "Participants send while ride live" ON public.ride_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_ride_participant(ride_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND r.status IN ('matched', 'accepted', 'arrived', 'in_progress')
    )
  );

-- Stream new messages live to the other participant.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. Notify the counterparty on each message (in-app notification feed;
--    becomes a push notification once web push is enabled in Phase 13).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_ride_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rides;
  recipient UUID;
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = NEW.ride_id;
  recipient := CASE WHEN NEW.sender_id = r.passenger_id THEN r.driver_id ELSE r.passenger_id END;
  IF recipient IS NOT NULL THEN
    PERFORM public.push_notification(recipient, 'ride', 'New message',
      left(NEW.body, 120), NEW.ride_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_ride_message ON public.ride_messages;
CREATE TRIGGER trg_notify_ride_message
  AFTER INSERT ON public.ride_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_ride_message();
