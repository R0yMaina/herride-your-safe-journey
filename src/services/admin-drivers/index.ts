import { env } from "@/config/env";
import { MockAdminDriversService, type IAdminDriversService } from "./admin-drivers.service";
import { SupabaseAdminDriversService } from "./supabase-admin-drivers.service";

export const adminDriversService: IAdminDriversService = env.useMocks
  ? new MockAdminDriversService()
  : new SupabaseAdminDriversService();

export type {
  DriverApplicationSummary,
  DriverVerificationStatus,
  IAdminDriversService,
} from "./admin-drivers.service";
