import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, Search, Share2, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/ride";
import type { ActivePromo } from "@/services/promos";
import { SavedPlaceShortcuts } from "./SavedPlaceShortcuts";
import { PromoBanner } from "./PromoBanner";

interface HomeSheetProps {
  readonly greeting: string;
  readonly firstName: string | null;
  readonly balance: number | null;
  readonly currency: string;
  readonly savedPlaces: readonly Place[];
  readonly promo: ActivePromo | null;
  /** Id of a ride still in flight, if any — enables the live-trip actions. */
  readonly activeRideId: string | null;
}

const ACTION_CLASS =
  "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-3 text-xs font-medium text-foreground transition-colors";
const ACTION_ENABLED = "hover:border-primary/40 hover:bg-card";

function ActionBody({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      {icon}
      {label}
    </>
  );
}

/**
 * The sheet that sits over the home map: who you are, what you have, and the
 * one thing this screen is for — saying where you're going.
 */
export function HomeSheet({
  greeting,
  firstName,
  balance,
  currency,
  savedPlaces,
  promo,
  activeRideId,
}: HomeSheetProps) {
  return (
    /* pb-28 clears the floating bottom nav, which is fixed over this sheet. */
    <div className="rounded-t-[2rem] border-t border-border/60 bg-card/95 px-5 pb-28 pt-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
            Where to next?
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Wallet</p>
          <p className="mt-1 font-display text-lg text-primary">
            {balance === null ? "—" : formatCurrency(balance, currency)}
          </p>
        </div>
      </div>

      {/* Goes straight into the destination picker rather than just landing on
          the booking step, so tapping a field that says "search" lets her
          type immediately. */}
      <Link
        to={ROUTES.book}
        search={{ focus: "destination" }}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3.5 transition-colors hover:border-primary/40"
        aria-label="Search destination"
      >
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 text-sm text-muted-foreground">Search destination</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      <SavedPlaceShortcuts places={savedPlaces} className="mt-4" />

      {promo ? <PromoBanner promo={promo} className="mt-4" /> : null}

      <div className="mt-4 flex gap-2">
        <Link to={ROUTES.book} className={cn(ACTION_CLASS, ACTION_ENABLED)}>
          <ActionBody icon={<CalendarClock className="h-4 w-4 text-primary" />} label="Schedule" />
        </Link>

        {/* Trip sharing needs a trip. Rather than route to a dead end, the
            action states why it's unavailable until one is under way. */}
        {activeRideId ? (
          <Link
            to="/trip/$rideId"
            params={{ rideId: activeRideId }}
            className={cn(ACTION_CLASS, ACTION_ENABLED)}
            title="Share your live trip"
          >
            <ActionBody icon={<Share2 className="h-4 w-4 text-primary" />} label="HerShare" />
          </Link>
        ) : (
          <span
            className={cn(ACTION_CLASS, "cursor-not-allowed opacity-40")}
            aria-disabled
            title="Available once a trip is under way"
          >
            <ActionBody icon={<Share2 className="h-4 w-4 text-primary" />} label="HerShare" />
          </span>
        )}

        <Link to={ROUTES.profile} className={cn(ACTION_CLASS, ACTION_ENABLED)}>
          <ActionBody icon={<ShieldCheck className="h-4 w-4 text-primary" />} label="Safety" />
        </Link>
      </div>
    </div>
  );
}
