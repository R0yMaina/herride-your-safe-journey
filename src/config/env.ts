/**
 * Typed, centralized access to environment variables.
 * Never read `import.meta.env` directly outside this module.
 */
const readString = (value: string | undefined, fallback = ""): string =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const readNumber = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined && value !== "" ? n : fallback;
};

/**
 * Pricing configuration. Rates are NEVER hardcoded in the calculator — they
 * live here, sourced from env with defaults that reproduce the v1 fare
 * (KES; base 180 + 55/km + 8/min + 50 booking). Swap these per-city/currency
 * or move them to a DB-backed config later without touching the engine.
 */
export interface PricingEnv {
  readonly currency: string;
  readonly baseFare: number;
  readonly perKm: number;
  readonly perMin: number;
  readonly bookingFee: number;
  readonly minFare: number;
  readonly maxFare: number;
  readonly taxRate: number; // fraction, e.g. 0.16 for 16% VAT; 0 = tax-inclusive/none
  readonly cancellationFee: number;
  readonly waitingFeePerMin: number;
  readonly rounding: number; // round component costs to nearest N
}

/** Commission the platform retains (driver keeps the rest). Default 0.10 —
 * kept in sync with the DB pricing_config, which is the settlement authority.
 * Configurable, never hardcoded in the calculator. */
export interface FinanceEnv {
  readonly commissionRate: number;
}

export type MapProvider = "leaflet" | "google";

/** Map/geo configuration. `provider` selects the map engine; Google unlocks
 * road-following routes (Directions) and address autocomplete (Places), and
 * requires a billing-enabled, referrer-restricted key. Defaults to the
 * key-free Leaflet engine so the app works with no setup. */
export interface MapEnv {
  readonly provider: MapProvider;
  readonly googleApiKey: string;
}

export interface AppEnv {
  readonly mode: "development" | "production" | "test";
  readonly appName: string;
  readonly apiBaseUrl: string;
  /** When true, all services use in-memory mocks instead of Supabase. */
  readonly useMocks: boolean;
  readonly pricing: PricingEnv;
  readonly finance: FinanceEnv;
  readonly map: MapEnv;
}

export const env: AppEnv = Object.freeze({
  mode: (import.meta.env.MODE as AppEnv["mode"]) ?? "development",
  appName: readString(import.meta.env.VITE_APP_NAME, "HeRide"),
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, "/api"),
  useMocks: readString(import.meta.env.VITE_USE_MOCKS, "false") === "true",
  pricing: Object.freeze({
    currency: readString(import.meta.env.VITE_PRICING_CURRENCY, "KES"),
    baseFare: readNumber(import.meta.env.VITE_PRICING_BASE_FARE, 180),
    perKm: readNumber(import.meta.env.VITE_PRICING_PER_KM, 55),
    perMin: readNumber(import.meta.env.VITE_PRICING_PER_MIN, 8),
    bookingFee: readNumber(import.meta.env.VITE_PRICING_BOOKING_FEE, 50),
    minFare: readNumber(import.meta.env.VITE_PRICING_MIN_FARE, 150),
    maxFare: readNumber(import.meta.env.VITE_PRICING_MAX_FARE, 100000),
    taxRate: readNumber(import.meta.env.VITE_PRICING_TAX_RATE, 0),
    cancellationFee: readNumber(import.meta.env.VITE_PRICING_CANCELLATION_FEE, 100),
    waitingFeePerMin: readNumber(import.meta.env.VITE_PRICING_WAITING_FEE_PER_MIN, 5),
    rounding: readNumber(import.meta.env.VITE_PRICING_ROUNDING, 10),
  }),
  finance: Object.freeze({
    commissionRate: readNumber(import.meta.env.VITE_COMMISSION_RATE, 0.1),
  }),
  map: Object.freeze({
    provider: (readString(import.meta.env.VITE_MAP_PROVIDER, "leaflet") === "google"
      ? "google"
      : "leaflet") as MapProvider,
    googleApiKey: readString(
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY,
    ),
  }),
});
