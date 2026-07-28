import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

/**
 * The admin console. Everything under /admin runs inside its own shell with
 * the admin tab bar, behind the admin role — which is granted server-side
 * only (verification, owner bootstrap), never self-assigned from the client.
 */
function AdminLayout() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </ProtectedRoute>
  );
}
