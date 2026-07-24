import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { DriverHomeScreen } from "@/features/driver/DriverHomeScreen";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "Driver · HeRide" },
      { name: "description", content: "Go online and accept HeRide requests." },
    ],
  }),
  component: DriverRoute,
});

function DriverRoute() {
  return (
    <ProtectedRoute roles={["driver"]}>
      <DriverHomeScreen />
    </ProtectedRoute>
  );
}
