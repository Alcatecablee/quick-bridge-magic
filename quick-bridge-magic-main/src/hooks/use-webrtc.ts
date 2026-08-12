import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { NodeHello } from "@/lib/node-identity";
import {
  validateNodeHello,
  validateNodeChallenge,
  validateNodeVerify,
  QB_PROTO_VERSION,
} from "@/lib/protocol";
import { IncrementalSha256 } from "@/lib/sha256";
import { detectDeviceKind, detectSafeMemoryBytes, type DeviceKind } from "@/lib/device";
import { deriveSas, extractFingerprint, type SasCode } from "@/lib/sas";
import {
  createWritableForName,
  clearInFlightTransfer,
  estimateFreeSpace,
  getInFlightTransfer,
  persistInFlightTransfer,
  pruneStaleInFlightTransfers,
  removeFileAtPath,
  streamToDiskSupported,
  type SaveDirectory,
} from "@/lib/streaming";
import { fetchTurnCredentials } from "@/lib/turn-credentials";
import type { IntentEnvelope, IntentAck, ContinuityIntentType } from "@/lib/continuity-types";
import { INTENT_ENVELOPE_VERSION } from "@/lib/continuity-types";

// Dev-only logger: all [QB] debug output is stripped from production builds
// so the console is quiet for end users without losing diagnostic detail in dev.
const qbLog = console.log.bind(console);
const qbWarn = import.meta.env.DEV ? console.warn.bind(console) : () => {};
// qbError is always active: these paths represent real failures that need
// visibility in production (connection drops, IDB writes, crypto errors).
const qbError = console.error.bind(console);


export type ProtocolState = "unknown" | "negotiating" | "compatible" | "incompatible";

export type TransportCapabilities = {
  protocolVersion: 1;
  controlChannel: true;
  fileResume: true;
  continuity: true;
  streamToDisk: true;
};

export type ProtocolEnvelope<T = any> = {
  v: 1;
  type: string;
  sessionId: string;
  generation: number;
  messageId: string;
  payload: T;
};
export type ConnectionStatus =
  | "waiting"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ending"
  | "ended";

export type SessionEndReason =
  | "local_disconnect"
  | "remote_disconnect"
  | "transport_lost"
  | "timeout"
  | "session_expired"
  | "verification_failed"
  | "key_changed"
  | "navigation"
  | "browser_closed"
  | "error"
  | "host_not_found";

export type ConnectionQuality = "direct" | "relay" | "unknown";

export type IncomingFileState = "receiving" | "finalizing" | "verified" | "failed" | "cancelled";

export interface IncomingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  receivedBytes: number;
  url?: string;
  state: IncomingFileState;
  startedAt: number;
  completedAt?: number;
  savedToDisk?: boolean;
  savedAs?: string;
  error?: string;
  // Hex SHA-256 sent by the sender in file-end.
  sha256?: string;
  // True = received hash matches sender hash; false = mismatch; undefined = no hash provided.
  verified?: boolean;
  // True while the connection is down but we're holding the partial buffer
  // and on-disk file in case the sender resumes within RESUME_GRACE_MS.
  // Cleared on successful resume or final cleanup.
  paused?: boolean;
  // Wall-clock timestamp (ms) when `paused` flipped true. UI uses it to
  // render a live countdown of how much of the grace window remains.
  // Cleared alongside `paused`.
  pausedAt?: number;
  // Byte offset at which a resume attempt started (mirrors OutgoingFile's
  // resumeFromBytes). Set when the receiver honours an incoming resume so
  // the UI can compute rate = (receivedBytes - resumeFromBytes) / elapsed
  // instead of receivedBytes / totalElapsed, which reads as nearly zero
  // right after a resume because elapsed includes the original attempt.
  resumeFromBytes?: number;
  // Wall-clock ms when the resume was accepted. Used as the elapsed-time
  // base for the rate calculation above so stale elapsed doesn't dilute it.
  resumedAt?: number;
}

export type OutgoingFileState = "queued" | "sending" | "paused" | "resuming" | "completed" | "failed" | "cancelled";

export interface OutgoingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  sentBytes: number;
  // Byte offset this attempt started from (0 for fresh sends, >0 for resumes).
  // The UI uses this so rate = (sentBytes - resumeFromBytes) / elapsed instead
  // of sentBytes / elapsed, which would spike to astronomical values right after
  // a resume because elapsed is near zero but sentBytes is already large.
  resumeFromBytes: number;
  state: OutgoingFileState;
  error?: string;
  retryable?: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface ChatMessage {
  id: string;
  from: "me" | "peer";
  kind: "text" | "clipboard";
  content: string;
  ts: number;
}

interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  // Set on the second-and-later attempts when the sender is trying to
  // resume an interrupted transfer rather than start fresh. Receiver uses
  // this as a signal to look up an existing partial buffer, and replies
  // with `file-resume-ack` carrying the byte offset it actually has.
  resumeFrom?: number;
}

// How long the receiver keeps a partial transfer alive after a connection
// drop, waiting for the sender to resume. Long enough to cover Wi-Fi <->
// cellular handoffs, brief router resets, and laptop wake-from-sleep;
// short enough that abandoned transfers don't accumulate as orphan files
// on disk.
export const RESUME_GRACE_MS = 2 * 60 * 1000;
// How long the sender waits for the receiver to acknowledge a resume
// attempt before giving up and surfacing a retryable error.
const RESUME_ACK_TIMEOUT_MS = 5_000;

interface IncomingBuffer {
  meta: FileMeta;
  received: number;
  // In-memory chunks: always populated until/unless we successfully open a writable.
  memoryChunks: Uint8Array[];
  // Stream-to-disk path:
  writer: FileSystemWritableFileStream | null;
  finalName: string | null;
  savedToDisk: boolean;
  // Serializes async writes so close() never races with a pending write().
  writeQueue: Promise<void>;
  // Best-effort delete of the partial file on disk after an abort/teardown.
  cleanup: (() => Promise<void>) | null;
  // Set once the receiver has decided this transfer is dead (write failure,
  // peer cancel, teardown). Further chunks become no-ops.
  aborted: boolean;
  // Incremental SHA-256 hasher. Updated with every received payload chunk so
  // the hash is computed in a single pass without keeping a second copy of
  // the data in memory.
  hasher: IncrementalSha256;
  createWritableInflight?: Promise<void>;
}

// Default TURN: Open Relay Project (free, public). Override via env vars below.
// Supports VITE_TURN_URLS (comma-separated), VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL.
function buildIceServers(): RTCIceServer[] {
  const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
  const stuns: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];
  const turnUrls = env.VITE_TURN_URLS
    ? env.VITE_TURN_URLS.split(",").map((u) => u.trim()).filter(Boolean)
    : [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ];
  // ⚠️  openrelayproject is a public rate-limited fallback for local development
  // only. Set VITE_TURN_USERNAME + VITE_TURN_CREDENTIAL in production.
  const username = env.VITE_TURN_USERNAME ?? "openrelayproject";
  const credential = env.VITE_TURN_CREDENTIAL ?? "openrelayproject";
  return [...stuns, { urls: turnUrls, username, credential }];
}

const CHUNK_SIZE = 64 * 1024; // 64KB payload (header adds 16 bytes)
const HEADER_SIZE = 16; // 16-byte file id (hex of UUID without dashes)
const CONNECT_TIMEOUT_MS = 12000;
export const MAX_TEXT_BYTES = 512 * 1024; // 512 KB hard cap on text channel messages (UTF-8 bytes)
export const MAX_IN_MEMORY_FILE_BYTES = 512 * 1024 * 1024;
export const MAX_TOTAL_IN_MEMORY_TRANSFER_BYTES = 1024 * 1024 * 1024;

/**
 * Returns true when a string's UTF-8 byte length exceeds MAX_TEXT_BYTES.
 *
 * Why not `s.length > MAX_TEXT_BYTES`?
 *   JS `.length` counts UTF-16 code units, not bytes. A string of 500 K CJK
 *   characters has `.length` = 500 K (below the 524 K cap) but encodes to
 *   ~1.5 MB UTF-8 (well above it). Using `.length` as a byte proxy lets a
 *   peer bypass the inbound guard with high-codepoint text.
 *
 * Fast path: pure-ASCII strings have UTF-8 length == code-unit count, so
 *   `s.length > MAX_TEXT_BYTES` is a cheap early reject for clearly oversized
 *   strings before the exact encode. The exact encode is only reached for
 *   strings whose code-unit count is within the cap but whose UTF-8 expansion
 *   might still exceed it (i.e. strings with multi-byte characters).
 */
function exceedsTextByteCap(s: string): boolean {
  // Fast reject: UTF-8 byte length >= code-unit count (ASCII equality).
  if (s.length > MAX_TEXT_BYTES) return true;
  // Fast accept: UTF-8 byte length <= code-unit count * 3 (max expansion for
  // 3-byte BMP chars). If even the upper bound is within the cap, skip encode.
  if (s.length * 3 <= MAX_TEXT_BYTES) return false;
  // Exact check needed: borderline length with potential multi-byte characters.
  return new TextEncoder().encode(s).length > MAX_TEXT_BYTES;
}
const MAX_RECONNECT_ATTEMPTS = 6;
// Number of initial reconnect attempts to try as lightweight ICE restarts
// before escalating to a full RTCPeerConnection teardown. ICE restart reuses
// the existing PC and DataChannel, which is 2-3x faster than full teardown
// and preserves in-flight transfer state without marking rows retryable.
const ICE_RESTART_MAX = 2;
// How long to wait after a "disconnected" PC state before scheduling a
// reconnect. ICE can self-recover within this window by re-selecting a
// candidate pair, avoiding an unnecessary restart offer on a transient blip.
const DISCONNECTED_DEBOUNCE_MS = 1500;
const QUALITY_POLL_MS = 4000;
// A DataChannel must remain open for at least this long before the reconnect
// attempt counter is reset to zero. Guards against brief open-then-close
// cycles (e.g. the remote device backgrounding its tab and the OS terminating
// the WebRTC stack) from wiping out attempt credit: if the remote side
// repeatedly backgrounds and the DataChannel never stays stable, the counter
// accumulates and the session gives up after MAX_RECONNECT_ATTEMPTS total
// tries instead of looping forever.
const DC_STABLE_DURATION_MS = 5000;

// Encode/decode 16-byte file id header
function idToBytes(id: string): Uint8Array {
  const hex = id.replace(/-/g, "").slice(0, 32).padEnd(32, "0");
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToId(buf: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < 16; i++) hex += buf[i].toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function detectQuality(pc: RTCPeerConnection): Promise<ConnectionQuality> {
  try {
    const stats = await pc.getStats();
    let pair: RTCIceCandidatePairStats | undefined;
    let pairIdFromTransport: string | undefined;

    stats.forEach((report) => {
      if (report.type === "transport") {
        const t = report as RTCStatsReport extends Map<string, infer V> ? V : never;
        const id = (t as { selectedCandidatePairId?: string }).selectedCandidatePairId;
        if (id) pairIdFromTransport = id;
      }
    });
    if (pairIdFromTransport) pair = stats.get(pairIdFromTransport) as RTCIceCandidatePairStats | undefined;

    if (!pair) {
      stats.forEach((report) => {
        if (
          report.type === "candidate-pair" &&
          (report as RTCIceCandidatePairStats).state === "succeeded" &&
          (report as RTCIceCandidatePairStats).nominated
        ) {
          pair = report as RTCIceCandidatePairStats;
        }
      });
    }
    if (!pair) return "unknown";

    const local = stats.get(pair.localCandidateId) as { candidateType?: string } | undefined;
    const remote = stats.get(pair.remoteCandidateId) as { candidateType?: string } | undefined;
    const isRelay = local?.candidateType === "relay" || remote?.candidateType === "relay";
    return isRelay ? "relay" : "direct";
  } catch {
    return "unknown";
  }
}

// Mirrors the latest value of a state or prop into a ref so callbacks and
// effects can read the freshest value without being re-created on every
// change. Encapsulates the declare-then-assign pattern so the assignment
// can never accidentally land before the ref is created (the temporal
// dead zone trap that previously crashed the session page).
function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function canTransition(from: ConnectionStatus, to: ConnectionStatus): boolean {
  if (from === "ended") return false;
  if (from === "ending" && to !== "ended") return false;
  return true;
}

export function useWebRTC(
  sessionId: string,
  isInitiator: boolean,
  deviceName?: string,
  forceRelay?: boolean,
  // Called when the hook automatically activates relay mode after repeated
  // connection failures. The parent must set its forceRelay state to true;
  // the hook reads it back via forceRelayRef on the next render.
  onAutoRelay?: () => void,
  // Phase 2 node identity callbacks. All optional; the hook is a no-op when
  // they are omitted so callers that predate Trusted Devices need no changes.
  onPeerNodeHello?: (hello: NodeHello) => void,
  onNodeChallenge?: (nonce: string) => void,
  onNodeVerify?: (nodeId: string, signature: string) => void,
  // Phase 3 Continuity callbacks. Optional; hook is a no-op when omitted.
  onContinuityIntent?: (envelope: IntentEnvelope) => void,
  onIntentAck?: (ack: IntentAck) => void,
) {
  const [statusRaw, setStatusRaw] = useState<ConnectionStatus>("waiting");
  const [protocolState, setProtocolState] = useState<ProtocolState>("unknown");
  const protocolStateRef = useRef<ProtocolState>("unknown");
  const setProtocolStateSafe = useCallback((s: ProtocolState) => {
    protocolStateRef.current = s;
    setProtocolState(s);
  }, []);
  const status = statusRaw;
  const setStatus = useCallback((to: ConnectionStatus) => {
    setStatusRaw(prev => canTransition(prev, to) ? to : prev);
  }, []);
  // Ref mirror so async callbacks (scheduleReconnect, ICE handlers) can read
  // the current status synchronously without capturing a stale closure value.
  const statusRef = useLatestRef(status);
  const [peerPresent, setPeerPresent] = useState(false);
  // True when this guest joined a session that already has another guest claiming it.
  // The session page renders a "bridge already in use" dead-end with a Retry button.
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const myClientIdRef = useRef<string>("");
  if (!myClientIdRef.current) {
    // crypto.randomUUID is available in all browsers with WebRTC support
    // (Chrome 92+, Firefox 95+, Safari 15.4+). QuickBridge requires WebRTC,
    // so the fallback path is unreachable in practice. Asserting rather than
    // falling back to Math.random avoids silent collision-prone IDs.
    if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
      throw new Error("[QB] crypto.randomUUID is required. Use a modern browser with WebRTC support.");
    }
    myClientIdRef.current = crypto.randomUUID();
  }
  const [peerDeviceKind, setPeerDeviceKind] = useState<DeviceKind | null>(null);
  const [peerDeviceName, setPeerDeviceName] = useState<string | null>(null);
  // Receiver-side capabilities the peer broadcasts via presence so we can
  // size outgoing transfers safely. `stream` = File System Access API
  // available; `save` = user has actually picked an auto-save folder. Both
  // true means the receiver writes chunks straight to disk with constant
  // memory, so we can allow much larger files. Either false → conservative
  // cap so we don't OOM the peer's tab on big transfers.
  const [peerCaps, setPeerCaps] = useState<{ stream: boolean; save: boolean; memBytes?: number } | null>(null);
  const deviceNameRef = useLatestRef<string | undefined>(deviceName);
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const myDeviceKindRef = useRef<DeviceKind>("computer");
  const [myDeviceKind, setMyDeviceKind] = useState<DeviceKind>("computer");
  useEffect(() => {
    const handleOnline = () => {
      if (statusRef.current === "reconnecting") {
        qbLog("[QB] Network online: resuming reconnect");
        scheduleReconnectRef.current();
      }
    };
    const handleOffline = () => {
      qbLog("[QB] Network offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const k = detectDeviceKind();
    myDeviceKindRef.current = k;
    setMyDeviceKind(k);
  }, []);
  // Remove IndexedDB in-flight transfer records older than 24 h. These
  // accumulate when the page is closed abruptly mid-transfer (no cleanup
  // callback runs), so we prune on mount instead of relying on explicit
  // clearInFlightTransfer calls alone.
  useEffect(() => {
    void pruneStaleInFlightTransfers().catch(err =>
      qbWarn("[QB] IDB: pruneStaleInFlightTransfers failed", err),
    );
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [incomingFiles, setIncomingFiles] = useState<Record<string, IncomingFile>>({});
  const [outgoingFiles, setOutgoingFiles] = useState<Record<string, OutgoingFile>>({});
  const [sasCode, setSasCode] = useState<SasCode | null>(null);
  const [saveDirectory, setSaveDirectoryState] = useState<SaveDirectory | null>(null);
  const saveDirectoryRef = useLatestRef<SaveDirectory | null>(saveDirectory);
  // Tier 2 auto-resume: snapshot of the most recent batched resume sweep.
  // `ts` increments per batch so the UI can fire one summary toast per
  // reopen without de-duping itself; `count` reports how many transfers
  // were re-issued in that batch.
  const [lastAutoResume, setLastAutoResume] = useState<{ ts: number; count: number } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const controlDcRef = useRef<RTCDataChannel | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const lastControlSequenceRef = useRef<Record<string, number>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sendControlMessage = useCallback((payload: any) => {
    const channel = controlDcRef.current;
    if (!channel || channel.readyState !== "open") return;
    const msg: ProtocolEnvelope<any> = {
      v: 1,
      type: payload.t || payload.type,
      sessionId,
      generation: sessionGenerationRef.current,
      messageId: crypto.randomUUID(),
      payload
    };
    try {
      channel.send(JSON.stringify(msg));
    } catch {}
  }, [sessionId]);

  const sendDataMessage = useCallback((payload: any): boolean => {
    const channel = dcRef.current;
    if (!channel || channel.readyState !== "open") return false;
    const msg: ProtocolEnvelope<any> = {
      v: 1,
      type: payload.t || payload.type,
      sessionId,
      generation: sessionGenerationRef.current,
      messageId: crypto.randomUUID(),
      payload
    };
    try {
      channel.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);
  const incomingBuffersRef = useRef<Record<string, IncomingBuffer>>({});
  const sasComputedRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qualityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const sessionGenerationRef = useRef(0);
  const hasConnectedRef = useRef(false);
  const peerPresentRef = useRef(false);
  const isInitiatorRef = useLatestRef(isInitiator);
  const teardownRef = useRef<() => void>(() => {});
  const fileSourcesRef = useRef<Record<string, File>>({});
  const cancelledIdsRef = useRef<Set<string>>(new Set());
  // Outgoing file ids that the receiver has asked us to abort mid-stream.
  // The send loop polls this and bails out with a retryable error.
  const peerAbortedSendIdsRef = useRef<Set<string>>(new Set());
  // Outgoing file ids the local user has cancelled mid-stream. The send loop
  // polls this and bails out without marking the row as a retryable error,
  // since the cancel is intentional and the row is removed from the UI.
  const cancelledOutgoingIdsRef = useRef<Set<string>>(new Set());
  // Running total of bytes held in in-memory incoming transfer buffers.
  // Incremented on every memoryChunks push, decremented when buffers are
  // flushed to disk or released on completion/abort/cancel.
  const incomingMemoryBytesRef = useRef(0);
  // One-shot timers per partial incoming transfer. Scheduled when the
  // connection drops mid-transfer; on fire we run the same destructive
  // cleanup teardown used to do immediately. Cleared if the sender resumes
  // before the timer fires, or if the receiver explicitly cancels.
  const graceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Promise resolvers parked by sendFileInternal while it waits for a
  // file-resume-ack reply from the receiver. Keyed by file id.
  const resumeAckResolversRef = useRef<Record<string, (offset: number) => void>>({});
  // setTimeout handles for the per-resume-attempt timeout above. Tracked so
  // the cleanup function can cancel them on unmount and avoid a stale setState.
  const resumeAckTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Snapshot of outgoingFiles state, kept in a ref so resumeTransfer() can
  // read the latest sentBytes without forcing the callback to re-create on
  // every state change.
  const outgoingFilesRef = useLatestRef<Record<string, OutgoingFile>>(outgoingFiles);
  // Tier 2 auto-resume: outgoing ids already attempted in the current
  // data-channel open cycle. Cleared on dc.onclose so the next reopen
  // counts as a fresh cycle and previously-attempted transfers are
  // eligible again. Prevents duplicate sendFileInternal calls under flap.
  const attemptedAutoResumeIdsRef = useRef<Set<string>>(new Set());
  // Debounce handle for the batched auto-resume sweep. Coalesces a burst
  // of open events (or close→open flap) into one sweep, and lets several
  // eligible transfers be resumed without per-file timer noise.
  const autoResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Late-binding ref so the data-channel open handler always calls the
  // freshest resumeTransfer, not the closure captured when setupDataChannel
  // was first created. resumeTransfer is declared further down in this hook.
  const resumeTransferRef = useRef<(id: string) => boolean>(() => false);
  const iceServersRef = useRef<RTCIceServer[]>(buildIceServers());
  const forceRelayRef = useLatestRef(!!forceRelay);
  const onAutoRelayRef = useLatestRef(onAutoRelay);
  const onPeerNodeHelloRef = useLatestRef(onPeerNodeHello);
  const onNodeChallengeRef = useLatestRef(onNodeChallenge);
  const onNodeVerifyRef = useLatestRef(onNodeVerify);
  // Phase 3 Continuity refs
  const onContinuityIntentRef = useLatestRef(onContinuityIntent);
  const onIntentAckRef = useLatestRef(onIntentAck);
  // Forward-decl ref so scheduleReconnect can call armConnectTimeout for ICE
  // restart attempts without creating a circular useCallback dependency.
  // Populated immediately after armConnectTimeout is defined below.
  const armConnectTimeoutRef = useRef<() => void>(() => {});
  // Forward-decl ref so setupDataChannel's dc.onerror can call scheduleReconnect
  // without adding it to setupDataChannel's dependency array (which would
  // propagate unnecessary recreations through createPeerConnection/startOffer).
  // Populated immediately after scheduleReconnect is defined below.
  const scheduleReconnectRef = useRef<() => void>(() => {});
  // Tracks the timeout that resets the reconnect counter once the DataChannel
  // has been open long enough to count as a stable connection. Cancelled in
  // dc.onclose so a brief open-then-close does not reset the counter and
  // silently wipe attempt credit.
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce timer separating the transient "disconnected" PC state from the
  // terminal "failed"/"closed" states. Cancelled if ICE self-recovers.
  const disconnectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Terminal-state guard: set to true the moment endSession() begins so that
  // all async callbacks (scheduleReconnect, ICE handlers, DC events) become
  // no-ops. Never reset within the lifetime of this hook instance.
  const sessionEndingRef = useRef(false);
  // The reason that caused the session to end. Captured once, never mutated.
  const endReasonRef = useRef<SessionEndReason | null>(null);
  // Forward-decl ref so endSession can be called from inside closures
  // (e.g. DataChannel onmessage, Supabase signalHandler) that are created
  // before endSession is defined below.
  const endSessionRef = useRef<(reason: SessionEndReason) => void>(() => {});
  // Snapshot of outgoing/incoming file state for use inside endSession,
  // which must cancel all active operations synchronously.
  const outgoingFilesSnapshotRef = useRef<Record<string, OutgoingFile>>({});
  const incomingFilesSnapshotRef = useRef<Record<string, IncomingFile>>({}); 
  const isNegotiatingRef = useRef(false);
  const sessionDisconnectedAtRef = useRef<number | null>(null);
  // Fetch short-lived Cloudflare TURN credentials on mount and refresh every
  // 23 h (credentials TTL is 24 h). Falls back to the static ICE servers if
  // the server function is not configured.
  useEffect(() => {
    let cancelled = false;
    async function fetchTurn() {
      try {
        const cf = await fetchTurnCredentials();
        if (cancelled || !cf) return;
        const stuns: RTCIceServer[] = [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
        ];
        iceServersRef.current = [
          ...stuns,
          { urls: cf.urls, username: cf.username, credential: cf.credential },
        ];
      } catch {
        // keep default buildIceServers() value on any error
      }
    }
    fetchTurn();
    const interval = setInterval(fetchTurn, 23 * 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const sendSignal = useCallback((payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload: { protocol: 1, ...payload, clientId: myClientIdRef.current } });
  }, []);

  const stopQualityPoll = useCallback(() => {
    if (qualityTimerRef.current) {
      clearInterval(qualityTimerRef.current);
      qualityTimerRef.current = null;
    }
  }, []);

  const startQualityPoll = useCallback(() => {
    stopQualityPoll();
    const tick = async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState !== "connected") return;
      const q = await detectQuality(pc);
      setQuality(q);
    };
    void tick();
    qualityTimerRef.current = setInterval(tick, QUALITY_POLL_MS);
  }, [stopQualityPoll]);

  const setupDataChannel = useCallback(
    (dc: RTCDataChannel, isControl: boolean) => {
      dc.binaryType = "arraybuffer";
      if (!isControl) {
      dc.bufferedAmountLowThreshold = 1 << 20; // 1MB
      }

      dc.onopen = () => {
        if (!isControl) hasConnectedRef.current = true;
        qbLog(`[QB] DataChannel ${isControl ? "CONTROL" : "DATA"} OPEN`);
        const dataOpen = dcRef.current?.readyState === "open";
        const controlOpen = controlDcRef.current?.readyState === "open";
        if (dataOpen && controlOpen) {
        if (connectTimerRef.current) {
          clearTimeout(connectTimerRef.current);
          connectTimerRef.current = null;
        }
          if (protocolStateRef.current === "compatible") {
        setStatus("connected");
          }
        startQualityPoll();
        // Defer the reconnect-counter reset until the DataChannel has been open
        // for DC_STABLE_DURATION_MS. A brief open-then-close (e.g. the remote
        // device's OS suspending its tab immediately after ICE settles) must not
        // reset the counter, or the attempt credit is silently wiped and the
        // reconnect loop runs indefinitely. The stable timer is cancelled in
        // dc.onclose if the channel closes before stability is confirmed.
        if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
        const generation = sessionGenerationRef.current;
        stableTimerRef.current = setTimeout(() => {
          if (generation !== sessionGenerationRef.current) return;
          stableTimerRef.current = null;
          if (dcRef.current?.readyState === "open" && controlDcRef.current?.readyState === "open") {
            reconnectAttemptRef.current = 0;
            setReconnectAttempt(0);
          }
        }, DC_STABLE_DURATION_MS);
        // Tier 2 auto-resume: kick a debounced sweep over outgoing
        // transfers that need a re-issue. Coalesces a brief flap (close
        // → open → close → open) into a single attempt-per-file so we
        // don't double-send. The receiver enforces the 2-min grace
        // window implicitly via its file-resume-ack offset, so the
        // sender doesn't need its own grace check here. If the buffer
        // is gone, the ack returns 0 and sendFileInternal restarts.
        if (autoResumeTimerRef.current) {
          clearTimeout(autoResumeTimerRef.current);
          autoResumeTimerRef.current = null;
        }
        const generation2 = sessionGenerationRef.current;
        autoResumeTimerRef.current = setTimeout(() => {
          if (generation2 !== sessionGenerationRef.current) return;
          autoResumeTimerRef.current = null;
          const channel = dcRef.current;
          if (!channel || channel.readyState !== "open") return;
          const tryResume = resumeTransferRef.current;
          let resumed = 0;
          for (const [id, file] of Object.entries(outgoingFilesRef.current)) {
            // Per-iteration cancel re-check closes the cancel-vs-reopen
            // race: cancelOutgoing/dismissOutgoing write to this ref
            // synchronously, so a click between "timer scheduled" and
            // "timer fires" is honored here, not silently overridden.
            if (cancelledOutgoingIdsRef.current.has(id)) continue;
            if (file.state === "cancelled" || file.state === "completed") continue;
            if (!file.retryable) continue;
            if (!fileSourcesRef.current[id]) continue;
            if (attemptedAutoResumeIdsRef.current.has(id)) continue;
            if (channel.readyState !== "open") break;
            attemptedAutoResumeIdsRef.current.add(id);
            if (tryResume(id)) resumed++;
          }
          if (resumed > 0) setLastAutoResume({ ts: Date.now(), count: resumed });
        }, 750);
        }
      };
      dc.onclose = () => {
        qbLog("[QB] DataChannel CLOSED");
        stopQualityPoll();
        // Cancel the stability timer: the channel closed before the connection
        // was confirmed stable, so the reconnect counter is preserved and not
        // reset. This is the critical guard against the mobile-backgrounding
        // loop where the remote side's OS suspends the tab immediately after
        // ICE settles, causing a tight open-error-close cycle.
        if (stableTimerRef.current) {
          clearTimeout(stableTimerRef.current);
          stableTimerRef.current = null;
        }
        // Tier 2: a fresh open from here on counts as a new reopen
        // cycle, so previously-attempted transfers become eligible again.
        attemptedAutoResumeIdsRef.current.clear();
        if (autoResumeTimerRef.current) {
          clearTimeout(autoResumeTimerRef.current);
          autoResumeTimerRef.current = null;
        }
        // Mark the first moment we detected degradation. The 5-minute absolute
        // recovery window is measured from this timestamp, not from when the
        // browser reports navigator.onLine = false (which can lag significantly).
        if (sessionDisconnectedAtRef.current === null && !sessionEndingRef.current) {
          sessionDisconnectedAtRef.current = Date.now();
        }
        // Defer to connection-state handler to decide reconnect vs disconnect.
      };
      dc.onerror = (err) => {
        // Chrome fires onerror with "User-Initiated Abort, reason=Close called"
        // whenever dc.close() is called deliberately (e.g. during teardownPeer).
        // This is not a real error: logging it and triggering a reconnect would
        // cause spurious churn. Skip it entirely.
        const rtcErr = (err as RTCErrorEvent).error as { message?: string } | null;
        if (rtcErr?.message?.includes("User-Initiated Abort")) return;
        qbError("[QB] DataChannel error", err);
        // The underlying SCTP stream was reset (e.g. the remote device
        // backgrounded its tab and the OS terminated the WebRTC stack, or a
        // network interface change caused an abrupt teardown). Trigger a
        // reconnect immediately instead of waiting for pc.onconnectionstatechange
        // to reflect the failure: on some browsers/networks the PC stays in
        // "connected" for several seconds after the DataChannel is already dead,
        // leaving the user on a frozen "connected" UI with no recovery path.
        // scheduleReconnect is idempotent: the timer-guard at its top prevents
        // double-scheduling if pc.onconnectionstatechange also fires shortly after.
        scheduleReconnectRef.current();
      };

      // Receiver-side: a write or close failed (disk full, permission revoked,
      // I/O error). Mark the file aborted so further chunks are no-ops, tell
      // the sender to stop, surface the error in the UI, and remove the
      // (partial) file from disk.
      const abortIncomingDueToWriteError = (id: string, err: unknown) => {
        const buf = incomingBuffersRef.current[id];
        if (!buf || buf.aborted) return;
        buf.aborted = true;
        cancelledIdsRef.current.add(id);
        const message =
          err instanceof Error && err.message ? err.message : "Disk write failed";
        try {
                  sendControlMessage({ t: "file-abort", id: id, reason: message, sequence: Date.now() });
        } catch {}
        const writer = buf.writer;
        const cleanup = buf.cleanup;
        if (writer) {
          buf.writeQueue = buf.writeQueue.then(async () => {
            try {
              await (writer as unknown as { abort?: () => Promise<void> }).abort?.();
            } catch {}
            try {
              await writer.close();
            } catch {}
            if (cleanup) {
              try {
                await cleanup();
              } catch {}
            }
          });
        }
        setIncomingFiles((s) =>
          s[id]
            ? {
                ...s,
                [id]: { ...s[id], error: message, state: "failed", completedAt: Date.now() },
              }
            : s,
        );
        delete incomingBuffersRef.current[id];
        // Clear the IDB record immediately so the 24-hour prune doesn't
        // need to handle it and a resume attempt for the same id doesn't
        // attempt a redundant removeFileAtPath on an already-cleaned file.
        void clearInFlightTransfer(id).catch(err =>
          qbError("[QB] IDB: clearInFlightTransfer failed after write error", err),
        );
      };

      dc.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          let env: ProtocolEnvelope;
          try {
            env = JSON.parse(ev.data);
          } catch {
            qbWarn("[QB] DataChannel: received malformed JSON from peer, discarding");
            return;
          }
          if (env.v !== 1 || !env.type || !env.payload) {
             qbWarn("[QB] DataChannel: missing protocol envelope", env);
             return;
          }
          if (env.sessionId !== sessionId) {
             qbWarn("[QB] DataChannel: rejecting message from invalid session", env.sessionId);
             return;
          }
          if (env.generation !== sessionGenerationRef.current) {
             qbWarn(`[QB] DataChannel: rejecting stale message gen ${env.generation}`);
             return;
          }
          if (env.messageId && seenMessageIdsRef.current.has(env.messageId)) return;
          if (env.messageId) {
             seenMessageIdsRef.current.add(env.messageId);
             if (seenMessageIdsRef.current.size > 1000) {
                 const iterator = seenMessageIdsRef.current.values();
                 for (let j = 0; j < 200; j++) { const v = iterator.next().value; if (v) seenMessageIdsRef.current.delete(v); }
             }
          }
          const msg = env.payload;
          
          if (isControl && msg.id && typeof msg.sequence === "number") {
             const lastSeq = lastControlSequenceRef.current[msg.id] || -1;
             if (msg.sequence <= lastSeq) return;
             lastControlSequenceRef.current[msg.id] = msg.sequence;
          }

          if (msg.t === "text" || msg.t === "clipboard") {
              if (typeof msg.content !== "string" || exceedsTextByteCap(msg.content)) {
                qbWarn(
                  "[QB] DataChannel: peer sent text/clipboard violating content rules",
                  {
                    t: String(msg.t),
                    contentType: typeof msg.content,
                    length: typeof msg.content === "string" ? msg.content.length : "N/A",
                    max: MAX_TEXT_BYTES,
                  },
                );
                return;
              }
              setMessages((m) => [
                ...m,
                { id: crypto.randomUUID(), from: "peer", kind: msg.t, content: msg.content, ts: Date.now() },
              ]);
            } else if (msg.t === "file-start") {
              const meta: FileMeta = msg.meta;
              const resumeFrom =
                typeof meta.resumeFrom === "number" ? meta.resumeFrom : 0;
              // Resume attempt against an id the receiver previously
              // cancelled: the partial is already gone, so honoring the
              // resume would silently produce a corrupt file. Refuse and
              // tell the sender so they don't sit in the resume-ack wait.
              // Fresh retries (resumeFrom === 0) fall through to the
              // existing path that explicitly clears cancelledIdsRef
              // before creating a new buffer.
              if (resumeFrom > 0 && cancelledIdsRef.current.has(meta.id)) {
                try {
                  sendControlMessage({ t: "file-abort", id: meta.id, reason: "Cancelled by receiver", sequence: Date.now() });
                } catch {}
                return;
              }
              if (resumeFrom > 0) {
                const existing = incomingBuffersRef.current[meta.id];
                const matches =
                  existing &&
                  !existing.aborted &&
                  existing.meta.name === meta.name &&
                  existing.meta.size === meta.size;
                if (matches && existing) {
                  // Honor resume: cancel the grace-cleanup timer, drop the
                  // paused flag, and tell the sender exactly how many bytes
                  // we have. The sender uses our number (not its own) so
                  // we can never end up with a hole in the file.
                  const gt = graceTimersRef.current[meta.id];
                  if (gt) {
                    clearTimeout(gt);
                    delete graceTimersRef.current[meta.id];
                  }
                  setIncomingFiles((s) =>
                    s[meta.id]
                      ? {
                          ...s,
                          [meta.id]: {
                            ...s[meta.id],
                            paused: false,
                            pausedAt: undefined,
                            error: undefined,
                            // Snapshot the byte offset and timestamp at the
                            // moment of resume so the rate display can use
                            // (receivedBytes - resumeFromBytes) / resumeElapsed
                            // rather than receivedBytes / totalElapsed, which
                            // reads as nearly zero right after a resume.
                            resumeFromBytes: existing.received,
                            resumedAt: Date.now(),
                          },
                        }
                      : s,
                  );
                  try {
                    sendControlMessage({ t: "file-resume-ack", id: meta.id, offset: resumeFrom, sequence: Date.now() });
                  } catch {}
                  return;
                }
                // Mismatch (different file under same id) or buffer expired:
                // clean up the old partial and fall through to the fresh
                // buffer setup below. The sender uses offset:0 from our ack
                // to start over.
                if (existing) {
                  existing.aborted = true;
                  const gt = graceTimersRef.current[meta.id];
                  if (gt) {
                    clearTimeout(gt);
                    delete graceTimersRef.current[meta.id];
                  }
                  const writer = existing.writer;
                  const cleanup = existing.cleanup;
                  if (writer) {
                    existing.writeQueue
                      .then(async () => {
                        try {
                          await (
                            writer as unknown as { abort?: () => Promise<void> }
                          ).abort?.();
                        } catch {}
                        try {
                          await writer.close();
                        } catch {}
                        if (cleanup) {
                          try {
                            await cleanup();
                          } catch {}
                        }
                      })
                      .catch(() => {});
                  }
                  delete incomingBuffersRef.current[meta.id];
                } else {
                  // No in-memory buffer exists — the receiver likely refreshed
                  // mid-transfer while streaming to disk. Look up any orphaned
                  // partial file in IndexedDB and remove it now, before the
                  // fresh writable opens. Without this, collision detection in
                  // createWritableForName would produce "file (1).ext" next to
                  // the existing "file.ext" partial, leaving the user with two
                  // confusing files. Best-effort: ack is sent regardless.
                  void (async () => {
                    try {
                      const record = await getInFlightTransfer(meta.id);
                      if (!record) return;
                      const dir = saveDirectoryRef.current;
                      if (dir) await removeFileAtPath(dir.handle, record.finalName);
                      void clearInFlightTransfer(meta.id).catch(err =>
                        qbWarn("[QB] IDB: clearInFlightTransfer failed (orphan cleanup)", err),
                      );
                    } catch (err) {
                      qbWarn("[QB] orphan file cleanup failed (stale handle or directory removed)", err);
                    }
                  })();
                }
                try {
                  sendControlMessage({ t: "file-resume-ack", id: meta.id, offset: resumeFrom, sequence: Date.now() });
                } catch {}
              }
              // FSA receiving invariant: if this browser supports the File
              // System Access API but no verified save directory is currently
              // set, we must not accumulate this file into RAM. The folder gate
              // UI protects against the normal case, but a race (peer sends
              // file-start before the user has chosen a folder) could bypass
              // the UI guard. Abort the transfer at the protocol level so the
              // sender receives a clear failure rather than a silent hang.
              // This guard intentionally runs AFTER the resume paths above:
              // a file already in a buffer (resume) was started before any
              // race could occur and is allowed to continue.
              if (streamToDiskSupported() && !saveDirectoryRef.current) {
                sendDataMessage({ t: "file-abort", id: meta.id, reason: "No save folder selected. Choose a folder on the receiving device.", sequence: Date.now() });
                return;
              }
              const buf: IncomingBuffer = {
                meta,
                received: 0,
                memoryChunks: [],
                writer: null,
                finalName: null,
                savedToDisk: false,
                writeQueue: Promise.resolve(),
                cleanup: null,
                aborted: false,
                hasher: new IncrementalSha256(),
              };
              incomingBuffersRef.current[meta.id] = buf;
              cancelledIdsRef.current.delete(meta.id);
              setIncomingFiles((s) => ({
                ...s,
                [meta.id]: {
                  id: meta.id,
                  name: meta.name,
                  size: meta.size,
                  type: meta.type,
                  receivedBytes: 0,
                  state: "receiving",
                  startedAt: Date.now(),
                },
              }));
              // Try to open a writable stream into the chosen save directory.
              // If the picker grant was revoked or the API isn't supported we
              // silently fall back to in-memory buffering.
              const dir = saveDirectoryRef.current;
              if (dir && streamToDiskSupported()) {
                void (async () => {
                  // Disk-space pre-check (best-effort; browsers report a
                  // per-origin quota that approximates free disk space).
                  // Requires a sane meta.size - zero-byte files always pass.
                  if (meta.size > 0) {
                    const free = await estimateFreeSpace();
                    if (free !== null && free < meta.size) {
                      const live = incomingBuffersRef.current[meta.id];
                      if (!live || live.aborted) return;
                      live.aborted = true;
                      cancelledIdsRef.current.add(meta.id);
                      try {
                  sendControlMessage({ t: "file-abort", id: meta.id, reason: "Memory limit exceeded", sequence: Date.now() });
                      } catch {}
                      const reason = `Not enough free space (need ${meta.size} bytes, ~${free} available)`;
                      setIncomingFiles((s) =>
                        s[meta.id]
                          ? {
                              ...s,
                              [meta.id]: {
                                ...s[meta.id],
                                error: reason,
                                state: "failed",
                                completedAt: Date.now(),
                              },
                            }
                          : s,
                      );
                      delete incomingBuffersRef.current[meta.id];
                      return;
                    }
                  }
                  try {
                    const live = incomingBuffersRef.current[meta.id];
                    if (!live || live.aborted) return;
                    live.createWritableInflight = (async () => {
                      const { writable, finalName, cleanup } = await createWritableForName(
                        dir.handle,
                        meta.name,
                      );
                      const currentLive = incomingBuffersRef.current[meta.id];
                      if (!currentLive || currentLive.aborted) {
                        try {
                          await (writable as unknown as { abort?: () => Promise<void> }).abort?.();
                        } catch {}
                        try {
                          await writable.close();
                        } catch {}
                        try {
                          await cleanup();
                        } catch {}
                        return;
                      }
                      const queued = currentLive.memoryChunks;
                      currentLive.memoryChunks = []; // free memory
                      incomingMemoryBytesRef.current -= queued.reduce((acc, c) => acc + c.byteLength, 0);
                      currentLive.writer = writable;
                      currentLive.finalName = finalName;
                      currentLive.savedToDisk = true;
                      currentLive.cleanup = cleanup;
                      void persistInFlightTransfer(meta.id, finalName, meta.size).catch(err =>
                        qbError("[QB] IDB: persistInFlightTransfer failed - resume will restart from 0 if disconnected", err),
                      );
                      currentLive.writeQueue = currentLive.writeQueue.then(async () => {
                        for (const c of queued) {
                          if (currentLive.aborted) return;
                          try {
                            await writable.write(c as BufferSource);
                          } catch (err) {
                            abortIncomingDueToWriteError(meta.id, err);
                            return;
                          }
                        }
                      });
                    })();
                    await live.createWritableInflight;
                    setIncomingFiles((s) =>
                      s[meta.id]
                        ? { ...s, [meta.id]: { ...s[meta.id], savedToDisk: true, savedAs: live.finalName ?? undefined } }
                        : s,
                    );
                  } catch (err) {
                    // Could not open the writable (permission revoked, etc.).
                    // Stay on the in-memory fallback path so the transfer still
                    // succeeds, but surface a hint via console for debugging.
                    if (typeof console !== "undefined") {
                      qbWarn("[quickbridge] stream-to-disk fallback:", err);
                    }
                  }
                })();
              }
            } else if (msg.t === "file-cancel") {
              // Validate id before use: msg.offset and msg.sha256 have
              // existing typeof guards; apply the same discipline here so a
              // malformed packet cannot corrupt cancelledIdsRef or leave a
              // disk writer open without an associated buffer entry.
              if (typeof msg.id !== "string" || !msg.id) return;
              const id = msg.id;
              cancelledIdsRef.current.add(id);
              const buf = incomingBuffersRef.current[id];
              if (buf) {
                buf.aborted = true;
                // Release memory accounting for any buffered in-memory chunks.
                if (!buf.writer && buf.memoryChunks.length > 0) {
                  const freed = buf.memoryChunks.reduce((acc, c) => acc + c.byteLength, 0);
                  incomingMemoryBytesRef.current = Math.max(0, incomingMemoryBytesRef.current - freed);
                  buf.memoryChunks = [];
                }
                if (buf.writer) {
                  const writer = buf.writer;
                  const cleanup = buf.cleanup;
                  buf.writeQueue = buf.writeQueue.then(async () => {
                    try {
                      await (
                        writer as unknown as { abort?: () => Promise<void> }
                      ).abort?.();
                    } catch {}
                    try {
                      await writer.close();
                    } catch {}
                    if (cleanup) {
                      try {
                        await cleanup();
                      } catch {}
                    }
                  });
                }
              }
              delete incomingBuffersRef.current[id];
              setIncomingFiles((s) => {
                if (!s[id]) return s;
                const next = { ...s };
                delete next[id];
                return next;
              });
            } else if (msg.t === "file-abort") {
              // Receiver told us to stop sending this file (disk full, write
              // failure, permission revoked, etc.). Mark it so the send loop
              // bails out, and surface the reason on the outgoing entry as a
              // retryable error.
              if (typeof msg.id !== "string" || !msg.id) return;
              const id = msg.id;
              const reason: string =
                typeof msg.reason === "string" && msg.reason ? msg.reason : "Receiver aborted";
              // Terminal-state guard: if the outgoing transfer is already in a
              // terminal state (completed, failed, cancelled), discard the
              // late abort — we must not resurrect or corrupt a settled entry.
              const existingOutgoing = outgoingFilesRef.current[id];
              if (existingOutgoing && (existingOutgoing.state === "completed" || existingOutgoing.state === "failed" || existingOutgoing.state === "cancelled")) {
                return;
              }
              peerAbortedSendIdsRef.current.add(id);
              // If a resume attempt is parked waiting for an ack, fail it
              // now so the user sees the real abort reason instead of the
              // misleading "did not acknowledge resume" timeout 5s later.
              const ackResolver = resumeAckResolversRef.current[id];
              if (ackResolver) {
                delete resumeAckResolversRef.current[id];
                // Signal abort with offset = -1; sendFileInternal treats
                // this as a hard failure and surfaces the existing
                // outgoing-entry error (set just below) instead of its
                // own message.
                ackResolver(-1);
              }
              setOutgoingFiles((s) =>
                s[id]
                  ? {
                      ...s,
                      [id]: {
                        ...s[id],
                        state: "failed",
                        error: reason,
                        retryable: !!fileSourcesRef.current[id],
                      },
                    }
                  : s,
              );
            } else if (msg.t === "file-resume-ack") {
              // Receiver tells us the actual byte offset they have. We
              // always honor their number, even if it's lower than ours,
              // so the file can never contain a hole.
              // Delete the resolver before calling it to guarantee idempotency:
              // a duplicate or late ACK will find no resolver and be ignored
              // safely, preventing double-resume or state corruption.
              if (typeof msg.id !== "string" || !msg.id) return;
              const id = msg.id;
              const offset: number =
                typeof msg.offset === "number" && msg.offset >= 0 ? msg.offset : 0;
              const resolver = resumeAckResolversRef.current[id];
              if (resolver) {
                delete resumeAckResolversRef.current[id];
                // Cancel the timeout so it doesn't fire a redundant failure
                // after the ACK has already been successfully processed.
                if (resumeAckTimersRef.current[id]) {
                  clearTimeout(resumeAckTimersRef.current[id]);
                  delete resumeAckTimersRef.current[id];
                }
                resolver(offset);
              }
            } else if (msg.t === "file-end") {
              if (typeof msg.id !== "string" || !msg.id) return;
              const id = msg.id;
              const buf = incomingBuffersRef.current[id];
              // Terminal-state invariant: if this transfer is already aborted
              // (disk failure, receiver cancel, etc.), discard the late file-end.
              // FAILED -> VERIFIED and FAILED -> COMPLETED are strictly forbidden.
              if (!buf || buf.aborted) return;
              // Capture SHA-256 from sender and compute the receiver digest now,
              // while buf is still alive and hasher state is complete. The data
              // channel is ordered so file-end always arrives after the last
              // binary frame, making the hasher state final at this point.
              const senderSha256: string | undefined =
                typeof msg.sha256 === "string" && msg.sha256 ? msg.sha256 : undefined;
              const receivedDigest = buf.hasher.digest();
              const verified: boolean | undefined =
                senderSha256 !== undefined ? senderSha256 === receivedDigest : undefined;
              void (async () => {
                if (buf.createWritableInflight) {
                  await buf.createWritableInflight;
                }
                if (buf.writer) {
                  const writer = buf.writer;
                  const finalName = buf.finalName;
                  buf.writeQueue
                    .then(async () => {
                      await writer.close();
                    })
                    .then(() => {
                      setIncomingFiles((s) =>
                        s[id]
                          ? {
                              ...s,
                              [id]: {
                                ...s[id],
                                receivedBytes: buf.meta.size,
                                state: verified ? "verified" : "finalizing",
                                savedToDisk: true,
                                savedAs: finalName ?? undefined,
                                completedAt: Date.now(),
                                sha256: senderSha256,
                                verified,
                              },
                            }
                          : s,
                      );
                      delete incomingBuffersRef.current[id];
                      void clearInFlightTransfer(id).catch(err =>
                        qbError("[QB] IDB: clearInFlightTransfer failed after file-end", err),
                      );
                    })
                    .catch((err) => {
                      setIncomingFiles((s) =>
                        s[id]
                          ? {
                              ...s,
                              [id]: {
                                ...s[id],
                                state: "failed",
                                error: "Disk write failed",
                                completedAt: Date.now(),
                              },
                            }
                          : s,
                      );
                      delete incomingBuffersRef.current[id];
                      void clearInFlightTransfer(id).catch(err =>
                        qbError("[QB] IDB: clearInFlightTransfer failed after write error", err),
                      );
                    });
              } else {
                // Release the memory accounting before building the Blob
                // so the counter doesn't remain elevated while the Blob
                // itself uses its own (separate) managed heap.
                const freedBytes = buf.memoryChunks.reduce((acc, c) => acc + c.byteLength, 0);
                incomingMemoryBytesRef.current = Math.max(0, incomingMemoryBytesRef.current - freedBytes);
                const blob = new Blob(buf.memoryChunks as BlobPart[], { type: buf.meta.type });
                const url = URL.createObjectURL(blob);
                objectUrlsRef.current.push(url);
                setIncomingFiles((s) => ({
                  ...s,
                  [id]: {
                    ...s[id],
                    receivedBytes: buf.meta.size,
                    url,
                    state: verified ? "verified" : "finalizing",
                    completedAt: Date.now(),
                    sha256: senderSha256,
                    verified,
                  },
                }));
                delete incomingBuffersRef.current[id];
              }
            })();
            } else if (msg.t === "node-hello") {
              const hello = validateNodeHello(msg);
              if (hello) {
                const nodeHello: NodeHello = {
                  nodeId: hello.nodeId,
                  publicKeyJwk: hello.publicKeyJwk,
                  nickname: hello.nickname,
                  deviceKind: hello.deviceKind,
                };
                try {
                  onPeerNodeHelloRef.current?.(nodeHello);
                } catch (err) {
                  qbError("[QB] DataChannel: onPeerNodeHello callback threw", err);
                }
              }
            } else if (msg.t === "node-challenge") {
              const challenge = validateNodeChallenge(msg);
              if (challenge) {
                try {
                  onNodeChallengeRef.current?.(challenge.nonce);
                } catch (err) {
                  qbError("[QB] DataChannel: onNodeChallenge callback threw", err);
                }
              }
            } else if (msg.t === "node-verify") {
              const verify = validateNodeVerify(msg);
              if (verify) {
                try {
                  onNodeVerifyRef.current?.(verify.nodeId, verify.signature);
                } catch (err) {
                  qbError("[QB] DataChannel: onNodeVerify callback threw", err);
                }
              }
            } else if (msg.t === "continuity-intent") {
              // Phase 3 Continuity: incoming intent from the peer.
              const envelope: IntentEnvelope = {
                // Pass the peer's actual version through so handleIncomingIntent
                // can detect mismatches and send UNSUPPORTED_VERSION (BUG 1 fix).
                version: msg.version as typeof INTENT_ENVELOPE_VERSION,
                intentId: String(msg.intentId ?? ""),
                sessionId: String(msg.sessionId ?? ""),
                type: String(msg.type ?? "") as ContinuityIntentType,
                senderNodeId: String(msg.senderNodeId ?? ""),
                targetNodeId: String(msg.targetNodeId ?? ""),
                payload: msg.payload,
                createdAt: Number(msg.createdAt ?? 0),
                expiresAt: Number(msg.expiresAt ?? 0),
              };
              try {
                onContinuityIntentRef.current?.(envelope);
              } catch (err) {
                qbError("[QB] DataChannel: onContinuityIntent callback threw", err);
              }
            } else if (msg.t === "intent-ack") {
              // Phase 3 Continuity: ACK for an intent we sent.
              const ack: IntentAck = {
                intentId: String(msg.intentId ?? ""),
                status: msg.status as IntentAck["status"],
                reasonCode: msg.reasonCode as IntentAck["reasonCode"],
                reasonMessage: typeof msg.reasonMessage === "string"
                  ? msg.reasonMessage
                  : undefined,
              };
              try {
                onIntentAckRef.current?.(ack);
              } catch (err) {
                qbError("[QB] DataChannel: onIntentAck callback threw", err);
              }
            } else if (msg.t === "session-ended") {
              // Remote peer deliberately closed the session.
              // Validate the sessionId so a stale event from a previous
              // session cannot accidentally terminate a new one.
              if (typeof msg.sessionId === "string" && msg.sessionId !== sessionId) {
                qbWarn("[QB] DataChannel: session-ended sessionId mismatch, discarding",
                  { received: msg.sessionId, expected: sessionId });
                return;
              }
              qbLog("[QB] DataChannel: received session-ended from peer");
              endSessionRef.current("remote_disconnect");
            } else {
              qbWarn("[QB] DataChannel: unknown message type from peer", String(msg.t));
            }
        } else {
          const data = new Uint8Array(ev.data as ArrayBuffer);
          if (data.byteLength <= HEADER_SIZE) return;
          const id = bytesToId(data.subarray(0, HEADER_SIZE));
          if (cancelledIdsRef.current.has(id)) return;
          // Copy the payload - the underlying ArrayBuffer is owned by the
          // event and may be neutered or reused; both the writer and the
          // memory blob path need stable bytes.
          const payload = new Uint8Array(data.byteLength - HEADER_SIZE);
          payload.set(data.subarray(HEADER_SIZE));
          const buf = incomingBuffersRef.current[id];
          if (!buf || buf.aborted) return;
          if (buf.writer) {
            const writer = buf.writer;
            buf.writeQueue = buf.writeQueue.then(async () => {
              if (buf.aborted) return;
              try {
                // The writable's write() promise resolves only once the
                // chunk is accepted, which gives us natural backpressure
                // since the queue is serialized - fast network + slow disk
                // can't blow up memory the way an unawaited write would.
                await writer.write(payload as BufferSource);
              } catch (err) {
                abortIncomingDueToWriteError(id, err);
              }
            });
          } else {
            // Memory-only path: enforce per-file and total limits before
            // buffering. Exceeding either triggers a hard abort so a large
            // transfer (or several concurrent ones) can't OOM the browser tab.
            const newFileBytes = buf.received + payload.byteLength;
            const newTotalBytes = incomingMemoryBytesRef.current + payload.byteLength;
            if (
              newFileBytes > MAX_IN_MEMORY_FILE_BYTES ||
              newTotalBytes > MAX_TOTAL_IN_MEMORY_TRANSFER_BYTES
            ) {
              // Release already-buffered bytes before aborting.
              const alreadyBuffered = buf.memoryChunks.reduce((acc, c) => acc + c.byteLength, 0);
              incomingMemoryBytesRef.current = Math.max(0, incomingMemoryBytesRef.current - alreadyBuffered);
              buf.aborted = true;
              cancelledIdsRef.current.add(id);
              buf.memoryChunks = [];
              try {
              sendControlMessage({ t: "file-abort", id, reason: "Memory limit exceeded", sequence: Date.now() });
              } catch {}
              setIncomingFiles((s) =>
                s[id]
                  ? {
                      ...s,
                      [id]: {
                        ...s[id],
                        state: "failed",
                        error: "File too large to receive in memory. Use a browser with File System Access API (e.g. Chrome) to receive large files.",
                        completedAt: Date.now(),
                      },
                    }
                  : s,
              );
              delete incomingBuffersRef.current[id];
              return;
            }
            incomingMemoryBytesRef.current += payload.byteLength;
            buf.memoryChunks.push(payload);
          }
          buf.received += payload.byteLength;
          // Accumulate the incremental SHA-256 in the same order chunks arrive.
          // Data channel is ordered so this exactly mirrors the sender's byte stream.
          buf.hasher.update(payload);
          setIncomingFiles((s) => {
            const file = s[id];
            if (!file || file.state === "failed" || file.state === "cancelled" || file.state === "verified") return s;
            return { ...s, [id]: { ...file, receivedBytes: buf.received } };
          });
        }
      };
    },
    [startQualityPoll, stopQualityPoll],
  );

  const scheduleReconnect = useCallback(() => {
    // Terminal guard: once endSession() has been called, no reconnection is
    // ever attempted. This prevents ICE/DC close events from accidentally
    // resurrecting a deliberately ended session.
    if (sessionEndingRef.current) {
      qbLog("[QB] scheduleReconnect: session is ending/ended, skipping");
      return;
    }
    // If already waiting with no peer in signaling, stay there — no WebRTC
    // reconnect is possible. In all other cases (reconnecting, connected, etc.)
    // proceed even if presence has dropped, because transport state is
    // authoritative (Rule 8/9: WebRTC state drives session, not Supabase).
    if (!peerPresentRef.current && statusRef.current === "waiting") {
      qbLog("[QB] scheduleReconnect: no peer present and already waiting, staying");
      return;
    }
    if (!hasConnectedRef.current && reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      qbLog("[QB] scheduleReconnect: max initial attempts reached, ending session");
      endSessionRef.current("host_not_found");
      return;
    }
    if (sessionDisconnectedAtRef.current && Date.now() - sessionDisconnectedAtRef.current > 300_000) {
      qbLog("[QB] scheduleReconnect: 5-minute absolute recovery window expired, ending session");
      endSessionRef.current("timeout");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      qbLog("[QB] scheduleReconnect: offline, pausing reconnect backoff");
      setStatus("reconnecting");
      return;
    }
    if (reconnectTimerRef.current) return; // already scheduled
    const attempt = reconnectAttemptRef.current + 1;
    reconnectAttemptRef.current = attempt;
    setReconnectAttempt(attempt);
    setStatus("reconnecting");
    // Exponential backoff capped at 8s
    const delay = Math.min(8000, 600 * Math.pow(1.6, attempt - 1));
    const generation = sessionGenerationRef.current;
    reconnectTimerRef.current = setTimeout(() => {
      if (generation !== sessionGenerationRef.current) return;
      reconnectTimerRef.current = null;

      const pc = pcRef.current;
      // ICE restart is faster than full teardown (reuses existing PC + DataChannel,
      // no new offer/answer ceremony needed) but only works when:
      //   - We are within the lightweight-restart budget (first ICE_RESTART_MAX attempts).
      //   - The RTCPeerConnection is still alive and not in a terminal state.
      //   - The DataChannel is still open (SCTP hasn't timed out).
      //   - There are no active transfers (Chrome SCTP buffers often get permanently stuck after ICE restarts).
      //   - We are the initiator (only the offerer can trigger an ICE restart by
      //     sending a new offer with iceRestart:true). Non-initiators ask the host
      //     via a "request-ice-restart" signal instead.
      const hasActiveTransfer = Object.values(outgoingFilesRef.current).some(
        f => f.state === "sending" || f.state === "resuming"
      );
      const pcUsable =
        pc !== null &&
        pc.connectionState !== "closed" &&
        pc.connectionState !== "failed" &&
        pc.signalingState !== "closed" &&
        dcRef.current?.readyState === "open" &&
        !hasActiveTransfer;

      if (attempt <= ICE_RESTART_MAX && pcUsable) {
        qbLog(`[QB] scheduleReconnect: ICE restart attempt ${attempt}/${ICE_RESTART_MAX}`);
        armConnectTimeoutRef.current();
        if (isInitiatorRef.current) {
          void (async () => {
            if (isNegotiatingRef.current) return;
            const gen = sessionGenerationRef.current;
            isNegotiatingRef.current = true;
            try {
              pc.restartIce();
              const offer = await pc.createOffer({ iceRestart: true });
              if (gen !== sessionGenerationRef.current) return;
              await pc.setLocalDescription(offer);
              sendSignal({ type: "offer", sdp: offer, iceRestart: true });
            } catch (err) {
              qbError("[QB] ICE restart offer failed", err);
              scheduleReconnectRef.current();
            } finally {
              if (gen === sessionGenerationRef.current) isNegotiatingRef.current = false;
            }
          })();
        } else {
          // Non-initiator: ask the host to generate the restart offer.
          sendSignal({ type: "request-ice-restart" });
        }
        return;
      }

      // Full teardown path (either ICE restart budget exhausted or PC is dead).
      //
      // Auto-relay: on the first full-teardown attempt, if we have not already
      // enabled relay, activate it now. The ICE restarts above already tried
      // the same ICE servers; continuing with the same config would just repeat
      // the same failures. Routing through TURN gives a fresh path, especially
      // useful for CGNAT and corporate firewalls.
      //
      // onAutoRelayRef.current() triggers setForceRelay(true) in the parent,
      // which schedules a React re-render. That render will call useLatestRef
      // and set forceRelayRef.current = true — but only after this synchronous
      // code finishes and the React scheduler runs. To guarantee that
      // createPeerConnection (called below via doRestart) reads the correct
      // relay flag, we eagerly set forceRelayRef.current = true here. The
      // subsequent React render will write the same value, so there is no
      // conflict and no ordering dependency on browser task scheduling.
      const activatingAutoRelay =
        attempt === ICE_RESTART_MAX + 1 && !forceRelayRef.current;
      if (activatingAutoRelay) {
        qbLog("[QB] scheduleReconnect: auto-activating relay after ICE restart exhaustion");
        forceRelayRef.current = true; // eagerly sync; React render will confirm the same value
        onAutoRelayRef.current?.();
      }

      teardownRef.current();
      // Mark active outgoing transfers as retryable failures so the user can resume.
      setOutgoingFiles((s) => {
        const next = { ...s };
        for (const id of Object.keys(next)) {
          const f = next[id];
          if (f.state !== "completed" && f.state !== "failed" && f.state !== "cancelled" && !f.error) {
            next[id] = { ...f, state: "paused", retryable: true };
          }
        }
        return next;
      });

      if (isInitiatorRef.current) {
        void startOfferRef.current?.()?.catch(err => {
          qbError("[QB] startOffer failed (reconnect path)", err);
          scheduleReconnectRef.current();
        });
      } else {
        sendSignal({ type: "hello", protocol: 1, capabilities: { controlChannel: true, fileResume: true, continuity: true, streamToDisk: true } });
      }
    }, delay);
  }, [sendSignal]);
  // Populate the forward-decl ref so setupDataChannel's dc.onerror can call
  // scheduleReconnect without a circular useCallback dependency chain.
  scheduleReconnectRef.current = scheduleReconnect;

  const createPeerConnection = useCallback(() => {
    // Close any previous PC so it cannot fire stale state-change events that
    // would tear down the new one. Without this, double-fired startOffer()
    // calls (e.g. presence sync + hello arriving back-to-back) leave an
    // orphaned RTCPeerConnection alive that later "fails" and triggers
    // teardown of the working PC -- visible to the user as the connection
    // dropping and reconnecting several times before it finally settles.
    if (pcRef.current) {
      qbLog("[QB] createPeerConnection: closing previous PC");
      try {
        pcRef.current.close();
      } catch {}
    }
    qbLog("[QB] createPeerConnection: creating new RTCPeerConnection");
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current, iceTransportPolicy: forceRelayRef.current ? "relay" : "all" });
    pcRef.current = pc;
    remoteDescSetRef.current = false;
    const dc = pc.createDataChannel("qb-data", { negotiated: true, id: 0, ordered: true });
    const controlDc = pc.createDataChannel("qb-control", { negotiated: true, id: 1, ordered: true });
    dcRef.current = dc;
    controlDcRef.current = controlDc;
    setupDataChannel(dc, false);
    setupDataChannel(controlDc, true);
    pendingCandidatesRef.current = [];

    const generation = sessionGenerationRef.current;
    pc.onicecandidate = (e) => {
      if (generation !== sessionGenerationRef.current) return;
      // Ignore candidates from an orphaned PC.
      if (pc !== pcRef.current) return;
      if (e.candidate) sendSignal({ type: "ice", candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      // Defensive: if this PC is no longer the active one (because a fresh
      // negotiation replaced it), don't mutate global status / trigger
      // reconnects on its behalf.
      if (pc !== pcRef.current) return;
      const st = pc.connectionState;
      qbLog(`[QB] PC connectionState: ${st}`);
      if (st === "connected") {
        hasConnectedRef.current = true;
        if (connectTimerRef.current) {
          clearTimeout(connectTimerRef.current);
          connectTimerRef.current = null;
        }
        // ICE self-recovered: cancel any pending disconnected debounce so we
        // do not trigger a reconnect after the connection is already healthy.
        if (disconnectedTimerRef.current) {
          clearTimeout(disconnectedTimerRef.current);
          disconnectedTimerRef.current = null;
        }
        // Only surface "connected" status here when the DataChannel is already
        // open. For the initial connection the DataChannel state is still
        // "connecting" when the PC reaches "connected" — dc.onopen handles the
        // status transition a few milliseconds later. For ICE restarts the
        // existing DataChannel stays open through the re-negotiation, so
        // readyState is already "open" here and this is the only place that
        // can signal the reconnection is complete (dc.onopen does not re-fire
        // on ICE restart). Keeping the two paths separate avoids the connect
        // sound, vibrate, and trust-flow effects firing before the channel is
        // actually usable.
          if (dcRef.current?.readyState === "open" && controlDcRef.current?.readyState === "open") {
          // ICE restart succeeded: the DataChannel survived the re-negotiation
          // and is already live. Reset the counter immediately — the channel
          // was open and stable before the restart attempt, so there is no
          // risk of brief-open credit loss. For fresh connections the counter
          // reset is deferred to the DC_STABLE_DURATION_MS timer in dc.onopen.
          reconnectAttemptRef.current = 0;
          setReconnectAttempt(0);
          if (protocolStateRef.current === "compatible") {
          setStatus("connected");
          }
        }
        startQualityPoll();
      } else if (st === "failed" || st === "closed") {
        // Terminal states: fire immediately. Cancel any pending debounce.
        if (disconnectedTimerRef.current) {
          clearTimeout(disconnectedTimerRef.current);
          disconnectedTimerRef.current = null;
        }
        // Mark the first disconnect timestamp for the 5-minute absolute
        // recovery window. Only set once — the earliest timestamp is authoritative.
        if (sessionDisconnectedAtRef.current === null && !sessionEndingRef.current) {
          sessionDisconnectedAtRef.current = Date.now();
        }
        stopQualityPoll();
        setQuality("unknown");
        scheduleReconnect();
      } else if (st === "disconnected") {
        // Transient state: ICE can self-recover within a few hundred ms by
        // re-selecting a candidate pair. Debounce before triggering a restart
        // so a brief candidate swap does not kick off an unnecessary ICE
        // restart offer into a connection that would have recovered on its own.
        // The timer is cancelled above if the PC reaches "connected" first.
        // Mark the first disconnect timestamp for the 5-minute absolute
        // recovery window if not already recorded.
        if (sessionDisconnectedAtRef.current === null && !sessionEndingRef.current) {
          sessionDisconnectedAtRef.current = Date.now();
        }
        stopQualityPoll();
        setQuality("unknown");
        if (!disconnectedTimerRef.current) {
          const generation = sessionGenerationRef.current;
          disconnectedTimerRef.current = setTimeout(() => {
            if (generation !== sessionGenerationRef.current) return;
            disconnectedTimerRef.current = null;
            if (pc === pcRef.current) scheduleReconnect();
          }, DISCONNECTED_DEBOUNCE_MS);
        }
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc !== pcRef.current) return;
      qbLog(`[QB] ICE connectionState: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        scheduleReconnect();
      }
    };
    return pc;
  }, [scheduleReconnect, sendSignal, setupDataChannel, startQualityPoll, stopQualityPoll]);

  const armConnectTimeout = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    const generation = sessionGenerationRef.current;
    connectTimerRef.current = setTimeout(() => {
      if (generation !== sessionGenerationRef.current) return;
      connectTimerRef.current = null;
      if (sessionEndingRef.current) return;
      // The connect timer is always cancelled by dc.onopen and
      // pc.onconnectionstatechange when the connection succeeds, so if
      // we reach here the connection has not completed. Calling
      // scheduleReconnect() inside a React state updater is incorrect:
      // updater functions may run more than once in concurrent/strict mode,
      // which would double-increment the attempt counter and arm two timers.
      // Reading the flag directly here is safe because this callback runs
      // in a genuine event-loop tick, never inside a render.
      if (peerPresentRef.current) {
        scheduleReconnect();
      } else {
        // No peer and connect timed out: treat as a timeout end.
        endSessionRef.current(hasConnectedRef.current ? "timeout" : "host_not_found");
      }
    }, CONNECT_TIMEOUT_MS);
  }, [scheduleReconnect]);
  // Populate the forward-decl ref so scheduleReconnect can call armConnectTimeout
  // from its ICE-restart path without a circular useCallback dependency.
  armConnectTimeoutRef.current = armConnectTimeout;

  const tryComputeSas = useCallback(async () => {
    if (sasComputedRef.current) return;
    const pc = pcRef.current;
    if (!pc) return;
    const local = pc.localDescription?.sdp;
    const remote = pc.remoteDescription?.sdp;
    if (!local || !remote) return;
    const lf = extractFingerprint(local);
    const rf = extractFingerprint(remote);
    if (!lf || !rf) return;
    sasComputedRef.current = true;
    try {
      const code = await deriveSas(lf, rf);
      setSasCode(code);
    } catch {
      sasComputedRef.current = false;
    }
  }, []);

  const drainPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(c);
      } catch {}
    }
  }, []);

  // Forward-decl ref so scheduleReconnect can call startOffer
  const startOfferRef = useRef<(() => Promise<void>) | null>(null);

  const startOffer = useCallback(async () => {
    if (sessionEndingRef.current || isNegotiatingRef.current) {
      qbLog("[QB] startOffer: ending or negotiating, skipping");
      return;
    }
    const generation = sessionGenerationRef.current;
    isNegotiatingRef.current = true;
    try {
      qbLog("[QB] startOffer: creating offer");
      setStatus("connecting");
      armConnectTimeout();
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      if (generation !== sessionGenerationRef.current) return;
      await pc.setLocalDescription(offer);
      void tryComputeSas();
      qbLog("[QB] startOffer: sending offer via signaling");
      sendSignal({ type: "offer", sdp: offer });
    } catch (err) {
      qbLog(`[QB] startOffer failed: ${err}`);
    } finally {
      if (generation === sessionGenerationRef.current) {
        isNegotiatingRef.current = false;
      }
    }
  }, [armConnectTimeout, createPeerConnection, sendSignal, setupDataChannel, tryComputeSas]);

  startOfferRef.current = startOffer;

  // ---------------------------------------------------------------------------
  // endSession: the single authoritative entry-point for session termination.
  // Idempotent, terminal, and synchronous from the caller's perspective.
  // ---------------------------------------------------------------------------
  const endSession = useCallback((reason: SessionEndReason) => {
    // Idempotency guard: once we are ending/ended, do nothing.
    if (sessionEndingRef.current) {
      qbLog(`[QB] endSession(${reason}): already ending/ended, ignoring`);
      return;
    }
    sessionDisconnectedAtRef.current = null;
    sessionEndingRef.current = true;
    endReasonRef.current = reason;
    sessionGenerationRef.current++;
    qbLog(`[QB] endSession: reason=${reason}`);
    setStatus("ending");

    // 1. Cancel all active outgoing transfers so the peer and UI know they
    //    are dead, not merely paused. Cancelled means user/session action;
    //    it should NOT be marked as a retryable error.
    const dc = dcRef.current;
    setOutgoingFiles((s) => {
      const next = { ...s };
      for (const id of Object.keys(next)) {
        const f = next[id];
        if (f.state !== "completed" && f.state !== "failed" && f.state !== "cancelled" && !f.error) {
          // Tell the peer we are stopping so they don't wait indefinitely.
          sendDataMessage({ t: "file-cancel", id });
          next[id] = { ...f, error: "Bridge ended", retryable: false };
        }
      }
      return next;
    });

    // 2. Mark all in-progress incoming transfers as cancelled (not failed).
    //    Abort their disk writers and clear their buffers.
    setIncomingFiles((s) => {
      const next = { ...s };
      for (const id of Object.keys(next)) {
        const f = next[id];
        if (f.state !== "verified" && f.state !== "failed" && f.state !== "cancelled" && !f.error) {
          const buf = incomingBuffersRef.current[id];
          if (buf && !buf.aborted) {
            buf.aborted = true;
            const writer = buf.writer;
            const cleanup = buf.cleanup;
            if (writer) {
              buf.writeQueue = buf.writeQueue
                .then(async () => {
                  try { await (writer as unknown as { abort?: () => Promise<void> }).abort?.(); } catch {}
                  try { await writer.close(); } catch {}
                  if (cleanup) { try { await cleanup(); } catch {} }
                })
                .catch(() => {});
            }
            delete incomingBuffersRef.current[id];
            void clearInFlightTransfer(id).catch(() => {});
          }
          next[id] = { ...f, error: "Bridge ended", state: "failed" };
        }
      }
      return next;
    });

    // 3. Cancel all pending grace timers.
    for (const t of Object.values(graceTimersRef.current)) clearTimeout(t);
    graceTimersRef.current = {};

    // 4. Cancel auto-resume timer.
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }

    // 5. Send session-ended via DataChannel (fast path, arrives first).
    //    Validated payload lets the receiver reject stale events from
    //    a previous session.
    const payload = {
      t: "session-ended",
      type: "session-ended",
      sessionId: sessionId,
      reason,
    };
    try {
      if (dc && dc.readyState === "open") {
        sendControlMessage(payload);
      }
    } catch {}

    // 6. Send session-ended via Supabase as a fallback for the case where
    //    the DataChannel never opened or the DC send fails (race before
    //    handshake completes).
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload,
      });
    } catch {}

    // 7. Tear down WebRTC peer.
    teardownRef.current();

    // 8. Transition to ended.
    setStatus("ended");
  }, [
    sessionId,
  ]);
  // Populate the forward-decl ref immediately so closures created before
  // endSession was defined (setupDataChannel, signalHandler) can call it.
  endSessionRef.current = endSession;

  // Teardown without removing the realtime channel
  const teardownPeer = useCallback(() => {
    qbLog("[QB] teardownPeer");
    stopQualityPoll();
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    // Cancel the stability timer so a pending counter-reset from a brief
    // prior open does not fire after teardown and silently zero the counter.
    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }
    if (disconnectedTimerRef.current) {
      clearTimeout(disconnectedTimerRef.current);
      disconnectedTimerRef.current = null;
    }
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    dcRef.current = null;
    pcRef.current = null;
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];
    sasComputedRef.current = false;
    setSasCode(null);
    // Two paths for in-flight incoming transfers when the connection drops:
    //
    // 1. Buffer has real progress (received > 0): KEEP it. Mark the row as
    //    paused, leave the writer + on-disk partial alone, and schedule a
    //    one-shot grace timer. If the sender resumes within RESUME_GRACE_MS
    //    the file-start handler clears the timer and resumes writing. If
    //    not, the timer fires and runs the same destructive cleanup we used
    //    to do unconditionally.
    //
    // 2. Buffer has zero bytes (file-start arrived but nothing landed):
    //    nothing to resume from. Run the immediate cleanup as before.
    const performHardCleanup = (id: string) => {
      const live = incomingBuffersRef.current[id];
      if (!live || live.aborted) {
        delete incomingBuffersRef.current[id];
        return;
      }
      live.aborted = true;
      const writer = live.writer;
      const cleanup = live.cleanup;
      // Release memory accounting for in-memory chunks on teardown.
      if (!writer && live.memoryChunks.length > 0) {
        const freed = live.memoryChunks.reduce((acc, c) => acc + c.byteLength, 0);
        incomingMemoryBytesRef.current = Math.max(0, incomingMemoryBytesRef.current - freed);
        live.memoryChunks = [];
      }
      if (writer) {
        live.writeQueue
          .then(async () => {
            try {
              await (writer as unknown as { abort?: () => Promise<void> }).abort?.();
            } catch {}
            try {
              await writer.close();
            } catch {}
            if (cleanup) {
              try {
                await cleanup();
              } catch {}
            }
          })
          .catch(() => {});
      }
      delete incomingBuffersRef.current[id];
    };

    for (const id of Object.keys(incomingBuffersRef.current)) {
      const buf = incomingBuffersRef.current[id];
      if (!buf) continue;
      if (buf.aborted) {
        delete incomingBuffersRef.current[id];
        continue;
      }
      // Resumable: only when there's actual progress worth saving.
      if (buf.received > 0) {
        setIncomingFiles((s) =>
          s[id] && s[id].state === "receiving"
            ? { ...s, [id]: { ...s[id], paused: true, pausedAt: Date.now(), error: undefined } }
            : s,
        );
        const prev = graceTimersRef.current[id];
        if (prev) clearTimeout(prev);
        graceTimersRef.current[id] = setTimeout(() => {
          delete graceTimersRef.current[id];
          performHardCleanup(id);
          setIncomingFiles((s) => {
            const cur = s[id];
            if (!cur || cur.state === "verified" || cur.state === "failed" || cur.state === "cancelled") return s;
            return {
              ...s,
              [id]: {
                ...cur,
                paused: false,
                pausedAt: undefined,
                error: "Connection lost - sender did not return in time",
                state: "failed",
                completedAt: Date.now(),
              },
            };
          });
        }, RESUME_GRACE_MS);
        continue;
      }
      // No progress to save: surface the same explicit error as before and
      // tear down immediately so we don't leave a stuck row behind.
      performHardCleanup(id);
      setIncomingFiles((s) => {
        const cur = s[id];
        if (!cur || cur.state === "verified" || cur.state === "failed" || cur.state === "cancelled") return s;
        return {
          ...s,
          [id]: {
            ...cur,
            error: "Connection interrupted - partial file removed",
            state: "failed",
            completedAt: Date.now(),
          },
        };
      });
    }
  }, [stopQualityPoll]);

  teardownRef.current = teardownPeer;

  // Signaling channel
  useEffect(() => {
    if (!sessionId) return;
    const role = isInitiator ? "host" : "guest";
    qbLog(`[QB] Signaling effect: sessionId=${sessionId}, role=${role}`);
    let aborted = false;
    let helloTimer: ReturnType<typeof setTimeout> | null = null;
    // Separate ref for the 300ms bootstrap delay before startHelloRetries().
    // Must be tracked and cancelled in cleanup so a stale timer cannot call
    // startHelloRetries() on a torn-down effect's captured state.
    let helloBootstrapTimer: ReturnType<typeof setTimeout> | null = null;
    // The Supabase SDK reuses channel objects by topic. If the lobby page
    // (index.tsx) had a channel on the same topic (qb:SESSION_ID), its
    // cleanup may not have completed before this effect runs. Evict any
    // stale channel with the same topic so we always get a fresh instance
    // with clean state, no leftover event handlers, and a valid lifecycle.
    const topic = `qb:${sessionId}`;
    const stale = supabase.getChannels().find(
      (c: { topic: string }) => c.topic === `realtime:${topic}`,
    );
    if (stale) {
      qbLog("[QB] Signaling: evicting stale lobby channel");
      supabase.removeChannel(stale);
    }
    const channel = supabase.channel(topic, {
      config: { broadcast: { self: false }, presence: { key: role } },
    });
    channelRef.current = channel;

    // Bounded hello retry - guest re-announces until the host's presence is
    // observed. 30 attempts × 1 s gives a 30 s window that matches the
    // hostMissing dead-end timer on the UI side. The host's device may need
    // to receive the guest's signal, navigate from the home/lobby page to
    // /session/$id, re-subscribe to Supabase, and propagate "host" presence
    // back -- a chain that can take 2-6 s on normal connections but longer
    // on slower ones. Running retries until the hostMissing dead-end appears
    // ensures the host always has an active signal to react to.
    const startHelloRetries = () => {
      if (isInitiator) return;
      if (helloTimer) return;
      let attempts = 0;
      const tick = () => {
        helloTimer = null;
        if (aborted) return;
        if (peerPresentRef.current) return;
        if (attempts >= 30) {
          qbLog("[QB] hello retries exhausted (30)");
          return;
        }
        attempts += 1;
        if (attempts === 1 || attempts % 5 === 0) qbLog(`[QB] hello attempt ${attempts}/30`);
        sendSignal({ type: "hello", protocol: 1, capabilities: { controlChannel: true, fileResume: true, continuity: true, streamToDisk: true } });
        helloTimer = setTimeout(tick, 1000);
      };
      tick();
    };
    const stopHelloRetries = () => {
      if (helloTimer) {
        clearTimeout(helloTimer);
        helloTimer = null;
      }
    };

    const presenceSyncHandler = () => {
      if (aborted) return;
      const ch = channelRef.current;
      if (!ch) return;
      const rawState = ch.presenceState();
      qbLog(`[QB] presence sync: keys=${Object.keys(rawState).join(",") || "(empty)"}`);
      const state = ch.presenceState() as Record<
        string,
        Array<{
          device?: DeviceKind;
          name?: string;
          clientId?: string;
          t?: number;
          caps?: { stream?: boolean; save?: boolean; memBytes?: number };
        }>
      >;
      // Multi-guest lock: if we are a guest and another guest already claimed
      // this session before us, bow out cleanly. The earliest `t` wins; ties
      // broken by clientId for determinism.
      if (!isInitiator) {
        const guests = state["guest"] ?? [];
        if (guests.length > 1) {
          const mine = myClientIdRef.current;
          const earliest = guests.reduce((a, b) => {
            const ta = a.t ?? Number.POSITIVE_INFINITY;
            const tb = b.t ?? Number.POSITIVE_INFINITY;
            if (ta !== tb) return ta < tb ? a : b;
            return (a.clientId ?? "") < (b.clientId ?? "") ? a : b;
          });
          if (earliest.clientId && earliest.clientId !== mine) {
            setBridgeBusy(true);
            try { void ch.untrack(); } catch {}
            teardownPeer();
            setStatus("waiting");
            return;
          }
        }
      }
      const keys = Object.keys(state);
      const hasPeer = isInitiator ? keys.includes("guest") : keys.includes("host");
      const wasPeerPresent = peerPresentRef.current;
      peerPresentRef.current = hasPeer;
      setPeerPresent(hasPeer);
      const peerKey = isInitiator ? "guest" : "host";
      const peerEntry = state[peerKey]?.[0];
      if (peerEntry?.device) setPeerDeviceKind(peerEntry.device);
      setPeerDeviceName(peerEntry?.name?.trim() || null);
      const rawCaps = peerEntry?.caps;
      setPeerCaps(
        rawCaps
          ? {
              stream: !!rawCaps.stream,
              save: !!rawCaps.save,
              memBytes: typeof rawCaps.memBytes === "number" ? rawCaps.memBytes : undefined,
            }
          : peerEntry
            ? { stream: false, save: false }
            : null,
      );
      // Peer just appeared (transition false -> true). If we are the initiator
      // and have no active connection yet, kick off the offer directly. If we
      // are the guest, re-announce hello so a late-arriving host receives it.
      if (hasPeer && !wasPeerPresent) {
        qbLog(`[QB] peer appeared (${isInitiator ? "guest" : "host"} detected)`);
        stopHelloRetries();
        if (isInitiator && !pcRef.current) {
          qbLog("[QB] host: peer appeared, starting offer");
          void startOffer().catch(err => {
            qbError("[QB] startOffer failed (peer appeared)", err);
            if (!aborted) scheduleReconnect();
          });
        } else if (!isInitiator) {
          qbLog("[QB] guest: peer appeared, sending hello");
          sendSignal({ type: "hello", protocol: 1, capabilities: { controlChannel: true, fileResume: true, continuity: true, streamToDisk: true } });
        }
      }
      if (!hasPeer && pcRef.current) {
        qbLog("[QB] peer dropped from signaling; leaving WebRTC and reconnect timers untouched");
      }
    };

    const signalHandler = async ({ payload }: { payload: unknown }) => {
      // Top-level catch: Supabase does not await the handler's promise, so any
      // unhandled rejection becomes an uncaught promise error in the console.
      try {
      const msg = payload as {
        type: string;
        protocol?: number;
        sdp?: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
      };
      if (sessionEndingRef.current) return;
      
      if (msg.type === "hello" || msg.type === "offer" || msg.type === "answer") {
        if (msg.protocol !== 1) {
          setProtocolStateSafe("incompatible");
          qbLog(`[QB] Peer is incompatible (protocol: ${msg.protocol})`);
          if (msg.type === "offer" || msg.type === "answer") return;
        } else {
          setProtocolStateSafe("compatible");
        }
      }
      if (msg.type === "offer" && msg.sdp) {
        const isIceRestart = !!(msg as { iceRestart?: boolean }).iceRestart;
        qbLog(`[QB] received OFFER${isIceRestart ? " (ICE restart)" : ""}`);
        
        const existingPc = pcRef.current;
        const polite = myClientIdRef.current < ((msg as { clientId?: string }).clientId || "unknown");
        const makingOffer = isNegotiatingRef.current;
        const offerCollision = makingOffer || (existingPc && existingPc.signalingState !== "stable");
        
        if (offerCollision && !polite) {
          qbLog("[QB] impolite peer ignoring colliding offer");
          return;
        }
        
        const generation = sessionGenerationRef.current;
        try {
          if (offerCollision && polite && existingPc) {
            qbLog("[QB] polite peer rolling back colliding offer");
            try {
              await existingPc.setLocalDescription({ type: "rollback" });
            } catch (err) {
              qbLog("[QB] rollback failed, tearing down");
              teardownPeer();
            }
          } else if (!isIceRestart || !existingPc || existingPc.signalingState === "closed") {
            if (existingPc && remoteDescSetRef.current) teardownPeer();
          }
          if (aborted || generation !== sessionGenerationRef.current) return;
          
          setStatus("connecting");
          armConnectTimeout();
          const pc = pcRef.current ?? createPeerConnection();
          await pc.setRemoteDescription(msg.sdp);
          if (aborted || generation !== sessionGenerationRef.current) return;
          
          remoteDescSetRef.current = true;
          await drainPendingCandidates(pc);
          if (aborted || generation !== sessionGenerationRef.current) return;
          
          const answer = await pc.createAnswer();
          if (pc.signalingState !== "have-remote-offer") return;
          await pc.setLocalDescription(answer);
          
          if (aborted || generation !== sessionGenerationRef.current) return;
          void tryComputeSas();
          qbLog("[QB] sending ANSWER");
          sendSignal({ type: "answer", sdp: answer });
        } catch (err) {
          qbLog(`[QB] error handling offer: ${err}`);
        }
      } else if (msg.type === "answer" && msg.sdp) {
        qbLog("[QB] received ANSWER");
        const pc = pcRef.current;
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(msg.sdp);
          if (aborted) return;
          remoteDescSetRef.current = true;
          await drainPendingCandidates(pc);
          if (aborted) return;
          void tryComputeSas();
        }
      } else if (msg.type === "ice" && msg.candidate) {
        if (aborted) return;
        const pc = pcRef.current ?? createPeerConnection();
        if (!remoteDescSetRef.current) {
          pendingCandidatesRef.current.push(msg.candidate);
        } else {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch {}
        }
      } else if (msg.type === "hello" && isInitiator) {
        // Guest is announcing presence (initial connect or reconnect request).
        // Only kick off a fresh offer if we don't already have a healthy PC
        // -- otherwise a hello arriving right after the presence-sync-driven
        // offer would tear down the in-flight negotiation and cause the
        // visible connect/disconnect churn on first pair.
        if (aborted) return;
        const existing = pcRef.current;
        const healthy =
          existing &&
          existing.connectionState !== "failed" &&
          existing.connectionState !== "closed" &&
          existing.connectionState !== "disconnected";
        qbLog(`[QB] received HELLO from guest, existingPC=${!!existing}, healthy=${healthy}`);
        if (healthy) return;
        void startOffer().catch(err => {
          qbError("[QB] startOffer failed (hello handler)", err);
          if (!aborted) scheduleReconnect();
        });
      } else if (msg.type === "request-ice-restart" && isInitiator) {
        // Non-initiator asked us (the host) to perform an ICE restart.
        // The non-initiator cannot create offers, so it sends this signal
        // instead. We check whether the current PC is still usable; if so
        // we restart ICE and send a new offer. If the PC is already dead we
        // fall back to a full renegotiation via startOffer so the guest gets
        // a working channel either way.
        if (aborted) return;
        const pc = pcRef.current;
        const pcUsable =
          pc !== null &&
          pc.connectionState !== "closed" &&
          pc.connectionState !== "failed" &&
          pc.signalingState !== "closed";
        qbLog(`[QB] received request-ice-restart from guest, pcUsable=${pcUsable}`);
        if (pcUsable && pc) {
          armConnectTimeout();
          void (async () => {
            try {
              pc.restartIce();
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              sendSignal({ type: "offer", sdp: offer, iceRestart: true });
            } catch (err) {
              qbError("[QB] ICE restart offer (host-side) failed, falling back to startOffer", err);
              void startOffer().catch(offerErr => {
                qbError("[QB] startOffer failed after ICE restart failure", offerErr);
                if (!aborted) scheduleReconnect();
              });
            }
          })();
        } else {
          void startOffer().catch(err => {
            qbError("[QB] startOffer failed (PC dead, request-ice-restart path)", err);
            if (!aborted) scheduleReconnect();
          });
        }
      } else if (msg.type === "session-ended") {
        // Supabase fallback: remote peer ended the session before (or in lieu of)
        // the DataChannel. Validate the sessionId so a stale event from a prior
        // session cannot accidentally terminate a freshly started session.
        if (aborted) return;
        const incomingSessionId = (msg as { sessionId?: string }).sessionId;
        if (typeof incomingSessionId === "string" && incomingSessionId !== sessionId) {
          qbWarn("[QB] signalHandler: session-ended sessionId mismatch, discarding",
            { received: incomingSessionId, expected: sessionId });
          return;
        }
        qbLog("[QB] signalHandler: received session-ended from peer via Supabase");
        endSessionRef.current("remote_disconnect");
      }
      } catch (err) {
        // Catch any rejection from the async signaling steps (e.g. setLocalDescription
        // called in the wrong state due to a race) so it does not become an
        // uncaught promise rejection that silently disappears from error monitoring.
        if (!aborted) qbError("[QB] signalHandler unexpected error", err);
      }
    };

    channel.on("presence", { event: "sync" }, presenceSyncHandler);
    channel.on("broadcast", { event: "signal" }, signalHandler);

    // Bounded retry for transient channel subscription failures.
    // CHANNEL_ERROR and TIMED_OUT can happen when the Supabase WebSocket
    // encounters a brief hiccup (especially when the lobby channel on the
    // same topic hasn't fully torn down yet, or on mobile background/
    // foreground cycles). Without retries, the guest permanently stalls
    // at "Waiting for the host..." because no signaling can happen.
    let subscribeRetries = 0;
    const MAX_SUBSCRIBE_RETRIES = 5;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const doSubscribe = (ch: typeof channel) => {
      ch.subscribe(async (s, err) => {
        qbLog(`[QB] channel subscribe status: ${s}${err ? ` (${err.message ?? err})` : ""}`);
        if (s === "SUBSCRIBED") {
          subscribeRetries = 0;
          if (aborted) return;
          qbLog(`[QB] tracking presence as ${role}`);
          try {
            await ch.track({
              role: isInitiator ? "host" : "guest",
              device: myDeviceKindRef.current,
              name: deviceNameRef.current ?? "",
              clientId: myClientIdRef.current,
              t: Date.now(),
              caps: {
                stream: streamToDiskSupported(),
                save: !!saveDirectoryRef.current,
                memBytes: detectSafeMemoryBytes(),
              },
            });
            qbLog(`[QB] presence tracked successfully as ${role}`);
            if (aborted) return;
            if (!isInitiator) {
              qbLog("[QB] guest: scheduling hello retries in 800ms");
              helloBootstrapTimer = setTimeout(() => {
                helloBootstrapTimer = null;
                if (!aborted) startHelloRetries();
              }, 800);
            }
          } catch (e) {
            qbLog(`[QB] channel track failed: ${e instanceof Error ? e.message : e}`);
            // The channel likely transitioned out of 'joined' state due to a race
            // condition (e.g., phx_leave processing delayed). The Supabase SDK
            // will soon trigger CHANNEL_ERROR or CLOSED which handles the retry.
          }
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          if (aborted) return;
          if (subscribeRetries >= MAX_SUBSCRIBE_RETRIES) {
            console.error(`[QB] channel subscribe failed after ${MAX_SUBSCRIBE_RETRIES} retries, giving up`);
            // Signaling has permanently failed: treat as a session error so
            // cleanup runs and the UI routes to the correct error state.
            endSessionRef.current("error");
            return;
          }
          subscribeRetries++;
          const delay = Math.min(6400, 800 * Math.pow(1.5, subscribeRetries - 1));
          qbLog(`[QB] channel subscribe retry ${subscribeRetries}/${MAX_SUBSCRIBE_RETRIES} in ${Math.round(delay)}ms`);
          retryTimer = setTimeout(() => {
            retryTimer = null;
            if (aborted) return;
            // Remove the failed channel and create a fresh one so the SDK
            // starts from a clean WebSocket state. Reusing a CHANNEL_ERROR'd
            // channel object sometimes leaves it in a zombie state where
            // subscribe() never fires the callback again.
            try { supabase.removeChannel(ch); } catch {}
            const freshCh = supabase.channel(topic, {
              config: { broadcast: { self: false }, presence: { key: role } },
            });
            channelRef.current = freshCh;
            // Re-attach all event handlers to the fresh channel.
            freshCh.on("presence", { event: "sync" }, presenceSyncHandler);
            freshCh.on("broadcast", { event: "signal" }, signalHandler);
            doSubscribe(freshCh);
          }, delay);
        }
      });
    };
    
    // Add a 400ms delay before subscribing to the new session channel. This
    // ensures the phx_leave message from the Lobby's unsubscribe() call has
    // enough time to reach the server and process before we send a phx_join
    // for the exact same topic. Without this delay, the Phoenix channel server
    // can process the join and leave out-of-order or concurrently, leaving
    // the Session in a zombie state where it is deaf to WebRTC signaling.
    let subscribeTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      subscribeTimer = null;
      if (!aborted) doSubscribe(channel);
    }, 400);

    // Immediately remove presence when the tab is closed or navigated away so
    // the other side detects the disconnection within milliseconds rather than
    // waiting for Supabase's heartbeat timeout (10-30 s). Without this, a
    // guest closing the tab and immediately re-opening the session URL would
    // trigger the multi-guest lock (two stale+new entries → bridgeBusy) and
    // be blocked from reconnecting. pagehide is used instead of beforeunload
    // because it fires on iOS, back-forward cache entries, and tab close alike.
    const onPageHide = () => {
      // Best-effort: tell the peer the session is ending due to browser/tab close.
      // Not guaranteed on all browsers, so the peer's reconnect-timeout safety net
      // remains the authoritative fallback. Never call endSessionRef here because
      // the page is already tearing down and React state updates won't commit.
      try {
        const exitPayload = { t: "session-ended", sessionId, reason: "browser_closed" };
        sendDataMessage(exitPayload);
        channelRef.current?.send({ type: "broadcast", event: "signal", payload: { type: "session-ended", sessionId, reason: "browser_closed" } });
      } catch {}
      try { void channelRef.current?.untrack(); } catch {}
    };
    window.addEventListener("pagehide", onPageHide);


    return () => {
      window.removeEventListener("pagehide", onPageHide);
      aborted = true;
      sessionEndingRef.current = true;
      stopHelloRetries();
      if (helloBootstrapTimer) {
        clearTimeout(helloBootstrapTimer);
        helloBootstrapTimer = null;
      }
      if (subscribeTimer) {
        clearTimeout(subscribeTimer);
        subscribeTimer = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (connectTimerRef.current) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      stopQualityPoll();
      try {
        dcRef.current?.close();
        pcRef.current?.close();
      } catch {}
      // Remove the active channel (which may be the original or a retry
      // replacement). Also remove the original if it's different, in case
      // a retry created a replacement before this cleanup ran.
      const activeCh = channelRef.current;
      if (activeCh) {
        try { supabase.removeChannel(activeCh); } catch {}
      }
      if (channel !== activeCh) {
        try { supabase.removeChannel(channel); } catch {}
      }
      for (const u of objectUrlsRef.current) {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      }
      objectUrlsRef.current = [];
      pcRef.current = null;
      dcRef.current = null;
      channelRef.current = null;
      remoteDescSetRef.current = false;
      pendingCandidatesRef.current = [];
      reconnectAttemptRef.current = 0;
      peerPresentRef.current = false;
      // Cancel any pending resume-ack timeouts so they don't call setState
      // on an unmounted component or surface misleading errors.
      for (const t of Object.values(resumeAckTimersRef.current)) clearTimeout(t);
      resumeAckTimersRef.current = {};
      resumeAckResolversRef.current = {};
      // Cancel grace timers for paused incoming transfers so they don't fire
      // setState or attempt disk cleanup after the component unmounts.
      for (const t of Object.values(graceTimersRef.current)) clearTimeout(t);
      graceTimersRef.current = {};
      // Abort any in-progress disk-stream writers so the OS can release the
      // file handle and flush the partial file. Without this, rapid navigation
      // mid-transfer leaves an open writable and an orphaned entry in
      // incomingBuffersRef. setState must not be called here since the
      // component may already be unmounting.
      for (const buf of Object.values(incomingBuffersRef.current)) {
        if (buf.writer && !buf.aborted) {
          buf.aborted = true;
          const writer = buf.writer;
          const cleanup = buf.cleanup;
          buf.writeQueue = buf.writeQueue
            .then(async () => {
              try {
                await (writer as unknown as { abort?: () => Promise<void> }).abort?.();
              } catch {}
              try {
                await writer.close();
              } catch {}
              if (cleanup) {
                try {
                  await cleanup();
                } catch {}
              }
            })
            .catch(() => {});
        }
      }
    };
  }, [
    sessionId,
    isInitiator,
    createPeerConnection,
    sendSignal,
    startOffer,
    armConnectTimeout,
    drainPendingCandidates,
    teardownPeer,
    stopQualityPoll,
  ]);

  // Re-track presence when device name, device kind, or auto-save state
  // changes so the peer sees the update. Device kind is included because
  // detection runs on mount and may resolve after the channel opens on a
  // slow device, leaving the peer with a stale "computer" icon until the
  // next re-track event. Auto-save matters because the sender uses the
  // peer's caps to size outgoing transfers - flipping "save" on/off needs
  // to propagate or the sender's cap will be stale.
  useEffect(() => {
    const ch = channelRef.current;
    // Don't track if the channel isn't fully joined yet.
    if (!ch || ch.state !== "joined") return;
    
    ch.track({
      role: isInitiator ? "host" : "guest",
      device: myDeviceKindRef.current,
      name: deviceName ?? "",
      clientId: myClientIdRef.current,
      t: Date.now(),
      caps: {
        stream: streamToDiskSupported(),
        save: !!saveDirectory,
        memBytes: detectSafeMemoryBytes(),
      },
    }).catch(() => {
      // Ignore errors if the channel state changes mid-track.
    });
  }, [deviceName, isInitiator, myDeviceKind, saveDirectory]);

  const sendText = useCallback(
    (
      content: string,
      kind: "text" | "clipboard" = "text",
    ): { ok: true } | { ok: false; reason: "not_open" | "too_large" | "send_failed" } => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return { ok: false, reason: "not_open" };
      if (exceedsTextByteCap(content)) return { ok: false, reason: "too_large" };
      if (!sendDataMessage({ t: kind, content })) {
        return { ok: false, reason: "send_failed" };
      }
      setMessages((m) => [...m, { id: crypto.randomUUID(), from: "me", kind, content, ts: Date.now() }]);
      return { ok: true };
    },
    [sendDataMessage],
  );

  const sendQueueRef = useRef<Promise<void>>(Promise.resolve());

  const sendFileInternal = useCallback(
    (file: File, idOverride?: string, startOffset: number = 0) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return null;
      const id = idOverride ?? crypto.randomUUID();
      // Sanity-clamp: a stale sentBytes value greater than the file size
      // would cause file.slice() to return an empty stream and the
      // receiver to think the transfer is already done. Treat it as a
      // restart from zero rather than silently producing a corrupt file.
      const safeStart =
        startOffset > 0 && startOffset < file.size ? startOffset : 0;
      const meta: FileMeta = {
        id,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        ...(safeStart > 0 ? { resumeFrom: safeStart } : {}),
      };
      fileSourcesRef.current[id] = file;
      // A retry must clear any previous peer-abort signal for this id,
      // otherwise the new send loop would bail out immediately on the
      // stale flag.
      peerAbortedSendIdsRef.current.delete(id);
      setOutgoingFiles((s) => ({
        ...s,
        [id]: {
          id,
          name: file.name,
          size: file.size,
          type: meta.type,
          // Preserve the existing progress bar position on resume so the
          // UI doesn't snap back to 0% before the ack adjusts it.
          sentBytes: safeStart,
          // Track where this attempt started from so the UI can compute
          // rate as (sentBytes - resumeFromBytes) / elapsed rather than
          // sentBytes / elapsed, which spikes astronomically right after a
          // resume because elapsed is near zero but sentBytes is large.
          resumeFromBytes: safeStart,
          state: "sending",
          startedAt: Date.now(),
          error: undefined,
          retryable: false,
        },
      }));

      const task = async () => {
        const channel = dcRef.current;
        if (!channel || channel.readyState !== "open") {
          setOutgoingFiles((s) => ({ ...s, [id]: { ...s[id], error: "Not connected", retryable: true } }));
          return;
        }
        const idHeader = idToBytes(id);
        let actualOffset = safeStart;
        // For resume attempts we register the ack resolver BEFORE sending
        // file-start so the receiver's reply (which can arrive on the very
        // next event-loop tick) cannot race past us.
        let ackPromise: Promise<number> | null = null;
        if (safeStart > 0) {
          ackPromise = new Promise<number>((resolve, reject) => {
            const timer = setTimeout(() => {
              delete resumeAckResolversRef.current[id];
              delete resumeAckTimersRef.current[id];
              reject(new Error("Receiver did not acknowledge resume"));
            }, RESUME_ACK_TIMEOUT_MS);
            resumeAckTimersRef.current[id] = timer;
            resumeAckResolversRef.current[id] = (off) => {
              clearTimeout(timer);
              delete resumeAckTimersRef.current[id];
              delete resumeAckResolversRef.current[id];
              resolve(off);
            };
          });
        }
        try {
          // For a fresh retry (startOffset === 0 + idOverride present) we
          // still want the receiver to drop any stale partial buffer so it
          // restarts cleanly. For a true resume we deliberately skip this
          // because the partial is exactly what we want to keep.
          if (idOverride && safeStart === 0) {
            sendDataMessage({ t: "file-cancel", id });
          }
          if (!sendDataMessage({ t: "file-start", meta })) {
            throw new Error("Failed to send file-start");
          }
        } catch {
          if (ackPromise) {
            // Cancel the timeout and drop the resolver together so neither
            // fires after this early-return path. Deleting only the resolver
            // leaves an orphaned timer that fires after RESUME_ACK_TIMEOUT_MS
            // and calls clearTimeout on a handle that was already cleared.
            const pendingTimer = resumeAckTimersRef.current[id];
            if (pendingTimer) {
              clearTimeout(pendingTimer);
              delete resumeAckTimersRef.current[id];
            }
            delete resumeAckResolversRef.current[id];
          }
          setOutgoingFiles((s) => ({ ...s, [id]: { ...s[id], error: "Send failed", retryable: true } }));
          return;
        }
        if (ackPromise) {
          try {
            actualOffset = await ackPromise;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Resume failed";
            setOutgoingFiles((s) =>
              s[id] ? { ...s, [id]: { ...s[id], error: message, retryable: true } } : s,
            );
            return;
          }
          // -1 sentinel: the file-abort handler woke us up because the
          // receiver explicitly rejected this resume. The handler already
          // set a meaningful error on the outgoing entry; just bail.
          if (actualOffset < 0) {
            return;
          }
          // Receiver may have less than we thought (e.g., last few chunks
          // were in flight when the channel closed). Trust their number
          // and back the progress bar up to match before we stream.
          if (actualOffset !== safeStart) {
            setOutgoingFiles((s) =>
              s[id] ? { ...s, [id]: { ...s[id], sentBytes: actualOffset } } : s,
            );
          }
        }

        let offset = actualOffset;

        // SHA-256 integrity: compute the hash of the entire file so the
        // receiver can verify it after assembly. We always hash from byte 0,
        // even on resumes, so the digest covers the complete file.
        //
        // For resumes (actualOffset > 0) we pre-hash the portion the receiver
        // already has by reading file.slice(0, actualOffset) before the main
        // send loop. This is a sequential read - typical resume offsets are
        // much smaller than the total file, so the overhead is acceptable.
        // SHA-256 in JS runs at ~200-500 MB/s so even a 1 GB pre-pass only
        // takes 2-5 s and the receiver gains a guarantee about every byte.
        const fileHasher = new IncrementalSha256();
        if (actualOffset > 0) {
          const preStream = file.slice(0, actualOffset).stream();
          const preReader = preStream.getReader();
          try {
            while (true) {
              const { done, value } = await preReader.read();
              if (done) break;
              // Check for cancellation during the pre-hash pass so a user
              // cancel doesn't wait through the entire read before responding.
              if (cancelledOutgoingIdsRef.current.has(id)) {
                try { preReader.cancel(); } catch {}
                throw new Error("Cancelled");
              }
              fileHasher.update(value);
            }
          } catch (err) {
            try { preReader.cancel(); } catch {}
            throw err;
          }
        }

        // Slice the source so we only stream from the resume point. File
        // ReadableStreams aren't seekable, but Blob slicing is - the
        // resulting stream produces only the bytes we actually need.
        const sourceStream =
          actualOffset > 0 ? file.slice(actualOffset).stream() : file.stream();
        const reader = sourceStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            let chunkOffset = 0;
            while (chunkOffset < value.byteLength) {
              if (cancelledOutgoingIdsRef.current.has(id)) {
                throw new Error("Cancelled");
              }
              if (peerAbortedSendIdsRef.current.has(id)) {
                throw new Error("Receiver aborted");
              }
              const slice = value.subarray(chunkOffset, Math.min(chunkOffset + CHUNK_SIZE, value.byteLength));
              while (channel.readyState === "open" && channel.bufferedAmount > 8 * 1024 * 1024) {
                // Escape on close/error as well: if the channel closes while we
                // are parked here, "bufferedamountlow" will never fire and the
                // send-queue promise chain would hang permanently. Resolving on
                // close lets the outer "readyState !== open" guard throw and
                // surface a clean retryable error instead.
                await new Promise<void>((resolve) => {
                  const cleanup = () => {
                    channel.removeEventListener("bufferedamountlow", cleanup);
                    channel.removeEventListener("close", cleanup);
                    channel.removeEventListener("error", cleanup);
                    resolve();
                  };
                  channel.addEventListener("bufferedamountlow", cleanup);
                  channel.addEventListener("close", cleanup);
                  channel.addEventListener("error", cleanup);
                });
              }
              if (channel.readyState !== "open") throw new Error("Channel closed");
              const frame = new Uint8Array(HEADER_SIZE + slice.byteLength);
              frame.set(idHeader, 0);
              frame.set(slice, HEADER_SIZE);
              try {
                channel.send(frame);
              } catch (err) {
                throw err instanceof Error ? err : new Error("send failed");
              }
              // Hash the payload slice (not the full frame - receiver hashes
              // the same payload bytes after stripping the 16-byte header).
              fileHasher.update(slice);
              chunkOffset += slice.byteLength;
              offset += slice.byteLength;
              setOutgoingFiles((s) => ({ ...s, [id]: { ...s[id], sentBytes: offset } }));
            }
          }
          const sha256Hex = fileHasher.digest();
          sendDataMessage({ t: "file-end", id, sha256: sha256Hex });
          setOutgoingFiles((s) => ({
            ...s,
            [id]: { ...s[id], sentBytes: file.size, state: "completed", completedAt: Date.now(), error: undefined, retryable: false },
          }));
          // Successful: drop the cached source to free memory
          delete fileSourcesRef.current[id];
        } catch (err) {
          const message = err instanceof Error ? err.message : "Transfer aborted";
          // User-cancelled transfers: cancelOutgoing already removed the row
          // and notified the peer. Don't resurrect the row or mark retryable.
          if (!cancelledOutgoingIdsRef.current.has(id)) {
            setOutgoingFiles((s) =>
              s[id] ? { ...s, [id]: { ...s[id], state: "failed", error: message, retryable: true } } : s,
            );
          } else {
            // Cancelled by user: clean up the ID so it can never re-poison
            // a future transfer with the same ID.
            cancelledOutgoingIdsRef.current.delete(id);
          }
          try {
            reader.cancel();
          } catch {}
        }
      };

      sendQueueRef.current = sendQueueRef.current.then(task, task);
      return id;
    },
    [sendDataMessage],
  );

  const sendFile = useCallback(
    (file: File) => {
      sendFileInternal(file);
    },
    [sendFileInternal],
  );

  // Internal primitive: re-issue an outgoing transfer from wherever the
  // sender's progress counter says we left off. For brand-new failures
  // (sentBytes === 0) it's effectively a restart; for partial transfers
  // it's a true resume, with the receiver telling us the exact offset to
  // pick up from. The Retry button calls this directly. Tier 2 auto-
  // resume on reconnect will hook into the same primitive.
  const resumeTransfer = useCallback(
    (id: string) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return false;
      const file = fileSourcesRef.current[id];
      if (!file) return false;
      const sentBytes = outgoingFilesRef.current[id]?.sentBytes ?? 0;
      sendFileInternal(file, id, sentBytes);
      return true;
    },
    [sendFileInternal],
  );
  // Keep the late-binding ref pointing at the latest resumeTransfer so
  // the data-channel open handler (which captured a stale closure when
  // setupDataChannel was first created) always invokes the current one.
  useEffect(() => {
    resumeTransferRef.current = resumeTransfer;
  }, [resumeTransfer]);

  const retryFile = useCallback(
    (id: string) => resumeTransfer(id),
    [resumeTransfer],
  );

  const dismissOutgoing = useCallback((id: string) => {
    delete fileSourcesRef.current[id];
    peerAbortedSendIdsRef.current.delete(id);
    cancelledOutgoingIdsRef.current.delete(id);
    setOutgoingFiles((s) => {
      if (!s[id]) return s;
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  // Restores a dismissed outgoing file display entry during the undo window.
  // Only restores the display record (OutgoingFile shape) — does NOT restore
  // fileSourcesRef or cancelled-ID bookkeeping, since dismissed entries are
  // always in a terminal state (failed/cancelled) where the send loop cannot
  // restart. Safe because: failed is terminal, no state change can occur after
  // dismissal, so snapshot is always fresh.
  const undismissOutgoing = useCallback((id: string, snapshot: OutgoingFile) => {
    setOutgoingFiles((s) => {
      // Guard: if somehow the id re-appeared (should never happen for terminal
      // states), leave the current state untouched.
      if (s[id]) return s;
      return { ...s, [id]: snapshot };
    });
  }, []);

  // Cancel an in-flight outgoing transfer at the user's request. Marks the
  // id as cancelled (the send loop polls this and bails on the next chunk),
  // notifies the peer over the existing `file-cancel` protocol so the
  // receiver drops its partial buffer / on-disk file, drops the cached
  // source so a stale Retry can't resurrect it, and removes the row from
  // the UI immediately so the cancel feels instant.
  const cancelOutgoing = useCallback((id: string) => {
    // Signal the send loop to bail out on the next chunk boundary.
    cancelledOutgoingIdsRef.current.add(id);
    delete fileSourcesRef.current[id];
    peerAbortedSendIdsRef.current.delete(id);
    sendDataMessage({ t: "file-cancel", id });
    // Remove the row immediately and transition to the cancelled terminal
    // state. The send loop will also see cancelledOutgoingIdsRef and
    // delete the ID from the set once it exits, preventing ID poisoning.
    setOutgoingFiles((s) => {
      if (!s[id]) return s;
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  const setSaveDirectory = useCallback((dir: SaveDirectory | null) => {
    setSaveDirectoryState(dir);
  }, []);

  const manualReconnect = useCallback(() => {
    qbLog(`[QB] manualReconnect called, peerPresent=${peerPresentRef.current}`);
    // Clear any backoff and reset attempt counter so the user-driven retry
    // starts from a clean slate.
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    teardownPeer();
    if (!peerPresentRef.current) {
      qbLog("[QB] manualReconnect: no peer, setting waiting");
      setStatus("waiting");
      // Even without presence, nudge with a hello so a host that lost its
      // socket but is still on the same channel can pick us up.
      if (!isInitiatorRef.current) sendSignal({ type: "hello", protocol: 1, capabilities: { controlChannel: true, fileResume: true, continuity: true, streamToDisk: true } });
      return;
    }
    setStatus("connecting");
    if (isInitiatorRef.current) {
      qbLog("[QB] manualReconnect: host starting offer");
      if (startOfferRef.current) {
        startOfferRef.current().catch((err) => {
          qbError("[QB] manualReconnect: offer failed", err);
          endSessionRef.current("transport_lost");
        });
      }
    } else {
      qbLog("[QB] manualReconnect: guest sending hello");
      sendSignal({ type: "hello", protocol: 1, capabilities: { controlChannel: true, fileResume: true, continuity: true, streamToDisk: true } });
    }
  }, [sendSignal, teardownPeer]);

  const releaseIncoming = useCallback((id: string) => {
    setIncomingFiles((s) => {
      const f = s[id];
      if (f?.url) {
        try {
          URL.revokeObjectURL(f.url);
        } catch {}
        objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== f.url);
      }
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  // Cancel an in-flight incoming transfer at the user's request. Mirrors
  // the receiver-side abort path used for write errors, but with an
  // explicit "Cancelled by receiver" reason so the sender's row shows a
  // user-friendly message (and a Retry, since the source File is still
  // cached on their side). Aborts the disk writer if streaming-to-disk so
  // the partial file is removed from disk, drops the in-memory buffer, and
  // removes the row from the UI immediately.
  const cancelIncoming = useCallback((id: string) => {
    // Cancelling a paused-for-resume transfer must also kill the grace
    // timer, otherwise it would fire later and try to clean up a buffer
    // we've already deleted.
    const gt = graceTimersRef.current[id];
    if (gt) {
      clearTimeout(gt);
      delete graceTimersRef.current[id];
    }
    const buf = incomingBuffersRef.current[id];
    if (buf && !buf.aborted) {
      buf.aborted = true;
      cancelledIdsRef.current.add(id);
      try {
                  sendControlMessage({ t: "file-abort", id: id, reason: "Cancelled by receiver", sequence: Date.now() });
      } catch {}
      const writer = buf.writer;
      const cleanup = buf.cleanup;
      if (writer) {
        buf.writeQueue = buf.writeQueue.then(async () => {
          try {
            await (writer as unknown as { abort?: () => Promise<void> }).abort?.();
          } catch {}
          try {
            await writer.close();
          } catch {}
          if (cleanup) {
            try {
              await cleanup();
            } catch {}
          }
        });
      }
      delete incomingBuffersRef.current[id];
      // Clear the IDB record immediately rather than leaving it for the
      // 24-hour prune. A cancelled transfer is definitively abandoned.
      void clearInFlightTransfer(id).catch(err =>
        qbError("[QB] IDB: clearInFlightTransfer failed (cancel path)", err),
      );
    }
    setIncomingFiles((s) => {
      const f = s[id];
      if (!f) return s;
      if (f.url) {
        try {
          URL.revokeObjectURL(f.url);
        } catch {}
        objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== f.url);
      }
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  const incomingList = useMemo(
    () => Object.values(incomingFiles).sort((a, b) => a.startedAt - b.startedAt),
    [incomingFiles],
  );
  // Phase 2 send helpers. The DataChannel guard keeps them safe to call
  // from outside the setupDataChannel closure without stale-ref worries.
  const sendNodeHello = useCallback((hello: NodeHello) => {
    sendDataMessage({ t: "node-hello", v: QB_PROTO_VERSION, ...hello });
  }, [sendDataMessage]);

  const sendNodeChallenge = useCallback((nonce: string) => {
    sendDataMessage({ t: "node-challenge", v: QB_PROTO_VERSION, nonce });
  }, [sendDataMessage]);

  const sendNodeVerify = useCallback((nodeId: string, signature: string) => {
    sendDataMessage({ t: "node-verify", v: QB_PROTO_VERSION, nodeId, signature });
  }, [sendDataMessage]);

  // Phase 3 Continuity send helpers.
  const sendContinuityIntent = useCallback((envelope: IntentEnvelope) => {
    sendDataMessage({ t: "continuity-intent", ...envelope });
  }, [sendDataMessage]);

  const sendIntentAck = useCallback((ack: IntentAck) => {
    sendDataMessage({ t: "intent-ack", ...ack });
  }, [sendDataMessage]);

  const outgoingList = useMemo(
    () => Object.values(outgoingFiles).sort((a, b) => a.startedAt - b.startedAt),
    [outgoingFiles],
  );

  return {
    status,
    endReason: endReasonRef.current,
    quality,
    peerPresent,
    bridgeBusy,
    peerDeviceKind,
    peerDeviceName,
    peerCaps,
    myDeviceKind,
    reconnectAttempt,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    messages,
    incomingFiles: incomingList,
    outgoingFiles: outgoingList,
    sendText,
    sendFile,
    retryFile,
    resumeTransfer,
    cancelOutgoing,
    dismissOutgoing,
    undismissOutgoing,
    cancelIncoming,
    releaseIncoming,
    manualReconnect,
    endSession,
    isInitiator,
    sasCode,
    saveDirectory,
    setSaveDirectory,
    streamToDiskSupported: streamToDiskSupported(),
    lastAutoResume,
    sendNodeHello,
    sendNodeChallenge,
    sendNodeVerify,
    sendContinuityIntent,
    sendIntentAck,
  };
}
