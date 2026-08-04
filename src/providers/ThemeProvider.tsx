import { useEffect, type ReactNode } from "react";
import { restoreTheme, useThemeStore } from "@/store/theme.store";
import { restoreLanguage } from "@/i18n";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  // Restore the saved choices after hydration so SSR markup always matches.
  // Language rides along with theme rather than getting its own provider: both
  // are one localStorage read applied to <html>, and two providers wrapping
  // every route to do the same thing is not worth the extra tree depth.
  useEffect(() => {
    restoreTheme();
    restoreLanguage();
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
