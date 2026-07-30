import { env } from "./env";
import { contact } from "./contact";

export const appConfig = Object.freeze({
  name: env.appName,
  tagline: "The safest ride, for her.",
  // Single source of truth lives in config/contact.ts; re-exported here so
  // existing callers of appConfig keep working and can't drift.
  supportEmail: contact.email,
  defaultLocale: "en-KE",
  defaultCurrency: "KES",
  // Long enough for the full cheetah entrance to land and the wordmark to
  // resolve — see CheetahRun/SplashScreen. Shorten this and the sprint gets
  // cut off mid-stride.
  splash: { minDurationMs: 3000 },
  api: {
    baseUrl: env.apiBaseUrl,
    timeoutMs: 15_000,
    retry: { attempts: 3, backoffMs: 400 },
  },
});

export type AppConfig = typeof appConfig;
