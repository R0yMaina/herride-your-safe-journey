import { Link } from "@tanstack/react-router";
import { Briefcase, GraduationCap, Heart, Home, MapPin, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/ride";

/**
 * Label-to-icon guesses, so a place a rider named "Home" gets a house without
 * anyone having to store an icon choice. Unmatched labels fall back to a pin.
 */
const ICONS: readonly (readonly [RegExp, LucideIcon])[] = [
  [/home|house/i, Home],
  [/work|office|job/i, Briefcase],
  [/campus|school|uni|college/i, GraduationCap],
  [/mum|mom|dad|family|parent/i, Heart],
];

function iconFor(label: string): LucideIcon {
  return ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? MapPin;
}

interface SavedPlaceShortcutsProps {
  readonly places: readonly Place[];
  readonly className?: string;
}

const TILE =
  "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card/70 px-2 py-3 transition-colors hover:border-primary/40 hover:bg-card";

/** One-tap destinations. Shows at most four so the row never wraps. */
export function SavedPlaceShortcuts({ places, className }: SavedPlaceShortcutsProps) {
  const shown = places.slice(0, 4);

  // A rider with nothing saved yet gets a single prompt rather than an empty
  // row — the shortcuts are useless until she has somewhere to go back to.
  if (shown.length === 0) {
    return (
      <Link to={ROUTES.profile} className={cn(TILE, "flex-row justify-center gap-2", className)}>
        <Plus className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-xs text-muted-foreground">Save your first place</span>
      </Link>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {shown.map((place) => {
        const Icon = iconFor(place.label);
        return (
          <Link key={place.id} to={ROUTES.book} className={TILE} title={place.address}>
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="w-full truncate text-center text-[11px] text-foreground">
              {place.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
