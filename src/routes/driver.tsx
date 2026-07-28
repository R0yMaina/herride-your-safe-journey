import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { DriverShell } from "@/components/layout/DriverShell";

export const Route = createFileRoute("/driver")({
  component: DriverLayout,
});

/**
 * The driver app. Everything under /driver runs inside its own shell with
 * the driver tab bar — riders never see it, and the 'driver' role is only
 * granted after admin verification.
 */
function DriverLayout() {
  return (
    <ProtectedRoute roles={["driver"]}>
      <DriverShell>
        <Outlet />
      </DriverShell>
    </ProtectedRoute>
  );
}
