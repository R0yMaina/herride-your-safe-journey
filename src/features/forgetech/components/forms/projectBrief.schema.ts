import { z } from "zod";
import { BUDGET_BANDS, PROJECT_NEEDS } from "@/services/project-briefs";

/**
 * Validation for the project brief.
 *
 * Kept out of the component so it can be tested directly — it earned that
 * after two bugs a type-check could not catch:
 *
 * 1. react-hook-form reports an *unselected* radio group as `null`, not
 *    `undefined`. A plain `.optional()` rejects null, so leaving the optional
 *    budget blank silently failed validation and the form did nothing at all
 *    on submit. Hence `.nullish()` on both radio groups.
 * 2. A bare `z.enum` error surfaces Zod's raw union text ("Expected 'Website'
 *    | …, received null") to a visitor, so each one carries an errorMap.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || undefined);

export const projectBriefSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("That email doesn't look right").max(254),
  company: optionalText(160),
  need: z.enum(PROJECT_NEEDS, { errorMap: () => ({ message: "Pick the closest option" }) }),
  details: z
    .string()
    .trim()
    .min(20, "A sentence or two is enough — what are you trying to build or fix?")
    .max(4000),
  // Optional on purpose: a required budget field costs more enquiries than it
  // filters, and the range is more useful once there is a conversation.
  budget: z
    .enum(BUDGET_BANDS, { errorMap: () => ({ message: "Pick a range, or leave it blank" }) })
    .nullish()
    .transform((value) => value ?? undefined),
});

export type ProjectBriefValues = z.input<typeof projectBriefSchema>;
export type ProjectBriefParsed = z.output<typeof projectBriefSchema>;
