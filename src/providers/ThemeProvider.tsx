import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/store/theme.store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
  }, [mode]);
  return <>{children}</>;
}