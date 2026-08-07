// Background notifications for transfers. Permission is requested only on a
// user gesture; notifications fire only when the document is hidden so we
// don't double-up with in-page toasts.

const ICON = "/icon-192.png";
const BADGE = "/favicon-32.png";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const N = window.Notification;
  if (N.permission === "granted") return true;
  if (N.permission === "denied") return false;
  try {
    const result = await N.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function notify(title: string, body?: string, tag?: string): void {
  if (!notificationsSupported()) return;
  if (window.Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    const n = new window.Notification(title, {
      body,
      icon: ICON,
      badge: BADGE,
      tag,
      silent: false,
    });
    n.onclick = () => {
      try {
        window.focus();
        n.close();
      } catch {}
    };
  } catch {}
}
