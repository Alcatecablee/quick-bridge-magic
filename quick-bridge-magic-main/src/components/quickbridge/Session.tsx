import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactModal } from "./ContactModal";
import { usePostTransferNudge } from "@/hooks/use-post-transfer-nudge";
import { toast } from "sonner";
import {
  Clipboard,
  Copy,
  Download,
  FileIcon,
  FolderOpen,
  HardDriveDownload,
  Send,
  Upload,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Archive,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  RotateCw,
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Pencil,
  Check as CheckIcon,
  History as HistoryIcon,
  Trash2,
  ChevronDown,
  ArrowLeftRight,
  PowerOff,
  Users,
  HelpCircle,
  Loader2,
  Globe,
  Share2,
  Sparkles,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  QrCode,
  KeyRound,
} from "./icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWebRTC, MAX_TEXT_BYTES, RESUME_GRACE_MS, type ConnectionQuality, type SessionEndReason } from "@/hooks/use-webrtc";
import { useBridgeSignal } from "@/lib/bridge-signal";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";
import { SasBadge } from "./SasBadge";
import { QrDisplay } from "./QrDisplay";
import { pinFromSessionId, formatPin } from "@/lib/pin";
import { formatBytes } from "@/lib/session";
import { cn } from "@/lib/utils";
import { deviceLabel, type DeviceKind } from "@/lib/device";
import { playConnectSound, playDisconnectSound, playMessageSound, playReceiveSound, playSendSound, suspendAudio, unlockAudio, setAudioMuted } from "@/lib/sound";
import { useHistory, type HistoryItem } from "@/lib/history";
import { ensureNotificationPermission, notify, notificationsSupported } from "@/lib/notifications";
import { expandDataTransfer, readPaste } from "@/lib/dropzone";
import { usePendingShare } from "@/hooks/use-pending-share";
import { zipFiles } from "@/lib/zip";
import {
  clearPersistedDirectory,
  loadPersistedDirectory,
  pickSaveDirectory,
  requestPersistedDirectoryPermission,
} from "@/lib/streaming";
import {
  StorageKeys,
  readString,
  writeString,
  readJSON,
  writeJSON,
  writeActiveSession,
  clearActiveSession,
  removeKey,
} from "@/lib/storage";
import { trackPeerConnected, trackFileSent, trackFileReceived, trackTrustAdded, trackContinuityAction } from "@/lib/analytics";
import {
  getOrCreateNodeIdentity,
  signChallenge,
  verifyChallenge,
  generateNonce,
  type NodeIdentity,
  type NodeHello,
} from "@/lib/node-identity";
import { p256JwksDiffer } from "@/lib/protocol";
import {
  getTrustedNode,
  getAllTrustedNodes,
  upsertTrustedNode,
  touchTrustedNode,
  type TrustedNode,
} from "@/lib/trusted-nodes-db";
import { supabase } from "@/integrations/supabase/client";
import {
  getPresenceChannelId,
  PRESENCE_CHAN_PREFIX,
} from "@/lib/presence-channel";
import { TrustPrompt } from "./TrustPrompt";
import { ContinuityRuntime, PENDING_INTENT_KEY_PREFIX, type PendingIntent } from "@/lib/continuity-runtime";
import type { IntentEnvelope, IntentAck } from "@/lib/continuity-types";
import { useDeviceDisplayName } from "@/hooks/use-device-name";

interface Props {
  sessionId: string;
  isInitiator: boolean;
}

// Per-peer file size cap. The default protects receivers that buffer the
// whole file in RAM (mobile Safari, Firefox, Chromium without an auto-save
// folder) - a 5 GB transfer would crash those tabs. When the receiver
// advertises stream-to-disk + an active auto-save folder via presence,
// memory is constant and the cap can be raised meaningfully. Even then we
// keep a cap because there's no resume protocol yet, so a dropped
// connection wastes the whole transfer.
const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const DEFAULT_MAX_FILE_LABEL = "2 GB";
const STREAMED_MAX_FILE_BYTES = 10 * 1024 * 1024 * 1024;
const STREAMED_MAX_FILE_LABEL = "10 GB";

// Safety cap on the total bytes held in the mobile-recovery queue. File objects
// pin underlying Blob handles in memory; on Android, exceeding the tab's memory
// budget while waiting for reconnection triggers the OOM killer and silently
// loses everything. Matches the default per-file limit so at least one max-size
// transfer can always be queued.
const MAX_QUEUED_BYTES = 2 * 1024 * 1024 * 1024;

function fileTypeIcon(type: string, className = "h-5 w-5") {
  if (type.startsWith("image/")) return <ImageIcon className={className} />;
  if (type.startsWith("video/")) return <Video className={className} />;
  if (type.startsWith("audio/")) return <Music className={className} />;
  if (type.startsWith("text/") || type.includes("pdf") || type.includes("document"))
    return <FileText className={className} />;
  if (type.includes("zip") || type.includes("compressed") || type.includes("tar") || type.includes("rar"))
    return <Archive className={className} />;
  return <FileIcon className={className} />;
}

function deviceIcon(kind: DeviceKind | null, className = "h-3.5 w-3.5") {
  if (kind === "phone") return <Smartphone className={className} />;
  if (kind === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
}

function formatRate(bytesPerSec: number): string {
  if (!isFinite(bytesPerSec) || bytesPerSec <= 0) return "-";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "-";
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatRelative(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Live countdown toast surfaced the moment a paused incoming transfer
// enters the grace window. Re-renders once a second from its own
// interval so it ticks down even though the parent doesn't re-render.
// Cancel button discards the partial via the same `cancelIncoming`
// path the inline row uses, then dismisses the toast immediately so
// there's no zombie countdown left over.
function PausedTransferToast({
  name,
  pausedAt,
  onCancel,
  onDismiss,
}: {
  name: string;
  pausedAt: number;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, RESUME_GRACE_MS - (Date.now() - pausedAt)),
  );
  useEffect(() => {
    const tick = () =>
      setRemainingMs(Math.max(0, RESUME_GRACE_MS - (Date.now() - pausedAt)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pausedAt]);
  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = (totalSec % 60).toString().padStart(2, "0");
  return (
    <div className="flex w-full items-start gap-3 rounded-md border border-warning/30 bg-surface p-3 text-sm text-foreground shadow-lg">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-[13px] font-semibold">Transfer paused</div>
        <div className="truncate text-[12px] text-muted-foreground">{name}</div>
        <div className="text-[11px] tabular-nums text-muted-foreground">
          Sender disconnected · resuming when they return ({mm}:{ss} left)
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[11px]"
        onClick={() => {
          onCancel();
          onDismiss();
        }}
        aria-label={`Cancel paused transfer ${name}`}
      >
        Cancel
      </Button>
    </div>
  );
}

export function Session({ sessionId, isInitiator }: Props) {
  // Persisted device name
  const [deviceName, setDeviceName] = useState<string>(() => readString(StorageKeys.deviceName) ?? "");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(deviceName);

  // When true, RTCPeerConnection is created with iceTransportPolicy:"relay" so
  // all traffic goes through TURN servers. User-toggled from the stalled
  // diagnostic card to bypass strict firewalls. Cleared automatically when the
  // connection succeeds so it doesn't persist into the next session.
  const [forceRelay, setForceRelay] = useState(false);

  // Phase 2: node identity and trusted device state.
  // Drive the TrustPrompt card shown after the first successful transfer.
  const [peerNodeHello, setPeerNodeHello] = useState<NodeHello | null>(null);
  const [alreadyTrusted, setAlreadyTrusted] = useState(false);
  const [peerTrustVerified, setPeerTrustVerified] = useState(false);
  const [peerTrustFailed, setPeerTrustFailed] = useState(false);
  const [trustPromptDismissed, setTrustPromptDismissed] = useState(false);
  // Shown when a trusted peer presents a different public key for the same
  // nodeId (most often after they cleared browser storage).
  const [keyResetDetected, setKeyResetDetected] = useState(false);

  // Refs that break the circular dependency between the callbacks below
  // (defined before useWebRTC) and the send functions returned by useWebRTC.
  // Populated immediately after the hook call on every render (safe: refs
  // do not trigger re-renders).
  const localIdentityRef = useRef<NodeIdentity | null>(null);
  const peerNodeHelloRef = useRef<NodeHello | null>(null);
  const pendingNonceRef = useRef<string | null>(null);
  const nodeHelloSentRef = useRef(false);
  const seenForTrustRef = useRef(new Set<string>());
  const resolvedPeerNameRef = useRef<string>("Other device");
  // Prevents concurrent trust writes if the user double-taps "Trust this
  // device" or "Trust again" before the first IDB write resolves.
  const trustingInFlightRef = useRef(false);
  const sendNodeHelloRef = useRef<((hello: NodeHello) => void) | null>(null);
  const sendNodeChallengeRef = useRef<((nonce: string) => void) | null>(null);
  const sendNodeVerifyRef = useRef<((nodeId: string, sig: string) => void) | null>(null);
  // Phase 3 Continuity send refs
  const sendContinuityIntentRef = useRef<((envelope: IntentEnvelope) => void) | null>(null);
  const sendIntentAckRef = useRef<((ack: IntentAck) => void) | null>(null);
  // Phase 3 Continuity runtime: session-scoped, created when DC opens.
  const continuityRuntimeRef = useRef<ContinuityRuntime | null>(null);
  // Intents that arrived during the micro-gap between DataChannel open and
  // runtime creation are buffered here and flushed once the runtime is ready.
  const incomingIntentBufferRef = useRef<Array<{ envelope: IntentEnvelope; senderNodeId: string; senderNickname: string }>>([]);
  // Set to true in the status effect when the DataChannel opens but IDB has
  // not resolved yet (first-use race: keypair generation is slower than
  // WebRTC negotiation). The identity load .then() reads this flag and sends
  // the node-hello retroactively once IDB resolves.
  const pendingHelloAfterIdentityRef = useRef(false);
  // Stable refs for the latest deviceName / myDeviceKind values so the
  // dependency-free identity load effect can read current values without
  // stale closures. Updated in the render body after useWebRTC returns.
  const deviceNameRef = useRef(deviceName);
  const myDeviceKindRef = useRef<DeviceKind | null>(null);

  // Called by useWebRTC when the peer sends their node-hello over the DC.
  // Checks the trusted store; host issues a challenge if peer is known.
  const handlePeerNodeHello = useCallback(
    (hello: NodeHello) => {
      peerNodeHelloRef.current = hello;
      setPeerNodeHello(hello);
      getTrustedNode(hello.nodeId)
        .then((existing) => {
          setAlreadyTrusted(!!existing);
          // Both sides challenge each other when a trusted peer is recognised.
          // Removing the isInitiator guard makes authentication mutual: neither
          // side implicitly trusts the other just because they initiated the call.
          if (existing) {
            const nonce = generateNonce();
            pendingNonceRef.current = nonce;
            sendNodeChallengeRef.current?.(nonce);
          }
        })
        .catch((err: unknown) => {
          // IDB unavailable or blocked. Skip the challenge for this session;
          // the transfer still works, only the cryptographic re-verification
          // of a previously trusted device is skipped.
          console.warn("[QB] getTrustedNode failed, skipping challenge", err);
        });
    },
    [],
  );

  // Called by useWebRTC when the host challenges us (guest side).
  // Signs the nonce and sends node-verify back.
  const handleNodeChallenge = useCallback((nonce: string) => {
    signChallenge(nonce)
      .then((sig) => {
        const identity = localIdentityRef.current;
        if (!identity) return;
        sendNodeVerifyRef.current?.(identity.nodeId, sig);
      })
      .catch((err: unknown) => {
        // Signing failed (e.g. IDB unavailable, key corrupt). Log and skip;
        // the peer will treat a missing verify as a trust failure.
        console.warn("[QB] signChallenge failed, skipping verify", err);
      });
  }, []);

  // Called by useWebRTC when the peer sends their signed verify.
  // With mutual authentication both sides call this: guest verifies host and
  // host verifies guest. The pendingNonceRef holds the nonce we sent; we only
  // handle the verify that corresponds to our own challenge.
  const handleNodeVerify = useCallback((nodeId: string, signature: string) => {
    const peerHello = peerNodeHelloRef.current;
    const nonce = pendingNonceRef.current;
    if (!peerHello || !nonce || peerHello.nodeId !== nodeId) return;
    pendingNonceRef.current = null;
    Promise.all([
      verifyChallenge(nonce, signature, peerHello.publicKeyJwk),
      getTrustedNode(nodeId),
    ])
      .then(([valid, stored]) => {
        if (valid) {
          setPeerTrustVerified(true);
          void touchTrustedNode(nodeId, Date.now());
        } else {
          // Detect key reset: same nodeId but different public key coordinates.
          // This almost always means the peer cleared their browser storage and
          // generated a new keypair. Show a calm re-trust prompt rather than
          // a scary impersonation warning, since the scenario is almost always benign.
          const isKeyReset =
            stored !== null &&
            p256JwksDiffer(stored.publicKeyJwk, peerHello.publicKeyJwk);
          if (isKeyReset) {
            setKeyResetDetected(true);
          } else {
            setPeerTrustFailed(true);
            toast.error(
              "Verification failed. This device may not be who it claims to be.",
              { duration: 7000 },
            );
          }
        }
      })
      .catch((err: unknown) => {
        // verifyChallenge or getTrustedNode threw unexpectedly (e.g. IDB error,
        // malformed key). Treat as a non-fatal verification skip: the transfer
        // still works, only the cryptographic re-verification is skipped.
        console.warn("[QB] handleNodeVerify failed", err);
      });
  }, []);

  // Phase 3 Continuity: called by useWebRTC when the peer sends an intent.
  // Passes senderNodeId from the verified session context so it cannot be
  // spoofed from the envelope (finding 3 / review point 3).
  const handleContinuityIntent = useCallback((envelope: IntentEnvelope) => {
    // Reject new intents if the session is terminating.
    const currentStatus = statusRef.current;
    if (currentStatus === "ending" || currentStatus === "ended") {
      sendIntentAckRef.current?.({
        intentId: envelope.intentId,
        status: "failed",
        reasonCode: "SESSION_UNAVAILABLE",
        reasonMessage: "Session is ending.",
      });
      return;
    }
    // Reject new intents during reconnection: do not silently queue work
    // while the transport is down.
    if (currentStatus === "reconnecting") {
      sendIntentAckRef.current?.({
        intentId: envelope.intentId,
        status: "failed",
        reasonCode: "SESSION_UNAVAILABLE",
        reasonMessage: "Session is reconnecting. Please try again once connected.",
      });
      return;
    }
    const runtime = continuityRuntimeRef.current;
    const senderNodeId = peerNodeHelloRef.current?.nodeId ?? "";
    const senderNickname = resolvedPeerNameRef.current;
    if (!runtime) {
      // Runtime is not yet ready (micro-gap between DC open and useEffect).
      // Buffer the intent — it will be flushed immediately once the runtime is created.
      incomingIntentBufferRef.current.push({ envelope, senderNodeId, senderNickname });
      return;
    }
    runtime.handleIncomingIntent(envelope, senderNodeId, senderNickname);
  }, []);

  // Phase 3 Continuity: called by useWebRTC when the peer sends an ACK
  // for an intent we dispatched. Forwarded to the runtime which manages
  // timers and terminal state updates.
  const handleIntentAck = useCallback((ack: IntentAck) => {
    const runtime = continuityRuntimeRef.current;
    if (!runtime) return;
    runtime.handleIncomingAck(ack);
  }, []);

  // Called by the WebRTC hook when it auto-activates relay after exhausting
  // ICE restart attempts. We set forceRelay so the next RTCPeerConnection
  // (created inside the hook after this callback returns) uses relay mode,
  // and surface a toast so the user understands the automatic switch.
  const handleAutoRelay = useCallback(() => {
    setForceRelay(true);
    toast("Activating relay automatically", {
      description:
        "Direct connection attempts failed. Routing through a relay server to restore the bridge.",
      duration: 5000,
    });
  }, []);

  const {
    status,
    endReason,
    quality,
    messages,
    incomingFiles,
    outgoingFiles,
    sendText,
    sendFile,
    retryFile,
    cancelOutgoing,
    dismissOutgoing,
    cancelIncoming,
    releaseIncoming,
    peerCaps,
    myDeviceKind,
    peerPresent,
    peerDeviceKind,
    peerDeviceName,
    reconnectAttempt,
    maxReconnectAttempts,
    sasCode,
    saveDirectory,
    setSaveDirectory,
    streamToDiskSupported,
    manualReconnect,
    endSession,
    bridgeBusy,
    lastAutoResume,
    sendNodeHello,
  sendNodeChallenge,
  sendNodeVerify,
  sendContinuityIntent,
  sendIntentAck,
} = useWebRTC(
  sessionId,
  isInitiator,
  deviceName.trim() || undefined,
  forceRelay,
  handleAutoRelay,
  handlePeerNodeHello,
  handleNodeChallenge,
  handleNodeVerify,
  handleContinuityIntent,
  handleIntentAck,
);
const endSessionRef = useRef(endSession);

// Populate send-function refs and value-tracking refs after each render so
// the dependency-free effects and pre-hook callbacks always read current
// values without stale closures.
sendNodeHelloRef.current = sendNodeHello;
sendNodeChallengeRef.current = sendNodeChallenge;
sendNodeVerifyRef.current = sendNodeVerify;
sendContinuityIntentRef.current = sendContinuityIntent;
sendIntentAckRef.current = sendIntentAck;
// Keep endSessionRef current so the unmount effect below always calls the
// latest version even after React re-renders.
endSessionRef.current = endSession;
deviceNameRef.current = deviceName;
myDeviceKindRef.current = myDeviceKind;

  const resolvedPeerName = useDeviceDisplayName(
    peerTrustFailed ? null : peerNodeHello?.nodeId,
    peerDeviceName,
    peerDeviceKind
  );
  resolvedPeerNameRef.current = resolvedPeerName;

  const navigate = useNavigate();

  // Session cleanup on unmount (navigation away, back button, etc.).
  // Guarantees no zombie WebRTC connection is left open if the user navigates
  // without pressing the explicit Disconnect button. The endSession call is
  // idempotent: if the session is already ending/ended it is a no-op.
  useEffect(() => {
    return () => {
      endSessionRef.current("navigation");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the local ECDSA identity from IndexedDB once on mount. Subsequent
  // DataChannel opens read from the in-memory cache with no IDB round-trip.
  useEffect(() => {
    getOrCreateNodeIdentity()
      .then((identity) => {
        localIdentityRef.current = identity;
        // Race recovery: the DataChannel opened before IDB finished loading
        // (most likely on a first-use cold start where keypair generation is
        // slower than the WebRTC negotiation). The status effect set
        // pendingHelloAfterIdentityRef while identity was null; send the
        // hello retroactively now using stable refs so this effect stays
        // dependency-free.
        if (pendingHelloAfterIdentityRef.current) {
          pendingHelloAfterIdentityRef.current = false;
          nodeHelloSentRef.current = true;
          const hello: NodeHello = {
            nodeId: identity.nodeId,
            publicKeyJwk: identity.publicKeyJwk,
            nickname:
              deviceNameRef.current.trim() ||
              (myDeviceKindRef.current === "phone"
                ? "Phone"
                : myDeviceKindRef.current === "tablet"
                ? "Tablet"
                : "Computer"),
            deviceKind: myDeviceKindRef.current ?? "computer",
          };
          sendNodeHelloRef.current?.(hello);
        }
      })
      .catch((err: unknown) => {
        console.error("[QB] identity load failed", err);
        toast.error(
          "Could not load device identity. Trusted device features are unavailable for this session.",
        );
      });
  }, []);

  // Send node-hello when the DataChannel opens so both peers exchange
  // public keys. Reset all per-connection trust state on disconnect so a
  // reconnect starts a fresh challenge/verify cycle.
  useEffect(() => {
    if (status === "connected") {
      if (!nodeHelloSentRef.current) {
        const identity = localIdentityRef.current;
        if (identity) {
          // Identity ready: send hello immediately.
          nodeHelloSentRef.current = true;
          pendingHelloAfterIdentityRef.current = false;
          const hello: NodeHello = {
            nodeId: identity.nodeId,
            publicKeyJwk: identity.publicKeyJwk,
            nickname:
              deviceName.trim() ||
              (myDeviceKind === "phone"
                ? "Phone"
                : myDeviceKind === "tablet"
                ? "Tablet"
                : "Computer"),
            deviceKind: myDeviceKind,
          };
          sendNodeHelloRef.current?.(hello);
        } else {
          // Identity still loading from IDB (first-use race). Set the
          // pending flag; the identity load .then() will send the hello
          // retroactively once IDB resolves. Do NOT set nodeHelloSentRef
          // here so the guard stays false and the deferred send works.
          pendingHelloAfterIdentityRef.current = true;
        }
      }
    } else {
      // Not connected: reset so the next connection starts fresh.
      nodeHelloSentRef.current = false;
      pendingHelloAfterIdentityRef.current = false;
      peerNodeHelloRef.current = null;
      setPeerNodeHello(null);
      setAlreadyTrusted(false);
      setPeerTrustVerified(false);
      setPeerTrustFailed(false);
      setKeyResetDetected(false);
      pendingNonceRef.current = null;
      seenForTrustRef.current.clear();
      setTransfersCompleted(0);
      // trustPromptDismissed is intentionally NOT reset here so a brief
      // disconnect and reconnect within the same session does not re-surface
      // the prompt after the user already dismissed it.
    }
  }, [status, deviceName, myDeviceKind]);

  // Phase 3 Continuity: runtime lifecycle.
  // The runtime is created once peerTrustVerified is true (ECDSA handshake
  // complete) and torn down when the DataChannel closes.
  // Session-scoped by design (finding 6): refresh clears active intents.
  useEffect(() => {
    if (peerTrustVerified && status === "connected") {
      // Avoid creating a second runtime if one already exists for this
      // connection. peerTrustVerified fires once per session in normal flow.
      if (continuityRuntimeRef.current) return;

      const localNodeId = localIdentityRef.current?.nodeId ?? "";

      const transport = {
        sendIntent(envelope: IntentEnvelope) {
          sendContinuityIntentRef.current?.(envelope);
        },
        sendAck(ack: IntentAck) {
          sendIntentAckRef.current?.(ack);
        },
        connected() {
          return statusRef.current === "connected";
        },
      };

      continuityRuntimeRef.current = new ContinuityRuntime(transport, localNodeId, sessionId);

      // Flush intents that arrived during the micro-gap before the runtime was ready.
      const buffered = incomingIntentBufferRef.current.splice(0);
      for (const { envelope, senderNodeId, senderNickname } of buffered) {
        continuityRuntimeRef.current.handleIncomingIntent(envelope, senderNodeId, senderNickname);
      }
    }

    if (status !== "connected" && status !== "connecting") {
      const rt = continuityRuntimeRef.current;
      if (rt) {
        rt.teardown();
        continuityRuntimeRef.current = null;
      }
      // Discard any buffered intents so stale work does not bleed into
      // the next reconnect cycle.
      incomingIntentBufferRef.current.length = 0;
    }
  }, [peerTrustVerified, status, sessionId]);

  // Phase 3 Continuity: pending intent dispatch.
  // DevicesPanel stores a pending intent in sessionStorage under
  // qb:ci:<sessionId> before navigating here. We dispatch it exactly once,
  // when all three conditions are satisfied: trust verified, status connected,
  // and runtime ready. The try/finally guarantees the storage key is always
  // cleaned up, preventing a malformed payload from haunting future sessions.
  useEffect(() => {
    if (!peerTrustVerified || status !== "connected" || !continuityRuntimeRef.current) return;
    const pendingKey = `${PENDING_INTENT_KEY_PREFIX}${sessionId}`;
    let pending: PendingIntent | null = null;
    try {
      const raw = sessionStorage.getItem(pendingKey);
      if (raw) {
        pending = JSON.parse(raw) as PendingIntent;
      }
    } catch {
      // Malformed sessionStorage payload. Fall through to finally to clean up.
    } finally {
      // Always remove the key so a corrupted payload cannot haunt future sessions.
      try { sessionStorage.removeItem(pendingKey); } catch {}
    }
    if (!pending) return;
    const rt = continuityRuntimeRef.current;
    const { type, payload, targetNodeId, targetNickname } = pending;
    rt.dispatchIntent(
      type,
      targetNodeId,
      targetNickname,
      payload,
      (ack, _retryable) => {
        if (ack.status === "completed") {
          const label =
            type === "clipboard"
              ? `Pasted on ${targetNickname}`
              : `Sent to ${targetNickname}`;
          toast.success(label);
        } else if (ack.status === "requires-user-action") {
          toast.info(`Action required on ${targetNickname}.`, {
            description: ack.reasonMessage ?? "Open the device to complete the action.",
          });
        } else if (ack.status === "permission-denied") {
          toast.error(`${targetNickname} declined.`, {
            description: ack.reasonMessage,
          });
        } else if (ack.status === "failed") {
          toast.error(`Delivery failed.`, {
            description: ack.reasonMessage ?? "Try again.",
          });
        } else if (ack.status === "unsupported") {
          toast.error(`Not supported on ${targetNickname}.`, {
            description: ack.reasonMessage,
          });
        }
      },
    );
  // Depend on status so the effect re-evaluates once the runtime is confirmed
  // connected and ready. Without status in the dep array, an early fire when
  // peerTrustVerified becomes true but status is still "connecting" would
  // silently abort, and the effect would never retry.
  }, [peerTrustVerified, status, sessionId]);

  // Monotonic counter of successfully completed file transfers this session.
  // Tracked separately from incomingFiles/outgoingFiles so the count survives
  // file-row dismissals and does not drop back to zero before the prompt shows.
  const [transfersCompleted, setTransfersCompleted] = useState(0);
  useEffect(() => {
    let added = false;
    for (const f of [...incomingFiles, ...outgoingFiles]) {
      if ((f.state === "verified" || f.state === "completed") && !f.error && !seenForTrustRef.current.has(f.id)) {
        seenForTrustRef.current.add(f.id);
        added = true;
      }
    }
    if (added) setTransfersCompleted(seenForTrustRef.current.size);
  }, [incomingFiles, outgoingFiles]);

  // Show the trust prompt when connected, peer shared their hello, at least
  // one transfer completed, peer not already trusted, not dismissed, and
  // no verification failure (failure shows its own error toast).
  const showTrustPrompt =
    status === "connected" &&
    !!peerNodeHello &&
    transfersCompleted > 0 &&
    !alreadyTrusted &&
    !trustPromptDismissed &&
    !peerTrustFailed &&
    !keyResetDetected;

  // When the Trust card becomes visible, dismiss any queued toasts so they
  // don't compete with the trust decision. The card is inline and prominent;
  // transient toasts firing at the same moment push it out of the user's focus.
  useEffect(() => {
    if (showTrustPrompt) toast.dismiss();
  }, [showTrustPrompt]);

  // Writes the peer as a trusted node in IndexedDB when the user taps
  // "Trust this device" in the TrustPrompt card.
  const handleTrustDevice = useCallback(async () => {
    if (trustingInFlightRef.current) return;
    const peerHello = peerNodeHelloRef.current;
    if (!peerHello) return;
    trustingInFlightRef.current = true;
    try {
      const node: TrustedNode = {
        nodeId: peerHello.nodeId,
        publicKeyJwk: peerHello.publicKeyJwk,
        nickname: peerHello.nickname,
        deviceKind: peerHello.deviceKind,
        trustLevel: "trusted",
        capabilitySnapshot: ["files"],
        lastSeen: Date.now(),
        createdAt: Date.now(),
      };
      await upsertTrustedNode(node);
      setAlreadyTrusted(true);
      setTrustPromptDismissed(true);
      toast.success(
        `"${peerHello.nickname}" saved. Tap their name next time to connect instantly.`,
      );
      // Fire-and-forget: read the new total count and report it to analytics.
      // This is the primary signal for the Phase 2 kill criteria proxy
      // ("fraction of sessions with >= 2 trusted devices").
      getAllTrustedNodes()
        .then((nodes) => trackTrustAdded(nodes.length))
        .catch(() => {});
    } catch (err: unknown) {
      console.error("[QB] trust write failed", err);
      toast.error("Could not save trusted device. Try again.");
    } finally {
      trustingInFlightRef.current = false;
    }
  }, []);

  // Re-trusts a peer whose public key changed (key reset scenario).
  // Replaces the stored public key while preserving the original createdAt
  // timestamp and capability snapshot so the device history is not lost.
  const handleKeyResetTrust = useCallback(async () => {
    if (trustingInFlightRef.current) return;
    const peerHello = peerNodeHelloRef.current;
    if (!peerHello) return;
    trustingInFlightRef.current = true;
    try {
      const existing = await getTrustedNode(peerHello.nodeId);
      const node: TrustedNode = {
        nodeId: peerHello.nodeId,
        publicKeyJwk: peerHello.publicKeyJwk,
        nickname: existing?.nickname ?? peerHello.nickname,
        deviceKind: peerHello.deviceKind,
        trustLevel: "trusted",
        capabilitySnapshot: existing?.capabilitySnapshot ?? ["files"],
        lastSeen: Date.now(),
        createdAt: existing?.createdAt ?? Date.now(),
      };
      await upsertTrustedNode(node);
      setAlreadyTrusted(true);
      setKeyResetDetected(false);
      setPeerTrustFailed(false);
      toast.success(
        `"${peerHello.nickname}" trusted again with new identity.`,
      );
      // Fire-and-forget: report the updated total count for the kill criteria proxy.
      getAllTrustedNodes()
        .then((nodes) => trackTrustAdded(nodes.length))
        .catch(() => {});
    } catch (err: unknown) {
      console.error("[QB] key-reset trust write failed", err);
      toast.error("Could not save device identity. Try again.");
    } finally {
      trustingInFlightRef.current = false;
    }
  }, []);

  const [contactOpen, setContactOpen] = useState(false);
  const [bridgeEnded, setBridgeEnded] = useState(false);
  const { maybeNudge } = usePostTransferNudge(() => setContactOpen(true));

  // Heartbeat the active session so the home page can offer "Resume bridge"
  // if the user navigates back.
  useEffect(() => {
    if (!sessionId || bridgeBusy) return;
    const beat = () =>
      writeActiveSession({ id: sessionId, role: isInitiator ? "host" : "guest", ts: Date.now() });
    beat();
    const id = window.setInterval(beat, 5000);
    return () => window.clearInterval(id);
  }, [sessionId, isInitiator, bridgeBusy]);

  // Surface a live-countdown toast the moment any incoming transfer enters
  // the resume grace window, and dismiss it the instant the same transfer
  // resumes, is cancelled, or expires. Tracked per file id in a ref so a
  // re-render can never fire a duplicate toast for the same pause event.
  const pausedToastIdsRef = useRef<Map<string, string | number>>(new Map());
  useEffect(() => {
    const tracked = pausedToastIdsRef.current;
    const stillPaused = new Set<string>();
    for (const file of incomingFiles) {
      if (!file.paused || !file.pausedAt) continue;
      const id = file.id;
      stillPaused.add(id);
      if (tracked.has(id)) continue;
      const pausedAt = file.pausedAt;
      const fileName = file.name;
      const remainingMs = Math.max(0, RESUME_GRACE_MS - (Date.now() - pausedAt));
      const toastId = toast.custom(
        (t) => (
          <PausedTransferToast
            name={fileName}
            pausedAt={pausedAt}
            onCancel={() => cancelIncoming(id)}
            onDismiss={() => toast.dismiss(t)}
          />
        ),
        // Auto-dismiss right around the time the grace window expires so a
        // stale countdown can't outlive the actual transfer state.
        { id: `paused:${id}`, duration: remainingMs + 500 },
      );
      tracked.set(id, toastId);
    }
    for (const [id, toastId] of tracked) {
      if (!stillPaused.has(id)) {
        toast.dismiss(toastId);
        tracked.delete(id);
      }
    }
  }, [incomingFiles, cancelIncoming]);
  // Clean up any in-flight paused-toasts on unmount so they don't leak
  // past the session route.
  useEffect(() => {
    const tracked = pausedToastIdsRef.current;
    return () => {
      for (const toastId of tracked.values()) toast.dismiss(toastId);
      tracked.clear();
    };
  }, []);

  // Tier 2 auto-resume surface: when the hook reports a batched resume
  // sweep, fire one summary toast (not one per file) so the user sees
  // the recovery happen without a wall of notifications. The hook
  // increments `ts` per batch, so this effect runs once per sweep even
  // if `count` repeats.
  useEffect(() => {
    if (!lastAutoResume) return;
    const { count } = lastAutoResume;
    toast.success(
      count === 1
        ? "Connection restored. Resuming transfer…"
        : `Connection restored. Resuming ${count} transfers…`,
      { id: `auto-resume:${lastAutoResume.ts}`, duration: 4000 },
    );
  }, [lastAutoResume]);

  // Brief per-row "Resumed" indicator. Derived from a real state
  // transition (a row that was in a retryable error state and is now
  // actively sending again), NOT from auto-resume events. This way the
  // badge only appears when bytes are actually flowing again, never on
  // a resume attempt that immediately re-failed. Auto-clears at 3s.
  const [resumedRowIds, setResumedRowIds] = useState<Record<string, number>>({});
  const prevOutgoingRetryableRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const prev = prevOutgoingRetryableRef.current;
    const nextRetryable: Record<string, boolean> = {};
    const newlyResumed: string[] = [];
    for (const f of outgoingFiles) {
      const wasRetryable = !!prev[f.id];
      const isActivelySending = f.state === "sending" || f.state === "resuming";
      if (wasRetryable && isActivelySending) newlyResumed.push(f.id);
      nextRetryable[f.id] = !!(f.error && f.retryable);
    }
    prevOutgoingRetryableRef.current = nextRetryable;
    if (newlyResumed.length === 0) return;
    const stamp = Date.now();
    setResumedRowIds((s) => {
      const merged = { ...s };
      for (const id of newlyResumed) merged[id] = stamp;
      return merged;
    });
    const timer = window.setTimeout(() => {
      setResumedRowIds((s) => {
        const filtered = { ...s };
        // Only clear ids we just stamped. A later resume of the same
        // row would overwrite the stamp and start its own 3s timer.
        for (const id of newlyResumed) {
          if (filtered[id] === stamp) delete filtered[id];
        }
        return filtered;
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [outgoingFiles]);

  // Host-not-found dead-state: progressive wording so the wait doesn't feel
  // abrupt on slow networks.
  //   0-6s  : default "Waiting for the host…" header
  //   6-30s : eyebrow flips to "Still trying…"
  //   30s+  : full dead-end card with Retry / Go home
  //
  // The generous window is intentional: on the first reconnect after both
  // devices return to the home page, the host's device must receive the
  // guest's hello, navigate from the home/lobby page to /session/$id, and
  // re-subscribe to Supabase with the "host" presence key before the guest
  // can detect it. That transition + Supabase round-trip typically takes
  // 2 to 6 s, but can be longer on slower connections. Showing "host not
  // found" at 6 s almost guarantees a false-positive dead-end on those
  // networks; 30 s gives the host ample time to be ready.
  const [hostMissing, setHostMissing] = useState(false);
  const [stillTrying, setStillTrying] = useState(false);
  useEffect(() => {
    if (isInitiator) return;
    if (peerPresent || status !== "waiting") {
      setHostMissing(false);
      setStillTrying(false);
      return;
    }
    const tStill = window.setTimeout(() => setStillTrying(true), 6000);
    const tMissing = window.setTimeout(() => setHostMissing(true), 30000);
    return () => {
      window.clearTimeout(tStill);
      window.clearTimeout(tMissing);
    };
  }, [isInitiator, peerPresent, status]);

  // Trusted-connect session awareness.
  //
  // DevicesPanel stores two sessionStorage keys before navigating:
  //   qb:tc:from:{sessionId} — the fromNodeId the GUEST received (so they know
  //                            who is calling before the DataChannel opens).
  //   qb:tc:to:{sessionId}   — the targetNodeId the HOST sent a trusted-connect
  //                            to (so they know who they're waiting for, and we
  //                            can surface a timeout if the peer never arrives).
  //
  // Both keys are cleaned up when the session first connects or on unmount.

  // Name of the trusted device that initiated this session (guest-side only).
  const [connectingFromName, setConnectingFromName] = useState<string | null>(null);
  // Name of the trusted device the host is waiting for (host-side only).
  const [trustedConnectTargetName, setTrustedConnectTargetName] = useState<string | null>(null);
  // nodeId of the device the host sent a trusted-connect to. Stored alongside
  // trustedConnectTargetName so the resend handler can re-broadcast to the
  // same device without requiring the user to navigate back to the home screen.
  const trustedConnectTargetNodeIdRef = useRef<string | null>(null);
  // Set true after 30 s of waiting without the peer connecting (host-side,
  // trusted-connect sessions only). Shows an explicit timeout message.
  const [trustedConnectTimedOut, setTrustedConnectTimedOut] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const fromKey = `qb:tc:from:${sessionId}`;
    const toKey = `qb:tc:to:${sessionId}`;

    const fromNodeId = (() => { try { return sessionStorage.getItem(fromKey); } catch { return null; } })();
    const toNodeId = (() => { try { return sessionStorage.getItem(toKey); } catch { return null; } })();

    // Guest: look up who is connecting.
    if (!isInitiator && fromNodeId) {
      getTrustedNode(fromNodeId)
        .then((node) => {
          if (node) setConnectingFromName(node.nickname);
        })
        .catch(() => {});
    }

    // Host: look up who we are waiting for.
    if (isInitiator && toNodeId) {
      // Cache the nodeId in a ref so the resend handler can use it later
      // without reading sessionStorage again (the key is cleaned up on unmount).
      trustedConnectTargetNodeIdRef.current = toNodeId;
      getTrustedNode(toNodeId)
        .then((node) => {
          if (node) setTrustedConnectTargetName(node.nickname);
        })
        .catch(() => {});
    }

    return () => {
      // Clean up keys on unmount so stale info never leaks into the next session.
      try { sessionStorage.removeItem(fromKey); } catch {}
      try { sessionStorage.removeItem(toKey); } catch {}
    };
  // Intentionally run once on mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-broadcasts a trusted-connect invitation to the same target device.
  // Called when the 30-second timeout fires and the user taps "Send invite again".
  // Uses a one-shot transient Supabase channel (same pattern as usePresence's
  // sendTrustedConnect transient path) so Session.tsx does not need to own a
  // persistent presence subscription.
  const handleResendTrustedConnect = useCallback(async () => {
    const targetNodeId = trustedConnectTargetNodeIdRef.current;
    if (!targetNodeId) return;
    // Prevent concurrent in-flight resends (e.g. rapid button taps). Each
    // resend opens a transient Supabase channel; without this guard multiple
    // channels would pile up and each fire its own success toast.
    if (resendingInvite) return;
    setResendingInvite(true);
    try {
      const { nodeId: localNodeId } = await getOrCreateNodeIdentity();
      const targetChannelId = await getPresenceChannelId(targetNodeId);
      const payload = { fromNodeId: localNodeId, targetNodeId, sessionId };
      const ch = supabase.channel(`${PRESENCE_CHAN_PREFIX}${targetChannelId}`, {
        config: { broadcast: { self: false } },
      });
      ch.subscribe((s: string) => {
        if (s === "SUBSCRIBED") {
          void ch
            .send({ type: "broadcast", event: "trusted-connect", payload })
            .catch(() => {})
            .finally(() => {
              setTimeout(() => {
                try { supabase.removeChannel(ch); } catch {}
              }, 3000);
              setResendingInvite(false);
            });
          toast.success("Invite sent again");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          try { supabase.removeChannel(ch); } catch {}
          setResendingInvite(false);
          toast.error("Could not send invite. Check your connection and try again.");
        }
      });
    } catch (err: unknown) {
      // getOrCreateNodeIdentity or getPresenceChannelId threw (IDB unavailable
      // or SubtleCrypto blocked). This is a local device issue, not a network
      // one, so the wording is distinct from the CHANNEL_ERROR toast above.
      console.error("[QB] handleResendTrustedConnect: identity or channel lookup failed", err);
      setResendingInvite(false);
      toast.error("Could not prepare invite. Try reloading the page.");
    }
  }, [sessionId, resendingInvite]);

  // Initiator timeout: if this is a trusted-connect session and the peer has
  // not connected after 30 s, surface a clear message so the host knows
  // the broadcast was likely not received and can try QR pairing instead.
  useEffect(() => {
    if (!isInitiator || !trustedConnectTargetName) return;
    if (peerPresent || status !== "waiting") {
      setTrustedConnectTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setTrustedConnectTimedOut(true), 30000);
    return () => window.clearTimeout(t);
  }, [isInitiator, trustedConnectTargetName, peerPresent, status]);

  // End-bridge: cleanly close peer, clear active-session marker, rotate the
  // host's stored session id (so a fresh QR is generated on return), and go
  // home. The hook's signaling-effect cleanup tears down the channel + PC
  // when this component unmounts on navigate.
  // Mobile recovery: when the tab returns to foreground, the OS may have
  // suspended the WebRTC connection while we were minimized. Kick off a
  // reconnect immediately instead of waiting for the next backoff tick.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (status === "connected" || status === "connecting") return;
      // Stamp before calling so the handleFiles guard (which fires shortly
      // after on the same return-from-picker event) sees the recent timestamp
      // and skips its own manualReconnect() call.
      lastManualReconnectRef.current = Date.now();
      manualReconnect();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, manualReconnect]);

  // Hold a Screen Wake Lock while connected or reconnecting so mobile
  // browsers don't suspend the page during active transfers. Best-effort:
  // not supported everywhere (absent on iOS Safari entirely).
  //
  // The browser releases the sentinel automatically whenever the tab
  // becomes hidden, firing a "release" event on the sentinel object. The
  // previous implementation never listened for that event, so `sentinel`
  // stayed non-null after the browser released it and the !sentinel guard
  // in the visibilitychange handler would never allow reacquire. This
  // version listens for the sentinel's own "release" event and nulls the
  // ref so the reacquire path fires correctly when the tab returns.
  //
  // Extending coverage to "reconnecting": the backoff window can be up to
  // 48 s with 6 attempts and 8 s max delay. Releasing the lock the moment
  // status flips to "reconnecting" defeats the purpose on mobile, where
  // the screen locking is exactly what causes the connection to drop.
  useEffect(() => {
    if (status !== "connected" && status !== "reconnecting") return;
    type Sentinel = {
      release: () => Promise<void>;
      released: boolean;
      addEventListener: (type: string, listener: () => void) => void;
    };
    const navAny = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<Sentinel> };
    };
    if (!navAny.wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (cancelled) return;
      try {
        const s = await navAny.wakeLock!.request("screen");
        if (cancelled) {
          // Effect cleanup ran while the async request was in flight.
          // Release immediately so we don't hold a lock nobody owns.
          s.release().catch(() => {});
          return;
        }
        // The browser may have fired the "release" event on `s` between
        // when the Promise resolved and when we reach this line (the
        // microtask queue can process it before our .then continuation).
        // In that case the sentinel is already dead: assigning it would
        // leave a non-null sentinel that never receives the "release"
        // listener and therefore never clears, blocking the reacquire
        // path in onVis permanently.
        if (s.released) return;
        sentinel = s;
        // Null the ref when the browser releases the sentinel (e.g. tab
        // hidden, document loses focus). Without this the !sentinel check
        // in onVis is always false after the first acquire and the
        // reacquire path never fires when the tab returns to foreground.
        sentinel.addEventListener("release", () => { sentinel = null; });
      } catch {
        // Wake Lock unavailable, permission denied, or page not visible
        // at request time. Best-effort: ignore and let the tab sleep if
        // necessary.
      }
    };
    void acquire();
    const onVis = () => {
      if (cancelled) return;
      if (document.visibilityState === "visible" && !sentinel) void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [status]);

  // Guard against calling manualReconnect() twice in rapid succession when both
  // the visibilitychange handler and handleFiles fire within the same event-loop
  // window (common on Android Chrome when returning from the file picker).
  // visibilitychange fires first (calls manualReconnect → teardown → startOffer),
  // then onChange fires and handleFiles runs with a stale "reconnecting" status
  // closure and calls manualReconnect() again, tearing down the brand-new PC
  // mid-negotiation and causing the offer to fail. A 1 s debounce prevents the
  // second call from firing while the first offer is still completing.
  const lastManualReconnectRef = useRef<number>(0);

  const endBridge = useCallback(() => {
    endSession("local_disconnect");
  }, [endSession]);

  // confirmEndBridge: used when the user confirms they want to end while a
  // transfer is in progress. Delegates to endSession which handles atomic
  // transfer cancellation and peer notification.
  const confirmEndBridge = useCallback(() => {
    endSession("local_disconnect");
  }, [endSession]);


  const shareQuickBridge = useCallback(() => {
    const url = "https://quickbridge.app";
    const text = "Send files between your phone and PC in seconds. No app, no account, just scan a QR code.";
    const copyFallback = () =>
      navigator.clipboard?.writeText(url)
        .then(() => toast.success("Link copied to clipboard"))
        .catch(() => toast.error("Could not copy link"));
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "QuickBridge", text, url }).catch(copyFallback);
    } else {
      copyFallback();
    }
  }, []);

  const discardQueued = useCallback(() => {
    if (pendingFilesRef.current.length === 0) return;
    const dropped = pendingFilesRef.current.length;
    pendingFilesRef.current = [];
    setPendingFiles([]);
    toast(`Discarded ${dropped} queued file${dropped === 1 ? "" : "s"}`);
  }, []);

  const discardPendingFile = useCallback((index: number) => {
    const f = pendingFilesRef.current[index];
    if (!f) return;
    pendingFilesRef.current.splice(index, 1);
    setPendingFiles([...pendingFilesRef.current]);
    toast(`Removed "${f.name}" from queue`);
  }, []);

  // One-time hint shown the first time a touch user opens the file picker:
  // explains why the connection may briefly drop and that we'll auto-send.
  // Without this, a queued-and-recovered file looks like a glitch instead of
  // a deliberate, robust behaviour.
  const handleChooseFiles = useCallback(() => {
    if (typeof window !== "undefined") {
      const seen = readJSON<boolean>(StorageKeys.mobilePickerHintSeen, false);
      const isTouch =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      if (!seen && isTouch && status === "connected") {
        toast("Heads up", {
          description:
            "Picking a file may briefly pause the link. We'll send it automatically when reconnected.",
          duration: 6000,
        });
        writeJSON(StorageKeys.mobilePickerHintSeen, true);
      }
    }
    fileInputRef.current?.click();
  }, [status]);

  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [now, setNow] = useState(Date.now());
  // Increments each time we transition into "connected" - drives a one-shot burst animation.
  const [connectBurst, setConnectBurst] = useState(0);
  const connectedAtRef = useRef<number | null>(null);
  const reconnectStartedAtRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const stalledNotifiedRef = useRef(false);
  const prevStatusRef = useRef(status);
  // Live mirror of status so setTimeout callbacks can read the freshest value
  // without being re-created on every status change.
  const statusRef = useRef(status);
  statusRef.current = status;
  const prevQualityRef = useRef<ConnectionQuality>(quality);
  // Verification timer: scheduled when the debounce in handleFiles suppresses
  // a manualReconnect call. Fires after 3 s to retry if still reconnecting.
  const reconnectVerifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (reconnectVerifyTimerRef.current) clearTimeout(reconnectVerifyTimerRef.current);
    };
  }, []);
  // Mobile recovery queue: files chosen while the WebRTC peer is in any
  // recoverable non-connected state (reconnecting / connecting /
  // mid-handshake) are held here and auto-flushed on the next "connected"
  // transition. Without this, the file picker round-trip on Android silently
  // drops the selection: opening the OS picker backgrounds the tab, the OS
  // suspends the WebRTC peer, and on slow devices the reconnect attempt
  // budget can be fully exhausted (status="ended") before the user
  // finishes picking. `pendingFiles` is a state mirror so the inline banner
  // can re-render reactively while the ref holds the actual File objects.
  const pendingFilesRef = useRef<File[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const pendingCount = pendingFiles.length;

  // History (per-session)
  const history = useHistory(sessionId);

  // Remove a history item immediately and offer a brief undo via toast.
  const removeHistoryItem = useCallback(
    (item: HistoryItem) => {
      history.remove(item.id);
      toast("Removed from history", {
        duration: 4000,
        action: {
          label: "Undo",
          onClick: () => history.add(item),
        },
      });
    },
    [history],
  );

  // In-memory cache of File objects for sent files (so re-send works in this session)
  const sentSourcesRef = useRef<Record<string, File>>({});
  const seenSentRef = useRef<Set<string>>(new Set());
  const seenReceivedRef = useRef<Set<string>>(new Set());
  const seenMessagesRef = useRef<Set<string>>(new Set());

  // Auto-clipboard share toggle (per-session)
  const autoClipKey = StorageKeys.autoClipboard(sessionId);
  const [autoClip, setAutoClip] = useState<boolean>(() => readJSON<boolean>(autoClipKey, false));
  useEffect(() => {
    writeJSON(autoClipKey, autoClip);
  }, [autoClip, autoClipKey]);

  // Zip-before-send toggle: when on, multiple files picked at once are bundled
  // into a single zip archive before being sent. Handy for batch photo transfers
  // where the receiver prefers one download over many separate browser prompts.
  const [zipMode, setZipMode] = useState(false);
  const zipAbortRef = useRef<AbortController | null>(null);

  // Sound mute toggle - gates all audio in sound.ts via setAudioMuted
  const [soundMuted, setSoundMuted] = useState(false);
  useEffect(() => { setAudioMuted(soundMuted); }, [soundMuted]);

  // Track quality transitions over the lifetime of the connection. Each entry
  // records the quality value when it changed so the UI can show a trail of
  // direct/relay flips (e.g. "D D R D" pills). Capped at 12 entries.
  const [qualityHistory, setQualityHistory] = useState<Array<{ ts: number; quality: ConnectionQuality }>>([]);
  useEffect(() => {
    if (status !== "connected") {
      setQualityHistory([]);
      return;
    }
    if (quality === "unknown") return;
    setQualityHistory((h) => {
      const last = h[h.length - 1];
      if (last?.quality === quality) return h;
      const next = [...h, { ts: Date.now(), quality }];
      return next.length > 12 ? next.slice(-12) : next;
    });
  }, [quality, status]);

  // 6-digit PIN derived from sessionId (host only - guests don't need to share it)
  const [pin, setPin] = useState("");
  useEffect(() => {
    if (!isInitiator || !sessionId) return;
    pinFromSessionId(sessionId)
      .then(setPin)
      .catch(() => {
        // SHA-256 derivation failure (extremely rare). Show dashes so the
        // PIN row doesn't stay in an indefinite spinner state.
        setPin("------");
      });
  }, [isInitiator, sessionId]);

  // Pair URL for QR code and copy-link
  const pairUrl = useMemo(
    () => (isInitiator && typeof window !== "undefined" ? `${window.location.origin}/s/${sessionId}` : ""),
    [isInitiator, sessionId],
  );

  // Notification permission state - read once on mount, updated after requesting
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(() =>
    notificationsSupported() ? Notification.permission : "unsupported",
  );

  // Drive a low-frequency tick so live transfer rates/ETAs update smoothly.
  useEffect(() => {
    const hasActive =
      outgoingFiles.some((f) => f.state === "sending" || f.state === "resuming") || incomingFiles.some((f) => f.state === "receiving");
    if (!hasActive) return;
    const id = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(id);
  }, [outgoingFiles, incomingFiles]);

  // Tick once a minute for relative timestamps in history
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Notify on incoming files & log to history.
  // ID-based detection (not count-based) so that:
  //   a) releasing a done row doesn't make the next completion miss its toast, and
  //   b) errored files (done=true, error set) never fire the success toast/sound.
  useEffect(() => {
    let newSuccessCount = 0;
    let newSuccessBytes = 0;
    for (const f of incomingFiles) {
      if (f.state !== "verified" && f.state !== "failed" && f.state !== "cancelled") continue;
      if (seenReceivedRef.current.has(f.id)) continue;
      seenReceivedRef.current.add(f.id);
      if (f.error) continue; // failed transfer: skip toast, sound, and history
      newSuccessCount++;
      newSuccessBytes += f.size;
      history.add({
        kind: "file",
        direction: "received",
        id: `r:${f.id}`,
        name: f.name,
        size: f.size,
        type: f.type,
        ts: f.completedAt ?? Date.now(),
      });
      notify(
        "File received",
        f.savedToDisk
          ? `${f.name} · saved to ${saveDirectory?.label ?? "your folder"}`
          : `${f.name} · ${formatBytes(f.size)}`,
        `recv:${f.id}`,
      );
    }
    if (newSuccessCount > 0) {
      // No toast here — the file row updates, the sound plays, and the OS
      // notification fires when the tab is in the background. A redundant
      // "File received" toast would compete with the TrustPrompt card that
      // appears after the first transfer completes.
      playReceiveSound();
      if (typeof navigator !== "undefined" && "vibrate" in navigator && document.hasFocus()) navigator.vibrate?.([60, 40, 80]);
      maybeNudge();
      trackFileReceived({ count: newSuccessCount, totalBytes: newSuccessBytes });
    }
  }, [incomingFiles, history, saveDirectory]);

  // Log sent files, play send sound, and track source availability
  useEffect(() => {
    let newSuccessCount = 0;
    let newSuccessBytes = 0;
    for (const f of outgoingFiles) {
      if ((f.state === "completed" || f.state === "failed") && !seenSentRef.current.has(f.id)) {
        seenSentRef.current.add(f.id);
        if (!f.error) { newSuccessCount++; newSuccessBytes += f.size; }
        history.add({
          kind: "file",
          direction: "sent",
          id: `s:${f.id}`,
          name: f.name,
          size: f.size,
          type: f.type,
          ts: f.completedAt ?? Date.now(),
          sourceAvailable: !!sentSourcesRef.current[f.id],
        });
        notify("File sent", `${f.name} · ${formatBytes(f.size)}`, `sent:${f.id}`);
      }
    }
    if (newSuccessCount > 0) {
      playSendSound();
      maybeNudge();
      trackFileSent({ count: newSuccessCount, totalBytes: newSuccessBytes });
    }
  }, [outgoingFiles, history]);

  // Log messages (both directions)
  useEffect(() => {
    for (const m of messages) {
      const tag = `${m.from}:${m.id}`;
      if (seenMessagesRef.current.has(tag)) continue;
      seenMessagesRef.current.add(tag);
      history.add({
        kind: m.kind,
        direction: m.from === "me" ? "sent" : "received",
        id: `m:${m.id}`,
        content: m.content,
        ts: m.ts,
      });
    }
  }, [messages, history]);

  useEffect(() => {
    if (status === "reconnecting" && prevStatusRef.current === "connected") {
      toast.warning("Connection lost - reconnecting…", {
        id: "qb-status",
        description: "We'll try to restore your bridge automatically.",
      });
    }
    if (status === "ended" && prevStatusRef.current !== "ended") {
      connectedAtRef.current = null;
      reconnectStartedAtRef.current = null;
      clearActiveSession();
      if (isInitiator) removeKey(StorageKeys.hostSessionId);
      pendingFilesRef.current = [];
      setPendingFiles([]);
      suspendAudio();
      // Route based on why the session ended.
      const reason = endReason;
      if (reason === "local_disconnect" || reason === "navigation" || reason === null) {
        // Silent: user explicitly left. navigate without a toast.
        navigate({ to: "/" });
      } else if (reason === "remote_disconnect" || reason === "browser_closed") {
        // Remote party ended: inform user and return home.
        playDisconnectSound();
        toast("Bridge ended", {
          id: "qb-status",
          description: "The other device disconnected.",
        });
        navigate({ to: "/" });
      } else if (reason === "timeout" || reason === "transport_lost" || reason === "error") {
        // Connection failed unrecoverably: stay on page to show inline error UI.
        // The `ended` status + `endReason` are used by the render below.
        playDisconnectSound();
      } else if (
        reason === "verification_failed" ||
        reason === "key_changed" ||
        reason === "session_expired"
      ) {
        // Security/expiry: stay on page; inline UI handles it.
        playDisconnectSound();
      }
    }
    if (status === "connected" && prevStatusRef.current !== "connected") {
      if (!connectedAtRef.current) connectedAtRef.current = Date.now();
      reconnectStartedAtRef.current = null;
      notify("Bridge connected", `${resolvedPeerName} joined the session`, "qb-connect");
      stalledNotifiedRef.current = false;
      setForceRelay(false);
      trackPeerConnected(quality);
      // Cancel any pending reconnect-verification timer: we're connected now.
      if (reconnectVerifyTimerRef.current) {
        clearTimeout(reconnectVerifyTimerRef.current);
        reconnectVerifyTimerRef.current = null;
      }
      if (prevStatusRef.current === "reconnecting") {
        toast.success("Reconnected", { id: "qb-status" });
      }
      playConnectSound();
      if (typeof navigator !== "undefined" && "vibrate" in navigator && document.hasFocus()) navigator.vibrate?.(40);
      setConnectBurst((n) => n + 1);
    }
    prevStatusRef.current = status;
  }, [status, endReason]);

  // Reset the countdown baseline on every reconnect attempt — not just the
  // first one. The status effect above only fires when `status` changes, so
  // it fires once when we enter "reconnecting" and never again for attempts
  // 2-6 while we remain in "reconnecting". Using a separate effect keyed on
  // `reconnectAttempt` ensures each attempt gets a fresh timestamp so the
  // displayed "Retrying in N s…" always counts down from the actual delay
  // for that attempt rather than from when reconnecting first began.
  useEffect(() => {
    if (status === "reconnecting") {
      reconnectStartedAtRef.current = Date.now();
    }
  }, [reconnectAttempt, status]);

  // Surface quality transitions so the user understands sudden slowness.
  // We only fire toasts on real flips between known qualities (direct ↔ relay)
  // and only while connected. Flicker through "unknown" during reconnect
  // shouldn't trigger noise. The persistent inline notice in the file-picker
  // card covers the steady-state "you're on a relay right now" case.
  useEffect(() => {
    const prev = prevQualityRef.current;
    if (status === "connected" && prev !== quality) {
      if (prev !== "relay" && quality === "relay") {
        toast.warning("Going through a relay", {
          id: "qb-quality",
          description:
            "A direct path was blocked, so traffic is going through a TURN server. Still end-to-end encrypted, just slower.",
        });
      } else if (prev === "relay" && quality === "direct") {
        toast.success("Direct connection restored", {
          id: "qb-quality",
          description: "Transfers will be faster now.",
        });
      }
    }
    prevQualityRef.current = quality;
  }, [quality, status]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== "peer" || last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;
    const title = last.kind === "clipboard" ? "Clipboard received" : "Message received";
    const preview = last.content.length > 80 ? `${last.content.slice(0, 80)}…` : last.content;
    toast(title, { description: preview });
    playMessageSound();
    if (typeof navigator !== "undefined" && "vibrate" in navigator && document.hasFocus()) navigator.vibrate?.(30);
    notify(title, preview, `msg:${last.id}`);
  }, [messages]);

  const peerStreamingToDisk = !!(peerCaps && peerCaps.stream && peerCaps.save);
  // When streaming to disk the receiver writes straight to disk with constant
  // memory, so we allow the high cap. Otherwise respect the receiver's
  // advertised safe in-memory limit (peerCaps.memBytes), falling back to
  // DEFAULT_MAX_FILE_BYTES for older clients or desktops without FSA.
  const effectiveMaxBytes = peerStreamingToDisk
    ? STREAMED_MAX_FILE_BYTES
    : (peerCaps?.memBytes ?? DEFAULT_MAX_FILE_BYTES);
  const effectiveMaxLabel = peerStreamingToDisk
    ? STREAMED_MAX_FILE_LABEL
    : formatBytes(peerCaps?.memBytes ?? DEFAULT_MAX_FILE_BYTES);

  // Surface the cap upgrade so the sender feels it. Without this the user
  // has to know to look at the dropzone copy. We fire once per "ascent" to
  // streamed mode and reset on disconnect so a reconnect can re-announce.
  // Resetting back to false (downgrade) is intentionally silent - dropping
  // is rare, and a downgrade-toast right before a sender picks a file
  // would be more confusing than helpful.
  const didAnnounceLargeModeRef = useRef(false);
  useEffect(() => {
    if (status !== "connected") {
      didAnnounceLargeModeRef.current = false;
      return;
    }
    if (peerStreamingToDisk && !didAnnounceLargeModeRef.current) {
      didAnnounceLargeModeRef.current = true;
      const who = resolvedPeerName;
      toast.success("Large file mode enabled", {
        description: `${who} can save straight to disk - you can now send files up to ${STREAMED_MAX_FILE_LABEL}.`,
      });
    } else if (!peerStreamingToDisk && didAnnounceLargeModeRef.current) {
      didAnnounceLargeModeRef.current = false;
    }
  }, [peerStreamingToDisk, status, peerDeviceName]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      unlockAudio();
      void ensureNotificationPermission();
      if (status !== "connected") {
        const arr = Array.from(files);
        // Hold the selection if the peer is in any recoverable non-connected
        // state. On Android the OS backgrounds the tab while the file picker
        // is open and suspends WebRTC. We queue mid-handshake ("connecting")
        // and "reconnecting" so a fast pick during initial setup or reconnect
        // doesn't fall through. We do NOT queue on "ended" because the session
        // is terminal and will never automatically recover.
        const recoverable =
          status === "reconnecting" ||
          status === "connecting";
        if (recoverable && arr.length > 0) {
          const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
          const have = new Set(pendingFilesRef.current.map(key));
          // Reject files that already exceed the current cap so the user
          // gets immediate feedback rather than waiting through the entire
          // reconnect cycle only to see a size error at drain time.
          const currentQueuedBytes = pendingFilesRef.current.reduce((sum, g) => sum + g.size, 0);
          let addedBytes = 0;
          const adds: File[] = [];
          for (const f of arr) {
            if (have.has(key(f))) continue; // already queued
            if (f.size > effectiveMaxBytes) {
              const description = peerStreamingToDisk
                ? `Files over ${effectiveMaxLabel} aren't supported yet.`
                : `Files over ${effectiveMaxLabel} need the receiver to enable auto-save first (up to ${STREAMED_MAX_FILE_LABEL}).`;
              toast.error(`${f.name} is too large`, { description });
              continue;
            }
            // Guard total queued bytes so Android's OOM killer doesn't
            // silently terminate the tab while waiting for reconnection.
            if (currentQueuedBytes + addedBytes + f.size > MAX_QUEUED_BYTES) {
              toast.error(`${f.name} skipped`, {
                description: `The queue already holds ${formatBytes(currentQueuedBytes + addedBytes)}. Discard it or wait for reconnection before adding more.`,
              });
              continue;
            }
            adds.push(f);
            addedBytes += f.size;
          }
          if (adds.length > 0) {
            pendingFilesRef.current.push(...adds);
            setPendingFiles([...pendingFilesRef.current]);
            const label =
              adds.length === 1 ? `"${adds[0].name}"` : `${adds.length} files`;
            toast(`Queued ${label}`, {
              description: "We'll send as soon as the link is back.",
            });
          }
          // Wake the bridge if reconnect already gave up or is
          // still waiting on a backoff timer. On Android Chrome the
          // visibilitychange event does not reliably fire when returning
          // from the system file picker (it's an overlay, not a true tab
          // switch), so we can't count on that handler to cancel the
          // pending delay. Kicking manualReconnect() here directly
          // cancels any pending backoff and starts an immediate attempt.
          if (status === "reconnecting" || status === "connecting") {
            if (Date.now() - lastManualReconnectRef.current > 1000) {
              lastManualReconnectRef.current = Date.now();
              manualReconnect();
            } else {
              // The visibilitychange handler already kicked a reconnect
              // within the last second. Schedule a verification: if we're
              // still broken after the new negotiation should have had time
              // to complete, try once more. Without this, a silently failed
              // visibilitychange reconnect (e.g. suspended WebSocket) leaves
              // the queue stranded until the normal backoff machinery fires.
              if (reconnectVerifyTimerRef.current) clearTimeout(reconnectVerifyTimerRef.current);
              reconnectVerifyTimerRef.current = setTimeout(() => {
                reconnectVerifyTimerRef.current = null;
                const s = statusRef.current;
                if (s !== "connected" && s !== "connecting") {
                  lastManualReconnectRef.current = Date.now();
                  manualReconnect();
                }
              }, 3000);
            }
          }
          return;
        }
        // peerPresent === false (peer left) or status === "waiting": there's
        // genuinely no one on the other side; queueing would sit forever.
        toast.error(peerPresent ? "Connection lost. Try again." : "No peer connected");
        return;
      }
      // When zip mode is on and the user picked multiple files, bundle them
      // into a single archive before sending. Single-file sends are always
      // transmitted as-is regardless of zipMode.
      let filesToSend = Array.from(files);
      if (zipMode && filesToSend.length > 1) {
        // Pre-zip size check: level-0 zip output is approximately equal to the
        // sum of input sizes plus small per-file headers (~1 KB overhead total).
        // Checking here avoids spending time zipping only to hit the send cap.
        const rawSize = filesToSend.reduce((s, f) => s + f.size, 0);
        if (rawSize > effectiveMaxBytes) {
          toast.error("Files too large to zip", {
            description: `Combined size (${formatBytes(rawSize)}) exceeds the ${effectiveMaxLabel} limit. Send them individually, or ask the receiver to enable save-to-folder first.`,
          });
          return;
        }

        const abort = new AbortController();
        zipAbortRef.current = abort;

        const now = new Date();
        const stamp = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-");
        const archiveName = `quickbridge-${stamp}.zip`;

        const zipToastId = toast.loading(`Zipping ${filesToSend.length} files...`, {
          action: { label: "Cancel", onClick: () => abort.abort() },
        });
        try {
          const zipped = await zipFiles(filesToSend, archiveName, abort.signal);
          toast.dismiss(zipToastId);
          filesToSend = [zipped];
        } catch (err) {
          toast.dismiss(zipToastId);
          if (err instanceof DOMException && err.name === "AbortError") {
            toast("Zip cancelled");
            return;
          }
          toast.error("Failed to create zip archive");
          return;
        } finally {
          zipAbortRef.current = null;
        }
      }
      for (const f of filesToSend) {
        if (f.size > effectiveMaxBytes) {
          // Files larger than the peer can safely buffer in memory are
          // refused. Tell the sender what would unlock a higher cap so
          // they can ask the receiver to enable auto-save instead of just
          // hitting a wall.
          const description = peerStreamingToDisk
            ? `Files over ${effectiveMaxLabel} aren't supported yet.`
            : `Files over ${effectiveMaxLabel} need the receiver to enable auto-save first (up to ${STREAMED_MAX_FILE_LABEL}).`;
          toast.error(`${f.name} is too large`, { description });
          continue;
        }
        sendFile(f);
        // Cache the source so we can quick-resend later in this session.
        // We can't get the id back from sendFile (wrapped), so listen via outgoingFiles.
        // Store under a temp key + reconcile on the next outgoingFiles update.
        // Instead, capture by name+size+type matching in the next effect.
        pendingSourcesRef.current.push(f);
      }
    },
    [sendFile, status, peerPresent, manualReconnect, effectiveMaxBytes, effectiveMaxLabel, peerStreamingToDisk, zipMode],
  );

  // Reconcile File sources with outgoing entries
  const pendingSourcesRef = useRef<File[]>([]);
  useEffect(() => {
    if (pendingSourcesRef.current.length === 0) return;
    const remaining: File[] = [];
    for (const file of pendingSourcesRef.current) {
      const match = outgoingFiles.find(
        (o) =>
          !sentSourcesRef.current[o.id] &&
          o.name === file.name &&
          o.size === file.size &&
          (o.type === (file.type || "application/octet-stream")),
      );
      if (match) {
        sentSourcesRef.current[match.id] = file;
      } else {
        remaining.push(file);
      }
    }
    pendingSourcesRef.current = remaining;
  }, [outgoingFiles]);

  // Drain the mobile-recovery queue once the peer is connected again.
  // Calls sendFile directly instead of routing through handleFiles to avoid
  // a stale-closure race: handleFiles captures `status` in its useCallback
  // deps, and React's batched state updates can leave the drain effect
  // holding the old handleFiles instance (which still sees status as
  // "reconnecting"), causing it to re-queue the same files in a loop.
  useEffect(() => {
    if (status === "connected" && pendingFilesRef.current.length > 0) {
      const queued = pendingFilesRef.current;
      pendingFilesRef.current = [];
      setPendingFiles([]);
      const label = queued.length === 1 ? `"${queued[0].name}"` : `${queued.length} files`;
      toast.success(`Sending ${label}`);
      for (const f of queued) {
        if (f.size > effectiveMaxBytes) {
          const description = peerStreamingToDisk
            ? `Files over ${effectiveMaxLabel} aren't supported yet.`
            : `Files over ${effectiveMaxLabel} need the receiver to enable auto-save first (up to ${STREAMED_MAX_FILE_LABEL}).`;
          toast.error(`${f.name} is too large`, { description });
          continue;
        }
        sendFile(f);
        pendingSourcesRef.current.push(f);
      }
      return;
    }
    // Note: we deliberately do NOT drain on terminal states ("ended"). handleFiles
    // will refuse to queue if the session is ended, but if files were already
    // queued and the session subsequently ended (e.g. timeout), the hopeless
    // case is covered by endSession (user-initiated) or the inline ended banner.
    // The queue stays visible in the inline banner so the user can discard
    // or wait. Surfacing the count beats a fire-and-forget toast.
  }, [status, sendFile, effectiveMaxBytes, effectiveMaxLabel, peerStreamingToDisk]);

  const handleSendText = () => {
    unlockAudio();
    void ensureNotificationPermission();
    if (!text.trim()) return;
    if (text.trim().length > MAX_TEXT_BYTES) {
      toast.error("Message too large", {
        description: `Text messages are limited to ${Math.round(MAX_TEXT_BYTES / 1024)} KB. Send it as a .txt file instead.`,
      });
      return;
    }
    if (sendText(text.trim())) setText("");
    else toast.error("Not connected");
  };

  // Cmd/Ctrl+V on the session page sends pasted files / text. We only handle
  // the global paste when the focus isn't an editable element - otherwise the
  // user is typing into the message box and we let the default paste happen.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onPaste = async (e: ClipboardEvent) => {
      if (status !== "connected") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (!e.clipboardData) return;
      const { files, text: pastedText, hadContent } = await readPaste(e);
      if (files.length > 0) {
        e.preventDefault();
        await handleFiles(files);
        return;
      }
      if (pastedText && pastedText.trim()) {
        e.preventDefault();
        if (sendText(pastedText, "clipboard")) {
          toast.success("Pasted clipboard sent");
        }
        return;
      }
      // The user pressed Cmd/Ctrl+V but the clipboard contained something
      // we can't send (e.g. a rich-text table, HTML, or a browser-internal
      // type). Let them know instead of silently ignoring the gesture.
      if (hadContent) {
        e.preventDefault();
        toast("Nothing to send", {
          description: "That clipboard content can't be transferred. Try copying plain text or an image.",
        });
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [status, handleFiles, sendText]);

  const readClipboardSafe = useCallback(async (): Promise<string | null> => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return null;
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }, []);

  const handleSendClipboard = useCallback(async () => {
    unlockAudio();
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      toast.error("Clipboard API unavailable", {
        description: "Use HTTPS and a supported browser, or paste into the message box instead.",
      });
      return;
    }
    const t = await readClipboardSafe();
    if (t == null) {
      toast.error("Clipboard access denied", {
        description: "Allow clipboard permissions for this site, or paste into the message box.",
      });
      return;
    }
    if (!t) {
      toast.error("Clipboard is empty");
      return;
    }
    if (sendText(t, "clipboard")) toast.success("Clipboard sent");
    else toast.error("Not connected");
  }, [readClipboardSafe, sendText]);

  // Ctrl/Cmd+Shift+V: explicitly read and send the current clipboard via the
  // Clipboard API. Different from the paste handler (Ctrl/Cmd+V), which only
  // fires when the browser dispatches a paste event. This shortcut calls
  // navigator.clipboard.readText() directly, so it works for clipboard content
  // set by other apps, even without a browser-side copy gesture first.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (status !== "connected") return;
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        void handleSendClipboard();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [status, handleSendClipboard]);

  // Drain files shared via the Web Share Target (service worker stores them in
  // "qb-share-pending" cache and redirects to "/"). Fires on mount and whenever
  // the tab regains visibility, so files shared while the app was backgrounded
  // are picked up as soon as the user returns to the session.
  usePendingShare((sharedFiles) => {
    void handleFiles(sharedFiles);
  });

  // Auto-clipboard watcher: poll clipboard every 1.5s while window has focus,
  // send when content changes (and is non-empty). Opt-in only.
  const lastClipRef = useRef<string>("");
  const clipPermDeniedRef = useRef(false);
  useEffect(() => {
    if (!autoClip || status !== "connected") return;
    clipPermDeniedRef.current = false;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (typeof document !== "undefined" && !document.hasFocus()) return;
      // Read clipboard directly so we can distinguish permission errors from
      // empty-clipboard, rather than swallowing everything in readClipboardSafe.
      let t: string | null = null;
      try {
        t = await navigator.clipboard.readText();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          if (!clipPermDeniedRef.current) {
            clipPermDeniedRef.current = true;
            setAutoClip(false);
            toast.error("Clipboard permission denied", {
              description: "Allow clipboard access for this site in your browser settings, then re-enable auto-share.",
            });
          }
        }
        return;
      }
      if (!t) return;
      if (t === lastClipRef.current) return;
      lastClipRef.current = t;
      // No toast for auto-clipboard sends — it fires every 1.5 s and creates
      // continuous noise. The sent clipboard text appears in the message list,
      // which is the right place to see what was shared.
      sendText(t, "clipboard");
    };
    // Prime: capture current clipboard so we don't immediately broadcast it.
    void readClipboardSafe().then((t) => {
      if (t) lastClipRef.current = t;
    });
    const id = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [autoClip, status, sendText, readClipboardSafe]);

  // Predictive clipboard: when connected (and auto-share is OFF), listen for the
  // user's `copy` event and offer a one-tap "Send to <peer>" toast. We never
  // auto-send here - the user must tap the action.
  const lastSuggestedRef = useRef<string>("");
  useEffect(() => {
    if (status !== "connected" || autoClip) return;
    if (typeof document === "undefined") return;
    const onCopy = () => {
      // Defer slightly so the new selection lands in the OS clipboard first.
      window.setTimeout(async () => {
        const t = await readClipboardSafe();
        if (!t) return;
        if (t === lastSuggestedRef.current) return;
        if (t === lastClipRef.current) return; // already sent via auto-clip session
        lastSuggestedRef.current = t;
        const preview = t.length > 60 ? `${t.slice(0, 60)}…` : t;
        const peerLabel = resolvedPeerName;
        toast(`Send to ${peerLabel}?`, {
          description: preview,
          duration: 6000,
          action: {
            label: "Send",
            onClick: () => {
              if (sendText(t, "clipboard")) {
                lastClipRef.current = t;
                toast.success("Clipboard sent");
              } else {
                toast.error("Not connected");
              }
            },
          },
        });
      }, 50);
    };
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, [status, autoClip, readClipboardSafe, sendText, peerDeviceName, peerDeviceKind]);

  // Resend a history item
  const resendHistoryItem = useCallback(
    (item: HistoryItem) => {
      if (status !== "connected") {
        toast.error("Not connected yet");
        return;
      }
      if (item.kind === "file") {
        // Strip the s: / r: prefix to get the original outgoing/incoming id
        const baseId = item.id.replace(/^[sr]:/, "");
        const file = sentSourcesRef.current[baseId];
        if (!file) {
          toast.error("File no longer in memory", {
            description: "Pick the file again to send it.",
          });
          return;
        }
        sendFile(file);
        pendingSourcesRef.current.push(file);
        toast.success(`Resending ${file.name}`);
      } else {
        if (sendText(item.content, item.kind)) {
          toast.success(item.kind === "clipboard" ? "Clipboard resent" : "Message resent");
        } else {
          toast.error("Not connected");
        }
      }
    },
    [sendFile, sendText, status],
  );

  // Device name save
  const commitName = (raw: string) => {
    const trimmed = raw.trim().slice(0, 40);
    setDeviceName(trimmed);
    writeString(StorageKeys.deviceName, trimmed);
    setEditingName(false);
  };

  // Live throughput sparkline samples (bytes/sec, ~500ms cadence).
  const [throughputSamples, setThroughputSamples] = useState<number[]>([]);
  const lastBytesRef = useRef<{ ts: number; sent: number; recv: number }>({
    ts: 0,
    sent: 0,
    recv: 0,
  });
  useEffect(() => {
    if (status !== "connected") {
      setThroughputSamples([]);
      lastBytesRef.current = { ts: 0, sent: 0, recv: 0 };
      return;
    }
    let cancelled = false;
    const id = setInterval(() => {
      if (cancelled) return;
      const sent = outgoingFiles.reduce((acc, f) => acc + f.sentBytes, 0);
      const recv = incomingFiles.reduce((acc, f) => acc + f.receivedBytes, 0);
      const now = Date.now();
      const prev = lastBytesRef.current;
      if (prev.ts === 0) {
        lastBytesRef.current = { ts: now, sent, recv };
        return;
      }
      const dt = Math.max(0.001, (now - prev.ts) / 1000);
      const dBytes = Math.max(0, sent - prev.sent) + Math.max(0, recv - prev.recv);
      const rate = dBytes / dt;
      lastBytesRef.current = { ts: now, sent, recv };
      setThroughputSamples((s) => {
        const next = s.length >= 40 ? s.slice(-39) : s.slice();
        next.push(rate);
        // Trim trailing zero-only sequences so the line collapses when idle.
        if (next.every((v) => v === 0)) return [];
        return next;
      });
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, outgoingFiles, incomingFiles]);

  // When the user explicitly turns stream-to-disk OFF we also drop the
  // persisted handle so we don't silently re-enable it on the next refresh.
  const handleStreamToDiskClick = useCallback(async () => {
    void ensureNotificationPermission();
    if (saveDirectory) {
      setSaveDirectory(null);
      void clearPersistedDirectory();
      setResumeDirLabel(null);
      toast("Saving to folder turned off", {
        description: "Incoming files will be received in browser memory again.",
      });
      return;
    }
    const dir = await pickSaveDirectory();
    if (dir) {
      setSaveDirectory(dir);
      setResumeDirLabel(null);
      toast.success(`Saving incoming files to ${dir.label}`, {
        description: "Files sent to you will land here directly - no download button needed.",
      });
    } else {
      toast.error("Couldn't open folder picker");
    }
  }, [saveDirectory, setSaveDirectory]);

  // Prompt to pick a folder the first time any file arrives and auto-save is off.
  // One toast per session (tracked by a ref) so the user isn't spammed.
  const folderPromptedRef = useRef(false);
  useEffect(() => {
    if (!streamToDiskSupported || saveDirectory || folderPromptedRef.current) return;
    const hasIncoming = incomingFiles.some((f) => f.state === "receiving");
    if (!hasIncoming) return;
    folderPromptedRef.current = true;
    toast("Pick a save folder", {
      description:
        "Files write straight to your disk as they arrive. No download button, no browser memory limit.",
      duration: 15000,
      action: {
        label: "Pick folder",
        onClick: () => {
          void handleStreamToDiskClick();
        },
      },
    });
  }, [incomingFiles, streamToDiskSupported, saveDirectory, handleStreamToDiskClick]);

  // Persisted save-directory restore. On mount, if the browser still has a
  // valid permission grant we silently resume; if it's in "prompt" state we
  // surface a one-click button so the required user gesture is available.
  const [resumeDirLabel, setResumeDirLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!streamToDiskSupported) return;
    let cancelled = false;
    void loadPersistedDirectory().then((res) => {
      if (cancelled) return;
      if (res.directory) {
        setSaveDirectory(res.directory);
        toast(`Saving incoming files to ${res.directory.label}`, {
          description: "Resumed from your last session.",
        });
      } else if (res.needsPrompt && res.label) {
        setResumeDirLabel(res.label);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [streamToDiskSupported, setSaveDirectory]);

  const handleResumeStreamToDisk = useCallback(async () => {
    const dir = await requestPersistedDirectoryPermission();
    if (dir) {
      setSaveDirectory(dir);
      setResumeDirLabel(null);
      toast.success(`Saving incoming files to ${dir.label}`, {
        description: "Files sent to you will land here directly - no download button needed.",
      });
    } else {
      setResumeDirLabel(null);
      toast.error("Folder access denied", {
        description: "Pick a new folder to stream files to disk.",
      });
    }
  }, [setSaveDirectory]);

  // Labels
  const myFallback = deviceLabel(myDeviceKind, "self");
  const myShown = deviceName.trim() || myFallback;
  const peerFallback = peerDeviceKind ? deviceLabel(peerDeviceKind, "peer") : "Other device";
  const peerShown = resolvedPeerName;
  const connected = status === "connected";
  const reconnecting = status === "reconnecting";

  // Drive the site-wide "bridge active" UI cue (logo buzz + glow). See
  // src/lib/bridge-signal.ts for why this goes through a DOM attribute.
  useBridgeSignal(connected);

  const headerCopy = (() => {
    if (status === "connected") {
      return isInitiator
        ? { eyebrow: "Session active", eyebrowDot: "bg-success animate-pulse", title: "Your bridge is live.", body: "Send files, text, or your clipboard - directly between devices." }
        : { eyebrow: "Joined session", eyebrowDot: "bg-success animate-pulse", title: "You're paired.", body: "Send files, text, or your clipboard - directly between devices." };
    }
    if (status === "connecting") {
      return { eyebrow: "Negotiating", eyebrowDot: "bg-primary animate-pulse", title: "Connecting…", body: "Setting up a direct, encrypted channel between your devices." };
    }
    if (status === "reconnecting") {
      return { eyebrow: "Reconnecting", eyebrowDot: "bg-warning animate-pulse", title: "Reconnecting…", body: `The link dropped - trying again (attempt ${reconnectAttempt} of ${maxReconnectAttempts}).` };
    }
    if (status === "ended") {
      if (endReason === "error") {
        return { eyebrow: "Network blocked", eyebrowDot: "bg-destructive animate-pulse", title: "Network may be blocked.", body: "Your network is preventing peer-to-peer setup. Try a different network or enable a TURN server." };
      }
      if (endReason === "verification_failed" || endReason === "key_changed") {
        return { eyebrow: "Security alert", eyebrowDot: "bg-destructive animate-pulse", title: "Connection blocked.", body: "The device identity could not be verified or has changed unexpectedly. This connection was terminated to protect your security." };
      }
      if (endReason === "session_expired") {
        return { eyebrow: "Session expired", eyebrowDot: "bg-warning", title: "Session expired.", body: "This pairing link has expired. Start a new session from the host device." };
      }
      if (endReason === "host_not_found") {
        return { eyebrow: "Host not found", eyebrowDot: "bg-destructive", title: "Host not found.", body: "The host session is no longer active. They may have closed their tab or refreshed." };
      }
      return { eyebrow: "Disconnected", eyebrowDot: "bg-destructive", title: "Connection lost.", body: "We couldn't reach the other device. Refresh the page on both devices to start a new session." };
    }
    if (isInitiator) {
      const waitingBody = trustedConnectTargetName
        ? trustedConnectTimedOut
          ? `${trustedConnectTargetName} hasn't connected yet. Make sure they have QuickBridge open, or use the QR code below.`
          : `Waiting for ${trustedConnectTargetName} to connect…`
        : "Scan the QR code or enter the PIN on the other device to pair.";
      return { eyebrow: "Waiting", eyebrowDot: "bg-muted-foreground", title: "Waiting for the other device…", body: waitingBody };
    }
    if (stillTrying) {
      return { eyebrow: "Still trying", eyebrowDot: "bg-warning animate-pulse", title: "Still looking for the host…", body: "The host might be on a slow network. Hang on a moment longer." };
    }
    const guestBody = connectingFromName
      ? `Connecting from ${connectingFromName}. Hang tight.`
      : "Hang tight - connecting to the host's session.";
    return { eyebrow: "Waiting", eyebrowDot: "bg-muted-foreground", title: "Waiting for the host…", body: guestBody };
  })();

  if (bridgeBusy) {
    return (
      <div className="mx-auto w-full max-w-md py-12">
        <Card className="space-y-4 border-warning/40 bg-card/80 p-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Another device is already connected</h1>
            <p className="text-sm text-muted-foreground">
              Someone else got here first on this bridge. Ask the host to start a new session, or try again in a moment.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.reload()} className="h-10">
              <RotateCw className="mr-2 h-4 w-4" /> Try again
            </Button>
            <Button onClick={() => endSession("local_disconnect")} variant="outline" className="h-10">
              Go home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (bridgeEnded) {
    const transferred = history.items.length;
    return (
      <div className="mx-auto w-full max-w-md py-12">
        <Card className="space-y-6 border-border bg-card/80 p-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Bridge closed</h1>
            {transferred > 0 && (
              <p className="text-sm text-muted-foreground">
                {transferred} {transferred === 1 ? "item" : "items"} transferred this session.
              </p>
            )}
          </div>
          {transferred > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
              <p className="text-[13px] font-medium text-foreground">Enjoying QuickBridge?</p>
              <p className="text-[12px] text-muted-foreground">A quick review or share helps others find it.</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => window.open("https://www.producthunt.com/products/quickbridge", "_blank", "noopener,noreferrer")}
                  className="h-9 gap-1.5 text-[12px]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Leave a review
                </Button>
                <Button
                  variant="outline"
                  onClick={shareQuickBridge}
                  className="h-9 gap-1.5 text-[12px]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share with a friend
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            className="h-9 w-full text-[12px] text-muted-foreground"
          >
            Go home
          </Button>
        </Card>
      </div>
    );
  }

  if (hostMissing) {
    return (
      <div className="mx-auto w-full max-w-md py-12">
        <Card className="space-y-4 border-border bg-card/80 p-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Host not found</h1>
            <p className="text-sm text-muted-foreground">
              We couldn't find an open QuickBridge session. Ask them to open QuickBridge on their device first, then try again.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => { setHostMissing(false); window.location.reload(); }} className="h-10">
              <RotateCw className="mr-2 h-4 w-4" /> Retry
            </Button>
            {/* Navigate home without firing "Bridge ended": no bridge ever existed */}
            <Button
              onClick={() => {
                clearActiveSession();
                suspendAudio();
                navigate({ to: "/" });
              }}
              variant="outline"
              className="h-10"
            >
              Go home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 md:grid-cols-[1fr_2fr] md:items-start">
        <div className="space-y-3 md:sticky md:top-6">
      <Card
        className={cn(
          "relative overflow-hidden border-border/60 bg-card/70 backdrop-blur transition-shadow",
          connected && "shadow-[0_0_0_1px_oklch(0.7_0.18_220/0.45),0_0_30px_-6px_oklch(0.7_0.18_220/0.55)]",
          reconnecting && "shadow-[0_0_0_1px_oklch(0.78_0.14_75/0.45),0_0_28px_-6px_oklch(0.78_0.14_75/0.55)]",
        )}
      >
        {connectBurst > 0 && (
          <span
            key={connectBurst}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/60 animate-[ping_900ms_ease-out_1]"
          />
        )}

        {/* Status orb */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
          <div className="relative mb-5">
            <div
              className={cn(
                "absolute -inset-4 rounded-full blur-xl transition-all duration-700",
                connected ? "bg-success/25 opacity-100" :
                reconnecting ? "bg-warning/25 opacity-100" :
                status === "connecting" ? "bg-primary/20 opacity-100" :
                status === "ended" ? "bg-destructive/20 opacity-100" :
                "opacity-0"
              )}
            />
            <div
              className={cn(
                "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 transition-all duration-500",
                connected ? "border-success/50 bg-success/10" :
                reconnecting ? "border-warning/50 bg-warning/10" :
                status === "connecting" ? "border-primary/50 bg-primary/10" :
                status === "ended" ? "border-destructive/50 bg-destructive/10" :
                "border-border/60 bg-muted/20"
              )}
            >
              {(status === "connecting" || status === "reconnecting") ? (
                <Loader2 className={cn("h-7 w-7 animate-spin", reconnecting ? "text-warning" : "text-primary")} />
              ) : connected ? (
                <ArrowLeftRight className="h-7 w-7 text-success" />
              ) : status === "ended" ? (
                <AlertTriangle className="h-7 w-7 text-destructive" />
              ) : (
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Visually hidden live region: announces connection status changes
              to screen readers without interfering with the visual heading. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {headerCopy.title}
          </div>
          <h1 className="text-[17px] font-bold tracking-tight leading-snug">
            {headerCopy.title}
          </h1>
          <p className="mt-1.5 max-w-[200px] text-[11.5px] leading-relaxed text-muted-foreground">
            {headerCopy.body}
          </p>
          {/* Resend invite: shown when a trusted-connect invite timed out.
              Lets the host re-broadcast without navigating back to the home
              screen and tapping Connect again. The QR code below is always
              available as a fallback for the guest to scan. */}
          {trustedConnectTimedOut && isInitiator && trustedConnectTargetName && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 gap-1.5 px-3 text-[11px]"
              onClick={() => void handleResendTrustedConnect()}
              disabled={resendingInvite}
            >
              {resendingInvite ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCw className="h-3 w-3" />
              )}
              {resendingInvite ? "Sending..." : "Send invite again"}
            </Button>
          )}
          {status === "ended" && (endReason === "error" || endReason === "timeout" || endReason === "transport_lost") && (
            <a
              href="/help#troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[11px] font-medium text-primary underline-offset-2 hover:underline"
            >
              Troubleshooting guide
            </a>
          )}
          {status === "reconnecting" && reconnectStartedAtRef.current && (() => {
            const attempt = Math.max(1, reconnectAttempt);
            const delayMs = Math.min(8000, 600 * Math.pow(1.6, attempt - 1));
            const remaining = Math.max(0, delayMs - (now - reconnectStartedAtRef.current));
            const sec = Math.ceil(remaining / 1000);
            return (
              <p className="mt-1 text-[11px] tabular-nums text-warning/80">
                {sec > 0 ? `Retrying in ${sec}s` : "Retrying now..."}
              </p>
            );
          })()}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <StatusBadge
              status={status}
              quality={quality}
              attempt={reconnectAttempt}
              maxAttempts={maxReconnectAttempts}
            />
            {connected && throughputSamples.length > 1 && (
              <Sparkline samples={throughputSamples} className="opacity-90" ariaLabel="Live throughput" />
            )}
            {connected && qualityHistory.length > 1 && (
              <div
                className="flex items-center gap-0.5"
                aria-label="Connection quality history"
                title="Quality history: green = direct, amber = relay"
              >
                {qualityHistory.map((entry, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-3 rounded-full",
                      entry.quality === "direct" ? "bg-success/70" : "bg-warning/70",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          {connected && connectedAtRef.current && (() => {
            const totalSec = Math.floor((now - connectedAtRef.current) / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            const display = h > 0
              ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${m}:${String(s).padStart(2, "0")}`;
            return (
              <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground/60" aria-label="Session duration">
                {display}
              </p>
            );
          })()}
        </div>

        {/* Device pair */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-3">
            <div className="flex flex-1 min-w-0 flex-col items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {deviceIcon(myDeviceKind, "h-4 w-4")}
              </div>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={draftName}
                    placeholder={myFallback}
                    maxLength={40}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitName(draftName);
                      else if (e.key === "Escape") {
                        setDraftName(deviceName);
                        setEditingName(false);
                      }
                    }}
                    className="h-6 w-20 px-1.5 text-[10px]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => commitName(draftName)}
                    aria-label="Save name"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setDraftName(deviceName); setEditingName(true); }}
                  className="group flex items-center gap-1 text-center"
                  title="Edit device name"
                  aria-label="Edit device name"
                >
                  <span className="max-w-[80px] truncate text-[11.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {myShown}
                  </span>
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
                </button>
              )}
              <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground/50">You</span>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${i * 220}ms` }}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                      connected ? "bg-success animate-pulse" : "bg-border/60"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-1 min-w-0 flex-col items-center gap-1.5">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500",
                peerDeviceKind ? "bg-muted/50 text-foreground" : "bg-muted/20 text-muted-foreground/25"
              )}>
                {deviceIcon(peerDeviceKind, "h-4 w-4")}
              </div>
              <span className={cn(
                "max-w-[80px] truncate text-[11.5px] font-semibold transition-colors duration-500",
                peerDeviceKind ? "text-foreground" : "text-muted-foreground/30"
              )}>
                {peerShown}
              </span>
              {peerTrustVerified ? (
                <span className="flex items-center gap-0.5 text-[9.5px] text-success">
                  <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
                  Verified
                </span>
              ) : (
                <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground/50">
                  {peerDeviceKind ? "Peer" : "Waiting"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Session totals bar */}
        {history.items.length > 0 && (() => {
          const sentItems = history.items.filter((i) => i.direction === "sent");
          const recvItems = history.items.filter((i) => i.direction === "received");
          const sentBytes = sentItems.reduce((a, i) => a + (i.kind === "file" ? i.size : 0), 0);
          const recvBytes = recvItems.reduce((a, i) => a + (i.kind === "file" ? i.size : 0), 0);
          return (
            <div className="mx-4 mb-3 flex items-center justify-around gap-1 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[13px] font-semibold tabular-nums text-foreground">{sentItems.length}</span>
                <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground/60">Sent</span>
                {sentBytes > 0 && <span className="text-[9.5px] tabular-nums text-muted-foreground/50">{formatBytes(sentBytes)}</span>}
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[13px] font-semibold tabular-nums text-foreground">{recvItems.length}</span>
                <span className="text-[9.5px] uppercase tracking-widest text-muted-foreground/60">Received</span>
                {recvBytes > 0 && <span className="text-[9.5px] tabular-nums text-muted-foreground/50">{formatBytes(recvBytes)}</span>}
              </div>
            </div>
          );
        })()}

        {/* Action row */}
        <div className="flex items-center gap-1 border-t border-border/40 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-2.5">
          {/* Quick-access toggles - only meaningful once connected */}
          {connected && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-11 w-11 shrink-0 p-0 transition-colors",
                  autoClip ? "text-primary" : "text-muted-foreground",
                )}
                onClick={async () => {
                  if (autoClip) {
                    setAutoClip(false);
                  } else {
                    unlockAudio();
                    setAutoClip(true);
                    lastClipRef.current = "";
                    try {
                      await navigator.clipboard.readText();
                      toast.success("Clipboard auto-share on");
                    } catch (err) {
                      const name = err instanceof DOMException ? err.name : "";
                      if (name === "NotAllowedError" || name === "SecurityError") {
                        setAutoClip(false);
                        toast.error("Clipboard access blocked", {
                          description: "Allow clipboard access in the address bar, then try again.",
                        });
                      } else {
                        toast.success("Clipboard auto-share on");
                      }
                    }
                  }
                }}
                title={autoClip ? "Auto-share clipboard is on. Anything you copy sends to the other device automatically. Click to turn off." : "Auto-share clipboard: anything copied on either device sends automatically. Click to enable."}
                aria-label="Toggle clipboard auto-share"
                aria-pressed={autoClip}
              >
                <Clipboard className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-11 w-11 shrink-0 p-0 transition-colors",
                  zipMode ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setZipMode((v) => !v)}
                title={zipMode ? "Zip multi-file is on. Multiple files are bundled into one zip before sending. Click to turn off." : "Zip multi-file: bundle multiple files into a single zip before sending. Click to enable."}
                aria-label="Toggle zip multi-file"
                aria-pressed={zipMode}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
              {streamToDiskSupported && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "relative h-11 w-11 shrink-0 p-0 transition-colors",
                    saveDirectory
                      ? "text-primary"
                      : "text-amber-400 ring-2 ring-amber-400/50 ring-offset-1 ring-offset-background animate-pulse rounded-md",
                  )}
                  onClick={handleStreamToDiskClick}
                  title={
                    saveDirectory
                      ? `Saving to "${saveDirectory.label}". Files stream straight to disk, up to ${STREAMED_MAX_FILE_LABEL}. Click to turn off.`
                      : "Pick a save folder. Files stream straight to disk as they arrive, up to 10 GB. Required for large files."
                  }
                  aria-label="Toggle save to folder"
                  aria-pressed={!!saveDirectory}
                >
                  <HardDriveDownload className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="mx-0.5 h-4 w-px shrink-0 bg-border/50 sm:mx-1" aria-hidden="true" />
            </>
          )}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
          >
            <a href="/help#troubleshooting" target="_blank" rel="noopener noreferrer" aria-label="Help center" title="Help and troubleshooting, opens in a new tab">
              <HelpCircle className="h-3.5 w-3.5" />
            </a>
          </Button>
          {status === "ended" && (
            <Button
              size="sm"
              variant="outline"
              className="h-11 flex-1 gap-1.5 text-[11px]"
              onClick={() => window.location.reload()}
              title="Start a new session"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Start Over
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
            onClick={() => setSoundMuted((v) => !v)}
            title={soundMuted ? "Sounds are muted. Click to unmute connection and transfer sounds." : "Mute session sounds. Silences all connection and transfer audio cues."}
            aria-label={soundMuted ? "Unmute" : "Mute"}
          >
            {soundMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-11 flex-1 gap-1.5 text-[11px] text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                aria-label="End bridge and return home"
              >
                <PowerOff className="h-3.5 w-3.5" />
                End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End this bridge?</AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const activeCount = outgoingFiles.filter((f) => f.state === "sending" || f.state === "resuming" || f.state === "queued").length
                      + incomingFiles.filter((f) => f.state === "receiving").length;
                    return activeCount > 0
                      ? `${activeCount} transfer${activeCount === 1 ? "" : "s"} in progress will stop. The connection closes immediately.`
                      : "The connection will close. You can start a new bridge from the home screen at any time.";
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep session</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={confirmEndBridge}
                >
                  End bridge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* QR code + PIN share card - host only, shown while waiting */}
      {isInitiator && !connected && pairUrl && (
        <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-medium text-muted-foreground/80">Share to connect</p>
          </div>
          <div className="flex justify-center px-4 pb-3">
            <QrDisplay text={pairUrl} size={160} pulse={false} />
          </div>
          <div className="divide-y divide-border/40">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-[13px] font-bold tracking-widest tabular-nums">
                  {pin
                    ? formatPin(pin)
                    : <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" aria-label="Generating PIN" />}
                </span>
                <span className="text-[10px] text-muted-foreground/60">PIN</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 gap-1.5 px-2 text-[10.5px] text-muted-foreground"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pin);
                    toast.success("PIN copied");
                  } catch {
                    toast.error("Could not copy PIN");
                  }
                }}
                disabled={!pin}
                title="Copy PIN"
              >
                <Copy className="h-3 w-3" />
                Copy PIN
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <QrCode className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate text-[10.5px] text-muted-foreground/70">{pairUrl.replace(/^https?:\/\//, "")}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 gap-1.5 px-2 text-[10.5px] text-muted-foreground"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pairUrl);
                    toast.success("Link copied");
                  } catch {
                    toast.error("Could not copy link");
                  }
                }}
                title="Copy link"
              >
                <Copy className="h-3 w-3" />
                Copy link
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notification permission nudge - show when waiting and permission not yet decided */}
      {!connected && notifPermission === "default" && notificationsSupported() && (
        <Card className="flex items-start gap-3 border-border/60 bg-card/70 p-4 backdrop-blur">
          <Bell className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-[11.5px] font-medium text-foreground/90">Get notified when peer connects</p>
              <p className="text-[10.5px] text-muted-foreground/80">Switch tabs - we'll alert you the moment they arrive.</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2.5 text-[10.5px]"
                onClick={async () => {
                  const granted = await ensureNotificationPermission();
                  setNotifPermission(granted ? "granted" : "denied");
                  if (granted) toast.success("Notifications on", { description: "You'll be notified when the other device connects." });
                  else toast.error("Permission denied", { description: "Enable notifications in your browser settings to use this feature." });
                }}
              >
                <Bell className="h-3 w-3" />
                Allow
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[10.5px] text-muted-foreground"
                onClick={() => setNotifPermission("denied")}
              >
                Not now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stalled connection diagnostic - shown when ICE negotiation fails */}
      {status === "ended" && endReason === "error" && (
        <Card className="border-warning/30 bg-warning/5 p-4 backdrop-blur space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <div>
              <p className="text-[11.5px] font-medium text-foreground/90">Connection blocked</p>
              <p className="text-[10.5px] text-muted-foreground/80">Common causes:</p>
            </div>
          </div>
          <ul className="space-y-1 pl-6 list-disc">
            <li className="text-[10.5px] text-muted-foreground/80">VPN active? Try disabling it.</li>
            <li className="text-[10.5px] text-muted-foreground/80">Corporate or school WiFi? Strict NATs block P2P.</li>
            <li className="text-[10.5px] text-muted-foreground/80">Mobile hotspot almost always works.</li>
          </ul>
          {/* Screen-reader announcement for relay state change */}
          <span role="status" aria-live="polite" className="sr-only">
            {forceRelay ? "Relay mode active. Reconnecting through relay server." : ""}
          </span>
          <Button
            size="sm"
            variant={forceRelay ? "secondary" : "outline"}
            className="w-full h-7 gap-1.5 text-[10.5px]"
            onClick={() => {
              if (!forceRelay) {
                setForceRelay(true);
                toast("Forcing relay (TURN)", {
                  description: "Reconnecting via relay server. Slower but bypasses strict firewalls.",
                });
                // Defer manualReconnect one tick so React re-renders first,
                // updating forceRelayRef inside the hook before the new PC is created.
                window.setTimeout(() => manualReconnect(), 0);
              }
            }}
            disabled={forceRelay}
            aria-describedby="relay-status-announce"
            title="Force all traffic through a relay server to bypass strict firewalls"
          >
            <Globe className="h-3.5 w-3.5" />
            {forceRelay ? "Relay active - reconnecting..." : "Force relay (bypass firewall)"}
          </Button>
          <span id="relay-status-announce" className="sr-only" aria-hidden="true" />
        </Card>
      )}

      {/* SAS verification */}
      {connected && (
        <Card className="overflow-hidden border-border/60 bg-card/70 p-4 backdrop-blur">
          <SasBadge code={sasCode} />
        </Card>
      )}

      {/* Key reset card: shown when a trusted peer presents a different public
          key for the same nodeId. Most commonly caused by clearing browser
          storage. Uses warning styling (not destructive) because this is
          usually a benign identity refresh rather than an impersonation. */}
      {keyResetDetected && peerNodeHello && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning/5 p-4 backdrop-blur">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[13px] font-semibold text-foreground">
              Device identity changed
            </p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              "{resolvedPeerName}" is connecting with new cryptographic keys. This usually happens after browser data is cleared. Trust this device again to reconnect securely.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="h-7 px-3 text-[12px]"
                onClick={() => void handleKeyResetTrust()}
              >
                Trust again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-[12px] text-muted-foreground"
                onClick={() => setKeyResetDetected(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Trust prompt: shown after the first successful transfer when the
          peer has shared their node identity and is not already trusted. */}
      {showTrustPrompt && peerNodeHello && (
        <TrustPrompt
          peerNickname={peerNodeHello.nickname}
          peerDeviceKind={peerNodeHello.deviceKind}
          completedTransferCount={transfersCompleted}
          onTrust={() => handleTrustDevice()}
          onDismiss={() => setTrustPromptDismissed(true)}
        />
      )}

      {/* Stalled transfer diagnostic card */}
      {connected && (() => {
        const STALL_MS = 45_000;
        const stalledOut = Object.values(outgoingFiles).filter(
          (f) => (f.state === "sending" || f.state === "resuming") && !f.error && f.sentBytes === 0 && now - f.startedAt > STALL_MS,
        );
        const stalledIn = Object.values(incomingFiles).filter(
          (f) => f.state === "receiving" && !f.error && !f.paused && f.receivedBytes === 0 && now - f.startedAt > STALL_MS,
        );
        const count = stalledOut.length + stalledIn.length;
        if (count === 0) return null;
        return (
          <Card className="flex items-start gap-3 border-warning/30 bg-warning/5 p-4 backdrop-blur">
            <HelpCircle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium text-foreground/90">
                {count === 1 ? "Transfer stalled" : `${count} transfers stalled`}
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                No bytes sent in 45s. Try a smaller file or check firewall settings.
              </p>
            </div>
          </Card>
        );
      })()}
        </div>

        <div className="space-y-4">
      {/* Drop zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // Expand folders recursively when supported; otherwise fall back to
          // the flat FileList the browser already gives us.
          void expandDataTransfer(e.dataTransfer).then(({ files, capped, hadItems }) => {
            if (capped) {
              toast.warning("Folder too large", {
                description: `Only the first 5,000 files were added. The rest were skipped.`,
              });
            }
            if (files.length > 0) {
              void handleFiles(files);
            } else if (hadItems) {
              // Items were present (e.g. empty folders) but produced no files.
              toast("Nothing to send", {
                description: "The dropped item contained no files.",
              });
            }
          });
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed bg-card/40 py-4 px-6 text-center backdrop-blur transition-all sm:py-10",
          dragOver
            ? "scale-[1.01] border-primary bg-primary/10 shadow-glow"
            : "border-border/60 hover:border-border/90",
        )}
      >
        <div
          className={cn(
            "hidden sm:grid h-14 w-14 place-items-center rounded-2xl border border-border bg-elevated text-primary transition-all duration-200",
            dragOver && "scale-110 border-primary shadow-[0_0_0_4px_oklch(0.7_0.18_220/0.15)]",
          )}
        >
          <Upload className={cn("h-6 w-6 transition-transform duration-200", dragOver && "scale-110")} />
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold hidden sm:block">
            {dragOver ? "Release to send" : "Drop files or folders to send"}
          </p>
          <p className="text-[15px] font-semibold sm:hidden">Send files</p>
          <p className="text-[12px] text-muted-foreground hidden sm:block">
            Drag, paste (⌘/Ctrl+V), or pick - works with screenshots too<span aria-hidden="true"> · </span>up to {effectiveMaxLabel} each
            <span className="text-muted-foreground/60"> (depends on receiving device)</span>
          </p>
          <p className="text-[12px] text-muted-foreground sm:hidden">
            Tap below to pick files - up to {effectiveMaxLabel} each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          // Reset the value before every open so re-selecting the same file
          // always fires onChange. Without this, picking photo.jpg → queuing
          // it → discarding the queue → re-picking photo.jpg is silently
          // ignored by the browser because the input value hasn't changed.
          onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ""; }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Button size="sm" variant="secondary" onClick={handleChooseFiles} className="mt-1 h-11 w-full sm:h-9 sm:w-auto sm:px-6">
          Choose files
        </Button>
        {pendingCount > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="mt-1 w-full rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground space-y-1.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>
                  {pendingCount === 1 ? "1 file queued" : `${pendingCount} files queued`}
                  {" · "}
                  {status === "connected" ? "sending now…" : "sending when reconnected"}
                </span>
              </span>
              {pendingCount > 1 && (
                <button
                  type="button"
                  onClick={discardQueued}
                  className="shrink-0 font-medium text-foreground/80 underline-offset-2 hover:underline"
                >
                  Discard all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pendingFiles.map((f, i) => (
                <span
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  className="inline-flex max-w-[180px] items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 text-[10.5px] text-warning-foreground"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name} from queue`}
                    onClick={() => discardPendingFile(i)}
                    className="shrink-0 rounded hover:text-destructive transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        {status === "connected" && quality === "relay" && (
          <div
            role="status"
            aria-live="polite"
            className="mt-1 flex w-full items-start gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5 text-xs text-warning"
          >
            <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="leading-snug">
              Your network blocked a direct connection. Files are routing through a relay server before reaching the other device.{" "}
              <span className="text-warning/70">The relay only forwards encrypted bytes and cannot read your files.</span>
            </span>
          </div>
        )}
      </Card>

      {/* Text + clipboard */}
      <Card className="space-y-3 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Send a message or URL…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            className="text-base sm:text-sm"
          />
          <Button onClick={handleSendText} disabled={!connected} title="Send message">
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleSendClipboard}
            disabled={!connected}
            title="Send your clipboard"
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
        <p className="hidden sm:flex items-start gap-1.5 pl-1 text-[10.5px] italic leading-snug text-muted-foreground/60">
          <span className="not-italic">💡</span>
          <span>Tip - copy a screenshot on either device, then press ⌘/Ctrl+V here to send it instantly as a file.</span>
        </p>
        <p className="flex sm:hidden items-start gap-1.5 pl-1 text-[10.5px] italic leading-snug text-muted-foreground/60">
          <span className="not-italic">💡</span>
          <span>Tip - paste or share directly from your phone's gallery to send images instantly.</span>
        </p>
      </Card>

      {/* Outgoing */}
      {outgoingFiles.length > 0 && (() => {
        const allDone = outgoingFiles.every((f) => f.state === "completed" || f.state === "failed" || f.state === "cancelled");
        const anyInFlight = outgoingFiles.some((f) => f.state === "sending" || f.state === "resuming" || f.state === "queued");
        const headerLabel = allDone ? "Sent" : anyInFlight ? "Sending" : "Failed";
        const headerClass = allDone ? "text-success" : "";
        const activeOutgoing = outgoingFiles.filter((f) => f.state === "sending" || f.state === "resuming" || f.state === "queued");
        return (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${headerClass}`}>{headerLabel}</h3>
            {activeOutgoing.length >= 2 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-[10.5px] text-muted-foreground hover:text-destructive"
                    title="Cancel all active transfers"
                  >
                    <X className="h-3 w-3" />
                    Cancel all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel all transfers?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop all {activeOutgoing.length} active transfers. Files already sent cannot be unsent, but incomplete transfers will need to be restarted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep sending</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: "destructive" })}
                      onClick={() => activeOutgoing.forEach((f) => cancelOutgoing(f.id))}
                    >
                      Cancel all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {outgoingFiles.map((f) => {
            const elapsed = Math.max(0.001, ((f.completedAt ?? Date.now()) - f.startedAt) / 1000);
            // Use bytes sent in THIS attempt only (not cumulative from the file
            // start) so rate doesn't spike to astronomical values right after a
            // resume where elapsed ≈ 0 but sentBytes is already large.
            const rate = (f.sentBytes - f.resumeFromBytes) / elapsed;
            const remaining = Math.max(0, f.size - f.sentBytes);
            const eta = rate > 0 ? remaining / rate : Infinity;
            const pct = f.size ? (f.sentBytes / f.size) * 100 : 0;
            return (
              <div key={f.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-muted-foreground">{fileTypeIcon(f.type, "h-4 w-4")}</span>
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatBytes(f.sentBytes)} / {formatBytes(f.size)}
                  </span>
                </div>
                <Progress
                  value={pct}
                  aria-label={`Sending ${f.name}: ${Math.round(pct)}%`}
                />
                {f.state === "completed" ? (
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" /> Sent in {elapsed.toFixed(1)}s
                    </span>
                  </div>
                ) : f.error ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" /> {f.error}
                      {f.retryable ? " - ready to retry" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      {f.retryable && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-[11px]"
                          disabled={!connected}
                          onClick={() => {
                            const ok = retryFile(f.id);
                            if (!ok) toast.error("Not connected yet");
                          }}
                          title={
                            f.sentBytes > 0
                              ? `Resume from ${formatBytes(f.sentBytes)}`
                              : "Retry from the beginning"
                          }
                        >
                          <RotateCw className="mr-1 h-3 w-3" />
                          {f.sentBytes > 0 ? "Resume" : "Retry"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => dismissOutgoing(f.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span>{formatRate(rate)}</span>
                      {resumedRowIds[f.id] && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success"
                          aria-live="polite"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Resumed
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>ETA {formatEta(eta)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => cancelOutgoing(f.id)}
                        title="Cancel transfer"
                        aria-label={`Cancel sending ${f.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
        );
      })()}

      {/* Incoming */}
      {incomingFiles.length > 0 && (
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Received</h3>
          {incomingFiles.map((f) => {
            const isImage = f.type.startsWith("image/");
            // Use the resume timestamp as the elapsed baseline when available so
            // the rate reflects the current attempt only (mirrors the outgoing
            // resumeFromBytes pattern). Without this, a 400 MB resume that adds
            // 100 MB reads as 100 MB / total_elapsed, which is nearly zero.
            const elapsed = Math.max(
              0.001,
              ((f.completedAt ?? Date.now()) - (f.resumedAt ?? f.startedAt)) / 1000,
            );
            const rate = (f.receivedBytes - (f.resumeFromBytes ?? 0)) / elapsed;
            const remaining = Math.max(0, f.size - f.receivedBytes);
            const eta = rate > 0 ? remaining / rate : Infinity;
            const pct = f.size ? (f.receivedBytes / f.size) * 100 : 0;
            return (
              <div key={f.id} className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  {/* Always-visible preview slot */}
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border bg-background/60 text-muted-foreground">
                    {isImage && f.url ? (
                      <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                    ) : (
                      fileTypeIcon(f.type, "h-6 w-6")
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{f.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatBytes(f.receivedBytes)} / {formatBytes(f.size)}
                      </span>
                    </div>
                    {f.state === "receiving" || f.state === "finalizing" ? (
                      <>
                        <Progress
                          value={pct}
                          aria-label={`Receiving ${f.name}: ${Math.round(pct)}%`}
                        />
                        {f.paused ? (
                          <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                            <span className="inline-flex items-center gap-1 text-warning">
                              <AlertTriangle className="h-3 w-3" />
                              Paused - waiting for sender to resume (up to 2 min)
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => cancelIncoming(f.id)}
                              title="Give up and discard the partial file"
                              aria-label={`Cancel receiving ${f.name}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums text-muted-foreground">
                            <span>{formatRate(rate)}</span>
                            <div className="flex items-center gap-2">
                              <span>ETA {formatEta(eta)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => cancelIncoming(f.id)}
                                title="Cancel transfer"
                                aria-label={`Cancel receiving ${f.name}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : f.error ? (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                          <AlertTriangle className="h-3 w-3" /> {f.error}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => releaseIncoming(f.id)}
                            title="Remove from this list"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-success">
                          <CheckCircle2 className="h-3 w-3" /> Received in {elapsed.toFixed(1)}s
                        </span>
                        {/* SHA-256 integrity badge - only shown when the sender
                            included a hash in file-end. verified=true means bytes
                            match exactly; verified=false means corruption detected. */}
                        {f.verified === true && (
                          <span
                            className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10.5px] text-success"
                            title={`SHA-256 verified: ${f.sha256 ?? ""}`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                        {f.verified === false && (
                          <span
                            className="inline-flex items-center gap-1 rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[10.5px] text-destructive"
                            title="SHA-256 mismatch: file may be corrupted. Download it again."
                          >
                            <ShieldX className="h-3 w-3" />
                            Integrity check failed
                          </span>
                        )}
                        {f.savedToDisk && (
                          <span className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                            <FolderOpen className="h-3 w-3" />
                            Saved to {saveDirectory?.label ?? "folder"}
                            {f.savedAs && f.savedAs !== f.name ? ` · ${f.savedAs}` : ""}
                          </span>
                        )}
                        {f.type.startsWith("video/") && (
                          <a
                            href="https://calmclip.video?ref=quickbridge"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="basis-full mt-1 flex items-center gap-1.5 rounded border border-border/60 bg-muted/20 px-2 py-1 text-[10.5px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                          >
                            <img src="/calmclip-logo.png" alt="" aria-hidden height="16" style={{ width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                            <span>Edit in <strong className="font-semibold text-foreground">CalmClip</strong>: trim, captions, silence cut. No upload.</span>
                          </a>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          {!f.savedToDisk && f.url && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                // On iOS Safari the `download` attribute on blob
                                // URLs is silently ignored - use the Web Share
                                // API with a File object instead, which opens the
                                // native share sheet so the user can Save Image /
                                // Save to Files. Fall back to anchor click on
                                // every other platform.
                                const isiOS =
                                  typeof navigator !== "undefined" &&
                                  /iphone|ipad|ipod/i.test(navigator.userAgent);
                                if (isiOS && navigator.share) {
                                  try {
                                    const res = await fetch(f.url!);
                                    const blob = await res.blob();
                                    const file = new File([blob], f.name, { type: f.type || blob.type });
                                    if (navigator.canShare?.({ files: [file] })) {
                                      await navigator.share({ files: [file], title: f.name });
                                      return;
                                    }
                                  } catch {
                                    // fall through to anchor download
                                  }
                                }
                                const a = document.createElement("a");
                                a.href = f.url!;
                                a.download = f.name;
                                a.click();
                              }}
                            >
                              <Download className="mr-1 h-4 w-4" />
                              {typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
                                ? "Save"
                                : "Download"}
                            </Button>
                          )}
                          {/* Confirm before clearing a file the user hasn't downloaded
                              yet. Once releaseIncoming() revokes the blob URL the file
                              is gone with no recovery path. Saved-to-disk files and
                              files with no blob are safe to clear without a dialog. */}
                          {!f.savedToDisk && f.url ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Remove from this list"
                                >
                                  Clear
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Clear this file?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{f.name}" has not been downloaded yet. Clearing removes it from this list permanently.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep</AlertDialogCancel>
                                  <AlertDialogAction
                                    className={buttonVariants({ variant: "destructive" })}
                                    onClick={() => releaseIncoming(f.id)}
                                  >
                                    Clear anyway
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => releaseIncoming(f.id)}
                              title="Remove from this list"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <Card className="min-w-0 overflow-hidden space-y-2 p-4">
          <h3 className="text-sm font-semibold">Messages</h3>
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex min-w-0 flex-col overflow-hidden rounded-lg border p-3 text-sm",
                  m.from === "me" ? "bg-primary/5" : "bg-muted/40",
                )}
              >
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate pr-2">
                    {m.from === "me" ? "You" : resolvedPeerName}
                    {m.kind === "clipboard" ? " · clipboard" : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 shrink-0 px-2"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(m.content)
                        .then(() => toast.success("Copied"))
                        .catch(() => toast.error("Could not copy to clipboard"));
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
                <span className="min-w-0 whitespace-pre-wrap break-words">{m.content}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History */}
      {history.items.length > 0 && (
        <HistoryPanel
          items={history.items}
          now={now}
          onResend={resendHistoryItem}
          onRemove={removeHistoryItem}
          onClear={history.clear}
          sentSourcesRef={sentSourcesRef}
          connected={connected}
        />
      )}
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({
  items,
  now,
  onResend,
  onRemove,
  onClear,
  sentSourcesRef,
  connected,
}: {
  items: HistoryItem[];
  now: number;
  onResend: (item: HistoryItem) => void;
  onRemove: (item: HistoryItem) => void;
  onClear: () => void;
  sentSourcesRef: React.MutableRefObject<Record<string, File>>;
  connected: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex flex-1 items-center gap-2 text-left text-sm font-semibold"
            >
              <HistoryIcon className="h-4 w-4 text-muted-foreground" />
              <span>Recent</span>
              <span className="rounded-full border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {items.length}
              </span>
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px] text-muted-foreground"
                title="Clear all history"
              >
                <Trash2 className="mr-1 h-3 w-3" /> Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear transfer history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all {items.length} {items.length === 1 ? "item" : "items"} from your recent history for this session. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={onClear}
                >
                  Clear history
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CollapsibleContent>
          <div className="border-t">
            <ul className="divide-y">
              {items.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  now={now}
                  onResend={onResend}
                  onRemove={onRemove}
                  sentSourcesRef={sentSourcesRef}
                  connected={connected}
                />
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function HistoryRow({
  item,
  now,
  onResend,
  onRemove,
  sentSourcesRef,
  connected,
}: {
  item: HistoryItem;
  now: number;
  onResend: (item: HistoryItem) => void;
  onRemove: (item: HistoryItem) => void;
  sentSourcesRef: React.MutableRefObject<Record<string, File>>;
  connected: boolean;
}) {
  const isFile = item.kind === "file";
  const baseId = item.id.replace(/^[sr]:/, "");
  const fileSourceAvailable = isFile && item.direction === "sent" && !!sentSourcesRef.current[baseId];

  const canResend = useMemo(() => {
    if (!connected) return false;
    if (item.kind === "file") return fileSourceAvailable;
    return true;
  }, [connected, item.kind, fileSourceAvailable]);

  const resendLabel = item.kind === "file" ? "Resend" : item.direction === "sent" ? "Resend" : "Send back";
  const resendTitle = !connected
    ? "Not connected"
    : item.kind === "file" && !fileSourceAvailable
      ? "File no longer in memory - pick it again to send"
      : resendLabel;

  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border text-muted-foreground",
          item.direction === "sent" ? "bg-primary/5" : "bg-muted/30",
        )}
      >
        {item.kind === "file" ? (
          fileTypeIcon(item.type, "h-3.5 w-3.5")
        ) : item.kind === "clipboard" ? (
          <Clipboard className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">
            {item.direction === "sent" ? "Sent" : "Received"}
          </span>
          <span>·</span>
          <span>{formatRelative(item.ts, now)}</span>
          {item.kind === "file" && (
            <>
              <span>·</span>
              <span>{formatBytes(item.size)}</span>
            </>
          )}
          {item.kind === "clipboard" && (
            <>
              <span>·</span>
              <span>clipboard</span>
            </>
          )}
        </div>
        <div className="mt-0.5 truncate text-sm">
          {item.kind === "file" ? item.name : item.content || "(empty)"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.kind !== "file" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              navigator.clipboard
                .writeText(item.content)
                .then(() => toast.success("Copied"))
                .catch(() => toast.error("Could not copy to clipboard"));
            }}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2 text-[11px]"
          onClick={() => onResend(item)}
          disabled={!canResend}
          title={resendTitle}
        >
          <RotateCw className="mr-1 h-3 w-3" />
          {resendLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={() => onRemove(item)}
          title="Remove from history"
          aria-label="Remove from history"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </li>
  );
}
