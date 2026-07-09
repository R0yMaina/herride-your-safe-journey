import { motion } from "framer-motion";
import { useState } from "react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { scheduleService } from "@/services/ride/schedule.service";
import { ScheduleSelector } from "../../components/ScheduleSelector";
import { StepHeader } from "../../components/StepHeader";
import { BottomActionBar } from "../../components/BottomActionBar";
import { ConfirmButton } from "../../components/ConfirmButton";
import { GlassCard } from "@/components/common";
import { formatScheduledFor } from "../../lib/format";

export function ScheduleStep() {
  const schedule = useRideRequestStore((s) => s.schedule);
  const setScheduleMode = useRideRequestStore((s) => s.setScheduleMode);
  const setScheduledFor = useRideRequestStore((s) => s.setScheduledFor);
  const next = useRideRequestStore((s) => s.next);
  const [error, setError] = useState<string | null>(null);

  const earliest = scheduleService.earliestSlot();

  const handleContinue = () => {
    const check = scheduleService.validate(schedule);
    if (!check.ok) {
      setError(check.reason ?? "Invalid schedule");
      return;
    }
    setError(null);
    next();
  };

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader title="When are you riding?" subtitle="Ride immediately or reserve a driver in advance." />
      <ScheduleSelector
        schedule={schedule}
        earliest={earliest}
        onModeChange={setScheduleMode}
        onDateTimeChange={setScheduledFor}
      />
      {schedule.mode === "scheduled" && schedule.scheduledFor && (
        <GlassCard className="text-sm text-foreground">
          Pickup scheduled for
          <span className="ml-1 font-display text-primary">{formatScheduledFor(schedule.scheduledFor)}</span>
        </GlassCard>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <BottomActionBar>
        <ConfirmButton onClick={handleContinue}>Review trip</ConfirmButton>
      </BottomActionBar>
    </motion.div>
  );
}