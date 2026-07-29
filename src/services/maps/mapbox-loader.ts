import { env } from "@/config/env";

/** True when Mapbox is the selected provider and a token is present. */
export function isMapboxEnabled(): boolean {
  return env.map.provider === "mapbox" && Boolean(env.map.mapboxToken);
}

/**
 * Latched off after the token is rejected (401/403). Mapbox failures are
 * configuration problems, not transient ones, so there is no point retrying
 * on every keystroke or every map move.
 */
let mapboxDown = false;

export function isMapboxDown(): boolean {
  return mapboxDown;
}

/** Call on a 401/403 so the app stops asking and uses its free fallbacks. */
export function markMapboxDown(): void {
  mapboxDown = true;
}

export function mapboxUsable(): boolean {
  return isMapboxEnabled() && !mapboxDown;
}

export function mapboxToken(): string {
  return env.map.mapboxToken;
}
