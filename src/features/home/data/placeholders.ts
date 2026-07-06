import type { ID } from "@/types/global";

export interface Destination {
  readonly id: ID;
  readonly name: string;
  readonly detail: string;
  readonly etaMin: number;
}

export interface RideCategory {
  readonly id: ID;
  readonly name: string;
  readonly description: string;
  readonly priceLabel: string;
}

export const RECENT_DESTINATIONS: readonly Destination[] = [
  { id: "d1", name: "Sarit Centre", detail: "Westlands, Nairobi", etaMin: 12 },
  { id: "d2", name: "Two Rivers Mall", detail: "Ruaka", etaMin: 22 },
  { id: "d3", name: "JKIA Terminal 1A", detail: "Airport", etaMin: 34 },
];

export const RIDE_CATEGORIES: readonly RideCategory[] = [
  { id: "safe", name: "HeRide Safe", description: "Verified female drivers", priceLabel: "From KES 350" },
  { id: "share", name: "HeRide Share", description: "Split with women nearby", priceLabel: "From KES 180" },
  { id: "lux", name: "HeRide Lux", description: "Premium comfort", priceLabel: "From KES 780" },
];