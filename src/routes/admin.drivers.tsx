import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AdminDriversScreen } from "@/features/admin/AdminDriversScreen";

export const Route = createFileRoute("/admin/drivers")({
  head: () => ({
    meta: [
      { title: "Driver verification · Admin · HeRide" },
      { name: "description", content: "Verify HeRide driver applications." },
    ],
  }),
  component: AdminDriversRoute,
});

function AdminDriversRoute() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminDriversScreen />
    </ProtectedRoute>
  );
}
