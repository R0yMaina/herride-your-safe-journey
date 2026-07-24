export interface TripShareLink {
  readonly token: string;
  readonly url: string;
  readonly expiresAt: string;
}

export interface ISafetyService {
  /** Raise an SOS on an active ride; returns the incident id. */
  raiseSos(rideId: string, coords?: { lat: number; lng: number }): Promise<string>;
  /** Create (or return) a public, time-boxed trip-share link. */
  shareTrip(rideId: string): Promise<TripShareLink>;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockSafetyService implements ISafetyService {
  async raiseSos() {
    await delay();
    return crypto.randomUUID();
  }
  async shareTrip() {
    await delay();
    const token = crypto.randomUUID().replace(/-/g, "");
    return {
      token,
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`,
      expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
    };
  }
}
