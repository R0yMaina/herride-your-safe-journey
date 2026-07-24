import { useQuery } from "@tanstack/react-query";
import { BarChart3, Wallet, TrendingUp, RotateCcw } from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { financeService, type FinancialSummary } from "@/services/finance";
import { formatCurrency } from "@/features/ride-request/lib/format";

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <GlassCard className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
      <p className="font-display text-2xl text-foreground tabular-nums">{stat.value}</p>
      {stat.hint && <p className="text-xs text-muted-foreground">{stat.hint}</p>}
    </GlassCard>
  );
}

function toStats(s: FinancialSummary): readonly Stat[] {
  const money = (n: number) => formatCurrency(n, s.currency);
  return [
    {
      label: "Gross revenue",
      value: money(s.grossRevenue),
      hint: `${s.completedRides} completed rides`,
    },
    { label: "Commission", value: money(s.commissionRevenue), hint: "Platform earnings" },
    { label: "Driver earnings", value: money(s.driverEarnings), hint: "Paid to drivers" },
    { label: "Average fare", value: money(s.averageFare) },
    { label: "Payouts paid", value: money(s.payoutsPaid) },
    { label: "Payouts pending", value: money(s.payoutsPending) },
    { label: "Refunds", value: money(s.refunds) },
  ];
}

export function AdminFinanceScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "finance-summary"],
    queryFn: () => financeService.getSummary(30),
  });

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Admin · Finance" title="Financial overview" />

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5" /> Last 30 days
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1">
            <BarChart3 className="h-3.5 w-3.5" /> Live ledger
          </span>
        </div>

        {isLoading && (
          <GlassCard className="py-8 text-center text-sm text-muted-foreground">
            Loading financials…
          </GlassCard>
        )}
        {error && (
          <GlassCard className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load financials"}
          </GlassCard>
        )}

        {data && (
          <>
            <Section title="Revenue">
              <div className="grid grid-cols-2 gap-3">
                {toStats(data)
                  .slice(0, 4)
                  .map((s) => (
                    <StatCard key={s.label} stat={s} />
                  ))}
              </div>
            </Section>

            <Section title="Payouts & refunds">
              <div className="grid grid-cols-2 gap-3">
                {toStats(data)
                  .slice(4)
                  .map((s) => (
                    <StatCard key={s.label} stat={s} />
                  ))}
              </div>
            </Section>

            <GlassCard className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Figures come from the immutable platform ledger and payouts table via the admin-only{" "}
                <code className="text-rose-300">get_financial_summary</code> function. Refunds are
                issued through <code className="text-rose-300">refund_ride</code>.
              </p>
            </GlassCard>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Reconciled against completed rides
            </div>
          </>
        )}
      </Container>
    </ScreenWrapper>
  );
}
