import { env } from "@/config/env";
import { MockPaymentsService } from "./payments.service";
import type { IPaymentsService } from "./payments.service";
import { SupabasePaymentsService } from "./supabase-payments.service";

export const paymentsService: IPaymentsService = env.useMocks
  ? new MockPaymentsService()
  : new SupabasePaymentsService();

export type { IPaymentsService } from "./payments.service";
export type {
  PaymentMethod,
  PaymentStatus,
  PaymentIntent,
  CreateIntentInput,
  Receipt,
  RefundRequest,
  RefundKind,
} from "./payment.types";
export { getPaymentProvider, listPaymentMethods, type IPaymentProvider } from "./payment-provider";
