import { env } from "@/config/env";
import { MockAdminOverviewService, type IAdminOverviewService } from "./admin-overview.service";
import { SupabaseAdminOverviewService } from "./supabase-admin-overview.service";

export const adminOverviewService: IAdminOverviewService = env.useMocks
  ? new MockAdminOverviewService()
  : new SupabaseAdminOverviewService();

export type { AdminOverview, IAdminOverviewService } from "./admin-overview.service";
export { EMPTY_OVERVIEW } from "./admin-overview.service";
