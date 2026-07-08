export interface PasswordStrength {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: "Very weak" | "Weak" | "Fair" | "Strong" | "Excellent";
  readonly checks: {
    readonly length: boolean;
    readonly upper: boolean;
    readonly lower: boolean;
    readonly number: boolean;
    readonly symbol: boolean;
  };
}

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Excellent"] as const;

export function evaluatePassword(pw: string): PasswordStrength {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.max(0, Math.min(4, passed - 1)) as PasswordStrength["score"];
  return { score, label: LABELS[score], checks };
}