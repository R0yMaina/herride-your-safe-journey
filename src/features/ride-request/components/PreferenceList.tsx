import { Check, Sparkles } from "lucide-react";
import type { RidePreference, RidePreferenceId } from "@/types/ride";
import { cn } from "@/lib/utils";

interface PreferenceListProps {
  readonly preferences: readonly RidePreference[];
  readonly selected: readonly RidePreferenceId[];
  readonly onToggle: (id: RidePreferenceId) => void;
}

export function PreferenceList({ preferences, selected, onToggle }: PreferenceListProps) {
  return (
    <ul className="grid grid-cols-1 gap-2">
      {preferences.map((p) => {
        const active = selected.includes(p.id);
        const disabled = !p.available;
        return (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onToggle(p.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/60 bg-card/60 hover:bg-white/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-foreground">{p.label}</span>
                  {p.comingSoon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-[2px] text-[9px] uppercase tracking-[0.2em] text-primary">
                      <Sparkles className="h-3 w-3" /> Soon
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 text-transparent",
                )}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
