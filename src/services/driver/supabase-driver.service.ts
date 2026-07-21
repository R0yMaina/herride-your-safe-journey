import { supabase } from "@/integrations/supabase/client";
import { canTransition, type RideRecord, type RideStatus } from "@/types/ride";
import type { RideSubscription } from "@/services/ride/rides.service";
import type { Database } from "@/integrations/supabase/types";
import { mapRideRow } from "@/services/ride/ride-mapper";
import type { DriverLocationPing, IDriverService, PublicDriver } from "./driver.service";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message ?? "Not signed in");
  return user.id;
}

export class SupabaseDriverService implements IDriverService {
  async goOnline(ping: DriverLocationPing): Promise<void> {
    const userId = await currentUserId();
    const { error } = await supabase.from("driver_locations").upsert(
      {
        driver_user_id: userId,
        lat: ping.lat,
        lng: ping.lng,
        heading: ping.heading ?? null,
        is_available: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "driver_user_id" },
    );
    if (error) throw new Error(error.message);
  }

  async goOffline(): Promise<void> {
    const userId = await currentUserId();
    const { error } = await supabase
      .from("driver_locations")
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq("driver_user_id", userId);
    if (error) throw new Error(error.message);
  }

  async pingLocation(ping: DriverLocationPing): Promise<void> {
    const userId = await currentUserId();
    const { error } = await supabase
      .from("driver_locations")
      .update({
        lat: ping.lat,
        lng: ping.lng,
        heading: ping.heading ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_user_id", userId);
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
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "requested")
      .is("driver_id", null)
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

  async getPublicDriver(userId: string): Promise<PublicDriver | null> {
    const [driverResult, profileResult] = await Promise.all([
      supabase
        .from("drivers")
        .select("vehicle_make, vehicle_model, vehicle_plate, vehicle_color, rating")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    const driver = driverResult.data;
    if (!driver) return null;
    const vehicle = [driver.vehicle_make, driver.vehicle_model].filter(Boolean).join(" ");
    return {
      userId,
      name: profileResult.data?.full_name ?? "Your driver",
      rating: Number(driver.rating ?? 5),
      vehicle: vehicle || "Vehicle",
      plate: driver.vehicle_plate,
      color: driver.vehicle_color,
    };
  }
}
