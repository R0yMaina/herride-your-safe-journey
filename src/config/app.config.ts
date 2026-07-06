import { env } from "./env";

export const appConfig = Object.freeze({
  name: env.appName,
  tagline: "The safest ride, for her.",
  supportEmail: "care@heride.app",
  defaultLocale: "en-KE",
  defaultCurrency: "KES",
  splash: { minDurationMs: 1600 },
  api: {
    baseUrl: env.apiBaseUrl,
    timeoutMs: 15_000,
    retry: { attempts: 3, backoffMs: 400 },
  },
});

export type AppConfig = typeof appConfig;