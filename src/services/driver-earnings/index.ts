import { env } from "@/config/env";
import { MockDriverEarningsService, type IDriverEarningsService } from "./driver-earnings.service";
import { SupabaseDriverEarningsService } from "./supabase-driver-earnings.service";

export const driverEarningsService: IDriverEarningsService = env.useMocks
  ? new MockDriverEarningsService()
  : new SupabaseDriverEarningsService();

export type { DriverEarnings, IDriverEarningsService } from "./driver-earnings.service";
