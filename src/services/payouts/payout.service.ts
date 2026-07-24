import type { PaymentMethod } from "@/services/payments";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface Payout {
  readonly id: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly status: PayoutStatus;
  readonly requestedAt: string;
  readonly processedAt: string | null;
}

/** Driver balance split: what's withdrawable now vs already paid out. */
export interface PayoutSummary {
  readonly available: number;
  readonly pending: number;
  readonly currency: string;
}

/**
 * Driver payouts — moving completed wallet balance out to M-Pesa/bank. The
 * wallet balance is already net of commission (credited by complete_ride), so
 * "available" is the wallet balance minus in-flight payout requests.
 */
export interface IPayoutService {
  getSummary(): Promise<PayoutSummary>;
  listPayouts(): Promise<readonly Payout[]>;
  requestPayout(amount: number, method?: PaymentMethod, destination?: string): Promise<Payout>;
}

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

export class MockPayoutService implements IPayoutService {
  private available = 4200;
  private payouts: Payout[] = [];
  async getSummary(): Promise<PayoutSummary> {
    await delay();
    const pending = this.payouts
      .filter((p) => p.status === "pending" || p.status === "processing")
      .reduce((s, p) => s + p.amount, 0);
    return { available: this.available, pending, currency: "KES" };
  }
  async listPayouts(): Promise<readonly Payout[]> {
    await delay(50);
    return this.payouts;
  }
  async requestPayout(amount: number, method: PaymentMethod = "mpesa"): Promise<Payout> {
    await delay();
    if (amount <= 0 || amount > this.available) throw new Error("Insufficient balance");
    this.available -= amount;
    const payout: Payout = {
      id: crypto.randomUUID(),
      amount,
      method,
      status: "pending",
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };
    this.payouts = [payout, ...this.payouts];
    return payout;
  }
}
