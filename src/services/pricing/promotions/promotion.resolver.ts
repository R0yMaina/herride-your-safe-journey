import type { PricingInput } from "../pricing.types";
import type { PricingConfig } from "../pricing.config";

/** A resolved discount to apply to a fare subtotal. */
export interface ResolvedDiscount {
  /** Absolute discount amount in the fare currency (already computed). */
  readonly amount: number;
  /** Human-readable source, for the receipt ("STUDENT10", "Referral"). */
  readonly label: string | null;
}

export const NO_DISCOUNT: ResolvedDiscount = { amount: 0, label: null };

/**
 * Turns a promotion context into a concrete discount. This is the seam for
 * coupons, referral credit, campaigns, holiday/student/corporate discounts and
 * loyalty — each becomes a resolver (or a rule inside one) without touching the
 * calculator. v1 ships the no-op resolver: architecture in place, zero discount
 * applied, so behavior is unchanged until campaigns are implemented.
 */
export interface IPromotionResolver {
  resolve(input: PricingInput, subtotal: number, config: PricingConfig): ResolvedDiscount;
}

export class NoopPromotionResolver implements IPromotionResolver {
  resolve(): ResolvedDiscount {
    return NO_DISCOUNT;
  }
}

/** Active resolver. Swap for a real one (or a composite) when promotions land. */
export const promotionResolver: IPromotionResolver = new NoopPromotionResolver();
