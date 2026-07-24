export type PaymentMethod = "cash" | "mpesa" | "card" | "wallet";

export type PaymentStatus =
  | "requires_payment"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "cancelled";

/** The passenger payment-flow record. Mirrors the payment_intents table. */
export interface PaymentIntent {
  readonly id: string;
  readonly rideId: string | null;
  readonly method: PaymentMethod;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: string | null;
  readonly providerRef: string | null;
  readonly createdAt: string;
}

export interface CreateIntentInput {
  readonly rideId: string | null;
  readonly method: PaymentMethod;
  readonly amount: number;
  readonly currency?: string;
  /** Dedupe key so a retried confirm never double-charges. */
  readonly idempotencyKey?: string;
}

/** A payment receipt derived from a captured intent / completed ride. */
export interface Receipt {
  readonly rideId: string;
  readonly total: number;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly issuedAt: string;
  readonly breakdown: {
    readonly fare: number;
    readonly bookingFee: number;
    readonly discount: number;
    readonly tax: number;
  };
}

export type RefundKind = "full" | "partial";

export interface RefundRequest {
  readonly rideId: string;
  readonly amount: number;
  readonly kind: RefundKind;
  readonly reason?: string;
}
