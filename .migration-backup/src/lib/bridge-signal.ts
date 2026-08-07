import { useEffect } from "react";

/**
 * Global signal driving site-wide "bridge active" UI cues (today: the logo
 * buzz/glow in the AppHeader). Toggles `data-bridge` on the document root so
 * any element on the page can react via CSS selectors:
 *
 *   :root[data-bridge="active"] .qb-logo-shimmy { ... }
 *
 * Why a DOM attribute instead of a context provider: the AppHeader lives at
 * the route level (above the Session subtree), so a React context owned by
 * Session can't reach it without lifting state into __root. A scoped
 * data-attribute is a 4-line, dependency-free way to plumb a single boolean
 * outward without touching the WebRTC lifecycle.
 *
 * Cleared on unmount so a navigation away from a connected session doesn't
 * leave the cue stuck on.
 */
export function useBridgeSignal(active: boolean): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (active) {
      root.dataset.bridge = "active";
    } else {
      delete root.dataset.bridge;
    }
    return () => {
      delete root.dataset.bridge;
    };
  }, [active]);
}
