import type { RideCategoryId } from "@/types/ride";
import { calculateFare } from "./fare-calculator";
import { resolvePricingConfig } from "./pricing.config";
import {
  AirportPricing,
  CorporatePricing,
  PremiumPricing,
  ScheduledRidePricing,
  StandardPricing,
  XLPricing,
} from "./pricing.strategy";
import type { IPricingStrategy } from "./pricing.strategy";
import type { FareBreakdown, PricingInput, PricingStrategyId } from "./pricing.types";

export type {
  FareBreakdown,
  PricingInput,
  PricingStrategyId,
  PassengerType,
  PromotionContext,
} from "./pricing.types";
export { PRICING_VERSION } from "./pricing.types";
export type { PricingConfig } from "./pricing.config";
export { resolvePricingConfig } from "./pricing.config";
export type { IPricingStrategy, StrategyModifiers } from "./pricing.strategy";
export { calculateFare } from "./fare-calculator";

/** Registry of interchangeable strategies, keyed by id. */
const STRATEGIES: Readonly<Record<PricingStrategyId, IPricingStrategy>> = {
  standard: new StandardPricing(),
  premium: new PremiumPricing(),
  xl: new XLPricing(),
  airport: new AirportPricing(),
  scheduled: new ScheduledRidePricing(),
  corporate: new CorporatePricing(),
};

/** Maps a ride category to its default strategy; overridable by context. */
function selectStrategy(input: PricingInput): IPricingStrategy {
  if (input.promotion?.corporateAccountId || input.passengerType === "corporate") {
    return STRATEGIES.corporate;
  }
  if (input.isAirport) return STRATEGIES.airport;
  if (input.scheduled) return STRATEGIES.scheduled;
  const byCategory: Partial<Record<RideCategoryId, PricingStrategyId>> = {
    standard: "standard",
    comfort: "standard",
    premium: "premium",
    xl: "xl",
  };
  return STRATEGIES[byCategory[input.category] ?? "standard"];
}

/**
 * The centralized Pricing Engine. Every fare on the platform — passenger
 * quote, driver estimate, admin recompute, analytics — goes through `quote`.
 * It is independent of payment processing: its only job is to calculate.
 */
export interface IPricingService {
  quote(input: PricingInput): FareBreakdown;
  getStrategy(id: PricingStrategyId): IPricingStrategy;
}

class PricingService implements IPricingService {
  quote(input: PricingInput): FareBreakdown {
    return calculateFare(input, selectStrategy(input));
  }
  getStrategy(id: PricingStrategyId): IPricingStrategy {
    return STRATEGIES[id];
  }
}

export const pricingService: IPricingService = new PricingService();

/** The resolved active rate card (for display, admin, analytics). */
export const pricingConfig = resolvePricingConfig();
