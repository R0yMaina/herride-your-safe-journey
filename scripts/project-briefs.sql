-- ============================================================
-- Forgetech — project brief inbox (the marketing site's contact form)
--
-- The form at /forgetech/contact is the only writer. It posts as an
-- anonymous visitor, so the policy set here is deliberately asymmetric:
--
--   INSERT  — anyone, including anon. That is the point of a contact form.
--   SELECT  — admins only. Enquiries contain a name, an email and a
--             description of someone's business; no visitor may read them
--             back, and neither may an ordinary signed-in user.
--   UPDATE/ — nobody, via PostgREST. Status changes are an admin console
--   DELETE    concern and are not needed to accept an enquiry.
--
-- Because INSERT is open, the abuse surface is volume and payload size, so
-- the columns are length-bounded at the database rather than trusting the
-- client's validation.
--
-- Idempotent: safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_briefs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  name        text NOT NULL,
  email       text NOT NULL,
  company     text,
  need        text NOT NULL,
  details     text NOT NULL,
  budget      text,
  -- Triage state for whoever works the inbox.
  status      text NOT NULL DEFAULT 'new'
);

-- Bounds. Added separately so re-running against an existing table works.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_briefs_lengths'
  ) THEN
    ALTER TABLE public.project_briefs ADD CONSTRAINT project_briefs_lengths CHECK (
      char_length(name) BETWEEN 1 AND 120
      AND char_length(email) BETWEEN 3 AND 254
      AND char_length(coalesce(company, '')) <= 160
      AND char_length(need) <= 40
      AND char_length(details) BETWEEN 1 AND 4000
      AND char_length(coalesce(budget, '')) <= 40
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_briefs_status_valid'
  ) THEN
    ALTER TABLE public.project_briefs ADD CONSTRAINT project_briefs_status_valid
      CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_briefs_email_shape'
  ) THEN
    ALTER TABLE public.project_briefs ADD CONSTRAINT project_briefs_email_shape
      CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS project_briefs_created_at_idx
  ON public.project_briefs (created_at DESC);

ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;

-- Anyone may submit an enquiry.
DROP POLICY IF EXISTS "Anyone can submit a project brief" ON public.project_briefs;
CREATE POLICY "Anyone can submit a project brief"
  ON public.project_briefs FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

-- Only admins may read them.
DROP POLICY IF EXISTS "Admins read project briefs" ON public.project_briefs;
CREATE POLICY "Admins read project briefs"
  ON public.project_briefs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins may triage them.
DROP POLICY IF EXISTS "Admins update project briefs" ON public.project_briefs;
CREATE POLICY "Admins update project briefs"
  ON public.project_briefs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note for anyone extending this: an anonymous submitter cannot read its own
-- row back, so the client must not use a returning insert here. The service
-- generates the id locally instead.
GRANT INSERT ON public.project_briefs TO anon, authenticated;
GRANT SELECT, UPDATE ON public.project_briefs TO authenticated;
