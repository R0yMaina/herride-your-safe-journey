import { CreditCard, Plus } from "lucide-react";
import {
  Container,
  EmptyState,
  GlassCard,
  IconButton,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";

export function WalletScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Balance"
          title="Wallet"
          subtitle="Manage cards, promos, and ride credits."
          action={
            <IconButton aria-label="Add payment method">
              <Plus className="h-5 w-5" />
            </IconButton>
          }
        />

        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-glow/30 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.28em] text-primary/70">Available</p>
          <p className="mt-2 font-display text-4xl text-foreground">KES 4,820<span className="text-lg text-muted-foreground">.00</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Includes KES 500 promo credit</p>
        </GlassCard>

        <Section title="Payment methods">
          <GlassCard className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base text-foreground">Visa •• 4421</p>
              <p className="text-xs text-muted-foreground">Expires 08/29 · Default</p>
            </div>
          </GlassCard>
        </Section>

        <Section title="Recent activity">
          <EmptyState
            title="No activity yet"
            description="Your ride receipts and top-ups will appear here."
          />
        </Section>
      </Container>
    </ScreenWrapper>
  );
}