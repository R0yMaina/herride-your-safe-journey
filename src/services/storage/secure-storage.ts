export interface SecureStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

const memoryStore = new Map<string, string>();
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const secureStorage: SecureStorage = {
  get<T>(key: string): T | null {
    try {
      const raw = isBrowser ? window.localStorage.getItem(key) : (memoryStore.get(key) ?? null);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (isBrowser) window.localStorage.setItem(key, raw);
    else memoryStore.set(key, raw);
  },
  remove(key: string): void {
    if (isBrowser) window.localStorage.removeItem(key);
    else memoryStore.delete(key);
  },
  clear(): void {
    if (isBrowser) window.localStorage.clear();
    else memoryStore.clear();
  },
};
