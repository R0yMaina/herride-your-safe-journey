import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { InviteEarnCard } from "./components/InviteEarnCard";
import { pushEnabled, requestPushPermission } from "@/features/notifications/lib/push";

interface Row {
  readonly id: string;
  readonly label: string;
  readonly sub: string;
  readonly Icon: typeof ShieldCheck;
  /** Destination route — or use onClick for action rows. */
  readonly to?: string;
  readonly onClick?: () => void;
  readonly value?: string;
}

export function ProfileScreen() {
  const { user } = useAuth();
  // Read after mount only — Notification API is browser-only (SSR-safe).
  const [pushOn, setPushOn] = useState(false);
  useEffect(() => {
    setPushOn(pushEnabled());
  }, []);
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
    // Passengers see the door to the driver side; verified drivers get the
    // dashboard link in the Driver section instead.
    ...(user?.role === "driver" || user?.role === "admin"
      ? []
      : ([
          {
            id: "become-driver",
            label: "Become a driver",
            sub: "Verified women only — earn on your terms",
            Icon: Car,
            to: ROUTES.driverApply,
          },
        ] as const)),
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
      sub: pushOn
        ? "Device alerts on for ride, driver & safety updates"
        : "Tap to enable alerts on this device",
      Icon: Bell,
      onClick: () => {
        void requestPushPermission().then((permission) => {
          setPushOn(permission === "granted");
          if (permission === "granted") toast.success("Device notifications enabled");
          else if (permission === "denied")
            toast.error("Notifications are blocked in your browser settings");
        });
      },
      value: pushOn ? "On" : undefined,
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

  const renderRow = ({ id, label, sub, Icon, to, onClick, value }: Row) => {
    const card = (
      <GlassCard className="flex items-center gap-4 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate font-display text-base text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{sub}</span>
        </span>
        {value && <span className="shrink-0 text-sm font-semibold text-primary">{value}</span>}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </GlassCard>
    );
    return to ? (
      <Link key={id} to={to}>
        {card}
      </Link>
    ) : (
      <button key={id} type="button" onClick={onClick} className="block w-full">
        {card}
      </button>
    );
  };

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
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Switch to driving
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Go online and take trips
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </GlassCard>
            </Link>
          </Section>
        )}

        {user?.role === "admin" && (
          <Section title="Admin">
            <div className="space-y-2">
              {[
                {
                  id: "admin-drivers",
                  label: "Driver verification",
                  sub: "Review and approve applications",
                  Icon: ShieldCheck,
                  to: ROUTES.adminDrivers,
                },
                {
                  id: "admin-finance",
                  label: "Finance",
                  sub: "Revenue, commission & payouts",
                  Icon: Wallet,
                  to: ROUTES.adminFinance,
                },
              ].map(renderRow)}
            </div>
          </Section>
        )}

        <Section title="Account">
          <div className="space-y-2">{account.map(renderRow)}</div>
        </Section>

        <TrustedContactsSection />

        <InviteEarnCard />

        <Section title="Preferences">
          <div className="space-y-2">{preferences.map(renderRow)}</div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
