import { ChevronRight, ShieldCheck, Bell, HelpCircle, LogOut } from "lucide-react";
import {
  Container,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";

const MENU = [
  { id: "safety", label: "Safety Suite", Icon: ShieldCheck },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "support", label: "Help & Support", Icon: HelpCircle },
  { id: "signout", label: "Sign out", Icon: LogOut },
] as const;

export function ProfileScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Account" title="Profile" />

        <GlassCard className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-pink font-display text-xl text-noir">
            A
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg text-foreground">Amara Njeri</p>
            <p className="text-xs text-muted-foreground">Verified passenger · Nairobi</p>
          </div>
        </GlassCard>

        <Section title="Preferences">
          <div className="space-y-2">
            {MENU.map(({ id, label, Icon }) => (
              <GlassCard key={id} className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex-1 font-display text-base text-foreground">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </GlassCard>
            ))}
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}