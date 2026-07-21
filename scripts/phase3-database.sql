-- ============================================================
-- HerRide — Phase 3 database additions
-- Run ONCE in the Supabase SQL Editor after setup-database.sql.
-- Adds a policy so ride counterparties can read each other's basic
-- profile (needed to show the driver's name to the passenger and vice
-- versa). Idempotent.
-- ============================================================

DROP POLICY IF EXISTS "Profiles read ride counterparty" ON public.profiles;
CREATE POLICY "Profiles read ride counterparty" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE (r.passenger_id = auth.uid() AND r.driver_id = profiles.id)
         OR (r.driver_id = auth.uid() AND r.passenger_id = profiles.id)
    )
  );
