import { ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Container,
  EmptyState,
  GlassCard,
  IconButton,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";
import { walletService, type WalletTransaction } from "@/services/wallet";
import { payoutService } from "@/services/payouts";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency } from "@/features/ride-request/lib/format";

const TYPE_LABEL: Record<string, string> = {
  ride_payment: "Ride payment",
  ride_payout: "Ride payout",
  topup: "Top-up",
  refund: "Refund",
  commission: "Commission",
  withdrawal: "Payout",
  adjustment: "Adjustment",
};

function DriverPayoutPanel() {
  const queryClient = useQueryClient();
  const { data: summary } = useQuery({
    queryKey: ["payouts", "summary"],
    queryFn: () => payoutService.getSummary(),
  });
  const cashOut = useMutation({
    mutationFn: () => payoutService.requestPayout(summary?.available ?? 0, "mpesa"),
    onSuccess: () => {
      toast.success("Payout requested");
      void queryClient.invalidateQueries({ queryKey: ["payouts"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Payout failed"),
  });
  const available = summary?.available ?? 0;
  return (
    <Section title="Driver payouts">
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available</p>
            <p className="font-display text-xl text-foreground">{formatCurrency(available)}</p>
          </div>
          {(summary?.pending ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary?.pending ?? 0)} pending
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => cashOut.mutate()}
          disabled={cashOut.isPending || available <= 0}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-pink px-4 py-2 text-sm font-semibold text-noir disabled:opacity-50"
        >
          <ArrowUpRight className="h-4 w-4" />
          {cashOut.isPending ? "Requesting…" : "Cash out to M-Pesa"}
        </button>
      </GlassCard>
    </Section>
  );
}

function TxRow({ tx }: { tx: WalletTransaction }) {
  const credit = tx.amount >= 0;
  const when = new Date(tx.createdAt).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <GlassCard className="flex items-center gap-4">
      <div
        className={`grid h-10 w-10 place-items-center rounded-2xl ${
          credit ? "bg-primary/15 text-primary" : "bg-card/60 text-muted-foreground"
        }`}
      >
        {credit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base text-foreground">
          {tx.description ?? TYPE_LABEL[tx.type] ?? tx.type}
        </p>
        <p className="text-xs text-muted-foreground">{when}</p>
      </div>
      <span className={`text-sm font-semibold ${credit ? "text-primary" : "text-foreground"}`}>
        {credit ? "+" : "−"}
        {formatCurrency(Math.abs(tx.amount))}
      </span>
    </GlassCard>
  );
}

export function WalletScreen() {
  const queryClient = useQueryClient();
  const isDriver = useAuthStore((s) => s.hasRole("driver"));
  const { data: wallet } = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: () => walletService.getBalance(),
  });
  const { data: txns, isLoading } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => walletService.listTransactions(),
  });

  const topUp = useMutation({
    mutationFn: () => walletService.topUp(1000),
    onSuccess: () => {
      toast.success("Added KES 1,000");
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Top-up failed"),
  });

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Balance"
          title="Wallet"
          subtitle="Ride credits and payouts."
          action={
            <IconButton aria-label="Top up" onClick={() => topUp.mutate()}>
              <Plus className="h-5 w-5" />
            </IconButton>
          }
        />

        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-glow/30 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.28em] text-primary/70">Available</p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {formatCurrency(wallet?.balance ?? 0)}
          </p>
          <button
            type="button"
            onClick={() => topUp.mutate()}
            disabled={topUp.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-pink px-4 py-2 text-sm font-semibold text-noir disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> {topUp.isPending ? "Adding…" : "Add KES 1,000"}
          </button>
        </GlassCard>

        {isDriver && <DriverPayoutPanel />}

        <Section title="Recent activity">
          {isLoading ? (
            <GlassCard className="py-4 text-sm text-muted-foreground">Loading…</GlassCard>
          ) : (txns?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<WalletIcon className="h-6 w-6" />}
              title="No activity yet"
              description="Ride receipts and top-ups will appear here."
            />
          ) : (
            <div className="space-y-3">
              {txns?.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
