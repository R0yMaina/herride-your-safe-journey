import { supabase } from "@/integrations/supabase/client";
import type { PaymentMethod } from "@/services/payments";
import type { IPayoutService, Payout, PayoutStatus, PayoutSummary } from "./payout.service";

function mapPayout(row: {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PayoutStatus;
  requested_at: string;
  processed_at: string | null;
}): Payout {
  return {
    id: row.id,
    amount: Number(row.amount),
    method: row.method,
    status: row.status,
    requestedAt: row.requested_at,
    processedAt: row.processed_at,
  };
}

export class SupabasePayoutService implements IPayoutService {
  async getSummary(): Promise<PayoutSummary> {
    const [wallet, pendingRows] = await Promise.all([
      supabase.from("wallets").select("balance, currency").maybeSingle(),
      supabase.from("payouts").select("amount").in("status", ["pending", "processing"]),
    ]);
    if (wallet.error) throw new Error(wallet.error.message);
    if (pendingRows.error) throw new Error(pendingRows.error.message);
    const pending = (pendingRows.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
    return {
      available: Number(wallet.data?.balance ?? 0),
      pending,
      currency: wallet.data?.currency ?? "KES",
    };
  }

  async listPayouts(): Promise<readonly Payout[]> {
    const { data, error } = await supabase
      .from("payouts")
      .select("id, amount, method, status, requested_at, processed_at")
      .order("requested_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPayout);
  }

  async requestPayout(
    amount: number,
    method: PaymentMethod = "mpesa",
    destination?: string,
  ): Promise<Payout> {
    const { data, error } = await supabase.rpc("request_payout", {
      _amount: amount,
      _method: method,
      _destination: destination ?? undefined,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Payout failed");
    return mapPayout(row as never);
  }
}
