import type { RideRecord, RideStatus } from "@/types/ride";
import type { RideSubscription } from "@/services/ride/rides.service";

export interface DriverLocationPing {
  readonly lat: number;
  readonly lng: number;
  readonly heading?: number;
}

/** Public-facing driver + vehicle info shown to a matched passenger. */
export interface PublicDriver {
  readonly userId: string;
  readonly name: string;
  readonly rating: number;
  readonly vehicle: string;
  readonly plate: string | null;
  readonly color: string | null;
}

export interface NearbyDriver {
  readonly driverUserId: string;
  readonly distanceKm: number;
  readonly rating: number;
  readonly vehicle: string;
  readonly plate: string | null;
}

/**
 * Driver-side dispatch: availability, location, the open-ride pool, atomic
 * claiming, and lifecycle transitions. Interface-first so screens stay
 * backend-agnostic.
 */
export interface IDriverService {
  goOnline(ping: DriverLocationPing): Promise<void>;
  goOffline(): Promise<void>;
  pingLocation(ping: DriverLocationPing): Promise<void>;
  isOnline(): Promise<boolean>;
  /** Open (unassigned) ride requests this driver may claim. */
  listOpenRides(): Promise<readonly RideRecord[]>;
  subscribeOpenRides(onChange: () => void): RideSubscription;
  /** Atomically claim a requested ride; throws if already taken. */
  claim(rideId: string): Promise<RideRecord>;
  /** Advance a ride the driver owns to the next legal status. */
  transition(rideId: string, next: RideStatus): Promise<RideRecord>;
  getPublicDriver(userId: string): Promise<PublicDriver | null>;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockDriverService implements IDriverService {
  private online = false;
  async goOnline() {
    await delay();
    this.online = true;
  }
  async goOffline() {
    await delay();
    this.online = false;
  }
  async pingLocation() {
    await delay(50);
  }
  async isOnline() {
    await delay(50);
    return this.online;
  }
  async listOpenRides() {
    await delay();
    return [];
  }
  subscribeOpenRides(): RideSubscription {
    return { unsubscribe: () => {} };
  }
  async claim(): Promise<RideRecord> {
    await delay();
    throw new Error("Mock driver cannot claim rides");
  }
  async transition(): Promise<RideRecord> {
    await delay();
    throw new Error("Mock driver cannot transition rides");
  }
  async getPublicDriver(): Promise<PublicDriver | null> {
    await delay();
    return null;
  }
}
