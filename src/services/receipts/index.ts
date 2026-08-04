import { env } from "@/config/env";
import { MockReceiptService } from "./receipt.service";
import type { IReceiptService } from "./receipt.service";
import { SupabaseReceiptService } from "./supabase-receipt.service";

export const receiptService: IReceiptService = env.useMocks
  ? new MockReceiptService()
  : new SupabaseReceiptService();

export type { IReceiptService, RideReceipt } from "./receipt.service";
export { receiptLines, receiptText, type ReceiptLine } from "./receipt-lines";
