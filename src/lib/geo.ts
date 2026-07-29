import type { GeoPoint } from "@/types/ride";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km. Mirrors the haversine used by the
 * nearest_available_drivers SQL function so client-side ranking and
 * server-side proximity queries agree. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Human-friendly distance label ("850 m", "2.4 km"). */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Nairobi CBD — where a map opens when the browser gives us nothing. */
export const FALLBACK_CENTER: GeoPoint = { lat: -1.2921, lng: 36.8219 };

/**
 * Best-effort current position, resolving to {@link FALLBACK_CENTER} when
 * geolocation is unavailable or denied.
 *
 * Never rejects: every caller is drawing a map, and a map that fails to open
 * because a permission prompt was dismissed is worse than one centred on the
 * wrong city.
 */
export function getCurrentPosition(): Promise<GeoPoint & { readonly heading?: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(FALLBACK_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
        }),
      () => resolve(FALLBACK_CENTER),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}
