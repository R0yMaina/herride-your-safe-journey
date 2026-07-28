import { useQuery } from "@tanstack/react-query";
import { Receipt as ReceiptIcon } from "lucide-react";
import { GlassCard } from "@/components/common";
import { receiptService } from "@/services/receipts";
import { formatCurrency } from "@/features/ride-request/lib/format";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

/** Itemised receipt for a completed ride, from the server-authoritative
 * breakdown (`get_receipt`). Doubles as the corporate invoice source. */
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
  const money = (n: number) => formatCurrency(n, r.currency);

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center gap-2">
        <ReceiptIcon className="h-4 w-4 text-primary" />
        <p className="font-display text-base text-foreground">Receipt</p>
      </div>

      <div className="space-y-1.5 border-b border-border/50 pb-3">
        <Row label="Base fare" value={money(r.baseFare)} />
        <Row label="Distance" value={money(r.distanceCost)} />
        <Row label="Time" value={money(r.timeCost)} />
        <Row label="Booking fee" value={money(r.bookingFee)} />
      </div>
      <Row label="Total charged" value={money(r.total)} strong />

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
