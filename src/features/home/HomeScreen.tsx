import { ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { ROUTES } from "@/constants/routes";
import { DestinationCard } from "./components/DestinationCard";
import { RideCategoryList } from "./components/RideCategoryList";
import { RECENT_DESTINATIONS } from "./data/placeholders";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

export function HomeScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Good evening"
          title="Where to tonight?"
          subtitle="Verified drivers nearby, ready when you are."
          action={<NotificationBell />}
        />

        <Link
          to={ROUTES.book}
          className="group flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/60 px-4 py-4 shadow-soft backdrop-blur-xl transition-colors hover:border-primary/40"
          aria-label="Book a ride"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/80">Book a ride</p>
            <p className="mt-1 font-display text-base text-foreground">Where to tonight?</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-pink text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>

        <GlassCard className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base text-foreground">Safety Suite is on</p>
            <p className="text-xs text-muted-foreground">
              Live trip share, SOS, and audio guardian ready.
            </p>
          </div>
        </GlassCard>

        <RideCategoryList />

        <Section title="Recent">
          <div className="space-y-3">
            {RECENT_DESTINATIONS.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
