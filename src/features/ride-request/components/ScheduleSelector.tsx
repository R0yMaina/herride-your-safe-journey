import { Calendar, Clock, Zap } from "lucide-react";
import type { ScheduledRide } from "@/types/ride";
import { cn } from "@/lib/utils";

interface ScheduleSelectorProps {
  readonly schedule: ScheduledRide;
  readonly earliest: Date;
  readonly onModeChange: (mode: ScheduledRide["mode"]) => void;
  readonly onDateTimeChange: (iso: string | null) => void;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleSelector({ schedule, earliest, onModeChange, onDateTimeChange }: ScheduleSelectorProps) {
  const date = toDateInput(schedule.scheduledFor) || toDateInput(earliest.toISOString());
  const time = toTimeInput(schedule.scheduledFor) || toTimeInput(earliest.toISOString());

  const emit = (nextDate: string, nextTime: string) => {
    if (!nextDate || !nextTime) return;
    const iso = new Date(`${nextDate}T${nextTime}`).toISOString();
    onDateTimeChange(iso);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Ride timing" className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-card/60 p-1 backdrop-blur-xl">
        {(["now", "scheduled"] as const).map((mode) => {
          const active = schedule.mode === mode;
          const Icon = mode === "now" ? Zap : Calendar;
          return (
            <button
              key={mode}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onModeChange(mode)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {mode === "now" ? "Ride now" : "Schedule"}
            </button>
          );
        })}
      </div>
      {schedule.mode === "scheduled" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.22em]">Date</span>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-3 py-2">
              <Calendar className="h-4 w-4 text-primary" aria-hidden />
              <input
                type="date"
                value={date}
                min={toDateInput(earliest.toISOString())}
                onChange={(e) => emit(e.target.value, time)}
                className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
              />
            </div>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.22em]">Time</span>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-3 py-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              <input
                type="time"
                value={time}
                onChange={(e) => emit(date, e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
              />
            </div>
          </label>
        </div>
      )}
    </div>
  );
}