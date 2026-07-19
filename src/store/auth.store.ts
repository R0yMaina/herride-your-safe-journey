import { create } from "zustand";
import type { AuthSession, AuthStatus } from "@/types/auth";
import type { Permission, UserRole } from "@/types/user";
import { sessionService } from "@/services/auth/session.service";
import { env } from "@/config/env";

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
    if (session) {
      set({ session, status: "authenticated" });
      return;
    }
    // In real mode Supabase is the source of truth and may still refresh an
    // expired session — initAuthSync resolves "loading" either way.
    if (env.useMocks) set({ session: null, status: "unauthenticated" });
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
