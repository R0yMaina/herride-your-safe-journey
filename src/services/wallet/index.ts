import { env } from "@/config/env";
import { MockWalletService, type IWalletService } from "./wallet.service";
import { SupabaseWalletService } from "./supabase-wallet.service";

export const walletService: IWalletService = env.useMocks
  ? new MockWalletService()
  : new SupabaseWalletService();

export type { IWalletService, WalletBalance, WalletTransaction } from "./wallet.service";
