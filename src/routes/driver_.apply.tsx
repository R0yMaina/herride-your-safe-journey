import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { DriverApplyScreen } from "@/features/driver-onboarding/DriverApplyScreen";

export const Route = createFileRoute("/driver_/apply")({
  head: () => ({
    meta: [
      { title: "Drive with HeRide · HeRide" },
      { name: "description", content: "Apply to become a verified HeRide driver." },
    ],
  }),
  component: DriverApplyRoute,
});

// Any signed-in woman can apply — the driver ROLE is granted only after
// admin verification, so no role restriction here.
function DriverApplyRoute() {
  return (
    <ProtectedRoute>
      <DriverApplyScreen />
    </ProtectedRoute>
  );
}
