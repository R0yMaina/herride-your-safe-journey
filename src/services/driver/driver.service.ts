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
  /**
   * Signed URL of the selfie she was VERIFIED on — not a profile picture she
   * can change. The rider checks it against whoever pulls up, which is the
   * only thing standing between a lent account and a stranger at the wheel.
   */
  readonly photoUrl: string | null;
}

/** An available driver near a rider, as returned by nearest_available_drivers. */
export interface NearbyDriver {
  readonly driverUserId: string;
  readonly lat: number;
  readonly lng: number;
  readonly distanceKm: number;
  readonly rating: number;
  readonly vehicle: string;
  readonly plate: string | null;
}

/** A ride this driver is being asked to take, and how long she has to answer. */
export interface RideOffer {
  readonly offerId: string;
  readonly rideId: string;
  readonly distanceKm: number | null;
  /** When the offer lapses and moves to the next driver. */
  readonly expiresAt: string;
  readonly pickupAddress: string | null;
  readonly dropAddress: string | null;
  readonly fareEstimate: number | null;
}

/** A driver's last known position, as streamed to their passenger. */
export interface DriverLiveLocation {
  readonly lat: number;
  readonly lng: number;
  readonly heading: number | null;
  readonly updatedAt: string;
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
  /**
   * The offer this driver is currently being asked to answer.
   *
   * Dispatch is sequential: one driver at a time on a timer, nearest first.
   * An open pool let whoever tapped fastest win, which is not the same as the
   * rider getting the closest car.
   */
  pendingOffer(): Promise<RideOffer | null>;
  acceptOffer(offerId: string): Promise<RideRecord>;
  /** Decline; the ride moves to the next driver immediately. */
  declineOffer(offerId: string): Promise<void>;
  /**
   * Rider never came. Refused server-side until the configured wait has
   * elapsed since arrival, so it cannot be claimed the moment she pulls up.
   */
  reportNoShow(rideId: string): Promise<RideRecord>;
  /** Advance a ride the driver owns to the next legal status. */
  transition(rideId: string, next: RideStatus): Promise<RideRecord>;
  /**
   * Start the trip by entering the rider's 4-digit pickup PIN (HerShield).
   * The DB refuses arrived → in_progress through any other path.
   */
  startTripWithPin(rideId: string, pin: string): Promise<RideRecord>;
  getPublicDriver(userId: string): Promise<PublicDriver | null>;
  /**
   * Available drivers around a point, for the rider's home map.
   *
   * Backed by the `nearest_available_drivers` SECURITY DEFINER function, which
   * is the only thing a rider may use to see driver positions — it filters to
   * verified female drivers with a fresh ping, so no raw `driver_locations`
   * read is ever needed client-side.
   */
  nearbyDrivers(
    center: { readonly lat: number; readonly lng: number },
    radiusKm?: number,
    limit?: number,
  ): Promise<readonly NearbyDriver[]>;
  /** Last known position of a driver (passenger-side; RLS-gated). */
  getDriverLocation(driverUserId: string): Promise<DriverLiveLocation | null>;
  /** Live GPS stream of one driver, for the passenger's active trip. */
  subscribeDriverLocation(
    driverUserId: string,
    onChange: (location: DriverLiveLocation) => void,
  ): RideSubscription;
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
  async startTripWithPin(): Promise<RideRecord> {
    await delay();
    throw new Error("Mock driver cannot start trips");
  }
  async getPublicDriver(): Promise<PublicDriver | null> {
    await delay();
    return null;
  }
  async pendingOffer(): Promise<RideOffer | null> {
    await delay(80);
    return null;
  }
  async acceptOffer(): Promise<RideRecord> {
    await delay();
    throw new Error("Mock driver cannot accept offers");
  }
  async declineOffer(): Promise<void> {
    await delay(80);
  }
  async reportNoShow(): Promise<RideRecord> {
    await delay();
    throw new Error("Mock driver cannot report no-shows");
  }
  async nearbyDrivers(
    center: { readonly lat: number; readonly lng: number },
    radiusKm = 5,
  ): Promise<readonly NearbyDriver[]> {
    await delay(120);
    // Fixed offsets rather than random ones: the home map should look the
    // same on every render in mock mode, or it reads as drivers teleporting.
    const offsets = [
      { dLat: 0.012, dLng: 0.008, km: 1.6 },
      { dLat: -0.009, dLng: 0.015, km: 2.0 },
      { dLat: 0.006, dLng: -0.017, km: 2.1 },
      { dLat: -0.018, dLng: -0.006, km: 2.2 },
    ];
    return offsets
      .filter((o) => o.km <= radiusKm)
      .map((o, i) => ({
        driverUserId: `mock-driver-${i}`,
        lat: center.lat + o.dLat,
        lng: center.lng + o.dLng,
        distanceKm: o.km,
        rating: 4.9,
        vehicle: "Toyota Vitz",
        plate: null,
      }));
  }
  async getDriverLocation(): Promise<DriverLiveLocation | null> {
    await delay(50);
    return null;
  }
  subscribeDriverLocation(): RideSubscription {
    return { unsubscribe: () => {} };
  }
}
