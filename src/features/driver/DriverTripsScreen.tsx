import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Container,
  EmptyState,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";
import { ridesService } from "@/services/ride";
import { useAuth } from "@/hooks/useAuth";
import type { RideRecord } from "@/types/ride";
import { formatCurrency } from "@/features/ride-request/lib/format";

/**
 * The driver's Trips tab — her completed and cancelled jobs. listMine() is
 * RLS-scoped to rides she drove, so no extra query surface is needed; the
 * fare shown is what the rider paid (her share is 90% of it, per Earnings).
 */
export function DriverTripsScreen() {
  const { user } = useAuth();
  const { data: rides, isLoading } = useQuery({
    queryKey: ["driver", "trips"],
    queryFn: () => ridesService.listMine(),
  });

  const mine = (rides ?? []).filter(
    (r) => r.driverId === user?.id && ["completed", "cancelled"].includes(r.status),
  );

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="History" title="Your trips" />
        {isLoading ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : mine.length === 0 ? (
          <EmptyState
            title="No trips yet"
            description="Go online from the Drive tab — your completed trips will appear here."
          />
        ) : (
          <Section title={`${mine.length} ${mine.length === 1 ? "trip" : "trips"}`}>
            <div className="space-y-2">
              {mine.map((ride) => (
                <TripRow key={ride.id} ride={ride} />
              ))}
            </div>
          </Section>
        )}
      </Container>
    </ScreenWrapper>
  );
}

function TripRow({ ride }: { readonly ride: RideRecord }) {
  const completed = ride.status === "completed";
  const when = new Date(ride.completedAt ?? ride.requestedAt).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <GlassCard className="flex items-center gap-3">
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${
          completed ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground"
        }`}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {ride.pickup.address ?? "Pickup"} → {ride.destination.address ?? "Destination"}
        </p>
        <p className="text-xs text-muted-foreground">
          {when} · {completed ? "Completed" : "Cancelled"}
        </p>
      </div>
      {completed && (
        <span className="shrink-0 text-sm font-semibold text-primary">
          {formatCurrency(ride.fareFinal ?? ride.fareEstimate ?? 0)}
        </span>
      )}
    </GlassCard>
  );
}
