import { env } from "@/config/env";
import { MockAdminDriversService, type IAdminDriversService } from "./admin-drivers.service";
import { SupabaseAdminDriversService } from "./supabase-admin-drivers.service";

export const adminDriversService: IAdminDriversService = env.useMocks
  ? new MockAdminDriversService()
  : new SupabaseAdminDriversService();

export type {
  PendingDriverCheck,
  DriverApplicationSummary,
  DriverVerificationStatus,
  IAdminDriversService,
} from "./admin-drivers.service";
