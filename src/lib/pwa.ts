// Tiny PWA helpers: register the service worker on the client and expose the
// `beforeinstallprompt` event as a deferred install hook.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

export function initPwa(): void {
  if (typeof window === "undefined") return;
  // Service worker registration (production-safe; browsers require https or localhost)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Silently ignore: SW is a progressive enhancement. */
      });
    });
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    for (const fn of listeners) fn(true);
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    for (const fn of listeners) fn(false);
  });
}

export function onInstallAvailabilityChange(fn: (canInstall: boolean) => void): () => void {
  listeners.add(fn);
  fn(deferredPrompt !== null);
  return () => listeners.delete(fn);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    for (const fn of listeners) fn(false);
    return choice.outcome;
  } catch {
    deferredPrompt = null;
    for (const fn of listeners) fn(false);
    return "dismissed";
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; everywhere else uses display-mode media query.
  const matches =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return matches || iosStandalone;
}
