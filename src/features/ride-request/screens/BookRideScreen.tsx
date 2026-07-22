import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Container, ScreenWrapper } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import { LocationStep } from "./steps/LocationStep";
import { VehicleStep } from "./steps/VehicleStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import { ConfirmStep } from "./steps/ConfirmStep";

/** Orchestrates the multi-step ride request flow. Each step is presentational. */
export function BookRideScreen() {
  const step = useRideRequestStore((s) => s.step);
  const setStep = useRideRequestStore((s) => s.setStep);

  useEffect(() => {
    return () => {
      // On unmount reset to the first step so re-entry starts at location.
      setStep("location");
    };
  }, [setStep]);

  return (
    <ScreenWrapper className="pb-48">
      <Container>
        <AnimatePresence mode="wait">
          {step === "location" && <LocationStep key="location" />}
          {step === "vehicle" && <VehicleStep key="vehicle" />}
          {step === "preferences" && <PreferencesStep key="preferences" />}
          {step === "schedule" && <ScheduleStep key="schedule" />}
          {step === "confirm" && <ConfirmStep key="confirm" />}
        </AnimatePresence>
      </Container>
    </ScreenWrapper>
  );
}
