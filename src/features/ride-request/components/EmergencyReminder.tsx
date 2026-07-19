import { ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/common";

export function EmergencyReminder() {
  return (
    <GlassCard className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm text-foreground">Emergency contacts on standby</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your saved contacts can follow this trip in real time as soon as it begins.
        </p>
      </div>
    </GlassCard>
  );
}
