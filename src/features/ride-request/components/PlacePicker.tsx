import { MapPin, Circle } from "lucide-react";
import type { Place } from "@/types/ride";
import { cn } from "@/lib/utils";

interface PlacePickerProps {
  readonly label: string;
  readonly kind: "pickup" | "destination";
  readonly value: Place | null;
  readonly options: readonly Place[];
  readonly onSelect: (place: Place) => void;
}

export function PlacePicker({ label, kind, value, options, onSelect }: PlacePickerProps) {
  const Icon = kind === "pickup" ? Circle : MapPin;
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <div className="rounded-2xl border border-border/60 bg-card/60 p-2 backdrop-blur-xl">
        {options.map((place) => {
          const active = value?.id === place.id;
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onSelect(place)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                active ? "bg-primary/15 text-primary" : "hover:bg-white/5",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full",
                  active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-sm text-foreground">
                  {place.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {place.address}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
