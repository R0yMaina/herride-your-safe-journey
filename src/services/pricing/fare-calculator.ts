import type { PricingConfig } from "./pricing.config";
import { resolvePricingConfig } from "./pricing.config";
import type { IPricingStrategy } from "./pricing.strategy";
import { promotionResolver } from "./promotions/promotion.resolver";
import type { IPromotionResolver } from "./promotions/promotion.resolver";
import { PRICING_VERSION } from "./pricing.types";
import type { FareBreakdown, PricingInput } from "./pricing.types";

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/**
 * The single fare calculator for the whole platform. Pure and deterministic:
 * given the same input, config, and strategy it always returns the same
 * breakdown, so it can be unit-tested and (if ever moved server-side) ported
 * verbatim. No module should compute a fare any other way.
 *
 * Order of operations: rate card × multipliers → surge → surcharge → subtotal
 * → promotional discount → tax → clamp to [min,max] → split commission.
 */
export function calculateFare(
  input: PricingInput,
  strategy: IPricingStrategy,
  config: PricingConfig = resolvePricingConfig({
    cityCode: input.cityCode,
    regionCode: input.regionCode,
    currency: input.currency,
  }),
  promotions: IPromotionResolver = promotionResolver,
): FareBreakdown {
  const roundTo = (n: number) => Math.round(n / config.rounding) * config.rounding;

  const distanceKm = Math.max(0, input.distanceKm);
  const durationMin = Math.max(0, input.durationMin);
  const categoryMultiplier = input.categoryMultiplier ?? 1;
  const mods = strategy.modifiers(input, config);
  const mult = categoryMultiplier * mods.rateMultiplier;

  const baseFare = roundTo(config.baseFare * mult);
  const distanceCost = roundTo(distanceKm * config.perKm * mult);
  const timeCost = roundTo(durationMin * config.perMin * mult);
  const bookingFee = config.bookingFee;

  const demand = input.demandMultiplier ?? 1;
  const weather = input.weatherMultiplier ?? 1;
  const runningCost = baseFare + distanceCost + timeCost;
  const surge = roundTo(runningCost * (demand * weather - 1));
  const surcharge = mods.surcharge;

  const subtotal = baseFare + distanceCost + timeCost + bookingFee + surge + surcharge;

  const strategyDiscount = roundTo(subtotal * mods.discountRate);
  const promoDiscount = promotions.resolve(input, subtotal, config).amount;
  const discount = Math.min(subtotal, strategyDiscount + promoDiscount);

  const taxed = subtotal - discount;
  const tax = roundTo(taxed * config.taxRate);

  const passengerTotal = clamp(taxed + tax, config.minFare, config.maxFare);

  // Commission settles to the whole currency unit (matches complete_ride,
  // which rounds to 2dp) — not to the component rounding step.
  const commissionRate = input.commissionRate ?? config.commissionRate;
  const platformCommission = Math.round(passengerTotal * commissionRate);
  const driverEarnings = passengerTotal - platformCommission;

  return {
    baseFare,
    distanceCost,
    timeCost,
    bookingFee,
    surge,
    surcharge,
    discount,
    tax,
    subtotal,
    passengerTotal,
    platformCommission,
    driverEarnings,
    currency: config.currency,
    pricingVersion: PRICING_VERSION,
    strategy: strategy.id,
  };
}
