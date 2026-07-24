import { env } from "@/config/env";
import { MockFinanceService } from "./finance.service";
import type { IFinanceService } from "./finance.service";
import { SupabaseFinanceService } from "./supabase-finance.service";

export const financeService: IFinanceService = env.useMocks
  ? new MockFinanceService()
  : new SupabaseFinanceService();

export type { IFinanceService, FinancialSummary } from "./finance.service";
