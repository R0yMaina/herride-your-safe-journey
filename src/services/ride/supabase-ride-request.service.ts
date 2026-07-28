import { supabase } from "@/integrations/supabase/client";
import { RIDE_STATUS_TRANSITIONS } from "@/types/ride";
import type { RideRequestDraft, RideStatus, TripSummary } from "@/types/ride";
import type { IRideRequestService } from "./ride-request.service";

/** Statuses from which "cancelled" is a legal transition, per the canonical map. */
const CANCELLABLE_STATUSES = (
  Object.entries(RIDE_STATUS_TRANSITIONS) as [RideStatus, readonly RideStatus[]][]
)
  .filter(([, next]) => next.includes("cancelled"))
  .map(([from]) => from);

/**
 * Creates real ride rows. `fare_estimate` is the client-side quote from the
 * Pricing Engine, shown to the passenger — but the pricing INPUTS
 * (distance, duration, tier multiplier) are also stored so the database can
 * independently recompute the authoritative fare at settlement (see
 * quote_fare / complete_ride). The client estimate never decides money. The
 * female-only guarantee is enforced by the DB trigger, not here.
 */
export class SupabaseRideRequestService implements IRideRequestService {
  async submit(summary: TripSummary): Promise<RideRequestDraft> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message ?? "You must be signed in to book");

    const { data, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: user.id,
        pickup_lat: summary.pickup.coords.lat,
        pickup_lng: summary.pickup.coords.lng,
        pickup_address: summary.pickup.address,
        drop_lat: summary.destination.coords.lat,
        drop_lng: summary.destination.coords.lng,
        drop_address: summary.destination.address,
        fare_estimate: summary.fare.total,
        distance_km: summary.route.distanceKm,
        duration_min: summary.route.durationMin,
        category_multiplier: summary.option.baseMultiplier,
        // Reserved rides carry their pickup time; drivers see them only
        // inside the 30-minute release window (phase14).
        scheduled_for: summary.schedule.mode === "scheduled" ? summary.schedule.scheduledFor : null,
        // Intermediate stops for multi-stop trips (already priced into the route).
        waypoints: summary.stops.map((s) => ({
          lat: s.coords.lat,
          lng: s.coords.lng,
          address: s.address,
        })),
        status: "requested",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: data.id, summary, createdAt: data.created_at };
  }

  async cancel(requestId: string): Promise<void> {
    // Conditional update: only rows whose current status legally allows
    // "cancelled" (per RIDE_STATUS_TRANSITIONS) are touched, so a ride that
    // completed or was already cancelled in a race is left untouched.
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "cancelled", cancellation_reason: "Cancelled by passenger" })
      .eq("id", requestId)
      .in("status", CANCELLABLE_STATUSES)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error("This ride can no longer be cancelled.");
    }
  }
}
