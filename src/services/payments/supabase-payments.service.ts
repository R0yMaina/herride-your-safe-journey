import { supabase } from "@/integrations/supabase/client";
import type { CreateIntentInput, PaymentIntent } from "./payment.types";
import type { IPaymentsService } from "./payments.service";
import { getPaymentProvider } from "./payment-provider";

function mapIntent(row: {
  id: string;
  ride_id: string | null;
  method: PaymentIntent["method"];
  amount: number;
  currency: string;
  status: PaymentIntent["status"];
  provider: string | null;
  provider_ref: string | null;
  created_at: string;
}): PaymentIntent {
  return {
    id: row.id,
    rideId: row.ride_id,
    method: row.method,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    providerRef: row.provider_ref,
    createdAt: row.created_at,
  };
}

/**
 * Records the passenger payment intent. For wallet/cash rides the money truth
 * is the settlement inside complete_ride — this table is the auditable
 * intent/status record. External rails (M-Pesa/card) reach 'captured' via a
 * server-side webhook once their provider is configured.
 */
export class SupabasePaymentsService implements IPaymentsService {
  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be signed in to pay");
    const provider = getPaymentProvider(input.method);
    const { data, error } = await supabase
      .from("payment_intents")
      .insert({
        ride_id: input.rideId,
        passenger_id: user.id,
        method: input.method,
        amount: input.amount,
        currency: input.currency ?? "KES",
        status: provider.configured ? "requires_payment" : "failed",
        provider: input.method,
        idempotency_key: input.idempotencyKey ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapIntent(data);
  }

  async confirm(intentId: string): Promise<PaymentIntent> {
    // Wallet/cash settlement happens in complete_ride; card/M-Pesa capture is
    // driven by the provider webhook. Here we read back the current state.
    const { data, error } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("id", intentId)
      .single();
    if (error) throw new Error(error.message);
    return mapIntent(data);
  }

  async listForRide(rideId: string): Promise<readonly PaymentIntent[]> {
    const { data, error } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapIntent);
  }
}
