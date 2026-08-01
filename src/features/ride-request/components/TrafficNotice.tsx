import { TrafficCone } from "lucide-react";
import type { RouteEstimate } from "@/types/ride";
import { isHeavyTraffic, trafficRatio } from "@/services/maps/route-steps";

/**
 * Says so when the roads are the reason the trip is long.
 *
 * Renders nothing at all when no provider could see traffic. Silence is the
 * correct output there: claiming clear roads on a router that cannot see them
 * would be a guess dressed as a fact, and she is about to pay for those extra
 * minutes.
 */
export function TrafficNotice({ route }: { readonly route: RouteEstimate }) {
  if (!isHeavyTraffic(route)) return null;
  const ratio = trafficRatio(route);
  const extra = Math.round(route.durationMin - (route.freeFlowDurationMin ?? route.durationMin));
  if (ratio === null || extra < 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-xs text-foreground">
      <TrafficCone className="h-4 w-4 shrink-0 text-primary" />
      <span>
        Heavy traffic — about <span className="font-semibold">{extra} min</span> slower than usual.
        Your fare includes the extra time.
      </span>
    </div>
  );
}
