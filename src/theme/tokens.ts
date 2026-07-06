/**
 * Semantic design tokens exposed to TS. CSS custom properties remain the
 * source of truth in styles.css; this file is for consumers that need
 * typed access (charts, canvases, motion configs).
 */
export const tokens = Object.freeze({
  color: {
    background: "var(--background)",
    foreground: "var(--foreground)",
    primary: "var(--primary)",
    primaryGlow: "var(--primary-glow)",
    blush: "var(--blush)",
    noir: "var(--noir)",
    muted: "var(--muted)",
    border: "var(--border)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  },
  motion: {
    fast: 0.18,
    base: 0.28,
    slow: 0.5,
  },
});

export type Tokens = typeof tokens;