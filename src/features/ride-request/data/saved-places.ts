import type { Place } from "@/types/ride";

export const SAVED_PICKUPS: readonly Place[] = [
  {
    id: "p_home",
    label: "Home",
    address: "Kileleshwa, Nairobi",
    coords: { lat: -1.2833, lng: 36.7833 },
  },
  {
    id: "p_work",
    label: "Work",
    address: "GTC Tower, Westlands",
    coords: { lat: -1.2646, lng: 36.8028 },
  },
  {
    id: "p_current",
    label: "Current location",
    address: "Detected via GPS",
    coords: { lat: -1.2921, lng: 36.8219 },
  },
];

export const POPULAR_DESTINATIONS: readonly Place[] = [
  {
    id: "d_sarit",
    label: "Sarit Centre",
    address: "Westlands, Nairobi",
    coords: { lat: -1.2606, lng: 36.8025 },
  },
  {
    id: "d_tworivers",
    label: "Two Rivers Mall",
    address: "Ruaka",
    coords: { lat: -1.2113, lng: 36.7947 },
  },
  {
    id: "d_jkia",
    label: "JKIA Terminal 1A",
    address: "Jomo Kenyatta International Airport",
    coords: { lat: -1.3192, lng: 36.9278 },
  },
  {
    id: "d_village",
    label: "The Village Market",
    address: "Gigiri",
    coords: { lat: -1.2314, lng: 36.8069 },
  },
  {
    id: "d_yaya",
    label: "Yaya Centre",
    address: "Kilimani",
    coords: { lat: -1.2929, lng: 36.7856 },
  },
];
