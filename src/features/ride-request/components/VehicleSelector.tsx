import { motion } from "framer-motion";
import { Users, Car } from "lucide-react";
import type { RideOption, FareEstimate } from "@/types/ride";
import { cn } from "@/lib/utils";
import { formatCurrency } from "../lib/format";

interface VehicleSelectorProps {
  readonly options: readonly RideOption[];
  readonly selectedId: RideOption["id"] | null;
  readonly fareById: Readonly<Partial<Record<RideOption["id"], FareEstimate>>>;
  readonly onSelect: (option: RideOption) => void;
}

export function VehicleSelector({ options, selectedId, fareById, onSelect }: VehicleSelectorProps) {
  return (
    <ul className="space-y-3" role="radiogroup" aria-label="Ride category">
      {options.map((opt) => {
        const selected = selectedId === opt.id;
        const fare = fareById[opt.id];
        return (
          <li key={opt.id}>
            <motion.button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(opt)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border p-4 text-left transition-colors",
                selected
                  ? "border-primary/60 bg-primary/10 shadow-glow"
                  : "border-border/60 bg-card/60",
              )}
            >
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl",
                  selected ? "bg-primary/25 text-primary" : "bg-white/5 text-muted-foreground",
                )}
              >
                <Car className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-base text-foreground">{opt.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {fare ? formatCurrency(fare.total, fare.currency) : "—"}
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {opt.capacity}
                  </span>
                  <span>{opt.etaMin} min away</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{opt.description}</span>
              </span>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );
}
