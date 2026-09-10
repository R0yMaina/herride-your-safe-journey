/**
 * Typed, centralized access to environment variables.
 * Never read `import.meta.env` directly outside this module.
 */
const readString = (value: string | undefined, fallback = ""): string =>
  typeof value === "string" && value.length > 0 ? value : fallback;

export interface Env {
  /** When true the contact form uses the in-memory mock instead of Supabase. */
  readonly useMocks: boolean;
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
}

export const env: Env = {
  useMocks: readString(import.meta.env.VITE_USE_MOCKS, "false") === "true",
  supabaseUrl: readString(import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: readString(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
};
