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
