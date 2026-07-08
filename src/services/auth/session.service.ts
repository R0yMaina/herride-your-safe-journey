import { storageService } from "@/services/storage/storage.service";
import { STORAGE_KEYS } from "@/services/storage/keys";
import type { AuthSession } from "@/types/auth";
import { tokenService } from "./token.service";

export const sessionService = {
  load(): AuthSession | null {
    const session = storageService.get<AuthSession>(STORAGE_KEYS.authSession);
    if (!session) return null;
    if (tokenService.isExpired(session.tokens)) return null;
    return session;
  },
  persist(session: AuthSession): void {
    storageService.set(STORAGE_KEYS.authSession, session);
    tokenService.set(session.tokens);
  },
  clear(): void {
    storageService.remove(STORAGE_KEYS.authSession);
    tokenService.clear();
  },
} as const;