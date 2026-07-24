import type { PricingConfig } from "./pricing.config";
import type { PricingInput, PricingStrategyId } from "./pricing.types";

/** Rate adjustments a strategy contributes on top of the base rate card. */
export interface StrategyModifiers {
  /** Multiplied into base/distance/time (stacks with categoryMultiplier). */
  readonly rateMultiplier: number;
  /** Flat surcharge added to the subtotal (e.g. airport pickup fee). */
  readonly surcharge: number;
  /** Fractional discount applied before tax (e.g. corporate rate). */
  readonly discountRate: number;
}

const NEUTRAL: StrategyModifiers = { rateMultiplier: 1, surcharge: 0, discountRate: 0 };

/**
 * Strategy Pattern: each pricing strategy returns the modifiers it applies.
 * Strategies are interchangeable and selected by category/context in the
 * registry. The base tiers (standard/premium/xl) are neutral — the tier price
 * comes from categoryMultiplier — so they exactly reproduce v1 fares; the
 * others layer market-specific rules on top without regressing existing rides.
 */
export interface IPricingStrategy {
  readonly id: PricingStrategyId;
  modifiers(input: PricingInput, config: PricingConfig): StrategyModifiers;
}

export class StandardPricing implements IPricingStrategy {
  readonly id = "standard" as const;
  modifiers(): StrategyModifiers {
    return NEUTRAL;
  }
}

export class PremiumPricing implements IPricingStrategy {
  readonly id = "premium" as const;
  modifiers(): StrategyModifiers {
    return NEUTRAL; // premium price is carried by the category multiplier
  }
}

export class XLPricing implements IPricingStrategy {
  readonly id = "xl" as const;
  modifiers(): StrategyModifiers {
    return NEUTRAL;
  }
}

/** Airport rides add a flat pickup/permit surcharge. */
export class AirportPricing implements IPricingStrategy {
  readonly id = "airport" as const;
  constructor(private readonly surcharge = 250) {}
  modifiers(): StrategyModifiers {
    return { ...NEUTRAL, surcharge: this.surcharge };
  }
}

/** Scheduled rides carry a small booking-ahead premium. */
export class ScheduledRidePricing implements IPricingStrategy {
  readonly id = "scheduled" as const;
  constructor(private readonly premium = 1.1) {}
  modifiers(): StrategyModifiers {
    return { ...NEUTRAL, rateMultiplier: this.premium };
  }
}

/** Corporate accounts get a negotiated discount rate. */
export class CorporatePricing implements IPricingStrategy {
  readonly id = "corporate" as const;
  constructor(private readonly discountRate = 0.1) {}
  modifiers(): StrategyModifiers {
    return { ...NEUTRAL, discountRate: this.discountRate };
  }
}
