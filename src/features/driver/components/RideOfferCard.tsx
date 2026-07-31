import { useEffect, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { GlassCard } from "@/components/common";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { formatDistanceKm } from "@/lib/geo";
import type { RideOffer } from "@/services/driver";

interface RideOfferCardProps {
  readonly offer: RideOffer;
  readonly busy: boolean;
  readonly onAccept: () => void;
  readonly onDecline: () => void;
  /** Fired when the timer runs out, so the parent can re-poll. */
  readonly onExpire: () => void;
}

/** Whole seconds left, floored at zero. */
function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

/**
 * A single ride offered to this driver, with the clock visible.
 *
 * The countdown is the honest part: dispatch moves on when it hits zero, so
 * hiding it would just make the offer vanish for no visible reason.
 */
export function RideOfferCard({ offer, busy, onAccept, onDecline, onExpire }: RideOfferCardProps) {
  const [left, setLeft] = useState(() => secondsLeft(offer.expiresAt));

  useEffect(() => {
    setLeft(secondsLeft(offer.expiresAt));
    const t = setInterval(() => {
      const next = secondsLeft(offer.expiresAt);
      setLeft(next);
      if (next === 0) onExpire();
    }, 1000);
    return () => clearInterval(t);
    // Restart the clock when a different offer arrives, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.offerId, offer.expiresAt]);

  const total = 20;
  const pct = Math.min(100, Math.max(0, (left / total) * 100));

  return (
    <GlassCard className="space-y-3 border-primary/40 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg text-foreground">New ride request</p>
        <span
          className="font-mono text-lg tabular-nums text-primary"
          aria-live="polite"
          aria-label={`${left} seconds to respond`}
        >
          {left}s
        </span>
      </div>

      {/* The bar is the same information as the number, for a glance rather
          than a read — she is holding a steering wheel. */}
      <div className="h-1 overflow-hidden rounded-full bg-primary/15">
        <div
          className="h-full bg-gradient-pink transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2 text-sm">
        <p className="flex items-start gap-2 text-foreground">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Pickup
              {offer.distanceKm !== null ? ` · ${formatDistanceKm(offer.distanceKm)} away` : ""}
            </span>
            {offer.pickupAddress ?? "Pickup point"}
          </span>
        </p>
        <p className="flex items-start gap-2 text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Drop-off
            </span>
            {offer.dropAddress ?? "Destination"}
          </span>
        </p>
      </div>

      {offer.fareEstimate !== null && (
        <p className="text-sm text-muted-foreground">
          Estimated fare{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(offer.fareEstimate, "KES")}
          </span>
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          className="flex-1 rounded-full border border-border/60 px-4 py-2.5 text-sm text-foreground disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={busy || left === 0}
          className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {left === 0 ? "Expired" : "Accept"}
        </button>
      </div>
    </GlassCard>
  );
}
