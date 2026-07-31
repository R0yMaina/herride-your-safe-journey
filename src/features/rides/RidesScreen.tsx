import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin, Receipt as ReceiptIcon } from "lucide-react";
import {
  Container,
  EmptyState,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";
import { ridesService } from "@/services/ride";
import { ACTIVE_RIDE_STATUSES, type RideRecord } from "@/types/ride";
import { formatCurrency } from "@/features/ride-request/lib/format";

const STATUS_LABEL: Record<string, string> = {
  requested: "Finding driver",
  matched: "Matched",
  accepted: "Driver assigned",
  arrived: "Driver arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function RideRow({ ride }: { ride: RideRecord }) {
  const where = `${ride.pickup.address ?? "Pickup"} → ${ride.destination.address ?? "Destination"}`;
  // Anything that moved money has an itemised receipt on the trip screen; say
  // so on the row, or she has no reason to think tapping it would show one.
  const hasReceipt = ride.status === "completed" || (ride.cancellationFee ?? 0) > 0;
  const when = new Date(ride.requestedAt).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const fare =
    ride.status === "cancelled"
      ? (ride.cancellationFee ?? 0)
      : (ride.fareFinal ?? ride.fareEstimate ?? 0);
  return (
    <Link to="/trip/$rideId" params={{ rideId: ride.id }}>
      <GlassCard className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-foreground">{where}</p>
          <p className="text-xs text-muted-foreground">
            {when} · {STATUS_LABEL[ride.status] ?? ride.status}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold text-primary">{formatCurrency(fare)}</span>
          {hasReceipt && (
            <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
              <ReceiptIcon className="h-3 w-3" /> Receipt
            </p>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

export function RidesScreen() {
  const { data: rides, isLoading } = useQuery({
    queryKey: ["rides", "mine"],
    queryFn: () => ridesService.listMine(),
  });

  const active = (rides ?? []).filter((r) => ACTIVE_RIDE_STATUSES.includes(r.status));
  const past = (rides ?? []).filter((r) => !ACTIVE_RIDE_STATUSES.includes(r.status));

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your rides"
          subtitle="Every trip, tracked and receipted."
        />

        <Section title="Active">
          {active.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No active rides"
              description="Book a ride from Home to see it here."
            />
          ) : (
            <div className="space-y-3">
              {active.map((r) => (
                <RideRow key={r.id} ride={r} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Past">
          {isLoading ? (
            <GlassCard className="py-4 text-sm text-muted-foreground">Loading…</GlassCard>
          ) : past.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No past rides yet"
              description="Completed and cancelled trips appear here."
            />
          ) : (
            <div className="space-y-3">
              {past.map((r) => (
                <RideRow key={r.id} ride={r} />
              ))}
            </div>
          )}
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
