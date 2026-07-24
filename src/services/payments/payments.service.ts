import type { CreateIntentInput, PaymentIntent } from "./payment.types";
import { getPaymentProvider } from "./payment-provider";

/**
 * Orchestrates the passenger payment flow (intent → authorize → capture)
 * across interchangeable providers. Independent of the Pricing Engine: it
 * moves money for an amount the engine already computed. Interface-first so
 * screens never touch a provider or the DB directly.
 */
export interface IPaymentsService {
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  /** Authorize then capture (or record intent for external rails). */
  confirm(intentId: string): Promise<PaymentIntent>;
  listForRide(rideId: string): Promise<readonly PaymentIntent[]>;
}

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

export class MockPaymentsService implements IPaymentsService {
  private intents = new Map<string, PaymentIntent>();

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    await delay();
    const provider = getPaymentProvider(input.method);
    const intent: PaymentIntent = {
      id: crypto.randomUUID(),
      rideId: input.rideId,
      method: input.method,
      amount: input.amount,
      currency: input.currency ?? "KES",
      status: provider.configured ? "requires_payment" : "failed",
      provider: input.method,
      providerRef: null,
      createdAt: new Date().toISOString(),
    };
    this.intents.set(intent.id, intent);
    return intent;
  }

  async confirm(intentId: string): Promise<PaymentIntent> {
    await delay();
    const existing = this.intents.get(intentId);
    if (!existing) throw new Error("Payment intent not found");
    const provider = getPaymentProvider(existing.method);
    const auth = await provider.authorize({
      rideId: existing.rideId,
      method: existing.method,
      amount: existing.amount,
    });
    const captured = auth.status === "authorized" ? await provider.capture(existing) : auth;
    const updated: PaymentIntent = {
      ...existing,
      status: captured.status,
      providerRef: captured.providerRef,
    };
    this.intents.set(intentId, updated);
    return updated;
  }

  async listForRide(rideId: string): Promise<readonly PaymentIntent[]> {
    await delay(50);
    return [...this.intents.values()].filter((i) => i.rideId === rideId);
  }
}
