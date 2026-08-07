// Capability detection and parsing utilities for Phase 2.5 Presence.
//
// "Capabilities" are the features a device/browser can offer to trusted peers.
// They are detected once at component mount, broadcast in the presence payload
// alongside nickname and deviceKind, and persisted in the IDB capabilitySnapshot
// field of each TrustedNode record when a peer comes online.
//
// Live capabilities always come from the presence payload when a device is online.
// The IDB snapshot is only a staleness fallback for offline display labels.

import type { Capability } from "@/lib/trusted-nodes-db";

/**
 * Detect which capabilities this browser/device currently supports.
 * Returns a stable array broadcast in the self presence payload.
 * Call once on mount with useMemo.
 */
export function detectLocalCapabilities(): Capability[] {
  const caps: Capability[] = ["files"]; // Always available in QuickBridge

  if (typeof navigator !== "undefined") {
    // Clipboard read (Phase 2 presence capability).
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.readText === "function"
    ) {
      caps.push("clipboard");
    }
    // Clipboard write (Phase 3 Continuity capability: receiving a "Paste on" intent).
    // Checked independently because some browser profiles expose readText but not
    // writeText (e.g. certain enterprise policies on Chromium).
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      caps.push("clipboard.write");
    }
    // Camera and microphone via getUserMedia
    if (
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      caps.push("camera", "microphone");
    }
    // Geolocation
    if (navigator.geolocation) {
      caps.push("location");
    }
    // Notifications API (Phase 3 Continuity)
    if ("Notification" in window) {
      caps.push("notifications");
    }
  }

  if (typeof window !== "undefined") {
    // File System Access API: stream-to-disk on Chromium-based browsers.
    // "storage" = Phase 2 usage (streaming transfers).
    // "filesystem.write" = Phase 3 usage (accept file intents).
    // Both require the same browser support; detected together.
    if ("showSaveFilePicker" in window) {
      caps.push("storage");
      caps.push("filesystem.write");
    }
    // browser.open: any browser that can open new tabs (Phase 3 Continuity).
    // Effectively universal; detecting window.open is a formality.
    if (typeof window.open === "function") {
      caps.push("browser.open");
    }
  }

  return caps;
}

const VALID_CAPS = new Set<string>([
  "files",
  "clipboard",
  "clipboard.write",       // Phase 3 Continuity: receiving paste intents
  "camera",
  "microphone",
  "location",
  "storage",
  "gpu",
  "display",
  // Phase 3 Continuity capabilities
  "browser.open",
  "filesystem.write",
  "notifications",
]);

/**
 * Parse and validate a capabilities array from an untrusted presence payload.
 * Drops any value that is not a recognised Capability string so malformed
 * peer payloads cannot inject unexpected values into the IDB snapshot.
 */
export function parseCapabilities(raw: unknown): Capability[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (v): v is Capability => typeof v === "string" && VALID_CAPS.has(v),
  );
}
