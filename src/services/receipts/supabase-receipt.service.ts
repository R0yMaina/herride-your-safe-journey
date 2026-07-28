import { supabase } from "@/integrations/supabase/client";
import type { IReceiptService, RideReceipt } from "./receipt.service";

export class SupabaseReceiptService implements IReceiptService {
  async getReceipt(rideId: string): Promise<RideReceipt | null> {
    const { data, error } = await supabase.rpc("get_receipt", { _ride_id: rideId });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    const n = (v: number | null | undefined) => Number(v ?? 0);
    return {
      rideId: row.ride_id,
      currency: row.currency,
      baseFare: n(row.base_fare),
      distanceCost: n(row.distance_cost),
      timeCost: n(row.time_cost),
      bookingFee: n(row.booking_fee),
      total: n(row.total),
      commission: n(row.commission),
      driverEarnings: n(row.driver_earnings),
      distanceKm: row.distance_km === null ? null : Number(row.distance_km),
      durationMin: row.duration_min === null ? null : Number(row.duration_min),
      driverName: row.driver_name,
      vehicle: row.vehicle,
      plate: row.plate,
      pickupAddress: row.pickup_address,
      dropAddress: row.drop_address,
      completedAt: row.completed_at,
    };
  }
}
