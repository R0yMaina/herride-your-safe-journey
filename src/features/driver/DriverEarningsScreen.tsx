import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Coins, Receipt, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { driverEarningsService } from "@/services/driver-earnings";
import { payoutService } from "@/services/payouts";
import { formatCurrency } from "@/features/ride-request/lib/format";

const EARNINGS_KEY = ["driver", "earnings"] as const;
const PAYOUT_KEY = ["driver", "payout-summary"] as const;

/**
 * The driver's Earnings tab: today / this week / lifetime, trips driven,
 * tips, the commission she paid (shown openly — trust is the product), and
 * a one-tap payout request against her withdrawable balance.
 */
export function DriverEarningsScreen() {
  const queryClient = useQueryClient();
  const { data: earnings } = useQuery({
    queryKey: EARNINGS_KEY,
    queryFn: () => driverEarningsService.getEarnings(),
  });
  const { data: payout } = useQuery({
    queryKey: PAYOUT_KEY,
    queryFn: () => payoutService.getSummary(),
  });
  const [requesting, setRequesting] = useState(false);

  const currency = earnings?.currency ?? "KES";

  const requestPayout = async () => {
    if (!payout || payout.available <= 0 || requesting) return;
    setRequesting(true);
    try {
      await payoutService.requestPayout(payout.available);
      toast.success("Payout requested — funds are on their way to M-Pesa");
      await queryClient.invalidateQueries({ queryKey: PAYOUT_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not request payout");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Earnings" title="Your money" />

        <GlassCard className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
          <p className="font-display text-4xl text-foreground">
            {formatCurrency(earnings?.today ?? 0, currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {earnings?.tripsToday ?? 0} {earnings?.tripsToday === 1 ? "trip" : "trips"} completed
          </p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="space-y-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="font-display text-xl text-foreground">
              {formatCurrency(earnings?.week ?? 0, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">{earnings?.tripsWeek ?? 0} trips</p>
          </GlassCard>
          <GlassCard className="space-y-1">
            <Coins className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Tips this week</p>
            <p className="font-display text-xl text-foreground">
              {formatCurrency(earnings?.tipsWeek ?? 0, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">100% yours</p>
          </GlassCard>
        </div>

        <Section title="Payout">
          <GlassCard className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Available now
                </p>
                <p className="font-display text-2xl text-primary">
                  {formatCurrency(payout?.available ?? 0, payout?.currency ?? currency)}
                </p>
              </div>
              {(payout?.pending ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(payout?.pending ?? 0, payout?.currency ?? currency)} in transit
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestPayout}
              disabled={requesting || (payout?.available ?? 0) <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir disabled:opacity-60"
            >
              <Banknote className="h-4 w-4" />
              {requesting ? "Requesting…" : "Cash out to M-Pesa"}
            </button>
          </GlassCard>
        </Section>

        <Section title="Lifetime">
          <GlassCard className="space-y-3">
            <Row label="Total earned" value={formatCurrency(earnings?.lifetime ?? 0, currency)} />
            <Row label="Trips completed" value={String(earnings?.tripsLifetime ?? 0)} />
            <Row
              label="HeRide fee this week (10%)"
              value={formatCurrency(earnings?.commissionWeek ?? 0, currency)}
              muted
            />
          </GlassCard>
          <p className="px-1 pt-2 text-[11px] text-muted-foreground">
            <Receipt className="mr-1 inline h-3 w-3" />
            You keep 90% of every fare, plus every shilling of your tips.
          </p>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  readonly label: string;
  readonly value: string;
  readonly muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
