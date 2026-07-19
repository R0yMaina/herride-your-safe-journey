import { create } from "zustand";
import type { AuthSession, AuthStatus } from "@/types/auth";
import type { Permission, UserRole } from "@/types/user";
import { sessionService } from "@/services/auth/session.service";

interface AuthState {
  readonly status: AuthStatus;
  readonly session: AuthSession | null;
  hydrateFromStorage: () => void;
  setSession: (session: AuthSession) => void;
  expire: () => void;
  clear: () => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  session: null,
  hydrateFromStorage: () => {
    const session = sessionService.load();
    set({ session, status: session ? "authenticated" : "unauthenticated" });
  },
  setSession: (session) => {
    sessionService.persist(session);
    set({ session, status: "authenticated" });
  },
  expire: () => {
    sessionService.clear();
    set({ session: null, status: "session-expired" });
  },
  clear: () => {
    sessionService.clear();
    set({ session: null, status: "unauthenticated" });
  },
  hasRole: (role) => get().session?.user.role === role,
  hasPermission: (permission) => get().session?.user.permissions.includes(permission) ?? false,
}));
