export type Coords = { lat: number; lng: number };

// Sensible default (Westwood / UCLA area) used when geolocation is unavailable.
export const DEFAULT_PICKUP: Coords = { lat: 34.0689, lng: -118.4452 };
export const DEFAULT_DROP: Coords = { lat: 34.0901, lng: -118.3849 };

export function getCurrentCoords(timeoutMs = 4000): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(DEFAULT_PICKUP);
      return;
    }
    const fallback = setTimeout(() => resolve(DEFAULT_PICKUP), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallback);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(fallback);
        resolve(DEFAULT_PICKUP);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs },
    );
  });
}