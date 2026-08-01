import type { GeoPoint } from "@/types/ride";

/** No surge. The value every failure path returns. */
export const NO_SURGE = 1;

/** Below this the multiplier is not worth mentioning to her. */
export const SURGE_VISIBLE_AT = 1.1;

/**
 * Live demand pricing around a pickup point.
 *
 * The number this returns is an *estimate shown before booking*. The number
 * she actually pays is locked onto the ride row by the database the moment she
 * books (`tg_rides_lock_surge`) and settlement uses that one — so a spike
 * between seeing the quote and confirming it cannot raise her fare.
 */
export interface ISurgeService {
  /** Multiplier at a point; 1 when surge is off, unknown, or unreachable. */
  surgeAt(point: GeoPoint): Promise<number>;
}

/** Is this multiplier worth showing? */
export function isSurging(multiplier: number): boolean {
  return multiplier >= SURGE_VISIBLE_AT;
}

/** "1.4x" — one decimal, matching what the database rounds to. */
export function formatSurge(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}

export class MockSurgeService implements ISurgeService {
  async surgeAt(): Promise<number> {
    await new Promise<void>((r) => setTimeout(r, 80));
    // Mock mode surges, so the badge and the fare line are reachable without
    // needing a real shortage of drivers to look at them.
    return 1.4;
  }
}
