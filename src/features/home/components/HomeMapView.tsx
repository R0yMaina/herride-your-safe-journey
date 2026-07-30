import { useEffect, useState } from "react";
import type { GeoPoint } from "@/types/ride";
import type { NearbyDriver } from "@/services/driver";
import {
  hasGoogleAuthFailed,
  isGoogleMapsEnabled,
  onGoogleAuthFailure,
} from "@/services/maps/google-loader";
import { HomeMap } from "./HomeMap";
import { GoogleHomeMap } from "./GoogleHomeMap";

interface HomeMapViewProps {
  readonly center: GeoPoint | null;
  readonly drivers: readonly NearbyDriver[];
  readonly className?: string;
}

/**
 * Single entry point for the home screen's map, mirroring {@link TripMap}:
 * Google when `VITE_MAP_PROVIDER=google` and a key works, otherwise the
 * key-free Leaflet map. Identical props either way.
 *
 * Without this the home map was Leaflet-only, so selecting the Google
 * provider would have switched the trip and picker maps while leaving the
 * most-looked-at map in the app on a different renderer.
 */
export function HomeMapView(props: HomeMapViewProps) {
  // A rejected key (billing off, wrong referrer, quota) degrades to Leaflet
  // rather than showing Google's error card over the home screen.
  const [googleDown, setGoogleDown] = useState(hasGoogleAuthFailed());
  useEffect(() => onGoogleAuthFailure(() => setGoogleDown(true)), []);

  if (!isGoogleMapsEnabled() || googleDown) return <HomeMap {...props} />;
  return <GoogleHomeMap {...props} />;
}
