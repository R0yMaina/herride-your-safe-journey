import { env } from "@/config/env";
import { MockProjectBriefService, type IProjectBriefService } from "./project-briefs.service";
import { SupabaseProjectBriefService } from "./supabase-project-briefs.service";

export const projectBriefService: IProjectBriefService = env.useMocks
  ? new MockProjectBriefService()
  : new SupabaseProjectBriefService();

export {
  PROJECT_NEEDS,
  BUDGET_BANDS,
  type IProjectBriefService,
  type NewProjectBrief,
  type ProjectNeed,
  type BudgetBand,
} from "./project-briefs.service";
