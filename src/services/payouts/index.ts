import { env } from "@/config/env";
import { MockPayoutService } from "./payout.service";
import type { IPayoutService } from "./payout.service";
import { SupabasePayoutService } from "./supabase-payout.service";

export const payoutService: IPayoutService = env.useMocks
  ? new MockPayoutService()
  : new SupabasePayoutService();

export type { IPayoutService, Payout, PayoutStatus, PayoutSummary } from "./payout.service";
