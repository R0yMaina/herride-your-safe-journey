const KEY = "heride.signup-intent";

export type SignupIntent = "passenger" | "driver";

/**
 * Which door the user came through on the welcome screen. Persisted across
 * the sign-up → email-verification → sign-in detour so a driver applicant
 * lands on the application form the first time she reaches the app.
 */
export function setSignupIntent(intent: SignupIntent): void {
  try {
    localStorage.setItem(KEY, intent);
  } catch {
    /* storage unavailable (private mode) — the profile row still offers the path */
  }
}

export function takeSignupIntent(): SignupIntent | null {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "driver" || value === "passenger") {
      localStorage.removeItem(KEY);
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}
