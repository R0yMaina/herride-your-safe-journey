import type { DriverLocationPing } from "@/services/driver";
import { getCurrentPosition } from "@/lib/geo";

/**
 * Best-effort current position as a driver ping.
 *
 * Thin adapter over the shared {@link getCurrentPosition} — the fallback
 * coordinate and permission handling live there, so the driver and rider maps
 * can't drift apart.
 */
export async function getCurrentPing(): Promise<DriverLocationPing> {
  const { lat, lng, heading } = await getCurrentPosition();
  return { lat, lng, heading };
}
