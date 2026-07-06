import { MapPin } from "lucide-react";
import {
  Container,
  EmptyState,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";

const PLACEHOLDER_RIDES = [
  { id: "r1", where: "Kilimani → Westlands", when: "Yesterday, 8:42 PM", fare: "KES 420" },
  { id: "r2", where: "Home → JKIA", when: "Mon, Jul 1 · 5:10 AM", fare: "KES 1,240" },
] as const;

export function RidesScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your rides"
          subtitle="Every trip, tracked and receipted."
        />

        <Section title="Upcoming">
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No scheduled rides"
            description="Book a ride from Home to see it here."
          />
        </Section>

        <Section title="Past">
          <div className="space-y-3">
            {PLACEHOLDER_RIDES.map((r) => (
              <GlassCard key={r.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate font-display text-base text-foreground">{r.where}</p>
                  <p className="text-xs text-muted-foreground">{r.when}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{r.fare}</span>
              </GlassCard>
            ))}
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}