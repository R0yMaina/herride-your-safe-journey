import type { RidePreference } from "@/types/ride";

export const RIDE_PREFERENCES: readonly RidePreference[] = [
  {
    id: "women_only",
    label: "Women Only",
    description: "Always matched with verified female drivers.",
    defaultOn: true,
    available: true,
  },
  {
    id: "quiet",
    label: "Quiet Ride",
    description: "Minimal conversation, calm cabin.",
    defaultOn: false,
    available: true,
  },
  {
    id: "air_conditioning",
    label: "Air Conditioning",
    description: "Cabin pre-cooled on request.",
    defaultOn: true,
    available: true,
  },
  {
    id: "extra_luggage",
    label: "Extra Luggage",
    description: "Larger boot space reserved.",
    defaultOn: false,
    available: true,
  },
  {
    id: "pet_friendly",
    label: "Pet Friendly",
    description: "Coming soon — drivers who welcome pets.",
    defaultOn: false,
    available: false,
    comingSoon: true,
  },
  {
    id: "wheelchair",
    label: "Wheelchair Accessible",
    description: "Coming soon — accessible vehicles.",
    defaultOn: false,
    available: false,
    comingSoon: true,
  },
  {
    id: "favorite_driver",
    label: "Favorite Driver",
    description: "Coming soon — prioritise saved drivers.",
    defaultOn: false,
    available: false,
    comingSoon: true,
  },
];