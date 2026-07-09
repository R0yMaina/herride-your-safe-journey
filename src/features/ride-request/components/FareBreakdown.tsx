import { GlassCard } from "@/components/common";
import type { FareEstimate } from "@/types/ride";
import { formatCurrency } from "../lib/format";

interface FareBreakdownProps {
  readonly fare: FareEstimate | null;
}

function Row({ label, value, muted = false, emphasize = false }: {
  readonly label: string;
  readonly value: string;
  readonly muted?: boolean;
  readonly emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={emphasize ? "font-display text-lg text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

export function FareBreakdown({ fare }: FareBreakdownProps) {
  if (!fare) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground">Select a ride to see fare details.</p>
      </GlassCard>
    );
  }
  const fmt = (n: number) => formatCurrency(n, fare.currency);
  return (
    <GlassCard className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Fare breakdown</p>
      <div className="space-y-2">
        <Row label="Base fare" value={fmt(fare.baseFare)} />
        <Row label="Distance" value={fmt(fare.distanceCost)} />
        <Row label="Time" value={fmt(fare.timeCost)} />
        <Row label="Booking fee" value={fmt(fare.bookingFee)} />
        <Row label="Surge" value={fare.surge ? fmt(fare.surge) : "—"} muted={!fare.surge} />
        <Row label="Promo" value={fare.discount ? `-${fmt(fare.discount)}` : "—"} muted={!fare.discount} />
      </div>
      <div className="border-t border-border/60 pt-3">
        <Row label="Estimated total" value={fmt(fare.total)} emphasize />
      </div>
    </GlassCard>
  );
}