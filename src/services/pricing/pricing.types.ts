import type { GeoPoint, RideCategoryId } from "@/types/ride";

/** Bumped whenever the fare formula changes so historical quotes stay explainable. */
export const PRICING_VERSION = "1.0.0";

export type PricingStrategyId =
  | "standard"
  | "premium"
  | "xl"
  | "airport"
  | "scheduled"
  | "corporate";

export type PassengerType = "standard" | "corporate" | "student" | "loyalty";

/** A promotion context the calculator can resolve to a discount. Architecture
 * only in v1 — the resolver returns zero until campaigns are implemented. */
export interface PromotionContext {
  readonly couponCode?: string;
  readonly referralCode?: string;
  readonly campaignId?: string;
  readonly corporateAccountId?: string;
}

/**
 * Everything the Pricing Engine may consider. Only distance, duration and
 * category are required; every other field is optional context so the same
 * input shape serves passenger quoting today and AI/surge/corporate pricing
 * later without a breaking change.
 */
export interface PricingInput {
  readonly distanceKm: number;
  readonly durationMin: number;
  readonly category: RideCategoryId;
  /** Multiplier for the chosen vehicle tier (from RideOption.baseMultiplier). */
  readonly categoryMultiplier?: number;
  readonly currency?: string;

  // --- optional context (future-ready, ignored by v1 strategies) ---
  readonly pickup?: GeoPoint;
  readonly destination?: GeoPoint;
  readonly cityCode?: string;
  readonly regionCode?: string;
  readonly timeOfDay?: string;
  readonly scheduled?: boolean;
  readonly isAirport?: boolean;
  readonly demandMultiplier?: number; // surge; 1 = none
  readonly weatherMultiplier?: number; // future; 1 = none
  readonly passengerType?: PassengerType;
  readonly driverType?: string;
  readonly promotion?: PromotionContext;
  /** Override the platform commission for this quote (e.g. corporate/tier). */
  readonly commissionRate?: number;
}

/**
 * Strongly typed fare result. `passengerTotal` is what the rider pays;
 * `driverEarnings` + `platformCommission` reconcile to the fare net of
 * booking fee handling, matching the on-chain settlement in complete_ride.
 */
export interface FareBreakdown {
  readonly baseFare: number;
  readonly distanceCost: number;
  readonly timeCost: number;
  readonly bookingFee: number;
  readonly surge: number;
  readonly surcharge: number;
  readonly discount: number;
  readonly tax: number;
  readonly subtotal: number;
  readonly passengerTotal: number;
  readonly platformCommission: number;
  readonly driverEarnings: number;
  readonly currency: string;
  readonly pricingVersion: string;
  readonly strategy: PricingStrategyId;
}
