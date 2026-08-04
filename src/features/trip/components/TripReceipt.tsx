import { useQuery } from "@tanstack/react-query";
import { Receipt as ReceiptIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/common";
import { receiptService, receiptLines, receiptText } from "@/services/receipts";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { useT } from "@/i18n";

function Row({
  label,
  value,
  strong,
  credit,
}: {
  label: string;
  value: string;
  strong?: boolean;
  credit?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={
          credit
            ? "font-medium text-primary"
            : strong
              ? "font-semibold text-foreground"
              : "text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Itemised receipt for a settled ride, from the server-authoritative breakdown
 * (`get_receipt`). Every line that moved money is printed — the promo
 * discount, the waiting charge, the fee on a cancelled trip — so the rows
 * always add up to the total charged.
 */
export function TripReceipt({ rideId }: { rideId: string }) {
  const { t } = useT();
  const { data: r, isLoading } = useQuery({
    queryKey: ["receipt", rideId],
    queryFn: () => receiptService.getReceipt(rideId),
  });

  if (isLoading || !r) {
    return (
      <GlassCard className="py-6 text-center text-sm text-muted-foreground">
        {isLoading ? t("common.loading") : t("receipt.unavailable")}
      </GlassCard>
    );
  }

  const money = (amount: number) => formatCurrency(amount, r.currency);

  const share = async () => {
    const text = receiptText(r, money, t);
    try {
      if (navigator.share) {
        await navigator.share({ title: `HeRide ${t("receipt.title")}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(t("receipt.copied"));
    } catch (e) {
      // Dismissing the share sheet is not a failure worth shouting about.
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Could not share the receipt");
    }
  };

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ReceiptIcon className="h-4 w-4 text-primary" />
          <p className="font-display text-base text-foreground">{t("receipt.title")}</p>
        </div>
        <button
          type="button"
          onClick={share}
          aria-label={t("receipt.share")}
          className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> {t("receipt.share")}
        </button>
      </div>

      <div className="space-y-1.5 border-b border-border/50 pb-3">
        {receiptLines(r).map((line) => (
          <Row
            key={line.labelKey}
            label={t(line.labelKey, line.labelValues)}
            value={money(line.amount)}
            credit={line.credit}
          />
        ))}
        {r.status === "cancelled" && (
          <p className="pt-1 text-xs text-muted-foreground">{t("receipt.cancellationNote")}</p>
        )}
      </div>

      <Row label={t("receipt.totalCharged")} value={money(r.total)} strong />
      {r.tip > 0 && <Row label={t("receipt.tip")} value={money(r.tip)} />}

      {(r.driverName || r.vehicle) && (
        <p className="pt-1 text-xs text-muted-foreground">
          {r.driverName ?? "Driver"}
          {r.vehicle ? ` · ${r.vehicle}` : ""}
          {r.plate ? ` · ${r.plate}` : ""}
        </p>
      )}
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Ride {rideId.slice(0, 8)}
      </p>
    </GlassCard>
  );
}
