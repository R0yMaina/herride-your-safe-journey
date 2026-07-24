import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

/** Convenience selector hook + one-time storage hydration. */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    if (status === "loading") hydrateFromStorage();
  }, [status, hydrateFromStorage]);

  return {
    status,
    session,
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
