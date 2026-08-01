import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  Milestone,
  RotateCcw,
  RotateCw,
  Merge,
  Navigation2,
} from "lucide-react";
import { GlassCard } from "@/components/common";
import type { GeoPoint } from "@/types/ride";
import { fetchRoadRoute } from "@/services/maps/osrm";
import type { RouteStep, StepManeuver } from "@/services/maps/route-steps";
import { haversineKm } from "@/lib/geo";
import { distanceCue, navigationDeepLink, navigationProgress } from "../lib/navigation";

const ICONS: Record<StepManeuver, typeof ArrowUp> = {
  depart: Navigation2,
  "turn-left": CornerUpLeft,
  "turn-right": CornerUpRight,
  "turn-slight-left": CornerDownLeft,
  "turn-slight-right": CornerDownRight,
  "turn-sharp-left": CornerUpLeft,
  "turn-sharp-right": CornerUpRight,
  uturn: RotateCcw,
  straight: ArrowUp,
  merge: Merge,
  "fork-left": CornerDownLeft,
  "fork-right": CornerDownRight,
  roundabout: RotateCw,
  ramp: Milestone,
  arrive: Flag,
};

/** Refetch the route when she strays this far from where it was computed. */
const REROUTE_KM = 0.15;

/**
 * Turn-by-turn for the driver.
 *
 * This is guidance, not a satnav — there is no voice, no lane detail and no
 * automatic rerouting mid-turn, so the panel says what the next manoeuvre is
 * and keeps a one-tap handoff to Google Maps or Waze for the actual driving.
 * The route is refetched when she drifts off it, which covers a missed turn
 * without pretending to be a navigation engine.
 */
export function NavigationPanel({
  from,
  to,
  label,
}: {
  readonly from: GeoPoint | null;
  readonly to: GeoPoint;
  readonly label: string;
}) {
  const [steps, setSteps] = useState<readonly RouteStep[]>([]);
  const [floor, setFloor] = useState(0);
  const routedFrom = useRef<GeoPoint | null>(null);
  const seq = useRef(0);

  // Target changes (to pickup → to destination) are a different journey.
  const targetKey = `${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  useEffect(() => {
    routedFrom.current = null;
    setSteps([]);
    setFloor(0);
  }, [targetKey]);

  useEffect(() => {
    if (!from) return;
    const drifted = !routedFrom.current || haversineKm(routedFrom.current, from) > REROUTE_KM;
    if (!drifted) return;

    routedFrom.current = from;
    const mine = ++seq.current;
    void fetchRoadRoute(from, to).then((route) => {
      // A slower earlier request must not overwrite a newer route.
      if (mine !== seq.current || !route?.steps?.length) return;
      setSteps(route.steps);
      setFloor(0);
    });
  }, [from, to]);

  const progress = navigationProgress(steps, from, floor);

  // Remember how far she has got so the panel never rewinds to a turn she has
  // already taken when a GPS sample lands slightly behind her.
  useEffect(() => {
    if (progress.index > floor) setFloor(progress.index);
  }, [progress.index, floor]);

  if (!progress.step) {
    return (
      <GlassCard className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {from ? "Finding the route…" : "Waiting for your location…"}
        </p>
        <DeepLinks to={to} />
      </GlassCard>
    );
  }

  const Icon = ICONS[progress.step.maneuver] ?? ArrowUp;
  const cue = distanceCue(progress.distanceToStepKm);

  return (
    <GlassCard className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base leading-snug text-foreground">
            {progress.step.instruction}
          </p>
          {cue && <p className="text-xs text-primary">{cue}</p>}
        </div>
      </div>

      {progress.next && (
        <p className="truncate border-t border-border/50 pt-2 text-xs text-muted-foreground">
          Then: {progress.next.instruction}
        </p>
      )}

      <DeepLinks to={to} />
    </GlassCard>
  );
}

function DeepLinks({ to }: { readonly to: GeoPoint }) {
  return (
    <div className="flex gap-2">
      {(["google", "waze"] as const).map((app) => (
        <a
          key={app}
          href={navigationDeepLink(to, app)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/70 py-2 text-xs text-muted-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {app === "google" ? "Google Maps" : "Waze"}
        </a>
      ))}
    </div>
  );
}
