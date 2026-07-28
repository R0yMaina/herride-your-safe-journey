import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ShieldCheck,
  Bell,
  HelpCircle,
  LogOut,
  BadgeCheck,
  Car,
  Clock,
  Wallet,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { walletService } from "@/services/wallet";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { TrustedContactsSection } from "./components/TrustedContactsSection";

interface Row {
  readonly id: string;
  readonly label: string;
  readonly sub: string;
  readonly Icon: typeof ShieldCheck;
  readonly to: string;
  readonly value?: string;
}

export function ProfileScreen() {
  const { user } = useAuth();
  const fullName =
    [user?.profile.firstName, user?.profile.lastName].filter(Boolean).join(" ") || "Your account";
  const initial = (user?.profile.firstName?.[0] ?? user?.email?.[0] ?? "H").toUpperCase();
  const emailVerified = user?.verification.email === "verified";
  const roleLabel = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Passenger";

  const { data: wallet } = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: () => walletService.getBalance(),
  });

  const account: readonly Row[] = [
    {
      id: "rides",
      label: "Ride history",
      sub: "Your trips, receipts & ratings",
      Icon: Clock,
      to: ROUTES.rides,
    },
    {
      id: "wallet",
      label: "Wallet & payments",
      sub: "Balance, top-ups & payouts",
      Icon: Wallet,
      to: ROUTES.wallet,
      value: wallet ? formatCurrency(wallet.balance, wallet.currency) : undefined,
    },
  ];

  const preferences: readonly Row[] = [
    {
      id: "safety",
      label: "Safety suite",
      sub: "SOS, live trip share & trusted contacts",
      Icon: ShieldCheck,
      to: ROUTES.profile,
      value: "On",
    },
    {
      id: "notifications",
      label: "Notifications",
      sub: "Ride, driver & safety alerts",
      Icon: Bell,
      to: ROUTES.home,
    },
    {
      id: "support",
      label: "Help & support",
      sub: "FAQs, report an issue, contact us",
      Icon: HelpCircle,
      to: ROUTES.profile,
    },
    {
      id: "signout",
      label: "Sign out",
      sub: "Log out of this device",
      Icon: LogOut,
      to: ROUTES.logout,
    },
  ];

  const renderRow = ({ id, label, sub, Icon, to, value }: Row) => (
    <Link key={id} to={to}>
      <GlassCard className="flex items-center gap-4 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{sub}</span>
        </span>
        {value && <span className="shrink-0 text-sm font-semibold text-primary">{value}</span>}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </GlassCard>
    </Link>
  );

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

        <Section title="Account">
          <div className="space-y-2">{account.map(renderRow)}</div>
        </Section>

        <TrustedContactsSection />

        <Section title="Preferences">
          <div className="space-y-2">{preferences.map(renderRow)}</div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
