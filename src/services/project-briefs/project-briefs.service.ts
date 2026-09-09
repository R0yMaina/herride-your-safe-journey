/**
 * Project briefs — the Forgetech contact form's domain service.
 *
 * Interface-first, per the repo's service convention: screens talk to this,
 * never to Supabase, so the form works against the mock in development and
 * against the real table in production with no change to the UI.
 */

export const PROJECT_NEEDS = [
  "Website",
  "Web Application",
  "AI Solution",
  "Automation",
  "E-commerce",
  "Startup MVP",
  "Other",
] as const;

export type ProjectNeed = (typeof PROJECT_NEEDS)[number];

export const BUDGET_BANDS = [
  "Under KSh 50,000",
  "KSh 50,000 – 100,000",
  "KSh 100,000 – 250,000",
  "KSh 250,000 – 500,000",
  "KSh 500,000+",
  "Not sure yet",
] as const;

export type BudgetBand = (typeof BUDGET_BANDS)[number];

export interface NewProjectBrief {
  readonly name: string;
  readonly email: string;
  readonly company?: string;
  readonly need: ProjectNeed;
  readonly details: string;
  /** Optional on purpose — asking for a budget before there is a conversation
   *  costs more enquiries than it saves. */
  readonly budget?: BudgetBand;
}

export interface IProjectBriefService {
  submit(brief: NewProjectBrief): Promise<{ id: string }>;
}

const delay = (ms = 700) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MockProjectBriefService implements IProjectBriefService {
  async submit(brief: NewProjectBrief) {
    await delay();
    // Visible in development so the flow can be exercised without a backend.
    console.info("[mock] project brief submitted", brief);
    return { id: crypto.randomUUID() };
  }
}
