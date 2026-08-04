import type { TranslationKey, Substitutions } from "@/i18n";
import type { RideReceipt } from "./receipt.service";

export interface ReceiptLine {
  /** Translation key — the label is resolved by the component that renders it. */
  readonly labelKey: TranslationKey;
  /** Values for the key's placeholders, when it has any. */
  readonly labelValues?: Substitutions;
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
    return [{ labelKey: "receipt.cancellationFee", amount: receipt.cancellationFee }];
  }

  const lines: ReceiptLine[] = [
    { labelKey: "receipt.baseFare", amount: receipt.baseFare },
    receipt.distanceKm
      ? {
          labelKey: "receipt.distanceWith" as const,
          labelValues: { km: receipt.distanceKm.toFixed(1) },
          amount: receipt.distanceCost,
        }
      : { labelKey: "receipt.distance" as const, amount: receipt.distanceCost },
    receipt.durationMin
      ? {
          labelKey: "receipt.timeWith" as const,
          labelValues: { minutes: Math.round(receipt.durationMin) },
          amount: receipt.timeCost,
        }
      : { labelKey: "receipt.time" as const, amount: receipt.timeCost },
    { labelKey: "receipt.bookingFee", amount: receipt.bookingFee },
  ];

  if (receipt.surgeAmount > 0) {
    lines.push({
      labelKey: "receipt.busyPeriod",
      labelValues: { multiplier: `${receipt.surgeMultiplier.toFixed(1)}x` },
      amount: receipt.surgeAmount,
    });
  }

  if (receipt.adjustment !== 0) {
    lines.push({
      labelKey: receipt.adjustment > 0 ? "receipt.minimumFareAdjustment" : "receipt.fareAdjustment",
      amount: receipt.adjustment,
      credit: receipt.adjustment < 0,
    });
  }
  if (receipt.discount > 0) {
    lines.push({
      labelKey: receipt.promoCode ? "receipt.promo" : "receipt.promoGeneric",
      labelValues: receipt.promoCode ? { code: receipt.promoCode } : undefined,
      amount: -receipt.discount,
      credit: true,
    });
  }
  if (receipt.waitingFee > 0) {
    lines.push({
      labelKey: "receipt.waiting",
      labelValues: { minutes: receipt.waitingMinutes },
      amount: receipt.waitingFee,
    });
  }
  return lines;
}

/** Plain-text receipt, for the share sheet or an expense claim. */
export function receiptText(
  receipt: RideReceipt,
  money: (amount: number) => string,
  t: (key: TranslationKey, values?: Substitutions) => string,
): string {
  const when = receipt.completedAt ? new Date(receipt.completedAt).toLocaleString("en-KE") : null;
  const route =
    receipt.pickupAddress && receipt.dropAddress
      ? `${receipt.pickupAddress} → ${receipt.dropAddress}`
      : null;

  const parts = [`HeRide ${t("receipt.title")}`, when, route, ""];
  for (const line of receiptLines(receipt)) {
    parts.push(`${t(line.labelKey, line.labelValues)}: ${money(line.amount)}`);
  }
  parts.push(`${t("receipt.totalCharged")}: ${money(receipt.total)}`);
  if (receipt.tip > 0) parts.push(`${t("receipt.tip")}: ${money(receipt.tip)}`);
  if (receipt.driverName) parts.push(`Driver: ${receipt.driverName}`);
  parts.push("", `Ride ${receipt.rideId}`);

  return parts.filter((p) => p !== null).join("\n");
}
