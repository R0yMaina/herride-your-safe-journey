export interface TripShareLink {
  readonly token: string;
  readonly url: string;
  readonly expiresAt: string;
}

/** Someone to ring, and the number to ring if all else fails. */
export interface EmergencyContact {
  readonly name: string;
  readonly phone: string;
  /** True when this contact is a HeRide user, so the in-app alert reached her. */
  readonly isAppUser: boolean;
}

export interface EmergencyContacts {
  readonly contacts: readonly EmergencyContact[];
  /** Police/ambulance for the operating country, from pricing_config. */
  readonly emergencyNumber: string;
}

export interface ISafetyService {
  /**
   * Who to put in front of her the moment she panics. Fetched ahead of time
   * so the emergency sheet opens with the numbers already on it — she should
   * never be watching a spinner while frightened.
   */
  getEmergencyContacts(): Promise<EmergencyContacts>;
  /** Raise an SOS on an active ride; returns the incident id. */
  raiseSos(rideId: string, coords?: { lat: number; lng: number }): Promise<string>;
  /** Create (or return) a public, time-boxed trip-share link. */
  shareTrip(rideId: string): Promise<TripShareLink>;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockSafetyService implements ISafetyService {
  async getEmergencyContacts(): Promise<EmergencyContacts> {
    await delay(80);
    return {
      contacts: [{ name: "Wanjiru (sister)", phone: "+254712345678", isAppUser: true }],
      emergencyNumber: "999",
    };
  }

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
