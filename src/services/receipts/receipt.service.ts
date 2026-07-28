export interface RideReceipt {
  readonly rideId: string;
  readonly currency: string;
  readonly baseFare: number;
  readonly distanceCost: number;
  readonly timeCost: number;
  readonly bookingFee: number;
  readonly total: number;
  readonly commission: number;
  readonly driverEarnings: number;
  readonly distanceKm: number | null;
  readonly durationMin: number | null;
  readonly driverName: string | null;
  readonly vehicle: string | null;
  readonly plate: string | null;
  readonly pickupAddress: string | null;
  readonly dropAddress: string | null;
  readonly completedAt: string | null;
}

/**
 * Itemised trip receipt (also the basis for corporate invoices). The
 * breakdown is recomputed server-side from the authoritative pricing config
 * in `get_receipt`, so it always reconciles with what was charged.
 */
export interface IReceiptService {
  getReceipt(rideId: string): Promise<RideReceipt | null>;
}

export class MockReceiptService implements IReceiptService {
  async getReceipt(rideId: string): Promise<RideReceipt | null> {
    await new Promise<void>((r) => setTimeout(r, 120));
    return {
      rideId,
      currency: "KES",
      baseFare: 180,
      distanceCost: 220,
      timeCost: 80,
      bookingFee: 50,
      total: 530,
      commission: 53,
      driverEarnings: 477,
      distanceKm: 4,
      durationMin: 10,
      driverName: "Grace Wanjiku",
      vehicle: "Toyota Vitz",
      plate: "KDA 100A",
      pickupAddress: "Nairobi CBD",
      dropAddress: "Sarit Centre, Westlands",
      completedAt: new Date().toISOString(),
    };
  }
}
