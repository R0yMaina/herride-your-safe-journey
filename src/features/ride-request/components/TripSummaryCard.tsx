import { MapPin, Circle, Clock, Route } from "lucide-react";
import { GlassCard } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import type { TripSummary } from "@/types/ride";
import { RIDE_PREFERENCES } from "../data/preferences";
import { TrafficNotice } from "./TrafficNotice";
import { SurgeNotice } from "./SurgeNotice";
import { formatCurrency, formatDistance, formatDuration, formatScheduledFor } from "../lib/format";

interface TripSummaryCardProps {
  readonly summary: TripSummary;
}

export function TripSummaryCard({ summary }: TripSummaryCardProps) {
  const surge = useRideRequestStore((s) => s.surge);
  const prefs = RIDE_PREFERENCES.filter((p) => summary.preferences.includes(p.id));
  return (
    <GlassCard className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
            <Circle className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Pickup</p>
            <p className="truncate font-display text-sm text-foreground">{summary.pickup.label}</p>
            <p className="truncate text-xs text-muted-foreground">{summary.pickup.address}</p>
          </div>
        </div>
        {summary.stops.map((stop, i) => (
          <div key={stop.id} className="flex items-start gap-3">
            <span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-muted-foreground">
              <Circle className="h-2.5 w-2.5 fill-current" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Stop {i + 1}
              </p>
              <p className="truncate font-display text-sm text-foreground">{stop.label}</p>
              <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Destination
            </p>
            <p className="truncate font-display text-sm text-foreground">
              {summary.destination.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">{summary.destination.address}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Distance</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-foreground">
            <Route className="h-3.5 w-3.5 text-primary" />{" "}
            {formatDistance(summary.route.distanceKm)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Duration</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />{" "}
            {formatDuration(summary.route.durationMin)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ride</p>
          <p className="mt-1 text-sm text-foreground">
            {summary.option.name.replace("HeRide ", "")}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {summary.schedule.mode === "scheduled" ? "Scheduled" : "Pickup"}
        </p>
        <p className="text-sm text-foreground">
          {summary.schedule.mode === "scheduled" && summary.schedule.scheduledFor
            ? formatScheduledFor(summary.schedule.scheduledFor)
            : `Now · ${summary.option.etaMin} min away`}
        </p>
      </div>

      <SurgeNotice multiplier={surge} />
      <TrafficNotice route={summary.route} />

      {prefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prefs.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-primary/15 px-3 py-1 text-[11px] text-primary"
            >
              {p.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Estimated fare
        </span>
        <span className="font-display text-2xl text-primary">
          {formatCurrency(summary.fare.total, summary.fare.currency)}
        </span>
      </div>
    </GlassCard>
  );
}
