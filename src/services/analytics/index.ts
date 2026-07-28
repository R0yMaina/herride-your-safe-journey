import { env } from "@/config/env";
import { MockAnalyticsService } from "./analytics.service";
import type { IAnalyticsService } from "./analytics.service";
import { SupabaseAnalyticsService } from "./supabase-analytics.service";

export const analyticsService: IAnalyticsService = env.useMocks
  ? new MockAnalyticsService()
  : new SupabaseAnalyticsService();

export type {
  IAnalyticsService,
  ReportBucket,
  ReportRow,
  TopDriver,
  TopCustomer,
  TopRoute,
} from "./analytics.service";
