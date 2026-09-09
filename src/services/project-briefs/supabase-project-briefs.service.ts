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
 */
export class SupabaseProjectBriefService implements IProjectBriefService {
  async submit(brief: NewProjectBrief): Promise<{ id: string }> {
    const id = crypto.randomUUID();

    const { error } = await supabase.from("project_briefs").insert({
      id,
      name: brief.name,
      email: brief.email,
      company: brief.company ?? null,
      need: brief.need,
      details: brief.details,
      budget: brief.budget ?? null,
    });

    if (error) throw new Error(error.message);
    return { id };
  }
}
