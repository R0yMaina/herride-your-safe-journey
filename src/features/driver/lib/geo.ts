import type { DriverLocationPing } from "@/services/driver";

// Nairobi CBD — used when the browser has no geolocation (e.g. desktop dev).
const FALLBACK: DriverLocationPing = { lat: -1.2921, lng: 36.8219 };

/** Best-effort current position; falls back to a Nairobi coordinate in dev. */
export function getCurrentPing(): Promise<DriverLocationPing> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
        }),
      () => resolve(FALLBACK),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}
