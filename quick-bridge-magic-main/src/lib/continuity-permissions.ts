// Per-capability per-node permission settings for Continuity Phase 3.
//
// Stored in localStorage keyed by the SENDER's nodeId.
// The permission answers: "Is nodeId allowed to execute capability X on THIS device?"
// Defaults to "ask" for all capabilities.
//
// ask  - surface an inline prompt with a 15-second timeout (auto-deny on expiry).
// always - execute silently.
// never  - reject immediately with PERMISSION_DENIED.

export type PermissionSetting = "always" | "ask" | "never";

export type PermissionCapability =
  | "browser.open"
  | "clipboard.write"
  | "filesystem.write"
  | "camera"
  | "notifications";

export type NodePermissions = Record<PermissionCapability, PermissionSetting>;

const DEFAULT_PERMISSIONS: NodePermissions = {
  "browser.open": "ask",
  "clipboard.write": "ask",
  "filesystem.write": "ask",
  camera: "ask",
  notifications: "ask",
};

const STORAGE_KEY_PREFIX = "qb:perm:";

// Maps intent type to the capability required to execute it.
export const INTENT_CAPABILITY_MAP: Partial<
  Record<string, PermissionCapability>
> = {
  "open-url": "browser.open",
  "continue-reading": "browser.open",
  clipboard: "clipboard.write",
  "open-file": "filesystem.write",
  "media-share": "filesystem.write",
};

function storageKey(senderNodeId: string): string {
  return `${STORAGE_KEY_PREFIX}${senderNodeId}`;
}

export function getNodePermissions(senderNodeId: string): NodePermissions {
  try {
    const raw = localStorage.getItem(storageKey(senderNodeId));
    if (!raw) return { ...DEFAULT_PERMISSIONS };
    const parsed = JSON.parse(raw) as Partial<NodePermissions>;
    return { ...DEFAULT_PERMISSIONS, ...parsed };
  } catch {
    return { ...DEFAULT_PERMISSIONS };
  }
}

export function getPermission(
  senderNodeId: string,
  capability: PermissionCapability,
): PermissionSetting {
  return getNodePermissions(senderNodeId)[capability];
}

export function setPermission(
  senderNodeId: string,
  capability: PermissionCapability,
  setting: PermissionSetting,
): void {
  try {
    const existing = getNodePermissions(senderNodeId);
    existing[capability] = setting;
    localStorage.setItem(storageKey(senderNodeId), JSON.stringify(existing));
  } catch {}
}

export function clearNodePermissions(senderNodeId: string): void {
  try {
    localStorage.removeItem(storageKey(senderNodeId));
  } catch {}
}
