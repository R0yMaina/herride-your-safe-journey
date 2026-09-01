import { AlertTriangle, Check, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/common";
import type { TripAnomaly } from "@/services/safety";
import { anomalyCopy } from "../lib/anomaly-copy";

/**
 * The "are you okay?" prompt, shown when the monitor notices something.
 *
 * Two actions, no more. "I'm fine" clears it; "Get help" raises the SOS she
 * would otherwise have to find the shield for. A third option would be a
 * decision to make while frightened.
 */
export function AnomalyPrompt({
  anomaly,
  onAcknowledge,
  onGetHelp,
}: {
  readonly anomaly: TripAnomaly;
  readonly onAcknowledge: () => void;
  readonly onGetHelp: () => void;
}) {
  const copy = anomalyCopy(anomaly);

  return (
    <GlassCard className={`space-y-3 ${copy.urgent ? "border-destructive/50" : ""}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 shrink-0 ${copy.urgent ? "text-destructive" : "text-primary"}`}
        />
        <div className="min-w-0">
          <p className="font-display text-base text-foreground">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAcknowledge}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 py-2.5 text-sm text-foreground"
        >
          <Check className="h-4 w-4" /> I&apos;m fine
        </button>
        <button
          type="button"
          onClick={onGetHelp}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive py-2.5 text-sm font-semibold text-white"
        >
          <ShieldAlert className="h-4 w-4" /> Get help
        </button>
      </div>
    </GlassCard>
  );
}
