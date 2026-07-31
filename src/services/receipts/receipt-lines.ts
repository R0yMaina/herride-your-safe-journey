import type { RideReceipt } from "./receipt.service";

export interface ReceiptLine {
  readonly label: string;
  /** Signed: a discount is negative, so the lines sum to the total charged. */
  readonly amount: number;
  /** Money back to her — rendered in the accent colour rather than plain. */
  readonly credit?: boolean;
}

/**
 * The itemised lines of a receipt, in the order they are printed.
 *
 * The contract this module exists to hold: **the amounts always sum to
 * `receipt.total`**. That is what makes it a receipt rather than a summary,
 * and it is enforced by test. `get_receipt` supplies an `adjustment` column
 * for exactly this reason — it absorbs the minimum-fare floor and the
 * maximum-fare cap, which are applied to the fare as a whole and cannot be
 * attributed to any single line.
 */
export function receiptLines(receipt: RideReceipt): readonly ReceiptLine[] {
  if (receipt.status === "cancelled") {
    // Nobody was driven anywhere, so there is no metered fare to itemise.
    return [{ label: "Cancellation fee", amount: receipt.cancellationFee }];
  }

  const lines: ReceiptLine[] = [
    { label: "Base fare", amount: receipt.baseFare },
    {
      label: receipt.distanceKm ? `Distance (${receipt.distanceKm.toFixed(1)} km)` : "Distance",
      amount: receipt.distanceCost,
    },
    {
      label: receipt.durationMin ? `Time (${Math.round(receipt.durationMin)} min)` : "Time",
      amount: receipt.timeCost,
    },
    { label: "Booking fee", amount: receipt.bookingFee },
  ];

  if (receipt.adjustment !== 0) {
    lines.push({
      label: receipt.adjustment > 0 ? "Minimum fare adjustment" : "Fare adjustment",
      amount: receipt.adjustment,
      credit: receipt.adjustment < 0,
    });
  }
  if (receipt.discount > 0) {
    lines.push({
      label: receipt.promoCode ? `Promo ${receipt.promoCode}` : "Promo discount",
      amount: -receipt.discount,
      credit: true,
    });
  }
  if (receipt.waitingFee > 0) {
    lines.push({
      label: `Waiting (${receipt.waitingMinutes} min)`,
      amount: receipt.waitingFee,
    });
  }
  return lines;
}

/** Plain-text receipt, for the share sheet or an expense claim. */
export function receiptText(receipt: RideReceipt, money: (amount: number) => string): string {
  const when = receipt.completedAt ? new Date(receipt.completedAt).toLocaleString("en-KE") : null;
  const route =
    receipt.pickupAddress && receipt.dropAddress
      ? `${receipt.pickupAddress} → ${receipt.dropAddress}`
      : null;

  const parts = ["HeRide receipt", when, route, ""];
  for (const line of receiptLines(receipt)) {
    parts.push(`${line.label}: ${money(line.amount)}`);
  }
  parts.push(`Total charged: ${money(receipt.total)}`);
  if (receipt.tip > 0) parts.push(`Tip to your driver: ${money(receipt.tip)}`);
  if (receipt.driverName) parts.push(`Driver: ${receipt.driverName}`);
  parts.push("", `Ride ${receipt.rideId}`);

  return parts.filter((p) => p !== null).join("\n");
}
