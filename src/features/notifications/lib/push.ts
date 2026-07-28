import type { AppNotification } from "@/services/notifications";

/** Whether this browser supports OS-level notifications at all. */
export function pushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushEnabled(): boolean {
  return pushSupported() && Notification.permission === "granted";
}

/** Ask the user for notification permission (no-op if already decided). */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!pushSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Surface a fresh in-app notification at OS level so ride/safety alerts reach
 * the rider even when HeRide is in a background tab. Quiet no-op without
 * permission; skipped when the app is visible (the in-app feed handles it).
 */
export function showOsNotification(n: AppNotification): void {
  if (!pushEnabled()) return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    const note = new Notification(n.title, {
      body: n.body ?? undefined,
      tag: n.id, // dedupe if the same row fans out twice
      icon: "/favicon.ico",
    });
    note.onclick = () => window.focus();
  } catch {
    /* Notification constructor can throw on some mobile browsers — feed still works. */
  }
}
