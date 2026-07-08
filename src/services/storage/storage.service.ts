import { secureStorage } from "./secure-storage";
import type { StorageKey } from "./keys";

/**
 * High-level, namespaced storage facade. Never call `localStorage` directly
 * elsewhere in the codebase — always go through this service so we can swap
 * to encrypted / native secure storage without a project-wide refactor.
 */
export const storageService = {
  get<T>(key: StorageKey): T | null {
    return secureStorage.get<T>(key);
  },
  set<T>(key: StorageKey, value: T): void {
    secureStorage.set<T>(key, value);
  },
  remove(key: StorageKey): void {
    secureStorage.remove(key);
  },
  clearAll(): void {
    secureStorage.clear();
  },
} as const;

export type StorageService = typeof storageService;