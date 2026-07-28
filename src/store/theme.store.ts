import { create } from "zustand";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "heride.theme";

interface ThemeState {
  readonly mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

/**
 * Light is HeRide's default look (violet on white); a returning rider keeps
 * whatever she last chose. Reads happen lazily on the client — the server
 * always renders light and ThemeProvider reconciles after hydration, so the
 * SSR markup never mismatches.
 */
function persisted(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function persist(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode — the choice just won't survive a reload */
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  setMode: (mode) => {
    persist(mode);
    set({ mode });
  },
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    persist(next);
    set({ mode: next });
  },
}));

/** Applies the stored preference once, on the client, after hydration. */
export function restoreTheme(): void {
  const stored = persisted();
  if (stored) useThemeStore.setState({ mode: stored });
}
