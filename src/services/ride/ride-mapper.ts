import type { RideRecord, RideStatus } from "@/types/ride";
import type { Database } from "@/integrations/supabase/types";

type RideRow = Database["public"]["Tables"]["rides"]["Row"];

export function mapRideRow(row: RideRow): RideRecord {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    status: row.status as RideStatus,
    pickup: { lat: row.pickup_lat, lng: row.pickup_lng, address: row.pickup_address },
    destination: { lat: row.drop_lat, lng: row.drop_lng, address: row.drop_address },
    fareEstimate: row.fare_estimate === null ? null : Number(row.fare_estimate),
    fareFinal: row.fare_final === null ? null : Number(row.fare_final),
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    cancellationReason: row.cancellation_reason,
    requestedAt: row.requested_at,
    acceptedAt: row.accepted_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
