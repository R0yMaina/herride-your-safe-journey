import { storageService } from "@/services/storage/storage.service";
import { STORAGE_KEYS } from "@/services/storage/keys";
import type { AuthTokens } from "@/types/auth";

/**
 * Token storage + lifecycle abstraction. Swap the storage layer here to
 * migrate to secure/native storage without touching call sites.
 */
export const tokenService = {
  get(): AuthTokens | null {
    return storageService.get<AuthTokens>(STORAGE_KEYS.authTokens);
  },
  set(tokens: AuthTokens): void {
    storageService.set(STORAGE_KEYS.authTokens, tokens);
  },
  clear(): void {
    storageService.remove(STORAGE_KEYS.authTokens);
  },
  isExpired(tokens: AuthTokens | null): boolean {
    if (!tokens) return true;
    return Date.parse(tokens.expiresAt) <= Date.now();
  },
  /** Future: swap with real refresh call to the backend. */
  async refresh(current: AuthTokens): Promise<AuthTokens> {
    const refreshed: AuthTokens = {
      ...current,
      accessToken: `mock.${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
    tokenService.set(refreshed);
    return refreshed;
  },
} as const;
