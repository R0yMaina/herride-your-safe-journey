import { supabase } from "@/integrations/supabase/client";
import { canTransition, type RideRecord, type RideStatus } from "@/types/ride";
import type { RideSubscription } from "@/services/ride/rides.service";
import type { Database } from "@/integrations/supabase/types";
import { mapRideRow } from "@/services/ride/ride-mapper";
import type {
  DriverLiveLocation,
  DriverLocationPing,
  IDriverService,
  NearbyDriver,
  PublicDriver,
  RideOffer,
} from "./driver.service";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message ?? "Not signed in");
  return user.id;
}

export class SupabaseDriverService implements IDriverService {
  // Availability and coordinates both go through RPCs now. Direct writes to
  // driver_locations are revoked, because a client that can PATCH its own
  // coordinates can claim to be anywhere and get matched there.
  async goOnline(ping: DriverLocationPing): Promise<void> {
    const { error } = await supabase.rpc("set_driver_availability", {
      _available: true,
      // Passing the position resets the speed baseline, so reconnecting from a
      // different part of town isn't mistaken for a teleport.
      _lat: ping.lat,
      _lng: ping.lng,
    });
    if (error) throw new Error(error.message);
  }

  async goOffline(): Promise<void> {
    const { error } = await supabase.rpc("set_driver_availability", { _available: false });
    if (error) throw new Error(error.message);
  }

  async pingLocation(ping: DriverLocationPing): Promise<void> {
    const { error } = await supabase.rpc("ping_driver_location", {
      _lat: ping.lat,
      _lng: ping.lng,
      _heading: ping.heading ?? undefined,
    });
    // A rejected ping means the server judged the movement impossible. Surface
    // it rather than swallowing it — the driver's position is now stale, and a
    // silent failure would leave her invisible to riders with no explanation.
    if (error) throw new Error(error.message);
  }

  async isOnline(): Promise<boolean> {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("driver_locations")
      .select("is_available")
      .eq("driver_user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.is_available ?? false;
  }

  async listOpenRides(): Promise<readonly RideRecord[]> {
    // RLS lets a verified female driver SELECT rides with status='requested'.
    // Scheduled rides stay hidden until 30 minutes before pickup (phase14
    // release window) so the pool only shows work that is actionable now.
    const releaseBefore = new Date(Date.now() + 30 * 60_000).toISOString();
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "requested")
      .is("driver_id", null)
      .or(`scheduled_for.is.null,scheduled_for.lte.${releaseBefore}`)
      .order("requested_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRideRow);
  }

  subscribeOpenRides(onChange: () => void): RideSubscription {
    const channel = supabase
      .channel("open-rides")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => onChange())
      .subscribe();
    return {
      unsubscribe: () => {
        void supabase.removeChannel(channel);
      },
    };
  }

  async claim(rideId: string): Promise<RideRecord> {
    // Atomic claim in the DB — guards against two drivers taking one ride.
    const { data, error } = await supabase.rpc("claim_ride", { _ride_id: rideId });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Ride is no longer available");
    return mapRideRow(row as never);
  }

  async startTripWithPin(rideId: string, pin: string): Promise<RideRecord> {
    // arrived → in_progress is still a status change, so it obeys the same
    // transition law as every other write (the DB re-checks it too).
    const { data: current, error: readError } = await supabase
      .from("rides")
      .select("status")
      .eq("id", rideId)
      .single();
    if (readError) throw new Error(readError.message);
    const from = current.status as RideStatus;
    if (!canTransition(from, "in_progress")) {
      throw new Error(`Illegal transition: ${from} → in_progress`);
    }

    const { data, error } = await supabase.rpc("start_trip_with_pin", {
      _ride_id: rideId,
      _pin: pin.trim(),
    });
    if (error) throw new Error(error.message);
    return mapRideRow(data as never);
  }

  async transition(rideId: string, next: RideStatus): Promise<RideRecord> {
    const { data: current, error: readError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();
    if (readError) throw new Error(readError.message);

    const from = current.status as RideStatus;
    if (!canTransition(from, next)) {
      throw new Error(`Illegal transition: ${from} → ${next}`);
    }

    // Completion settles money (passenger debit + driver payout + tx pair) and
    // must be atomic, so it runs entirely inside the complete_ride RPC.
    if (next === "completed") {
      const { data, error } = await supabase.rpc("complete_ride", { _ride_id: rideId });
      if (error) throw new Error(error.message);
      return mapRideRow(data as never);
    }

    // "completed" is handled above via complete_ride; here only non-terminal
    // transitions remain.
    const update: Database["public"]["Tables"]["rides"]["Update"] = { status: next };
    if (next === "accepted") update.accepted_at = new Date().toISOString();
    if (next === "in_progress") update.started_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("rides")
      .update(update)
      .eq("id", rideId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRideRow(data);
  }

  async getDriverLocation(driverUserId: string): Promise<DriverLiveLocation | null> {
    const { data, error } = await supabase
      .from("driver_locations")
      .select("lat, lng, heading, updated_at")
      .eq("driver_user_id", driverUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { lat: data.lat, lng: data.lng, heading: data.heading, updatedAt: data.updated_at };
  }

  subscribeDriverLocation(
    driverUserId: string,
    onChange: (location: DriverLiveLocation) => void,
  ): RideSubscription {
    // One channel per driver, filtered server-side so only that driver's
    // pings reach this socket. RLS additionally gates what rows are visible.
    const channel = supabase
      .channel(`driver-location:${driverUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_locations",
          filter: `driver_user_id=eq.${driverUserId}`,
        },
        (payload) => {
          const row = payload.new as {
            lat: number;
            lng: number;
            heading: number | null;
            updated_at: string;
          };
          onChange({
            lat: row.lat,
            lng: row.lng,
            heading: row.heading,
            updatedAt: row.updated_at,
          });
        },
      )
      .subscribe();
    return {
      unsubscribe: () => {
        void supabase.removeChannel(channel);
      },
    };
  }

  async getPublicDriver(userId: string): Promise<PublicDriver | null> {
    const { data, error } = await supabase.rpc("get_public_driver", {
      _driver_user_id: userId,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    // The selfie lives in a private bucket; the rider gets a short-lived link
    // scoped to the driver on her own active ride (phase28 storage policy).
    let photoUrl: string | null = null;
    if (row.photo_path) {
      const { data: signed } = await supabase.storage
        .from("driver-docs")
        .createSignedUrl(row.photo_path, 900);
      photoUrl = signed?.signedUrl ?? null;
    }

    return {
      userId,
      name: row.name ?? "Your driver",
      rating: Number(row.rating ?? 5),
      vehicle: row.vehicle ?? "Vehicle",
      plate: row.plate,
      color: row.color,
      photoUrl,
    };
  }

  async nearbyDrivers(
    center: { readonly lat: number; readonly lng: number },
    radiusKm = 5,
    limit = 10,
  ): Promise<readonly NearbyDriver[]> {
    const { data, error } = await supabase.rpc("nearest_available_drivers", {
      _lat: center.lat,
      _lng: center.lng,
      _radius_km: radiusKm,
      _limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      driverUserId: row.driver_user_id,
      lat: row.lat,
      lng: row.lng,
      distanceKm: Number(row.distance_km),
      rating: Number(row.rating ?? 5),
      vehicle: [row.vehicle_make, row.vehicle_model].filter(Boolean).join(" ") || "Vehicle",
      plate: row.vehicle_plate,
    }));
  }

  async pendingOffer(): Promise<RideOffer | null> {
    const { data, error } = await supabase.rpc("my_pending_offer");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      offerId: row.offer_id,
      rideId: row.ride_id,
      distanceKm: row.distance_km,
      expiresAt: row.expires_at,
      pickupAddress: row.pickup_address,
      dropAddress: row.drop_address,
      fareEstimate: row.fare_estimate === null ? null : Number(row.fare_estimate),
    };
  }

  async acceptOffer(offerId: string): Promise<RideRecord> {
    const { data, error } = await supabase.rpc("accept_offer", { _offer_id: offerId });
    if (error) throw new Error(error.message);
    return mapRideRow(data as unknown as Database["public"]["Tables"]["rides"]["Row"]);
  }

  async declineOffer(offerId: string): Promise<void> {
    const { error } = await supabase.rpc("decline_offer", { _offer_id: offerId });
    if (error) throw new Error(error.message);
  }

  async reportNoShow(rideId: string): Promise<RideRecord> {
    const { data, error } = await supabase.rpc("report_no_show", { _ride_id: rideId });
    if (error) throw new Error(error.message);
    return mapRideRow(data as unknown as Database["public"]["Tables"]["rides"]["Row"]);
  }
}
