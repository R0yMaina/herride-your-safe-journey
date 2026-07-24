import type {
  CreateIntentInput,
  PaymentIntent,
  PaymentMethod,
  RefundRequest,
} from "./payment.types";

/** Result of a provider-side authorization/capture step. */
export interface ProviderResult {
  readonly status: PaymentIntent["status"];
  readonly provider: string;
  readonly providerRef: string | null;
}

/**
 * Provider abstraction. Every payment rail — M-Pesa, card, Apple/Google Pay,
 * PayPal, Flutterwave, Airtel Money, banks — implements this same contract, so
 * rails are interchangeable and adding one never touches the payment service.
 * Card data is NEVER handled here: providers exchange tokens/refs only.
 */
export interface IPaymentProvider {
  readonly method: PaymentMethod;
  readonly configured: boolean;
  authorize(input: CreateIntentInput): Promise<ProviderResult>;
  capture(intent: PaymentIntent): Promise<ProviderResult>;
  refund(request: RefundRequest): Promise<ProviderResult>;
}

/** Wallet/cash "provider": settlement happens in the DB, so authorize/capture
 * are no-ops that mark the intent captured. Always available. */
class LedgerBackedProvider implements IPaymentProvider {
  constructor(readonly method: PaymentMethod) {}
  readonly configured = true;
  async authorize(): Promise<ProviderResult> {
    return { status: "authorized", provider: this.method, providerRef: null };
  }
  async capture(): Promise<ProviderResult> {
    return { status: "captured", provider: this.method, providerRef: null };
  }
  async refund(): Promise<ProviderResult> {
    return { status: "refunded", provider: this.method, providerRef: null };
  }
}

/** External rails requiring credentials + server-side webhooks. Declared so
 * the architecture is complete and selectable; throws until configured with
 * real keys and an edge-function callback (out of scope for the client). */
class UnconfiguredProvider implements IPaymentProvider {
  constructor(
    readonly method: PaymentMethod,
    private readonly providerName: string,
  ) {}
  readonly configured = false;
  private fail(): never {
    throw new Error(
      `${this.providerName} is not configured. Add provider credentials and a server-side ` +
        `webhook to enable ${this.method} payments.`,
    );
  }
  async authorize(): Promise<ProviderResult> {
    this.fail();
  }
  async capture(): Promise<ProviderResult> {
    this.fail();
  }
  async refund(): Promise<ProviderResult> {
    this.fail();
  }
}

/** Registry of rails, keyed by method. Swap an entry for a real integration
 * (e.g. an MpesaProvider hitting Daraja via an edge function) with no change
 * to callers. */
const PROVIDERS: Readonly<Record<PaymentMethod, IPaymentProvider>> = {
  cash: new LedgerBackedProvider("cash"),
  wallet: new LedgerBackedProvider("wallet"),
  mpesa: new UnconfiguredProvider("mpesa", "M-Pesa (Daraja)"),
  card: new UnconfiguredProvider("card", "Card processor"),
};

export function getPaymentProvider(method: PaymentMethod): IPaymentProvider {
  return PROVIDERS[method];
}

export function listPaymentMethods(): readonly PaymentMethod[] {
  return Object.keys(PROVIDERS) as PaymentMethod[];
}
