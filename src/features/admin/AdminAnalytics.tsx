import { useQuery } from "@tanstack/react-query";
import { GlassCard, Section } from "@/components/common";
import { analyticsService } from "@/services/analytics";
import type { ReportRow } from "@/services/analytics";
import { formatCurrency } from "@/features/ride-request/lib/format";

function RevenueTrend({ rows }: { rows: readonly ReportRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.grossRevenue));
  return (
    <GlassCard className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Gross revenue · daily
      </p>
      <div className="flex h-28 items-end gap-1.5">
        {rows.map((r) => (
          <div key={r.period} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-pink"
              style={{ height: `${Math.max(4, (r.grossRevenue / max) * 100)}%` }}
              title={`${new Date(r.period).toLocaleDateString()} · ${formatCurrency(r.grossRevenue)}`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {rows.length ? `${rows.length} days` : "No completed rides yet"}
      </p>
    </GlassCard>
  );
}

function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: readonly { key: string; name: string; sub: string; value: string }[];
}) {
  return (
    <GlassCard className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data yet</p>
      ) : (
        rows.map((r, i) => (
          <div key={r.key} className="flex items-center gap-3 text-sm">
            <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-foreground">{r.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>
            </span>
            <span className="font-semibold text-primary tabular-nums">{r.value}</span>
          </div>
        ))
      )}
    </GlassCard>
  );
}

/** Revenue trend + top drivers/customers, all admin-gated aggregates. */
export function AdminAnalytics() {
  const report = useQuery({
    queryKey: ["admin", "report", "day"],
    queryFn: () => analyticsService.getReport("day", 14),
  });
  const drivers = useQuery({
    queryKey: ["admin", "top-drivers"],
    queryFn: () => analyticsService.getTopDrivers(30, 5),
  });
  const customers = useQuery({
    queryKey: ["admin", "top-customers"],
    queryFn: () => analyticsService.getTopCustomers(30, 5),
  });

  return (
    <Section title="Analytics">
      <div className="space-y-3">
        <RevenueTrend rows={report.data ?? []} />
        <Leaderboard
          title="Top drivers · earnings"
          rows={(drivers.data ?? []).map((d) => ({
            key: d.driverId,
            name: d.name ?? "Driver",
            sub: `${d.rides} rides`,
            value: formatCurrency(d.earnings),
          }))}
        />
        <Leaderboard
          title="Top customers · spend"
          rows={(customers.data ?? []).map((c) => ({
            key: c.passengerId,
            name: c.name ?? "Passenger",
            sub: `${c.rides} rides`,
            value: formatCurrency(c.spend),
          }))}
        />
      </div>
    </Section>
  );
}
