/**
 * Typed, centralized access to environment variables.
 * Never read `import.meta.env` directly outside this module.
 */
const readString = (value: string | undefined, fallback = ""): string =>
  typeof value === "string" && value.length > 0 ? value : fallback;

export interface AppEnv {
  readonly mode: "development" | "production" | "test";
  readonly appName: string;
  readonly apiBaseUrl: string;
}

export const env: AppEnv = Object.freeze({
  mode: (import.meta.env.MODE as AppEnv["mode"]) ?? "development",
  appName: readString(import.meta.env.VITE_APP_NAME, "HeRide"),
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, "/api"),
});