import type { DeviceKind } from "./device";

export interface DeviceNameResolutionOptions {
  /** The trusted node's locally chosen nickname, if the peer is trusted. */
  trustedNickname?: string;
  /** The peer's self-advertised nickname from the current presence payload. */
  advertisedName?: string | null;
  /** The peer's device kind (phone, tablet, computer) from the current presence payload. */
  deviceKind?: DeviceKind | null;
}

/**
 * Resolves the display name for a device following the strict naming policy:
 * 
 * 1. TrustedNode.nickname (local, durable, user-editable)
 * 2. Advertised nickname (ephemeral, from presence)
 * 3. Device kind fallback ("Phone", "Computer")
 * 4. "Other device"
 * 
 * This ensures that once a user names a device, that local name is ALWAYS used,
 * regardless of what the peer advertises in subsequent sessions.
 */
export function resolveDeviceName({
  trustedNickname,
  advertisedName,
  deviceKind,
}: DeviceNameResolutionOptions): string {
  if (trustedNickname && trustedNickname.trim() !== "") {
    return trustedNickname.trim();
  }
  
  if (advertisedName && advertisedName.trim() !== "") {
    return advertisedName.trim();
  }
  
  if (deviceKind === "phone") return "Phone";
  if (deviceKind === "tablet") return "Tablet";
  if (deviceKind === "computer") return "Computer";
  
  return "Other device";
}
