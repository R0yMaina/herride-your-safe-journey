import { supabase } from "@/integrations/supabase/client";
import type { RideRequestDraft, TripSummary } from "@/types/ride";
import type { IRideRequestService } from "./ride-request.service";

/**
 * Creates real ride rows. The fare estimate is computed client-side by
 * FareService (the v1 pricing source of truth) and stored on the row; a
 * server-side recompute would live in an edge function, which is out of
 * scope for v1. The female-only guarantee is enforced by the DB trigger,
 * not here.
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
        status: "requested",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: data.id, summary, createdAt: data.created_at };
  }

  async cancel(requestId: string): Promise<void> {
    const { error } = await supabase
      .from("rides")
      .update({ status: "cancelled", cancellation_reason: "Cancelled by passenger" })
      .eq("id", requestId);
    if (error) throw new Error(error.message);
  }
}
