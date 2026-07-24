import type { ID, ISODateString } from "./global";

export type RideCategoryId = "standard" | "comfort" | "xl" | "premium";

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface Place {
  readonly id: ID;
  readonly label: string;
  readonly address: string;
  readonly coords: GeoPoint;
}

export interface RouteEstimate {
  readonly distanceKm: number;
  readonly durationMin: number;
  readonly polyline: readonly GeoPoint[];
}

export interface RideOption {
  readonly id: RideCategoryId;
  readonly name: string;
  readonly description: string;
  readonly capacity: number;
  readonly etaMin: number;
  readonly icon: "sedan" | "suv" | "van" | "lux";
  readonly baseMultiplier: number;
}

export interface FareEstimate {
  readonly currency: string;
  readonly baseFare: number;
  readonly distanceCost: number;
  readonly timeCost: number;
  readonly bookingFee: number;
  readonly surge: number;
  readonly discount: number;
  readonly total: number;
}

export type RidePreferenceId =
  | "quiet"
  | "women_only"
  | "air_conditioning"
  | "extra_luggage"
  | "pet_friendly"
  | "wheelchair"
  | "favorite_driver";

export interface RidePreference {
  readonly id: RidePreferenceId;
  readonly label: string;
  readonly description: string;
  readonly defaultOn: boolean;
  readonly available: boolean;
  readonly comingSoon?: boolean;
}

export type ScheduleMode = "now" | "scheduled";

export interface ScheduledRide {
  readonly mode: ScheduleMode;
  readonly scheduledFor: ISODateString | null;
}

export interface PassengerNote {
  readonly text: string;
  readonly maxLength: number;
}

export interface TripSummary {
  readonly pickup: Place;
  readonly destination: Place;
  readonly route: RouteEstimate;
  readonly option: RideOption;
  readonly fare: FareEstimate;
  readonly preferences: readonly RidePreferenceId[];
  readonly schedule: ScheduledRide;
  readonly note: string;
}

export interface RideRequestDraft {
  readonly id: ID;
  readonly summary: TripSummary;
  readonly createdAt: ISODateString;
}

export type RideRequestStep = "location" | "vehicle" | "preferences" | "schedule" | "confirm";

/**
 * Ride lifecycle statuses — mirrors the Postgres `ride_status` enum exactly.
 * Do NOT add values here without a matching DB migration.
 */
export type RideStatus =
  | "requested"
  | "matched"
  | "accepted"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

/**
 * The single source of truth for legal status changes. Every transition —
 * driver, passenger, or system — MUST be validated against this map before
 * writing to the database. Keys are the current status; values are the set of
 * statuses reachable from it. Terminal states map to an empty array.
 */
export const RIDE_STATUS_TRANSITIONS: Readonly<Record<RideStatus, readonly RideStatus[]>> = {
  requested: ["accepted", "matched", "cancelled"],
  matched: ["accepted", "cancelled"],
  accepted: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return RIDE_STATUS_TRANSITIONS[from].includes(to);
}

/** Statuses in which a ride is still "live" (visible on an active-trip screen). */
export const ACTIVE_RIDE_STATUSES: readonly RideStatus[] = [
  "requested",
  "matched",
  "accepted",
  "arrived",
  "in_progress",
];

/** A ride row as read back from the database, in app-facing shape. */
export interface RideRecord {
  readonly id: ID;
  readonly passengerId: ID;
  readonly driverId: ID | null;
  readonly status: RideStatus;
  readonly pickup: { readonly lat: number; readonly lng: number; readonly address: string | null };
  readonly destination: {
    readonly lat: number;
    readonly lng: number;
    readonly address: string | null;
  };
  readonly fareEstimate: number | null;
  readonly fareFinal: number | null;
  readonly distanceKm: number | null;
  readonly cancellationReason: string | null;
  readonly requestedAt: ISODateString;
  readonly acceptedAt: ISODateString | null;
  readonly startedAt: ISODateString | null;
  readonly completedAt: ISODateString | null;
}
