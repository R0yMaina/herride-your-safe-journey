import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Car, ChevronRight, LogOut, ShieldCheck, Star, Users } from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { driverOnboardingService } from "@/services/driver-onboarding";
import { driverEarningsService } from "@/services/driver-earnings";
import { driverService } from "@/services/driver";
import { ROUTES } from "@/constants/routes";

/**
 * The driver's own profile: verification badge, vehicle, lifetime stats, and
 * the way back to the rider app (one account, both sides of the marketplace).
 */
export function DriverProfileScreen() {
  const { user } = useAuth();
  const { data: application } = useQuery({
    queryKey: ["driver-application"],
    queryFn: () => driverOnboardingService.getMyApplication(),
  });
  const { data: earnings } = useQuery({
    queryKey: ["driver", "earnings"],
    queryFn: () => driverEarningsService.getEarnings(),
  });
  // Her own public card — the same rating riders see before they get in.
  const { data: publicDriver } = useQuery({
    queryKey: ["driver", "public", user?.id],
    queryFn: () => driverService.getPublicDriver(user!.id),
    enabled: Boolean(user?.id),
  });

  const fullName =
    [user?.profile.firstName, user?.profile.lastName].filter(Boolean).join(" ") || "Your account";
  const initial = (user?.profile.firstName?.[0] ?? user?.email?.[0] ?? "H").toUpperCase();
  const verified = application?.status === "verified";

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Driver" title="Profile" />

        <GlassCard className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-pink font-display text-xl text-noir">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-lg text-foreground">
              <span className="truncate">{fullName}</span>
              {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {verified ? "Verified HeRide driver" : "Verification pending"}
              {user?.phone ? ` · ${user.phone}` : ""}
            </p>
          </div>
        </GlassCard>

        {verified && (
          <GlassCard className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Your identity and licence were verified by our team. Riders see this badge before they
              get in.
            </p>
          </GlassCard>
        )}

        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="space-y-1">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Trips driven</p>
            <p className="font-display text-xl text-foreground">{earnings?.tripsLifetime ?? 0}</p>
          </GlassCard>
          <GlassCard className="space-y-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <p className="text-xs text-muted-foreground">Your rating</p>
            <p className="font-display text-xl text-foreground">
              {publicDriver ? publicDriver.rating.toFixed(1) : "—"}
            </p>
          </GlassCard>
        </div>

        {application && (
          <Section title="Your vehicle">
            <GlassCard className="flex items-center gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Car className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base text-foreground">
                  {application.vehicleMake} {application.vehicleModel}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[application.vehicleColor, application.vehicleYear].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {application.vehiclePlate}
              </span>
            </GlassCard>
          </Section>
        )}

        <Section title="Account">
          <div className="space-y-2">
            <Link to={ROUTES.home}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Switch to riding
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Book a HeRide with the same account
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </GlassCard>
            </Link>
            <Link to={ROUTES.logout}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">Sign out</span>
                  <span className="block text-xs text-muted-foreground">
                    Log out of this device
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </GlassCard>
            </Link>
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
