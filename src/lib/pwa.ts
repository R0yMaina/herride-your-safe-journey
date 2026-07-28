/**
 * Registers the service worker that makes HeRide installable ("Add to home
 * screen") and shows a branded offline page instead of a browser error.
 * Client-only and non-blocking: registration failures never affect the app.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // Dev servers hot-reload modules; a caching SW only gets in the way there.
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Installability is progressive enhancement — the app works regardless. */
    });
  });
}
