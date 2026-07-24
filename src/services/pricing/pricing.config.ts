import { env } from "@/config/env";

/**
 * Resolved pricing configuration. Values are sourced from env (see PricingEnv)
 * so nothing is hardcoded in the calculator. `resolvePricingConfig` is where a
 * future city/region- or DB-backed override would slot in — callers always go
 * through it rather than reading rates directly.
 */
export interface PricingConfig {
  readonly currency: string;
  readonly baseFare: number;
  readonly perKm: number;
  readonly perMin: number;
  readonly bookingFee: number;
  readonly minFare: number;
  readonly maxFare: number;
  readonly taxRate: number;
  readonly cancellationFee: number;
  readonly waitingFeePerMin: number;
  readonly rounding: number;
  readonly commissionRate: number;
}

/** Context that could select a different rate card (city/region/currency). */
export interface PricingConfigContext {
  readonly cityCode?: string;
  readonly regionCode?: string;
  readonly currency?: string;
}

const BASE_CONFIG: PricingConfig = {
  ...env.pricing,
  commissionRate: env.finance.commissionRate,
};

/**
 * The active rate card for a context. v1 returns the env-backed base card
 * (optionally overriding the display currency). Add city/region lookups here
 * when multi-market pricing lands — the engine and strategies are unaffected.
 */
export function resolvePricingConfig(context: PricingConfigContext = {}): PricingConfig {
  if (context.currency && context.currency !== BASE_CONFIG.currency) {
    return { ...BASE_CONFIG, currency: context.currency };
  }
  return BASE_CONFIG;
}
