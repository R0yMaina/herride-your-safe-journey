import type { RideOption } from "@/types/ride";

export const RIDE_OPTIONS: readonly RideOption[] = [
  {
    id: "standard",
    name: "HeRide Standard",
    description: "Verified female driver, everyday comfort.",
    capacity: 3,
    etaMin: 4,
    icon: "sedan",
    baseMultiplier: 1,
  },
  {
    id: "comfort",
    name: "HeRide Comfort",
    description: "Newer cars with extra space and quiet cabins.",
    capacity: 4,
    etaMin: 6,
    icon: "sedan",
    baseMultiplier: 1.25,
  },
  {
    id: "xl",
    name: "HeRide XL",
    description: "Room for the group, up to 6 passengers.",
    capacity: 6,
    etaMin: 8,
    icon: "van",
    baseMultiplier: 1.55,
  },
  {
    id: "premium",
    name: "HeRide Premium",
    description: "Top-rated drivers in luxury vehicles.",
    capacity: 3,
    etaMin: 9,
    icon: "lux",
    baseMultiplier: 1.9,
  },
];