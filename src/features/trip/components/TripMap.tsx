import { useEffect, useState } from "react";
import type { GeoPoint } from "@/types/ride";
import {
  hasGoogleAuthFailed,
  isGoogleMapsEnabled,
  onGoogleAuthFailure,
} from "@/services/maps/google-loader";
import { LiveTripMap, type TripMapPhase } from "./LiveTripMap";
import { GoogleTripMap } from "./GoogleTripMap";

interface TripMapProps {
  readonly pickup: GeoPoint;
  readonly destination: GeoPoint;
  readonly driver: (GeoPoint & { readonly heading?: number | null }) | null;
  readonly phase: TripMapPhase;
  readonly trackUser?: boolean;
  readonly className?: string;
}

/**
 * Single map entry point used by both the passenger and driver screens. Picks
 * the map engine from config (`VITE_MAP_PROVIDER`): Google (road-following
 * routes + ETA) when enabled with a key, otherwise the key-free Leaflet map.
 * Same props either way, so switching providers changes nothing for callers.
 * When Google is selected, its live ETA is shown as an overlay.
 */
export function TripMap(props: TripMapProps) {
  const [eta, setEta] = useState<{ text: string; distanceText: string } | null>(null);
  // If Google rejects the key at render time (bad referrer, billing, quota),
  // degrade to the always-working Leaflet map instead of Google's error card.
  const [googleDown, setGoogleDown] = useState(hasGoogleAuthFailed());
  useEffect(() => onGoogleAuthFailure(() => setGoogleDown(true)), []);

  if (!isGoogleMapsEnabled() || googleDown) {
    return <LiveTripMap {...props} />;
  }
  return (
    <div className="relative">
      <GoogleTripMap {...props} onEta={setEta} />
      {eta && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-noir shadow-soft backdrop-blur">
          <span className="text-primary">{eta.text}</span>
          {eta.distanceText ? ` · ${eta.distanceText}` : ""}
        </div>
      )}
    </div>
  );
}
