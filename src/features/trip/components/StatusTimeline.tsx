import { Check } from "lucide-react";
import type { RideStatus } from "@/types/ride";

const STEPS: readonly { status: RideStatus; label: string }[] = [
  { status: "accepted", label: "Driver assigned" },
  { status: "arrived", label: "Driver arrived" },
  { status: "in_progress", label: "On the way" },
  { status: "completed", label: "Arrived at destination" },
];

const ORDER: readonly RideStatus[] = ["accepted", "arrived", "in_progress", "completed"];

export function StatusTimeline({ status }: { status: RideStatus }) {
  const currentIndex = ORDER.indexOf(status);
  return (
    <ol className="space-y-3">
      {STEPS.map((step, i) => {
        const done = currentIndex >= i;
        const active = currentIndex === i;
        return (
          <li key={step.status} className="flex items-center gap-3">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
                done
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
