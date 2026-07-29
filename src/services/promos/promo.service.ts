export interface PromoPreview {
  readonly code: string;
  readonly label: string;
  /** Absolute discount (KES) this code is worth against the given subtotal. */
  readonly discount: number;
}

/** A live offer, for surfacing on the home screen. */
export interface ActivePromo {
  readonly code: string;
  /** Short headline, e.g. "20% off your ride". */
  readonly headline: string;
  /** The code's own description, or null if it has none. */
  readonly description: string | null;
}

export interface ReferralInfo {
  readonly code: string;
  /** Shareable invite link built from the code. */
  readonly url: string;
}

export interface IPromoService {
  /**
   * Live offers to advertise on the home screen.
   *
   * Display only — the discount a rider actually gets is still decided by
   * `validate_promo` server-side, so nothing here can inflate a fare.
   */
  listActive(): Promise<readonly ActivePromo[]>;
  /** Validate a promo code against a fare subtotal; throws with a reason if invalid. */
  validate(code: string, subtotal: number): Promise<PromoPreview>;
  /** Lock a validated code onto a requested ride (server re-validates + records redemption). */
  applyToRide(rideId: string, code: string): Promise<number>;
  /** The current user's referral code + share link (created on first call). */
  getReferralInfo(): Promise<ReferralInfo>;
  /** Redeem a friend's referral code (new riders, before their first trip). */
  redeemReferral(code: string): Promise<void>;
}

function referralUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/welcome?ref=${encodeURIComponent(code)}`;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

/** Mirrors the seeded HERIDE10 server code so mock and live behave alike. */
const MOCK_CODES: Record<string, { label: string; percent: number; cap: number }> = {
  HERIDE10: { label: "Welcome — 10% off your ride (up to KES 200)", percent: 10, cap: 200 },
};

export class MockPromoService implements IPromoService {
  private readonly used = new Set<string>();
  private referral: string | null = null;
  private referredBy: string | null = null;

  async listActive(): Promise<readonly ActivePromo[]> {
    await delay(120);
    return Object.entries(MOCK_CODES).map(([code, promo]) => ({
      code,
      headline: `${promo.percent}% off your ride`,
      description: promo.label,
    }));
  }

  async validate(code: string, subtotal: number): Promise<PromoPreview> {
    await delay();
    const key = code.trim().toUpperCase();
    const promo = MOCK_CODES[key];
    if (!promo) throw new Error("Invalid promo code");
    if (this.used.has(key)) throw new Error("You already used this code");
    const discount = Math.min(
      Math.round(((Math.max(subtotal, 0) * promo.percent) / 100) * 100) / 100,
      promo.cap,
      Math.max(subtotal, 0),
    );
    return { code: key, label: promo.label, discount };
  }

  async applyToRide(_rideId: string, code: string): Promise<number> {
    const preview = await this.validate(code, 1000);
    this.used.add(preview.code);
    return preview.discount;
  }

  async getReferralInfo(): Promise<ReferralInfo> {
    await delay(120);
    this.referral ??= `HER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return { code: this.referral, url: referralUrl(this.referral) };
  }

  async redeemReferral(code: string): Promise<void> {
    await delay();
    const key = code.trim().toUpperCase();
    if (!key.startsWith("HER-")) throw new Error("Invalid referral code");
    if (this.referredBy) throw new Error("You already used a referral code");
    this.referredBy = key;
  }
}
