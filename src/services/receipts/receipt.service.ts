export interface RideReceipt {
  readonly rideId: string;
  /** `completed` or `cancelled` — a cancelled ride bills only the fee. */
  readonly status: string;
  readonly currency: string;
  readonly baseFare: number;
  readonly distanceCost: number;
  readonly timeCost: number;
  readonly bookingFee: number;
  /**
   * Whatever the metered lines do not explain — normally the minimum-fare
   * floor on a very short trip. Exists so the printed lines always sum to the
   * total; the row is hidden when it is zero.
   */
  readonly adjustment: number;
  readonly discount: number;
  readonly promoCode: string | null;
  readonly waitingMinutes: number;
  readonly waitingFee: number;
  readonly cancellationFee: number;
  readonly total: number;
  /** Paid after settlement, so it sits below the total rather than inside it. */
  readonly tip: number;
  readonly commission: number;
  readonly driverEarnings: number;
  readonly distanceKm: number | null;
  readonly durationMin: number | null;
  readonly driverName: string | null;
  readonly vehicle: string | null;
  readonly plate: string | null;
  readonly pickupAddress: string | null;
  readonly dropAddress: string | null;
  readonly requestedAt: string | null;
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
    // Carries a promo and a waiting charge so the fuller receipt is reachable
    // in mock mode without anyone having to be kept waiting at a kerb.
    return {
      rideId,
      status: "completed",
      currency: "KES",
      baseFare: 180,
      distanceCost: 220,
      timeCost: 80,
      bookingFee: 50,
      adjustment: 0,
      discount: 100,
      promoCode: "HERIDE50",
      waitingMinutes: 6,
      waitingFee: 15,
      cancellationFee: 0,
      total: 445,
      tip: 50,
      commission: 44.5,
      driverEarnings: 400.5,
      distanceKm: 4,
      durationMin: 10,
      driverName: "Grace Wanjiku",
      vehicle: "Toyota Vitz",
      plate: "KDA 100A",
      pickupAddress: "Nairobi CBD",
      dropAddress: "Sarit Centre, Westlands",
      requestedAt: new Date(Date.now() - 25 * 60_000).toISOString(),
      completedAt: new Date().toISOString(),
    };
  }
}
