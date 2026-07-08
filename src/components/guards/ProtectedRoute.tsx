import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/features/common/LoadingScreen";
import type { Permission, UserRole } from "@/types/user";
import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly roles?: readonly UserRole[];
  readonly permissions?: readonly Permission[];
}

export function ProtectedRoute({ children, roles, permissions }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  useEffect(() => {
    if (status === "unauthenticated") void navigate({ to: ROUTES.signIn, replace: true });
    if (status === "session-expired") void navigate({ to: ROUTES.sessionExpired, replace: true });
  }, [status, navigate]);

  if (status === "loading" || !user) return <LoadingScreen />;
  if (status !== "authenticated") return null;

  const roleOk = !roles || roles.length === 0 || roles.some(hasRole);
  const permOk = !permissions || permissions.length === 0 || permissions.some(hasPermission);
  if (!roleOk || !permOk) {
    void navigate({ to: ROUTES.unauthorized, replace: true });
    return null;
  }

  return <>{children}</>;
}