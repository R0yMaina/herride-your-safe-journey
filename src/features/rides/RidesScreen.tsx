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
import { useT, type TranslationKey } from "@/i18n";
import { ACTIVE_RIDE_STATUSES, type RideRecord } from "@/types/ride";
import { formatCurrency } from "@/features/ride-request/lib/format";

function RideRow({ ride }: { ride: RideRecord }) {
  const { t, language } = useT();
  const where = `${ride.pickup.address ?? "Pickup"} → ${ride.destination.address ?? "Destination"}`;
  // Anything that moved money has an itemised receipt on the trip screen; say
  // so on the row, or she has no reason to think tapping it would show one.
  const hasReceipt = ride.status === "completed" || (ride.cancellationFee ?? 0) > 0;
  const when = new Date(ride.requestedAt).toLocaleString(language === "sw" ? "sw-KE" : "en-KE", {
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
            {when} · {t(`trip.status.${ride.status}` as TranslationKey)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold text-primary">{formatCurrency(fare)}</span>
          {hasReceipt && (
            <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
              <ReceiptIcon className="h-3 w-3" /> {t("rides.receipt")}
            </p>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

export function RidesScreen() {
  const { t } = useT();
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
          eyebrow={t("rides.eyebrow")}
          title={t("rides.title")}
          subtitle={t("rides.subtitle")}
        />

        <Section title={t("rides.active")}>
          {active.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title={t("rides.noActive")}
              description={t("rides.noActiveHelp")}
            />
          ) : (
            <div className="space-y-3">
              {active.map((r) => (
                <RideRow key={r.id} ride={r} />
              ))}
            </div>
          )}
        </Section>

        <Section title={t("rides.past")}>
          {isLoading ? (
            <GlassCard className="py-4 text-sm text-muted-foreground">
              {t("common.loading")}
            </GlassCard>
          ) : past.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title={t("rides.noPast")}
              description={t("rides.noPastHelp")}
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
