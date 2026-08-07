// DevicesPanel: homepage section showing trusted devices and their online status.
//
// Shown only when the user has at least one trusted device (hidden for new users).
// Each row shows an online indicator, device icon, nickname, last-seen label,
// a live capability hint when online, and a "Connect" button enabled only when
// the device is online.
//
// Clicking Connect:
//  1. Generates a fresh session UUID.
//  2. Broadcasts a "trusted-connect" invitation on the shared presence channel.
//  3. Navigates this tab to /session/$id as host.
//
// The target device's usePresence hook receives the broadcast, validates the
// sender is trusted, and navigates to /s/$id as guest. The DataChannel that
// opens runs the normal ECDSA challenge/verify handshake to confirm identity.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTrustedNodes } from "@/hooks/use-trusted-nodes";
import { usePresence } from "@/hooks/use-presence";
import { Smartphone, Tablet, Monitor, Loader2 } from "./icons";
import { Button } from "@/components/ui/button";
import type { DeviceKind } from "@/lib/device";
import type { NodeIdentity } from "@/lib/node-identity";
import { generateSessionId } from "@/lib/session";
import { detectLocalCapabilities } from "@/lib/capabilities";
import { touchTrustedNode, type Capability } from "@/lib/trusted-nodes-db";
import { PENDING_INTENT_KEY_PREFIX, type PendingIntent } from "@/lib/continuity-runtime";

interface Props {
  identity: NodeIdentity;
  /** Display name for this device, from deviceName state on the homepage. */
  nickname: string;
  /** This device's kind, detected once on mount by the homepage. */
  deviceKind: DeviceKind;
}

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const cls = "h-4 w-4 text-muted-foreground";
  if (kind === "phone") return <Smartphone className={cls} />;
  if (kind === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function relativeTime(ts: number): string {
  // Guard against malformed timestamps so the panel never renders "NaNd ago".
  if (typeof ts !== "number" || !isFinite(ts) || ts <= 0) return "a while ago";
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Maps Phase 3 Continuity receive-capabilities to user-facing action labels.
// Only shows what the peer is ready to *receive* — not internal debug details.
const CONTINUITY_CAP_LABELS: Partial<Record<Capability, string>> = {
  "browser.open":    "Tabs",
  "clipboard.write": "Clipboard",
  "filesystem.write": "Files",
  notifications:     "Notifications",
};

// Shows what this device is ready to receive as a compact "Ready for:" hint.
// Replaces the raw internal capability list with user-facing action labels.
function CapabilityHint({ caps }: { caps: Capability[] }) {
  const labels = caps
    .map((c) => CONTINUITY_CAP_LABELS[c])
    .filter(Boolean) as string[];
  if (labels.length === 0) return null;
  return (
    <p className="truncate text-[10.5px] text-muted-foreground/50">
      Ready for: {labels.join(", ")}
    </p>
  );
}

export function DevicesPanel({ identity, nickname, deviceKind }: Props) {
  const { nodes, loading } = useTrustedNodes();
  const navigate = useNavigate();
  // Tracks which node is currently being connected to. Prevents double-tap
  // from sending two invitations and opening two sessions.
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  // Memoised so the reference is stable between renders. Without this,
  // `.map()` produces a new array every render, causing usePresence's
  // incremental effect to fire on every render — which calls flushOnlineSet +
  // flushPeerCaps, scheduling another render, creating a tight re-render loop.
  const trustedNodeIds = useMemo(() => nodes.map((n) => n.nodeId), [nodes]);

  // Detected once on mount; stable for the lifetime of this component.
  const localCapabilities = useMemo(() => detectLocalCapabilities(), []);

  const handleTrustedConnect = useCallback(
    (fromNodeId: string, sessionId: string) => {
      // Store who is connecting so the session page can display their name
      // during the waiting phase (before the DataChannel opens).
      try {
        sessionStorage.setItem(`qb:tc:from:${sessionId}`, fromNodeId);
      } catch {}
      // Received a "connect" invitation from a trusted device. Navigate as guest.
      void navigate({ to: "/s/$id", params: { id: sessionId } });
    },
    [navigate],
  );

  const { onlineNodeIds, peerCapabilities, sendTrustedConnect } = usePresence({
    enabled: nodes.length > 0,
    localNodeId: identity.nodeId,
    localNickname: nickname || "This device",
    localDeviceKind: deviceKind,
    localCapabilities,
    trustedNodeIds,
    onTrustedConnect: handleTrustedConnect,
  });

  // Tracks the last caps JSON persisted to IDB per peer so we can skip
  // redundant writes when peerCapabilities or onlineNodeIds changes but a
  // specific peer's capabilities have not actually changed. Without this,
  // every render triggered by any peer state change fires N×M IDB transactions
  // and stamps an updated lastSeen on every online peer, even untouched ones.
  const lastPersistedCapsRef = useRef<Map<string, string>>(new Map());

  // Persist capability snapshots to IDB only when a peer's capabilities have
  // actually changed since the last write. This keeps the stored snapshot
  // reasonably current so offline display labels stay meaningful. Failures are
  // logged but never surfaced in the UI (live presence state is authoritative).
  useEffect(() => {
    for (const [nodeId, caps] of peerCapabilities) {
      if (!onlineNodeIds.has(nodeId)) continue;
      const capsKey = JSON.stringify(caps);
      if (lastPersistedCapsRef.current.get(nodeId) === capsKey) continue;
      // Optimistically mark as persisted before the async write. If the write
      // fails we roll back so a future render can retry.
      lastPersistedCapsRef.current.set(nodeId, capsKey);
      void touchTrustedNode(nodeId, Date.now(), undefined, caps).catch(
        (err: unknown) => {
          lastPersistedCapsRef.current.delete(nodeId);
          console.warn(
            "[QB] DevicesPanel: failed to update capability snapshot",
            nodeId,
            err,
          );
        },
      );
    }
    // Evict tracking entries for peers no longer in peerCapabilities (offline).
    for (const nodeId of lastPersistedCapsRef.current.keys()) {
      if (!peerCapabilities.has(nodeId)) {
        lastPersistedCapsRef.current.delete(nodeId);
      }
    }
  }, [peerCapabilities, onlineNodeIds]);

  const [pasteError, setPasteError] = useState<string | null>(null);

  // Core connect-and-navigate helper shared by all three actions.
  const connectWithIntent = useCallback(
    (targetNodeId: string, targetNickname: string, intent?: PendingIntent) => {
      if (connectingNodeId !== null) return;
      const sessionId = generateSessionId();
      try {
        sessionStorage.setItem(`qb:tc:to:${sessionId}`, targetNodeId);
      } catch {}
      if (intent) {
        try {
          sessionStorage.setItem(
            `${PENDING_INTENT_KEY_PREFIX}${sessionId}`,
            JSON.stringify(intent),
          );
        } catch {}
      }
      setConnectingNodeId(targetNodeId);
      sendTrustedConnect(targetNodeId, sessionId);
      navigate({ to: "/session/$id", params: { id: sessionId } })
        .catch(() => {
          setConnectingNodeId(null);
        });
    },
    [connectingNodeId, sendTrustedConnect, navigate],
  );

  const handleConnect = useCallback(
    (targetNodeId: string, targetNickname: string) => {
      connectWithIntent(targetNodeId, targetNickname);
    },
    [connectWithIntent],
  );

  // "Send tab" — Milestone B. Sends the current page URL to the peer device.
  // generateSessionId() produces a nanoid-style alphanumeric string that
  // passes validateTrustedConnect's SESSION_ID_RE on the recipient side.
  // crypto.randomUUID() must NOT be used here: UUIDs contain hyphens and
  // are 36 chars, both of which fail the /^[a-z0-9]{6,32}$/i validator
  // and cause the trusted-connect broadcast to be silently dropped.
  const handleSendTab = useCallback(
    (targetNodeId: string, targetNickname: string) => {
      const intent: PendingIntent = {
        type: "open-url",
        payload: {
          url: window.location.href,
          title: document.title,
        },
        targetNodeId,
        targetNickname,
      };
      connectWithIntent(targetNodeId, targetNickname, intent);
    },
    [connectWithIntent],
  );

  // "Paste on" — Milestone C. Reads local clipboard then sends the text to peer.
  // Clipboard.readText() is gated on the "clipboard-read" permission (Chrome)
  // but the button click satisfies the user-gesture requirement.
  const handlePasteOn = useCallback(
    async (targetNodeId: string, targetNickname: string) => {
      if (connectingNodeId !== null) return;
      setPasteError(null);
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        setPasteError(
          "Could not read clipboard. Allow clipboard access and try again.",
        );
        return;
      }
      if (!text.trim()) {
        setPasteError("Clipboard is empty.");
        return;
      }
      const intent: PendingIntent = {
        type: "clipboard",
        payload: { text },
        targetNodeId,
        targetNickname,
      };
      connectWithIntent(targetNodeId, targetNickname, intent);
    },
    [connectWithIntent, connectingNodeId],
  );

  // Render nothing while loading or when there are no trusted devices yet.
  if (loading || nodes.length === 0) return null;

  // Whether this device can read the clipboard for "Paste on" actions.
  const canReadClipboard =
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.readText === "function";

  return (
    <section className="mx-auto max-w-5xl rounded-xl border border-border/80 bg-card p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[13px] font-medium tracking-wide text-foreground/90">Your Devices</p>
        <Link
          to="/devices"
          className="text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage
        </Link>
      </div>
      {pasteError && (
        <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive">
          {pasteError}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => {
          const isOnline = onlineNodeIds.has(node.nodeId);
          const liveCaps = peerCapabilities.get(node.nodeId) ?? node.capabilitySnapshot ?? [];
          const peerCanOpenUrl = liveCaps.includes("browser.open");
          const peerCanPaste = liveCaps.includes("clipboard.write");
          const isConnecting = connectingNodeId === node.nodeId;
          const anyConnecting = connectingNodeId !== null;
          return (
            <div
              key={node.nodeId}
              className="group relative overflow-hidden rounded-xl bg-white/[0.035] p-3.5 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                {/* Avatar / Icon with online glow */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background/60">
                  <DeviceIcon kind={node.deviceKind} />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {node.nickname}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground/70">
                    {isOnline
                      ? "Online and ready"
                      : `Last seen ${relativeTime(node.lastSeen)}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isOnline ? "secondary" : "ghost"}
                  className={`h-7 shrink-0 rounded-full px-3.5 text-[11.5px] font-medium transition-all ${
                    isOnline ? "bg-white/10 hover:bg-white/20 text-foreground" : "text-muted-foreground/50"
                  }`}
                  disabled={!isOnline || anyConnecting}
                  onClick={() => handleConnect(node.nodeId, node.nickname)}
                  aria-label={`Connect to ${node.nickname}`}
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
              {/* Action row (OS quick actions style) */}
              {isOnline && (peerCanOpenUrl || (peerCanPaste && canReadClipboard)) && (
                <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 pl-[3.25rem]">
                  {peerCanOpenUrl && (
                    <button
                      type="button"
                      disabled={anyConnecting}
                      onClick={() => handleSendTab(node.nodeId, node.nickname)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                    >
                      Send Tab
                    </button>
                  )}
                  {peerCanPaste && canReadClipboard && (
                    <button
                      type="button"
                      disabled={anyConnecting}
                      onClick={() => void handlePasteOn(node.nodeId, node.nickname)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                    >
                      Paste
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
