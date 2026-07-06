import { Bell, ShieldCheck } from "lucide-react";
import {
  Container,
  GlassCard,
  IconButton,
  PageHeader,
  ScreenWrapper,
  SearchBar,
  Section,
} from "@/components/common";
import { DestinationCard } from "./components/DestinationCard";
import { RideCategoryList } from "./components/RideCategoryList";
import { RECENT_DESTINATIONS } from "./data/placeholders";

export function HomeScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Good evening"
          title="Where to tonight?"
          subtitle="Verified drivers nearby, ready when you are."
          action={
            <IconButton aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </IconButton>
          }
        />

        <SearchBar aria-label="Search destinations" />

        <GlassCard className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base text-foreground">Safety Suite is on</p>
            <p className="text-xs text-muted-foreground">Live trip share, SOS, and audio guardian ready.</p>
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