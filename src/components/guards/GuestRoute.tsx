import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/features/common/LoadingScreen";

/** Blocks authenticated users from public-only auth surfaces. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") void navigate({ to: ROUTES.home, replace: true });
  }, [status, navigate]);

  if (status === "loading") return <LoadingScreen />;
  return <>{children}</>;
}