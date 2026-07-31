import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminMfaGate } from "@/features/admin/components/AdminMfaGate";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

/**
 * The admin console. Everything under /admin runs inside its own shell with
 * the admin tab bar, behind the admin role — which is granted server-side
 * only (verification, owner bootstrap), never self-assigned from the client.
 *
 * The role is necessary but not sufficient: AdminMfaGate holds the session at
 * the door until a second factor is presented, because one password should not
 * be all that stands between an attacker and every rider's data.
 */
function AdminLayout() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminMfaGate>
        <AdminShell>
          <Outlet />
        </AdminShell>
      </AdminMfaGate>
    </ProtectedRoute>
  );
}
