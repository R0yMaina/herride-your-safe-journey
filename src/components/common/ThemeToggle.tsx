import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/lib/utils";

/**
 * Light ⇄ dark switch. Renders a neutral shell until mounted so the server
 * markup (always light) and the client's restored preference can't disagree.
 */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-border/70 bg-card/70 px-1 transition-colors",
        className,
      )}
    >
      <motion.span
        className="grid h-7 w-7 place-items-center rounded-full bg-gradient-pink text-noir shadow-soft"
        animate={{ x: dark ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </motion.span>
    </button>
  );
}
