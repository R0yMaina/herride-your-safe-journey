import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { env } from "@/config/env";

let loaded: Promise<typeof google> | null = null;
let authFailed = false;
const authFailListeners = new Set<() => void>();

/** Google calls this global when the key is rejected at render time
 * (RefererNotAllowedMapError, BillingNotEnabled, quota, …). We use it to fall
 * back to the Leaflet map so the user never sees Google's error card. */
function installAuthFailureHook(): void {
  if (typeof window === "undefined") return;
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    authFailed = true;
    authFailListeners.forEach((cb) => cb());
  };
}

export function hasGoogleAuthFailed(): boolean {
  return authFailed;
}

/** Subscribe to Google auth failure; returns an unsubscribe fn. */
export function onGoogleAuthFailure(cb: () => void): () => void {
  authFailListeners.add(cb);
  return () => authFailListeners.delete(cb);
}

/**
 * Loads the Google Maps JS SDK once (base map, markers, Places autocomplete,
 * and Directions/routes) and caches the promise. Client-only — never call
 * during SSR. Rejects clearly if no key is configured so callers can fall back
 * to the Leaflet map instead of failing silently.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (!env.map.googleApiKey) {
    return Promise.reject(new Error("No Google Maps API key configured"));
  }
  loaded ??= (async () => {
    installAuthFailureHook();
    setOptions({ key: env.map.googleApiKey, v: "weekly" });
    await Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
      importLibrary("routes"),
    ]);
    return google;
  })();
  return loaded;
}

/** True when the Google provider is selected AND a key is present. */
export function isGoogleMapsEnabled(): boolean {
  return env.map.provider === "google" && Boolean(env.map.googleApiKey);
}
