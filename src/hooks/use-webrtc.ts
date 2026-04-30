import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { detectDeviceKind, type DeviceKind } from "@/lib/device";
import { deriveSas, extractFingerprint, type SasCode } from "@/lib/sas";
import {
  createWritableForName,
  estimateFreeSpace,
  streamToDiskSupported,
  type SaveDirectory,
} from "@/lib/streaming";
import { fetchTurnCredentials } from "@/lib/turn-credentials";

export type ConnectionStatus =
  | "waiting"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "stalled";

export type ConnectionQuality = "direct" | "relay" | "unknown";

export interface IncomingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  receivedBytes: number;
  url?: string;
  done: boolean;
  startedAt: number;
  completedAt?: number;
  savedToDisk?: boolean;
  savedAs?: string;
  error?: string;
  // True while the connection is down but we're holding the partial buffer
  // and on-disk file in case the sender resumes within RESUME_GRACE_MS.
  // Cleared on successful resume or final cleanup.
  paused?: boolean;
  // Wall-clock timestamp (ms) when `paused` flipped true. UI uses it to
  // render a live countdown of how much of the grace window remains.
  // Cleared alongside `paused`.
  pausedAt?: number;
}

export interface OutgoingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  sentBytes: number;
  done: boolean;
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
  const username = env.VITE_TURN_USERNAME ?? "openrelayproject";
  const credential = env.VITE_TURN_CREDENTIAL ?? "openrelayproject";
  return [...stuns, { urls: turnUrls, username, credential }];
}

const CHUNK_SIZE = 64 * 1024; // 64KB payload (header adds 16 bytes)
const HEADER_SIZE = 16; // 16-byte file id (hex of UUID without dashes)
const CONNECT_TIMEOUT_MS = 12000;
export const MAX_TEXT_BYTES = 512 * 1024; // 512 KB hard cap on text channel messages
const MAX_RECONNECT_ATTEMPTS = 6;
const QUALITY_POLL_MS = 4000;

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

export function useWebRTC(sessionId: string, isInitiator: boolean, deviceName?: string) {
  const [status, setStatus] = useState<ConnectionStatus>("waiting");
  const [peerPresent, setPeerPresent] = useState(false);
  // True when this guest joined a session that already has another guest claiming it.
  // The session page renders a "bridge already in use" dead-end with a Retry button.
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const myClientIdRef = useRef<string>("");
  if (!myClientIdRef.current) {
    myClientIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const [peerDeviceKind, setPeerDeviceKind] = useState<DeviceKind | null>(null);
  const [peerDeviceName, setPeerDeviceName] = useState<string | null>(null);
  // Receiver-side capabilities the peer broadcasts via presence so we can
  // size outgoing transfers safely. `stream` = File System Access API
  // available; `save` = user has actually picked an auto-save folder. Both
  // true means the receiver writes chunks straight to disk with constant
  // memory, so we can allow much larger files. Either false → conservative
  // cap so we don't OOM the peer's tab on big transfers.
  const [peerCaps, setPeerCaps] = useState<{ stream: boolean; save: boolean } | null>(null);
  const deviceNameRef = useLatestRef<string | undefined>(deviceName);
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const myDeviceKindRef = useRef<DeviceKind>("computer");
  const [myDeviceKind, setMyDeviceKind] = useState<DeviceKind>("computer");
  useEffect(() => {
    const k = detectDeviceKind();
    myDeviceKindRef.current = k;
    setMyDeviceKind(k);
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const incomingBuffersRef = useRef<Record<string, IncomingBuffer>>({});
  const sasComputedRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qualityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
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
  // One-shot timers per partial incoming transfer. Scheduled when the
  // connection drops mid-transfer; on fire we run the same destructive
  // cleanup teardown used to do immediately. Cleared if the sender resumes
  // before the timer fires, or if the receiver explicitly cancels.
  const graceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Promise resolvers parked by sendFileInternal while it waits for a
  // file-resume-ack reply from the receiver. Keyed by file id.
  const resumeAckResolversRef = useRef<Record<string, (offset: number) => void>>({});
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

  const sendSignal = useCallback((payload: unknown) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
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
    (dc: RTCDataChannel) => {
      dc.binaryType = "arraybuffer";
      dc.bufferedAmountLowThreshold = 1 << 20; // 1MB

      dc.onopen = () => {
        if (connectTimerRef.current) {
          clearTimeout(connectTimerRef.current);
          connectTimerRef.current = null;
        }
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        setStatus("connected");
        startQualityPoll();
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
        autoResumeTimerRef.current = setTimeout(() => {
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
            if (!file.retryable) continue;
            if (!fileSourcesRef.current[id]) continue;
            if (attemptedAutoResumeIdsRef.current.has(id)) continue;
            if (channel.readyState !== "open") break;
            attemptedAutoResumeIdsRef.current.add(id);
            if (tryResume(id)) resumed++;
          }
          if (resumed > 0) setLastAutoResume({ ts: Date.now(), count: resumed });
        }, 750);
      };
      dc.onclose = () => {
        stopQualityPoll();
        // Tier 2: a fresh open from here on counts as a new reopen
        // cycle, so previously-attempted transfers become eligible again.
        attemptedAutoResumeIdsRef.current.clear();
        if (autoResumeTimerRef.current) {
          clearTimeout(autoResumeTimerRef.current);
          autoResumeTimerRef.current = null;
        }
        // Defer to connection-state handler to decide reconnect vs disconnect.
      };
      dc.onerror = () => {};

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
          dcRef.current?.send(JSON.stringify({ t: "file-abort", id, reason: message }));
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
                [id]: { ...s[id], error: message, done: true, completedAt: Date.now() },
              }
            : s,
        );
        delete incomingBuffersRef.current[id];
      };

      dc.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.t === "text" || msg.t === "clipboard") {
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
                  dcRef.current?.send(
                    JSON.stringify({
                      t: "file-abort",
                      id: meta.id,
                      reason: "Cancelled by receiver",
                    }),
                  );
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
                          },
                        }
                      : s,
                  );
                  try {
                    dcRef.current?.send(
                      JSON.stringify({
                        t: "file-resume-ack",
                        id: meta.id,
                        offset: existing.received,
                      }),
                    );
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
                }
                try {
                  dcRef.current?.send(
                    JSON.stringify({
                      t: "file-resume-ack",
                      id: meta.id,
                      offset: 0,
                    }),
                  );
                } catch {}
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
                  done: false,
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
                        dcRef.current?.send(
                          JSON.stringify({
                            t: "file-abort",
                            id: meta.id,
                            reason: "no-space",
                          }),
                        );
                      } catch {}
                      const reason = `Not enough free space (need ${meta.size} bytes, ~${free} available)`;
                      setIncomingFiles((s) =>
                        s[meta.id]
                          ? {
                              ...s,
                              [meta.id]: {
                                ...s[meta.id],
                                error: reason,
                                done: true,
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
                    const { writable, finalName, cleanup } = await createWritableForName(
                      dir.handle,
                      meta.name,
                    );
                    const live = incomingBuffersRef.current[meta.id];
                    if (!live || live.aborted) {
                      // Already cancelled/aborted - discard and clean up.
                      try {
                        await (writable as unknown as { abort?: () => Promise<void> })
                          .abort?.();
                      } catch {}
                      try {
                        await writable.close();
                      } catch {}
                      try {
                        await cleanup();
                      } catch {}
                      return;
                    }
                    const queued = live.memoryChunks;
                    live.memoryChunks = []; // free memory
                    live.writer = writable;
                    live.finalName = finalName;
                    live.savedToDisk = true;
                    live.cleanup = cleanup;
                    // Flush any chunks that arrived before the writable opened.
                    // Errors here go through the same abort path as live writes.
                    live.writeQueue = live.writeQueue.then(async () => {
                      for (const c of queued) {
                        if (live.aborted) return;
                        try {
                          await writable.write(c as BufferSource);
                        } catch (err) {
                          abortIncomingDueToWriteError(meta.id, err);
                          return;
                        }
                      }
                    });
                    setIncomingFiles((s) =>
                      s[meta.id]
                        ? { ...s, [meta.id]: { ...s[meta.id], savedToDisk: true, savedAs: finalName } }
                        : s,
                    );
                  } catch (err) {
                    // Could not open the writable (permission revoked, etc.).
                    // Stay on the in-memory fallback path so the transfer still
                    // succeeds, but surface a hint via console for debugging.
                    if (typeof console !== "undefined") {
                      console.warn("[quickbridge] stream-to-disk fallback:", err);
                    }
                  }
                })();
              }
            } else if (msg.t === "file-cancel") {
              const id: string = msg.id;
              cancelledIdsRef.current.add(id);
              const buf = incomingBuffersRef.current[id];
              if (buf) {
                buf.aborted = true;
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
              const id: string = msg.id;
              const reason: string =
                typeof msg.reason === "string" && msg.reason ? msg.reason : "Receiver aborted";
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
              const id: string = msg.id;
              const offset: number =
                typeof msg.offset === "number" && msg.offset >= 0 ? msg.offset : 0;
              const resolver = resumeAckResolversRef.current[id];
              if (resolver) resolver(offset);
            } else if (msg.t === "file-end") {
              const id: string = msg.id;
              const buf = incomingBuffersRef.current[id];
              if (!buf) return;
              if (buf.writer) {
                const writer = buf.writer;
                const finalName = buf.finalName;
                buf.writeQueue
                  .then(async () => {
                    try {
                      await writer.close();
                    } catch {}
                  })
                  .finally(() => {
                    setIncomingFiles((s) =>
                      s[id]
                        ? {
                            ...s,
                            [id]: {
                              ...s[id],
                              receivedBytes: buf.meta.size,
                              done: true,
                              savedToDisk: true,
                              savedAs: finalName ?? s[id].name,
                              completedAt: Date.now(),
                            },
                          }
                        : s,
                    );
                    delete incomingBuffersRef.current[id];
                  });
              } else {
                const blob = new Blob(buf.memoryChunks as BlobPart[], { type: buf.meta.type });
                const url = URL.createObjectURL(blob);
                objectUrlsRef.current.push(url);
                setIncomingFiles((s) => ({
                  ...s,
                  [id]: { ...s[id], receivedBytes: buf.meta.size, url, done: true, completedAt: Date.now() },
                }));
                delete incomingBuffersRef.current[id];
              }
            }
          } catch {}
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
            buf.memoryChunks.push(payload);
          }
          buf.received += payload.byteLength;
          setIncomingFiles((s) =>
            s[id] ? { ...s, [id]: { ...s[id], receivedBytes: buf.received } } : s,
          );
        }
      };
    },
    [startQualityPoll, stopQualityPoll],
  );

  const scheduleReconnect = useCallback(() => {
    if (!peerPresentRef.current) {
      setStatus("waiting");
      return;
    }
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus("disconnected");
      return;
    }
    if (reconnectTimerRef.current) return; // already scheduled
    const attempt = reconnectAttemptRef.current + 1;
    reconnectAttemptRef.current = attempt;
    setReconnectAttempt(attempt);
    setStatus("reconnecting");
    // Exponential backoff capped at 8s
    const delay = Math.min(8000, 600 * Math.pow(1.6, attempt - 1));
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      teardownRef.current();
      // Mark active outgoing transfers as retryable failures so the user can resume
      setOutgoingFiles((s) => {
        const next = { ...s };
        for (const id of Object.keys(next)) {
          const f = next[id];
          if (!f.done && !f.error) {
            next[id] = { ...f, error: "Connection lost", retryable: !!fileSourcesRef.current[id] };
          }
        }
        return next;
      });
      if (isInitiatorRef.current) {
        // initiator restarts the offer cycle
        // startOffer is defined below; closure uses ref
        void startOfferRef.current?.();
      } else {
        // guest pings host to start a new offer
        sendSignal({ type: "hello" });
      }
    }, delay);
  }, [sendSignal]);

  const createPeerConnection = useCallback(() => {
    // Close any previous PC so it cannot fire stale state-change events that
    // would tear down the new one. Without this, double-fired startOffer()
    // calls (e.g. presence sync + hello arriving back-to-back) leave an
    // orphaned RTCPeerConnection alive that later "fails" and triggers
    // teardown of the working PC -- visible to the user as the connection
    // dropping and reconnecting several times before it finally settles.
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
    }
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcRef.current = pc;
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];

    pc.onicecandidate = (e) => {
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
      if (st === "connected") {
        if (connectTimerRef.current) {
          clearTimeout(connectTimerRef.current);
          connectTimerRef.current = null;
        }
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        setStatus("connected");
        startQualityPoll();
      } else if (st === "disconnected" || st === "failed" || st === "closed") {
        stopQualityPoll();
        setQuality("unknown");
        scheduleReconnect();
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc !== pcRef.current) return;
      if (pc.iceConnectionState === "failed") {
        scheduleReconnect();
      }
    };
    pc.ondatachannel = (e) => {
      if (pc !== pcRef.current) return;
      dcRef.current = e.channel;
      setupDataChannel(e.channel);
    };
    return pc;
  }, [scheduleReconnect, sendSignal, setupDataChannel, startQualityPoll, stopQualityPoll]);

  const armConnectTimeout = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = setTimeout(() => {
      setStatus((s) => {
        if (s === "connected") return s;
        // If we have peer presence, treat as needing reconnect; otherwise stalled
        if (peerPresentRef.current) {
          scheduleReconnect();
          return "reconnecting";
        }
        return "stalled";
      });
    }, CONNECT_TIMEOUT_MS);
  }, [scheduleReconnect]);

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
    setStatus("connecting");
    armConnectTimeout();
    const pc = createPeerConnection();
    const dc = pc.createDataChannel("data", { ordered: true });
    dcRef.current = dc;
    setupDataChannel(dc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    void tryComputeSas();
    sendSignal({ type: "offer", sdp: offer });
  }, [armConnectTimeout, createPeerConnection, sendSignal, setupDataChannel, tryComputeSas]);

  startOfferRef.current = startOffer;

  // Teardown without removing the realtime channel
  const teardownPeer = useCallback(() => {
    stopQualityPoll();
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
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
          s[id] && !s[id].done
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
            if (!cur || cur.done) return s;
            return {
              ...s,
              [id]: {
                ...cur,
                paused: false,
                pausedAt: undefined,
                error: "Connection lost - sender did not return in time",
                done: true,
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
        if (!cur || cur.done) return s;
        return {
          ...s,
          [id]: {
            ...cur,
            error: "Connection interrupted - partial file removed",
            done: true,
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
    let aborted = false;
    let helloTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase.channel(`qb:${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: isInitiator ? "host" : "guest" } },
    });
    channelRef.current = channel;

    // Bounded hello retry - guest re-announces until the host's presence is
    // observed. 12 attempts × 1 s gives a generous 12 s window to cover the
    // host's home→session navigation, hydration re-renders, and Supabase
    // channel re-subscriptions.
    const startHelloRetries = () => {
      if (isInitiator) return;
      if (helloTimer) return;
      let attempts = 0;
      const tick = () => {
        helloTimer = null;
        if (aborted) return;
        if (peerPresentRef.current) return;
        if (attempts >= 12) return;
        attempts += 1;
        sendSignal({ type: "hello" });
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

    channel.on("presence", { event: "sync" }, () => {
      if (aborted) return;
      const state = channel.presenceState() as Record<
        string,
        Array<{
          device?: DeviceKind;
          name?: string;
          clientId?: string;
          t?: number;
          caps?: { stream?: boolean; save?: boolean };
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
            try { void channel.untrack(); } catch {}
            teardownPeer();
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
          ? { stream: !!rawCaps.stream, save: !!rawCaps.save }
          : peerEntry
            ? { stream: false, save: false }
            : null,
      );
      // Peer just appeared (transition false -> true). If we are the initiator
      // and have no active connection yet, kick off the offer directly. If we
      // are the guest, re-announce hello so a late-arriving host receives it.
      if (hasPeer && !wasPeerPresent) {
        stopHelloRetries();
        if (isInitiator && !pcRef.current) {
          startOffer();
        } else if (!isInitiator) {
          sendSignal({ type: "hello" });
        }
      }
      // Peer just left while we were active - update status
      if (!hasPeer && pcRef.current) {
        teardownPeer();
        setQuality("unknown");
        setStatus("waiting");
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
      }
    });

    channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
      const msg = payload as {
        type: string;
        sdp?: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
      };
      if (msg.type === "offer" && msg.sdp) {
        // A new offer arrived: if we already had a PC, tear it down to accept the fresh one.
        if (pcRef.current && pcRef.current.signalingState !== "stable") {
          teardownPeer();
        } else if (pcRef.current && remoteDescSetRef.current) {
          teardownPeer();
        }
        if (aborted) return;
        setStatus("connecting");
        armConnectTimeout();
        const pc = pcRef.current ?? createPeerConnection();
        await pc.setRemoteDescription(msg.sdp);
        if (aborted) return;
        remoteDescSetRef.current = true;
        await drainPendingCandidates(pc);
        if (aborted) return;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (aborted) return;
        void tryComputeSas();
        sendSignal({ type: "answer", sdp: answer });
      } else if (msg.type === "answer" && msg.sdp) {
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
        if (healthy) return;
        startOffer();
      }
    });

    channel.subscribe(async (s) => {
      if (s === "SUBSCRIBED") {
        if (aborted) return;
        await channel.track({
          role: isInitiator ? "host" : "guest",
          device: myDeviceKindRef.current,
          name: deviceNameRef.current ?? "",
          clientId: myClientIdRef.current,
          t: Date.now(),
          caps: {
            stream: streamToDiskSupported(),
            save: !!saveDirectoryRef.current,
          },
        });
        if (aborted) return;
        if (!isInitiator) {
          setTimeout(() => {
            if (!aborted) startHelloRetries();
          }, 300);
        }
      }
    });

    return () => {
      aborted = true;
      stopHelloRetries();
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
      supabase.removeChannel(channel);
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

  // Re-track presence when device name OR auto-save state changes so the
  // peer sees the update. Auto-save matters because the sender uses the
  // peer's caps to size outgoing transfers - flipping "save" on/off needs
  // to propagate or the sender's cap will be stale.
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;
    void ch.track({
      role: isInitiator ? "host" : "guest",
      device: myDeviceKindRef.current,
      name: deviceName ?? "",
      clientId: myClientIdRef.current,
      t: Date.now(),
      caps: {
        stream: streamToDiskSupported(),
        save: !!saveDirectory,
      },
    });
  }, [deviceName, isInitiator, saveDirectory]);

  const sendText = useCallback((content: string, kind: "text" | "clipboard" = "text") => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return false;
    if (content.length > MAX_TEXT_BYTES) return false;
    try {
      dc.send(JSON.stringify({ t: kind, content }));
    } catch {
      return false;
    }
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "me", kind, content, ts: Date.now() }]);
    return true;
  }, []);

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
          done: false,
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
              reject(new Error("Receiver did not acknowledge resume"));
            }, RESUME_ACK_TIMEOUT_MS);
            resumeAckResolversRef.current[id] = (off) => {
              clearTimeout(timer);
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
            try {
              channel.send(JSON.stringify({ t: "file-cancel", id }));
            } catch {}
          }
          channel.send(JSON.stringify({ t: "file-start", meta }));
        } catch {
          if (ackPromise) {
            // Tear down the parked resolver so its timer doesn't surface
            // a misleading "did not acknowledge" error after the fact.
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
                await new Promise<void>((resolve) => {
                  const onLow = () => {
                    channel.removeEventListener("bufferedamountlow", onLow);
                    resolve();
                  };
                  channel.addEventListener("bufferedamountlow", onLow);
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
              chunkOffset += slice.byteLength;
              offset += slice.byteLength;
              setOutgoingFiles((s) => ({ ...s, [id]: { ...s[id], sentBytes: offset } }));
            }
          }
          try {
            channel.send(JSON.stringify({ t: "file-end", id }));
          } catch {}
          setOutgoingFiles((s) => ({
            ...s,
            [id]: { ...s[id], sentBytes: file.size, done: true, completedAt: Date.now(), error: undefined, retryable: false },
          }));
          // Successful: drop the cached source to free memory
          delete fileSourcesRef.current[id];
        } catch (err) {
          const message = err instanceof Error ? err.message : "Transfer aborted";
          // User-cancelled transfers: cancelOutgoing already removed the row
          // and notified the peer. Don't resurrect the row or mark retryable.
          if (!cancelledOutgoingIdsRef.current.has(id)) {
            setOutgoingFiles((s) =>
              s[id] ? { ...s, [id]: { ...s[id], error: message, retryable: true } } : s,
            );
          }
          try {
            reader.cancel();
          } catch {}
        }
      };

      sendQueueRef.current = sendQueueRef.current.then(task, task);
      return id;
    },
    [],
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

  // Cancel an in-flight outgoing transfer at the user's request. Marks the
  // id as cancelled (the send loop polls this and bails on the next chunk),
  // notifies the peer over the existing `file-cancel` protocol so the
  // receiver drops its partial buffer / on-disk file, drops the cached
  // source so a stale Retry can't resurrect it, and removes the row from
  // the UI immediately so the cancel feels instant.
  const cancelOutgoing = useCallback((id: string) => {
    cancelledOutgoingIdsRef.current.add(id);
    delete fileSourcesRef.current[id];
    peerAbortedSendIdsRef.current.delete(id);
    try {
      const dc = dcRef.current;
      if (dc && dc.readyState === "open") {
        dc.send(JSON.stringify({ t: "file-cancel", id }));
      }
    } catch {}
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
      setStatus("waiting");
      // Even without presence, nudge with a hello so a host that lost its
      // socket but is still on the same channel can pick us up.
      if (!isInitiatorRef.current) sendSignal({ type: "hello" });
      return;
    }
    setStatus("connecting");
    if (isInitiatorRef.current) {
      void startOfferRef.current?.();
    } else {
      sendSignal({ type: "hello" });
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
        dcRef.current?.send(
          JSON.stringify({ t: "file-abort", id, reason: "Cancelled by receiver" }),
        );
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
    () => Object.values(incomingFiles).sort((a, b) => a.id.localeCompare(b.id)),
    [incomingFiles],
  );
  const outgoingList = useMemo(
    () => Object.values(outgoingFiles).sort((a, b) => a.id.localeCompare(b.id)),
    [outgoingFiles],
  );

  return {
    status,
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
    cancelIncoming,
    releaseIncoming,
    manualReconnect,
    isInitiator,
    sasCode,
    saveDirectory,
    setSaveDirectory,
    streamToDiskSupported: streamToDiskSupported(),
    lastAutoResume,
  };
}
