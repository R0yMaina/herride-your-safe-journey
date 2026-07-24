import { ChevronRight, ShieldCheck, Bell, HelpCircle, LogOut, BadgeCheck, Car } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { TrustedContactsSection } from "./components/TrustedContactsSection";

const MENU = [
  { id: "safety", label: "Safety Suite", Icon: ShieldCheck, to: ROUTES.profile },
  { id: "notifications", label: "Notifications", Icon: Bell, to: ROUTES.profile },
  { id: "support", label: "Help & Support", Icon: HelpCircle, to: ROUTES.profile },
  { id: "signout", label: "Sign out", Icon: LogOut, to: ROUTES.logout },
] as const;

export function ProfileScreen() {
  const { user } = useAuth();
  const fullName =
    [user?.profile.firstName, user?.profile.lastName].filter(Boolean).join(" ") || "Your account";
  const initial = (user?.profile.firstName?.[0] ?? user?.email?.[0] ?? "H").toUpperCase();
  const emailVerified = user?.verification.email === "verified";
  const roleLabel = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Passenger";

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Account" title="Profile" />

        <GlassCard className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-pink font-display text-xl text-noir">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-lg text-foreground">
              <span className="truncate">{fullName}</span>
              {emailVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {emailVerified ? "Verified" : "Unverified"} {roleLabel.toLowerCase()}
              {user?.phone ? ` · ${user.phone}` : ""}
            </p>
            {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </GlassCard>

        {user?.role === "driver" && (
          <Section title="Driver">
            <Link to={ROUTES.driver}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <span className="flex-1 font-display text-base text-foreground">
                  Driver dashboard
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </GlassCard>
            </Link>
          </Section>
        )}

        <TrustedContactsSection />

        <Section title="Preferences">
          <div className="space-y-2">
            {MENU.map(({ id, label, Icon, to }) => (
              <Link key={id} to={to}>
                <GlassCard className="flex items-center gap-4 py-4">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 font-display text-base text-foreground">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </GlassCard>
              </Link>
            ))}
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
