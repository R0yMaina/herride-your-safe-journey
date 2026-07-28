import { useEffect, type ReactNode } from "react";
import { restoreTheme, useThemeStore } from "@/store/theme.store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  // Restore the saved choice after hydration so SSR markup always matches.
  useEffect(() => {
    restoreTheme();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    // Keep the installed-app / browser chrome in step with the canvas.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mode === "dark" ? "#121016" : "#ffffff");
  }, [mode]);

  return <>{children}</>;
}
