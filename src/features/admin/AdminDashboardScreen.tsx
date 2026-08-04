import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BadgeCheck,
  ChevronRight,
  CircleDot,
  ShieldAlert,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { adminOverviewService, type AdminOverview } from "@/services/admin-overview";
import { adminDriversService } from "@/services/admin-drivers";
import { CHECK_QUEUE_KEY } from "./components/DriverCheckQueue";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { ROUTES } from "@/constants/routes";

/**
 * Admin console home: the live health of HeRide in one screen — the
 * verification queue, who's driving right now, today's money, and any open
 * safety incidents — with a jump into each area. Everything comes from
 * `admin_overview`, which is itself gated on the admin role server-side.
 */
export function AdminDashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminOverviewService.getOverview(),
    refetchInterval: 30_000, // operators watch this screen; keep it fresh
  });

  const firstName = user?.profile.firstName ?? "there";

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Admin console" title={`Welcome, ${firstName}`} />

        {isLoading || !data ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">Loading platform…</p>
        ) : (
          <>
            {/* Anything needing a human right now surfaces first. */}
            <AttentionRow overview={data} />

            <Section title="Today">
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  Icon={Activity}
                  label="Trips today"
                  value={String(data.ridesToday)}
                  hint={`${data.completedToday} completed · ${data.cancelledToday} cancelled`}
                />
                <Stat
                  Icon={Wallet}
                  label="Gross today"
                  value={formatCurrency(data.grossToday, data.currency)}
                  hint={`${formatCurrency(data.commissionToday, data.currency)} commission`}
                />
                <Stat
                  Icon={CircleDot}
                  label="Trips in progress"
                  value={String(data.activeRides)}
                  hint="Live right now"
                />
                <Stat
                  Icon={Users}
                  label="Drivers online"
                  value={String(data.driversOnline)}
                  hint="Available in the last 10 min"
                />
              </div>
            </Section>

            <Section title="Network">
              <div className="grid grid-cols-3 gap-3">
                <Stat Icon={BadgeCheck} label="Verified" value={String(data.verifiedDrivers)} />
                <Stat Icon={Users} label="Riders" value={String(data.passengersTotal)} />
                <Stat
                  Icon={TriangleAlert}
                  label="Suspended"
                  value={String(data.suspendedDrivers)}
                />
              </div>
            </Section>

            <Section title="Manage">
              <div className="space-y-2">
                <NavCard
                  to={ROUTES.adminDrivers}
                  Icon={BadgeCheck}
                  label="Driver verification"
                  sub={
                    data.pendingDrivers > 0
                      ? `${data.pendingDrivers} waiting for review`
                      : "No applications waiting"
                  }
                  badge={data.pendingDrivers > 0 ? String(data.pendingDrivers) : undefined}
                />
                <NavCard
                  to={ROUTES.adminFinance}
                  Icon={Wallet}
                  label="Finance"
                  sub="Revenue, commission, payouts & audit log"
                />
              </div>
            </Section>
          </>
        )}
      </Container>
    </ScreenWrapper>
  );
}

/** Red-flag banners: open SOS first, then the verification backlog. */
function AttentionRow({ overview }: { readonly overview: AdminOverview }) {
  // Read separately from the overview RPC: the re-check queue postdates it,
  // and a count is not worth widening admin_overview and re-running SQL for.
  const { data: checks } = useQuery({
    queryKey: CHECK_QUEUE_KEY,
    queryFn: () => adminDriversService.listPendingChecks(),
  });
  const pendingChecks = checks?.length ?? 0;

  const items: { key: string; text: string; urgent: boolean; to: string }[] = [];
  if (overview.openSos > 0) {
    items.push({
      key: "sos",
      text: `${overview.openSos} active SOS ${overview.openSos === 1 ? "alert" : "alerts"} — respond now`,
      urgent: true,
      to: ROUTES.adminDrivers,
    });
  }
  if (overview.openFraudSignals > 0) {
    items.push({
      key: "fraud",
      text: `${overview.openFraudSignals} fraud ${overview.openFraudSignals === 1 ? "signal" : "signals"} in the last 7 days`,
      urgent: false,
      to: ROUTES.adminFinance,
    });
  }
  if (pendingChecks > 0) {
    // Urgent: unlike an application, this is a driver who already works here
    // and cannot earn until someone looks. The phase 19 gate keeps her both
    // offline and unmatchable, so this queue is her only way back.
    items.push({
      key: "rechecks",
      text: `${pendingChecks} identity re-${pendingChecks === 1 ? "check" : "checks"} waiting — drivers are locked out until cleared`,
      urgent: true,
      to: ROUTES.adminDrivers,
    });
  }
  if (overview.pendingDrivers > 0) {
    items.push({
      key: "queue",
      text: `${overview.pendingDrivers} driver ${overview.pendingDrivers === 1 ? "application" : "applications"} to verify`,
      urgent: false,
      to: ROUTES.adminDrivers,
    });
  }
  if (items.length === 0) {
    return (
      <GlassCard className="flex items-center gap-3">
        <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          All clear — no open incidents and nothing waiting for review.
        </p>
      </GlassCard>
    );
  }
  return (
    <div className="space-y-2">
      {items.map(({ key, text, urgent, to }) => (
        <Link key={key} to={to}>
          <GlassCard className={`flex items-center gap-3 ${urgent ? "border-destructive/50" : ""}`}>
            <ShieldAlert
              className={`h-5 w-5 shrink-0 ${urgent ? "text-destructive" : "text-primary"}`}
            />
            <p
              className={`flex-1 text-sm ${urgent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {text}
            </p>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  hint,
}: {
  readonly Icon: typeof Activity;
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <GlassCard className="space-y-1">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="font-display text-xl tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </GlassCard>
  );
}

function NavCard({
  to,
  Icon,
  label,
  sub,
  badge,
}: {
  readonly to: string;
  readonly Icon: typeof Activity;
  readonly label: string;
  readonly sub: string;
  readonly badge?: string;
}) {
  return (
    <Link to={to}>
      <GlassCard className="flex items-center gap-4 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{sub}</span>
        </span>
        {badge && (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            {badge}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </GlassCard>
    </Link>
  );
}
