import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AdminFinanceScreen } from "@/features/admin/AdminFinanceScreen";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({
    meta: [
      { title: "Finance · Admin · HeRide" },
      { name: "description", content: "HeRide financial overview for administrators." },
    ],
  }),
  component: AdminFinanceRoute,
});

function AdminFinanceRoute() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminFinanceScreen />
    </ProtectedRoute>
  );
}
