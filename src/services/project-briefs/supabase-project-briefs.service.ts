import { supabase } from "@/integrations/supabase/client";
import type { IProjectBriefService, NewProjectBrief } from "./project-briefs.service";

/**
 * Writes to `project_briefs` — anonymous visitors may insert, only admins may
 * read (see `scripts/forgetech-project-briefs.sql`).
 *
 * The insert deliberately does not select the row back: under those policies
 * an anonymous submitter cannot read what it just wrote, so a returning insert
 * would fail RLS. The id is generated here instead, which is all the caller
 * needs for the success state.
 *
 * The request is bounded by a timeout. Without one, a request that never
 * settles — a dropped mobile connection mid-submit, which is the common case
 * here — leaves the form on "Sending…" indefinitely with no way back. A
 * bounded failure the visitor can retry is strictly better than a spinner.
 */
const SUBMIT_TIMEOUT_MS = 15_000;

export class SupabaseProjectBriefService implements IProjectBriefService {
  async submit(brief: NewProjectBrief): Promise<{ id: string }> {
    const id = crypto.randomUUID();

    const { error } = await supabase
      .from("project_briefs")
      .insert({
        id,
        name: brief.name,
        email: brief.email,
        company: brief.company ?? null,
        need: brief.need,
        details: brief.details,
        budget: brief.budget ?? null,
      })
      .abortSignal(AbortSignal.timeout(SUBMIT_TIMEOUT_MS));

    if (error) throw new Error(error.message);
    return { id };
  }
}
