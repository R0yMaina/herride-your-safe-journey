import { supabase } from "@/integrations/supabase/client";
import type { IReceiptService, RideReceipt } from "./receipt.service";

const n = (v: number | null | undefined) => Number(v ?? 0);
const maybe = (v: number | null | undefined) => (v === null || v === undefined ? null : Number(v));

export class SupabaseReceiptService implements IReceiptService {
  async getReceipt(rideId: string): Promise<RideReceipt | null> {
    const { data, error } = await supabase.rpc("get_receipt", { _ride_id: rideId });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      rideId: row.ride_id,
      status: row.status,
      currency: row.currency,
      baseFare: n(row.base_fare),
      distanceCost: n(row.distance_cost),
      timeCost: n(row.time_cost),
      bookingFee: n(row.booking_fee),
      adjustment: n(row.adjustment),
      discount: n(row.discount),
      promoCode: row.promo_code,
      waitingMinutes: n(row.waiting_minutes),
      waitingFee: n(row.waiting_fee),
      cancellationFee: n(row.cancellation_fee),
      total: n(row.total),
      tip: n(row.tip),
      commission: n(row.commission),
      driverEarnings: n(row.driver_earnings),
      distanceKm: maybe(row.distance_km),
      durationMin: maybe(row.duration_min),
      driverName: row.driver_name,
      vehicle: row.vehicle,
      plate: row.plate,
      pickupAddress: row.pickup_address,
      dropAddress: row.drop_address,
      requestedAt: row.requested_at,
      completedAt: row.completed_at,
    };
  }
}
