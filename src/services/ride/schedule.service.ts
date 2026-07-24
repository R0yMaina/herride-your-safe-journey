import type { ScheduledRide } from "@/types/ride";

export interface IScheduleService {
  validate(schedule: ScheduledRide): { readonly ok: boolean; readonly reason?: string };
  earliestSlot(): Date;
}

class MockScheduleService implements IScheduleService {
  earliestSlot(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 20);
    return d;
  }
  validate(schedule: ScheduledRide) {
    if (schedule.mode === "now") return { ok: true } as const;
    if (!schedule.scheduledFor) return { ok: false, reason: "Pick a date and time." } as const;
    const at = Date.parse(schedule.scheduledFor);
    if (Number.isNaN(at)) return { ok: false, reason: "Invalid date." } as const;
    if (at < this.earliestSlot().getTime()) {
      return { ok: false, reason: "Schedule at least 20 minutes ahead." } as const;
    }
    return { ok: true } as const;
  }
}

export const scheduleService: IScheduleService = new MockScheduleService();
