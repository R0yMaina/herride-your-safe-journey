import { MapPin, Clock } from "lucide-react";
import { GlassCard } from "@/components/common";
import type { Destination } from "../data/placeholders";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <GlassCard className="flex items-center gap-4 p-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
        <MapPin className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base text-foreground">{destination.name}</p>
        <p className="truncate text-xs text-muted-foreground">{destination.detail}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
        <Clock className="h-3 w-3" /> {destination.etaMin}m
      </span>
    </GlassCard>
  );
}
