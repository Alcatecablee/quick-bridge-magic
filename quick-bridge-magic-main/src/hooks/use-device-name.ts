import { useState, useEffect, useCallback } from "react";
import { getTrustedNode, TRUSTED_NODES_CHANNEL } from "@/lib/trusted-nodes-db";
import { resolveDeviceName } from "@/lib/device-name";
import type { DeviceKind } from "@/lib/device";

/**
 * React hook to resolve a device's display name according to the strict policy:
 * TrustedNode.nickname -> advertised peer nickname -> device-kind fallback -> "Other device"
 * 
 * Automatically subscribes to IDB mutations via BroadcastChannel to ensure
 * names update in real-time across tabs if the user renames a device.
 */
export function useDeviceDisplayName(
  nodeId: string | null | undefined,
  advertisedName: string | null | undefined,
  deviceKind: DeviceKind | null | undefined
): string {
  const [trustedNickname, setTrustedNickname] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    if (!nodeId) {
      setTrustedNickname(undefined);
      return;
    }
    
    getTrustedNode(nodeId)
      .then((node) => {
        setTrustedNickname(node?.nickname);
      })
      .catch(() => {
        // Failed to read IDB, just fallback to undefined
        setTrustedNickname(undefined);
      });
  }, [nodeId]);

  // Load initially and on nodeId change
  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to cross-tab mutations
  useEffect(() => {
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(TRUSTED_NODES_CHANNEL) : null;
    if (!bc) return;

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "MUTATED") {
        load();
      }
    };

    bc.addEventListener("message", handler);
    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
    };
  }, [load]);

  return resolveDeviceName({
    trustedNickname,
    advertisedName,
    deviceKind,
  });
}
