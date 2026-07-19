import { create } from "zustand";
import type { UserRole } from "@/types/global";

export interface SessionUser {
  readonly id: string;
  readonly displayName: string;
  readonly role: UserRole;
}

interface SessionState {
  readonly user: SessionUser | null;
  readonly accessToken: string | null;
  readonly isAuthenticated: boolean;
  hydrate: (user: SessionUser, token: string) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hydrate: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clear: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
