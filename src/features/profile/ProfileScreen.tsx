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
  Palette,
  Languages,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import {
  Container,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
  ThemeToggle,
  LanguageToggle,
} from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { walletService } from "@/services/wallet";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { TrustedContactsSection } from "./components/TrustedContactsSection";
import { InviteEarnCard } from "./components/InviteEarnCard";
import { DeleteAccountCard } from "./components/DeleteAccountCard";
import { pushEnabled, requestPushPermission } from "@/features/notifications/lib/push";
import { riderVerificationService } from "@/services/rider-verification";
import { VERIFICATION_KEY } from "@/features/verification/VerifyIdentityScreen";

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
  const { t } = useT();
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

  const { data: verification } = useQuery({
    queryKey: VERIFICATION_KEY,
    queryFn: () => riderVerificationService.getState(),
  });

  const account: readonly Row[] = [
    {
      id: "verify",
      label: t("profile.identityVerification"),
      sub: verification?.isVerified
        ? t("profile.identityVerified")
        : verification?.status === "pending"
          ? t("profile.identityPending")
          : t("profile.identityUnverified"),
      Icon: BadgeCheck,
      to: ROUTES.verifyIdentity,
      value: verification?.isVerified
        ? "Verified"
        : verification?.status === "pending"
          ? "Pending"
          : undefined,
    },
    {
      id: "rides",
      label: t("profile.rideHistory"),
      sub: t("profile.rideHistorySub"),
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
            label: t("profile.becomeDriver"),
            sub: t("profile.becomeDriverSub"),
            Icon: Car,
            to: ROUTES.driverApply,
          },
        ] as const)),
    {
      id: "wallet",
      label: t("profile.walletPayments"),
      sub: t("profile.walletPaymentsSub"),
      Icon: Wallet,
      to: ROUTES.wallet,
      value: wallet ? formatCurrency(wallet.balance, wallet.currency) : undefined,
    },
  ];

  const preferences: readonly Row[] = [
    {
      id: "safety",
      label: t("profile.safetySuite"),
      sub: t("profile.safetySuiteSub"),
      Icon: ShieldCheck,
      to: ROUTES.safety,
      value: "On",
    },
    {
      id: "notifications",
      label: t("profile.notifications"),
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
      label: t("profile.helpSupport"),
      sub: t("profile.helpSupportSub"),
      Icon: HelpCircle,
      to: ROUTES.support,
    },
    {
      id: "privacy",
      label: t("profile.privacy"),
      sub: t("profile.privacySub"),
      Icon: ShieldCheck,
      to: ROUTES.privacy,
    },
    {
      id: "signout",
      label: t("profile.signOut"),
      sub: t("profile.signOutSub"),
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
                  id: "admin-console",
                  label: "Admin console",
                  sub: "Platform overview, verification & finance",
                  Icon: ShieldCheck,
                  to: ROUTES.admin,
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

        <Section title={t("profile.preferences")}>
          <div className="space-y-2">
            {/* Appearance is a switch, not a destination — rendered inline. */}
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base text-foreground">Appearance</span>
                <span className="block text-xs text-muted-foreground">
                  Switch between light and dark
                </span>
              </span>
              <ThemeToggle />
            </GlassCard>
            {/* Language is a switch too, and it sits above the rest of the
                preferences: a rider who cannot read this screen needs to reach
                it before anything else on it. */}
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Languages className="h-5 w-5" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base text-foreground">
                  {t("profile.language")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("profile.languageSub")}
                </span>
              </span>
              <LanguageToggle />
            </GlassCard>
            {preferences.map(renderRow)}
          </div>
        </Section>

        <Section title="Your data">
          <DeleteAccountCard />
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
