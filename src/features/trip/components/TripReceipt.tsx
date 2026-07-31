import { useQuery } from "@tanstack/react-query";
import { Receipt as ReceiptIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/common";
import { receiptService, receiptLines, receiptText } from "@/services/receipts";
import { formatCurrency } from "@/features/ride-request/lib/format";

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
  const { data: r, isLoading } = useQuery({
    queryKey: ["receipt", rideId],
    queryFn: () => receiptService.getReceipt(rideId),
  });

  if (isLoading || !r) {
    return (
      <GlassCard className="py-6 text-center text-sm text-muted-foreground">
        {isLoading ? "Loading receipt…" : "Receipt unavailable"}
      </GlassCard>
    );
  }

  const money = (amount: number) => formatCurrency(amount, r.currency);

  const share = async () => {
    const text = receiptText(r, money);
    try {
      if (navigator.share) {
        await navigator.share({ title: "HeRide receipt", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
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
          <p className="font-display text-base text-foreground">Receipt</p>
        </div>
        <button
          type="button"
          onClick={share}
          aria-label="Share receipt"
          className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      <div className="space-y-1.5 border-b border-border/50 pb-3">
        {receiptLines(r).map((line) => (
          <Row
            key={line.label}
            label={line.label}
            value={money(line.amount)}
            credit={line.credit}
          />
        ))}
        {r.status === "cancelled" && (
          <p className="pt-1 text-xs text-muted-foreground">
            Charged because a driver was already on her way to you. It goes to her, not to HeRide.
          </p>
        )}
      </div>

      <Row label="Total charged" value={money(r.total)} strong />
      {r.tip > 0 && <Row label="Tip to your driver" value={money(r.tip)} />}

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
