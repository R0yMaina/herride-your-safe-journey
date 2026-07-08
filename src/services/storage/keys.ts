export const STORAGE_KEYS = Object.freeze({
  authSession: "heride.auth.session",
  authTokens: "heride.auth.tokens",
  rememberMe: "heride.auth.rememberMe",
  onboardingComplete: "heride.onboarding.complete",
  preferences: "heride.user.preferences",
  deviceId: "heride.device.id",
});

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];