import { create } from "zustand";
import { en, type Dictionary } from "./en";
import { sw } from "./sw";

export type Language = "en" | "sw";

export const LANGUAGES: readonly { readonly id: Language; readonly label: string }[] = [
  { id: "en", label: "English" },
  { id: "sw", label: "Kiswahili" },
];

const DICTIONARIES: Record<Language, Dictionary> = { en, sw };

const STORAGE_KEY = "heride.language";

/**
 * Every leaf path in the dictionary, as a dotted string: "trip.status.arrived".
 * Built from the type, so `t()` cannot be handed a key that does not exist and
 * renaming a key breaks the call sites at compile time rather than at runtime.
 */
type Leaves<T> = T extends string
  ? ""
  : {
      [K in keyof T & string]: Leaves<T[K]> extends "" ? K : `${K}.${Leaves<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = Leaves<Dictionary>;

export type Substitutions = Readonly<Record<string, string | number>>;

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replaces `{name}` with the matching substitution; unknown ones are left as-is. */
function interpolate(template: string, values?: Substitutions): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/**
 * Translate.
 *
 * Falls back to English if a Swahili string is somehow missing at runtime —
 * the types make that impossible at build time, but a stale bundle in a cache
 * is not worth showing an empty screen over. Falls back to the key itself only
 * if English is missing too, which is a bug that should be visible.
 */
export function translate(language: Language, key: TranslationKey, values?: Substitutions): string {
  const template = lookup(DICTIONARIES[language], key) ?? lookup(en, key) ?? key;
  return interpolate(template, values);
}

interface LanguageState {
  readonly language: Language;
  setLanguage: (language: Language) => void;
}

function persisted(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "sw" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * English is the default because it is what the server renders. A returning
 * rider keeps whatever she last chose; the choice is applied after hydration
 * (see restoreLanguage) so the SSR markup never mismatches.
 */
export const useLanguageStore = create<LanguageState>((set) => ({
  language: "en",
  setLanguage: (language) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        /* private mode — the choice just won't survive a reload */
      }
      document.documentElement.lang = language;
    }
    set({ language });
  },
}));

/** Applies the stored preference once, on the client, after hydration. */
export function restoreLanguage(): void {
  const stored = persisted();
  if (!stored) return;
  useLanguageStore.setState({ language: stored });
  document.documentElement.lang = stored;
}

/**
 * The hook screens use. Returns a stable-enough `t` plus the active language,
 * so a component that needs to branch on it (date formats, say) can.
 */
export function useT() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: TranslationKey, values?: Substitutions) => translate(language, key, values);
  return { t, language };
}
