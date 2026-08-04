import { useEffect, useState } from "react";
import { LANGUAGES, useLanguageStore, type Language } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * English ⇄ Kiswahili. A segmented control rather than a dropdown: there are
 * two options and both should be readable without a tap, so a woman who cannot
 * read the current language can still find her own.
 *
 * Each label is written in its own language for the same reason — "Kiswahili",
 * never "Swahili".
 */
export function LanguageToggle({ className }: { readonly className?: string }) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  // The server always renders English; wait for hydration before showing a
  // restored choice, or the markup disagrees with itself.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active: Language = mounted ? language : "en";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1",
        className,
      )}
    >
      {LANGUAGES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setLanguage(id)}
          aria-pressed={active === id}
          lang={id}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            active === id
              ? "bg-gradient-pink text-noir shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
