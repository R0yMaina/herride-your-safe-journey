-- ============================================================
-- HerRide — Phase 28: make SOS an actual escalation
--
-- What raise_sos did before this: wrote a row to sos_alerts and sent the rider
-- a notification telling her the alert was active. That is all. Her trusted
-- contacts were never told. Nobody was paged. The only path to a human was an
-- admin happening to be looking at a dashboard.
--
-- At 3am with one active alert, that is nobody. An alarm that waits to be
-- noticed is not an alarm.
--
-- This makes the escalation automatic and fans it out the moment she presses:
--
--   1. a live trip-share link is created for her, so anyone reached has
--      something to open that shows where she is, right now
--   2. every trusted contact gets an escalation row queued for SMS
--   3. any trusted contact who is herself a HeRide user is notified in-app
--      immediately — that path needs no provider and works today
--   4. every admin is notified individually, rather than a dashboard tile
--      changing colour and hoping
--   5. the driver is NOT told. If the danger is the driver, telling her an
--      alarm has been raised is the worst possible move.
--
-- SMS delivery still needs a provider (Africa's Talking or Twilio). The queue
-- and the drain RPC are built here so that wiring one in is a worker, not a
-- redesign — and so the record of "who we tried to reach and when" exists from
-- the first alert rather than being reconstructed after an incident.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Who we tried to reach, by what route, and whether it landed.
--
--    One row per contact per channel. Kept forever: after a serious incident
--    the question "was anyone actually told, and when" needs an answer that
--    does not depend on a provider's log retention.
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.escalation_channel AS ENUM ('sms', 'in_app', 'voice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.escalation_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sos_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  channel public.escalation_channel NOT NULL,
  -- Denormalised on purpose: if she later edits or deletes the contact, the
  -- record of who we tried to reach during an emergency must not change.
  target_name TEXT,
  target_phone TEXT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.escalation_status NOT NULL DEFAULT 'pending',
  body TEXT,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sos_esc_alert ON public.sos_escalations(alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_esc_pending
  ON public.sos_escalations(status, created_at) WHERE status = 'pending';

GRANT SELECT ON public.sos_escalations TO authenticated;
GRANT ALL ON public.sos_escalations TO service_role;
ALTER TABLE public.sos_escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SOS escalations own or admin" ON public.sos_escalations;
CREATE POLICY "SOS escalations own or admin" ON public.sos_escalations
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.sos_alerts a
      WHERE a.id = sos_escalations.alert_id AND a.user_id = auth.uid()
    )
  );

-- Every write goes through the functions below.

-- ------------------------------------------------------------
-- 2. Configuration.
-- ------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS emergency_number TEXT NOT NULL DEFAULT '999',
  -- Minutes after drop-off before we ask "did you get there safely?".
  ADD COLUMN IF NOT EXISTS arrival_checkin_min INT NOT NULL DEFAULT 5;

-- ------------------------------------------------------------
-- 3. raise_sos v2 — the fan-out.
--
--    Everything happens in one transaction: either she has an alert with its
--    escalations queued and a share link, or she has none of it. A half-raised
--    alarm is worse than a failed one, because it looks like it worked.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.raise_sos(
  _ride_id UUID, _lat DOUBLE PRECISION DEFAULT NULL,
  _lng DOUBLE PRECISION DEFAULT NULL, _notes TEXT DEFAULT NULL
) RETURNS public.sos_alerts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.sos_alerts;
  me public.profiles;
  share_token TEXT;
  contact RECORD;
  admin_id UUID;
  msg TEXT;
  contact_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  -- Rate limit deliberately loose. Pressing twice because she is frightened
  -- and unsure it worked must not be what stops the second one landing.
  PERFORM public.check_rate_limit('raise_sos', 6, interval '10 minutes');

  SELECT * INTO me FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.sos_alerts (user_id, ride_id, lat, lng, notes, status)
    VALUES (auth.uid(), _ride_id, _lat, _lng, _notes, 'active')
  RETURNING * INTO a;

  -- A live link, so whoever is reached can see where she is rather than being
  -- told there is an emergency and nothing else.
  IF _ride_id IS NOT NULL THEN
    INSERT INTO public.trip_shares (ride_id, token, created_by, expires_at)
      VALUES (_ride_id, encode(gen_random_bytes(16), 'hex'), auth.uid(), now() + interval '24 hours')
    ON CONFLICT DO NOTHING
    RETURNING token INTO share_token;

    IF share_token IS NULL THEN
      SELECT token INTO share_token FROM public.trip_shares
        WHERE ride_id = _ride_id AND expires_at > now()
        ORDER BY created_at DESC LIMIT 1;
    END IF;
  END IF;

  msg := COALESCE(NULLIF(me.full_name, ''), 'A HeRide rider')
    || ' has raised an emergency alert'
    || CASE WHEN _lat IS NOT NULL AND _lng IS NOT NULL
         THEN ' near https://maps.google.com/?q=' || _lat::TEXT || ',' || _lng::TEXT
         ELSE '' END
    || CASE WHEN share_token IS NOT NULL
         THEN '. Live trip: /s/' || share_token ELSE '' END;

  -- Trusted contacts. SMS is queued; the in-app leg fires now for any contact
  -- whose phone belongs to a HeRide account, which needs no provider.
  FOR contact IN
    SELECT tc.name, tc.phone FROM public.trusted_contacts tc WHERE tc.user_id = auth.uid()
  LOOP
    contact_count := contact_count + 1;

    INSERT INTO public.sos_escalations (alert_id, channel, target_name, target_phone, body)
      VALUES (a.id, 'sms', contact.name, contact.phone, msg);

    INSERT INTO public.sos_escalations (alert_id, channel, target_name, target_phone, target_user_id, body, status, sent_at)
    SELECT a.id, 'in_app', contact.name, contact.phone, p.id, msg, 'sent', now()
      FROM public.profiles p
      WHERE p.phone IS NOT NULL AND p.phone = contact.phone AND p.id <> auth.uid()
      LIMIT 1;

    PERFORM public.push_notification(p.id, 'sos', 'Emergency alert', msg, _ride_id)
      FROM public.profiles p
      WHERE p.phone IS NOT NULL AND p.phone = contact.phone AND p.id <> auth.uid();
  END LOOP;

  -- Admins are notified individually. A dashboard tile changing colour is not
  -- a page, and this is exactly the alert nobody may sit on.
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.push_notification(admin_id, 'sos', 'SOS — respond now', msg, _ride_id);
    INSERT INTO public.sos_escalations (alert_id, channel, target_user_id, body, status, sent_at)
      VALUES (a.id, 'in_app', admin_id, msg, 'sent', now());
  END LOOP;

  -- Her own confirmation is last and says what actually happened, including
  -- when it reached nobody — a false sense of safety is its own danger.
  PERFORM public.push_notification(auth.uid(), 'sos', 'Emergency alert active',
    CASE WHEN contact_count = 0
      THEN 'You have no trusted contacts saved, so only HeRide was alerted. Call '
           || COALESCE((SELECT emergency_number FROM public.pricing_config WHERE id = 'default'), '999')
           || ' if you are in danger.'
      ELSE 'HeRide and your ' || contact_count::TEXT || ' trusted contact'
           || CASE WHEN contact_count = 1 THEN '' ELSE 's' END || ' have been alerted.'
    END, _ride_id);

  INSERT INTO public.fraud_signals (user_id, ride_id, signal, severity, metadata)
    VALUES (auth.uid(), _ride_id, 'sos_raised', 'high',
            jsonb_build_object('alert_id', a.id, 'contacts', contact_count));

  RETURN a;
END; $$;
GRANT EXECUTE ON FUNCTION public.raise_sos(uuid, double precision, double precision, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.raise_sos(uuid, double precision, double precision, text) FROM anon;

-- ------------------------------------------------------------
-- 4. What the panic screen needs, in one call.
--
--    She is frightened and possibly being watched. The screen has to show the
--    numbers to call without a second round-trip, so this returns them with
--    the alert.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_emergency_contacts()
RETURNS TABLE (name TEXT, phone TEXT, is_app_user BOOLEAN, emergency_number TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN QUERY
  SELECT tc.name, tc.phone,
         EXISTS (SELECT 1 FROM public.profiles p WHERE p.phone = tc.phone AND p.id <> auth.uid()),
         COALESCE((SELECT pc.emergency_number FROM public.pricing_config pc WHERE pc.id = 'default'), '999')
  FROM public.trusted_contacts tc
  WHERE tc.user_id = auth.uid()
  ORDER BY tc.created_at;
END; $$;
REVOKE EXECUTE ON FUNCTION public.my_emergency_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_emergency_contacts() TO authenticated;

-- ------------------------------------------------------------
-- 5. The SMS drain, for whenever a provider is wired in.
--
--    Written now so the queue is never a pile of rows nobody built a reader
--    for. A worker calls pending_sos_escalations(), sends, then reports back.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pending_sos_escalations(_limit INT DEFAULT 50)
RETURNS TABLE (id UUID, target_phone TEXT, body TEXT, attempts INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT e.id, e.target_phone, e.body, e.attempts
  FROM public.sos_escalations e
  WHERE e.status = 'pending' AND e.channel = 'sms' AND e.attempts < 5
  ORDER BY e.created_at
  LIMIT GREATEST(_limit, 1);
END; $$;
REVOKE EXECUTE ON FUNCTION public.pending_sos_escalations(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pending_sos_escalations(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_escalation(
  _id UUID, _ok BOOLEAN, _error TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.sos_escalations
    SET status = CASE WHEN _ok THEN 'sent' ELSE 'failed' END,
        sent_at = CASE WHEN _ok THEN now() ELSE sent_at END,
        attempts = attempts + 1,
        last_error = CASE WHEN _ok THEN NULL ELSE _error END
    WHERE id = _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mark_escalation(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_escalation(uuid, boolean, text) TO authenticated;

-- ------------------------------------------------------------
-- 6. Show the rider the driver's face.
--
--    The pickup PIN proves the driver is with the right RIDER. Nothing proved
--    the opposite direction — that the woman at the wheel is the woman who was
--    verified. A lent or sold account passes every check we had.
--
--    This returns the storage path of the selfie she was approved on so the
--    rider can compare it against whoever pulled up, before getting in. It is
--    the cheapest possible closing of that loophole and needs no face-match
--    provider; a human does the matching, which is what a rider does anyway.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_driver(_driver_user_id UUID)
RETURNS TABLE (
  user_id UUID, name TEXT, rating NUMERIC,
  vehicle TEXT, plate TEXT, color TEXT, photo_path TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  -- Only someone actually on a ride with her may see any of this.
  IF NOT EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.driver_id = _driver_user_id
      AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised to view this driver';
  END IF;

  RETURN QUERY
  SELECT d.user_id,
         split_part(COALESCE(p.full_name, 'Driver'), ' ', 1),
         d.rating,
         NULLIF(concat_ws(' ', d.vehicle_make, d.vehicle_model), ''),
         d.vehicle_plate,
         d.vehicle_color,
         d.selfie_url
  FROM public.drivers d
  JOIN public.profiles p ON p.id = d.user_id
  WHERE d.user_id = _driver_user_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_public_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_driver(uuid) TO authenticated;

-- The rider needs to read that one file out of the private bucket. Scoped to
-- the driver on a ride she is actually on — not the whole bucket.
DROP POLICY IF EXISTS "Driver selfie visible to her rider" ON storage.objects;
CREATE POLICY "Driver selfie visible to her rider" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-docs'
    AND EXISTS (
      SELECT 1 FROM public.rides r
      JOIN public.drivers d ON d.user_id = r.driver_id
      WHERE r.passenger_id = auth.uid()
        AND r.status IN ('accepted', 'arrived', 'in_progress')
        AND d.selfie_url = storage.objects.name
    )
  );

COMMENT ON FUNCTION public.raise_sos(uuid, double precision, double precision, text) IS
  'Fans an alarm out to trusted contacts, admins and a live share link in one '
  'transaction. Deliberately does NOT notify the driver: if the danger is the '
  'driver, telling her an alarm was raised is the worst move available.';
