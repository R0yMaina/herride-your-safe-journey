-- ============================================================
-- HerRide — Phase 27: the scheduled jobs
--
-- `advance_dispatch()` and `enforce_retention()` have existed since phases 23
-- and 21 and have never run. Both are SECURITY DEFINER, neither reads
-- auth.uid(), and both are REVOKEd from anon and authenticated — so no client
-- can call them and nothing else was ever going to. Until this script they
-- were dead code that the product quietly depends on.
--
-- pg_cron runs jobs as the role that scheduled them, so run this as the
-- `postgres` user in the Supabase SQL editor. Function owners keep EXECUTE
-- regardless of the REVOKEs above, so no extra grants are needed.
--
-- Idempotent: unschedules by name before scheduling, so re-running replaces
-- rather than duplicates.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ------------------------------------------------------------
-- 1. advance_dispatch — move a lapsed ride offer to the next driver.
--
--    Every minute, which is pg_cron's floor. Note the consequence: offers
--    expire after `offer_seconds` (default 20), so in the worst case a rider
--    waits ~20s for the offer to lapse plus up to 60s for this job to notice.
--    If that feels long, raise offer_seconds to 45-60 so the two line up:
--
--      UPDATE public.pricing_config SET offer_seconds = 45 WHERE id = 'default';
--
--    Without this job a driver who simply ignores her phone stalls the ride
--    permanently — it is never offered to anyone else. That is the single
--    most important line in this file.
-- ------------------------------------------------------------
SELECT cron.unschedule('heride-advance-dispatch')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'heride-advance-dispatch');

SELECT cron.schedule(
  'heride-advance-dispatch',
  '* * * * *',
  $$SELECT public.advance_dispatch();$$
);

-- ------------------------------------------------------------
-- 2. enforce_retention — delete what we promised to delete.
--
--    Daily at 23:30 UTC, which is 02:30 in Nairobi (EAT is UTC+3, no DST) —
--    the quietest hour for a ride-hailing service. pg_cron schedules are
--    always UTC, so this is written in UTC deliberately rather than looking
--    like a local time that happens to work.
--
--    This is the job that makes the privacy policy true: stale driver
--    positions, expired message bodies, dead trip-share links and spent
--    rate-limit windows. If it never runs, the retention periods published on
--    /privacy are a claim the system does not keep, which under the Kenya
--    Data Protection Act is the kind of gap that matters.
-- ------------------------------------------------------------
SELECT cron.unschedule('heride-enforce-retention')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'heride-enforce-retention');

SELECT cron.schedule(
  'heride-enforce-retention',
  '30 23 * * *',
  $$SELECT public.enforce_retention();$$
);

-- ------------------------------------------------------------
-- 2b. monitor_active_trips — watch live trips for trouble (phase 29).
--
--     Every minute, because the thing it is looking for is a car that has
--     stopped or turned the wrong way, and a five-minute check would mean a
--     five-minute-old answer to "is she okay?".
--
--     Cheap by construction: it only touches rides that are in_progress, past
--     the grace period, and it dedupes anomalies on a partial unique index, so
--     a car sitting still raises one question rather than one per minute.
-- ------------------------------------------------------------
SELECT cron.unschedule('heride-monitor-trips')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'heride-monitor-trips');

SELECT cron.schedule(
  'heride-monitor-trips',
  '* * * * *',
  $$SELECT public.monitor_active_trips();$$
);

-- ------------------------------------------------------------
-- 3. Confirm all three are registered.
-- ------------------------------------------------------------
SELECT jobname, schedule, active, command
FROM cron.job
WHERE jobname LIKE 'heride-%'
ORDER BY jobname;

-- ------------------------------------------------------------
-- 4. Checking on them later.
--
--    A cron job that silently fails every night looks exactly like one that
--    has nothing to do, so check the run history rather than assuming:
--
--      SELECT j.jobname, d.status, d.return_message, d.start_time
--      FROM cron.job_run_details d
--      JOIN cron.job j ON j.jobid = d.jobid
--      WHERE j.jobname LIKE 'heride-%'
--      ORDER BY d.start_time DESC
--      LIMIT 20;
--
--    Expect `succeeded` rows. advance_dispatch returns the number of rides it
--    moved on — usually 0, which is healthy, not broken.
-- ------------------------------------------------------------
