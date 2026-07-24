import { supabase } from "@/integrations/supabase/client";
import type { FinancialSummary, IFinanceService } from "./finance.service";

export class SupabaseFinanceService implements IFinanceService {
  async getSummary(days = 30): Promise<FinancialSummary> {
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await supabase.rpc("get_financial_summary", { _since: since });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      grossRevenue: Number(row?.gross_revenue ?? 0),
      commissionRevenue: Number(row?.commission_revenue ?? 0),
      driverEarnings: Number(row?.driver_earnings ?? 0),
      refunds: Number(row?.refunds ?? 0),
      payoutsPaid: Number(row?.payouts_paid ?? 0),
      payoutsPending: Number(row?.payouts_pending ?? 0),
      completedRides: Number(row?.completed_rides ?? 0),
      averageFare: Number(row?.average_fare ?? 0),
      currency: "KES",
    };
  }
}
