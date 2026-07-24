import { supabase } from "@/integrations/supabase/client";
import type { IWalletService, WalletBalance, WalletTransaction } from "./wallet.service";

export class SupabaseWalletService implements IWalletService {
  async getBalance(): Promise<WalletBalance> {
    const { data, error } = await supabase
      .from("wallets")
      .select("balance, currency")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { balance: Number(data?.balance ?? 0), currency: data?.currency ?? "KES" };
  }

  async listTransactions(): Promise<readonly WalletTransaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, description, balance_after, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      balanceAfter: t.balance_after === null ? null : Number(t.balance_after),
      createdAt: t.created_at,
    }));
  }

  async topUp(amount: number): Promise<WalletBalance> {
    const { data, error } = await supabase.rpc("wallet_topup", { _amount: amount });
    if (error) throw new Error(error.message);
    return { balance: Number(data?.balance ?? 0), currency: data?.currency ?? "KES" };
  }
}
