import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Pencil,
  Check as CheckIcon,
  History as HistoryIcon,
  Trash2,
  ChevronDown,
  ArrowLeftRight,
  PowerOff,
  Users,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useWebRTC, MAX_TEXT_BYTES, RESUME_GRACE_MS } from "@/hooks/use-webrtc";
import { useBridgeSignal } from "@/lib/bridge-signal";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";
import { SasBadge } from "./SasBadge";
import { formatBytes } from "@/lib/session";
import { cn } from "@/lib/utils";
import { deviceLabel, type DeviceKind } from "@/lib/device";
import { playConnectSound, playMessageSound, playReceiveSound, unlockAudio } from "@/lib/sound";
import { useHistory, type HistoryItem } from "@/lib/history";
import { ensureNotificationPermission, notify } from "@/lib/notifications";
import { expandDataTransfer, readPaste } from "@/lib/dropzone";
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

  const {
    status,
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
    bridgeBusy,
    lastAutoResume,
  } = useWebRTC(sessionId, isInitiator, deviceName.trim() || undefined);

  const navigate = useNavigate();

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
    for (const [id, file] of Object.entries(incomingFiles)) {
      if (!file.paused || !file.pausedAt) continue;
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
        ? "Connection restored — resuming transfer…"
        : `Connection restored — resuming ${count} transfers…`,
      { id: `auto-resume:${lastAutoResume.ts}`, duration: 4000 },
    );
  }, [lastAutoResume]);

  // Brief per-row "Resumed" indicator. Derived from a real state
  // transition — a row that was in a retryable error state and is now
  // actively sending again — NOT from auto-resume events. This way the
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
      const isActivelySending = !f.done && !f.error;
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
        // Only clear ids we just stamped — a later resume of the same
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
  //   0–3s : default "Waiting for the host…" header
  //   3–6s : eyebrow flips to "Still trying…"
  //   6s+  : full dead-end card with Retry / Go home
  const [hostMissing, setHostMissing] = useState(false);
  const [stillTrying, setStillTrying] = useState(false);
  useEffect(() => {
    if (isInitiator) return;
    if (peerPresent || status !== "waiting") {
      setHostMissing(false);
      setStillTrying(false);
      return;
    }
    const tStill = window.setTimeout(() => setStillTrying(true), 3000);
    const tMissing = window.setTimeout(() => setHostMissing(true), 6000);
    return () => {
      window.clearTimeout(tStill);
      window.clearTimeout(tMissing);
    };
  }, [isInitiator, peerPresent, status]);

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
      manualReconnect();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, manualReconnect]);

  // Hold a Screen Wake Lock while connected so mobile browsers don't suspend
  // the page as aggressively. Best-effort - not supported everywhere, and
  // released automatically when the tab is hidden.
  useEffect(() => {
    if (status !== "connected") return;
    const navAny = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (!navAny.wakeLock) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        sentinel = await navAny.wakeLock!.request("screen");
      } catch {}
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
    };
  }, [status]);

  const endBridge = useCallback(() => {
    clearActiveSession();
    if (isInitiator) removeKey(StorageKeys.hostSessionId);
    pendingFilesRef.current = [];
    toast("Bridge ended", { description: "The connection has been closed." });
    navigate({ to: "/" });
  }, [isInitiator, navigate]);

  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [now, setNow] = useState(Date.now());
  // Increments each time we transition into "connected" - drives a one-shot burst animation.
  const [connectBurst, setConnectBurst] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastIncomingRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const stalledNotifiedRef = useRef(false);
  const prevStatusRef = useRef(status);
  // Mobile recovery queue: files chosen while the WebRTC peer is reconnecting
  // (because the OS suspended the tab while the system file picker was open)
  // are held here and auto-flushed on the next "connected" transition. Without
  // this, the file picker round-trip on Android silently drops the selection.
  const pendingFilesRef = useRef<File[]>([]);

  // History (per-session)
  const history = useHistory(sessionId);
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

  // Drive a low-frequency tick so live transfer rates/ETAs update smoothly.
  useEffect(() => {
    const hasActive =
      outgoingFiles.some((f) => !f.done && !f.error) || incomingFiles.some((f) => !f.done);
    if (!hasActive) return;
    const id = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(id);
  }, [outgoingFiles, incomingFiles]);

  // Tick once a minute for relative timestamps in history
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Notify on incoming files & log to history
  useEffect(() => {
    const doneCount = incomingFiles.filter((f) => f.done).length;
    if (doneCount > lastIncomingRef.current) {
      lastIncomingRef.current = doneCount;
      toast.success("File received");
      playReceiveSound();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([60, 40, 80]);
    }
    for (const f of incomingFiles) {
      if (f.done && !seenReceivedRef.current.has(f.id)) {
        seenReceivedRef.current.add(f.id);
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
    }
  }, [incomingFiles, history, saveDirectory]);

  // Log sent files & track source availability
  useEffect(() => {
    for (const f of outgoingFiles) {
      if (f.done && !seenSentRef.current.has(f.id)) {
        seenSentRef.current.add(f.id);
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
    if (status === "stalled" && !stalledNotifiedRef.current) {
      stalledNotifiedRef.current = true;
      toast.error("Connection is taking too long", {
        description:
          "A network firewall or strict NAT may be blocking the direct connection. We'll keep trying via a relay.",
      });
    }
    if (status === "reconnecting" && prevStatusRef.current === "connected") {
      toast.warning("Connection lost - reconnecting…", {
        description: "We'll try to restore your bridge automatically.",
      });
    }
    if (status === "disconnected" && prevStatusRef.current !== "disconnected") {
      toast.error("Couldn't reconnect", {
        description: "Reload the page or open the pair link again to start a new bridge.",
      });
    }
    if (status === "connected" && prevStatusRef.current !== "connected") {
      stalledNotifiedRef.current = false;
      if (prevStatusRef.current === "reconnecting") {
        toast.success("Reconnected");
      }
      playConnectSound();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(40);
      setConnectBurst((n) => n + 1);
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== "peer" || last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;
    const title = last.kind === "clipboard" ? "Clipboard received" : "Message received";
    const preview = last.content.length > 80 ? `${last.content.slice(0, 80)}…` : last.content;
    toast(title, { description: preview });
    playMessageSound();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);
    notify(title, preview, `msg:${last.id}`);
  }, [messages]);

  const peerStreamingToDisk = !!(peerCaps && peerCaps.stream && peerCaps.save);
  const effectiveMaxBytes = peerStreamingToDisk
    ? STREAMED_MAX_FILE_BYTES
    : DEFAULT_MAX_FILE_BYTES;
  const effectiveMaxLabel = peerStreamingToDisk
    ? STREAMED_MAX_FILE_LABEL
    : DEFAULT_MAX_FILE_LABEL;

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
      const who = peerDeviceName?.trim() || "The receiving device";
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
        // If the peer is mid-reconnect (typical on Android: opening the system
        // file picker backgrounds the tab and the OS suspends WebRTC), hold
        // the selection in memory and auto-flush on the next "connected"
        // transition instead of dropping it. Dedupe by name+size+lastModified
        // so a re-pick of the same file doesn't queue a duplicate.
        if (status === "reconnecting" && arr.length > 0) {
          const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
          const have = new Set(pendingFilesRef.current.map(key));
          const adds = arr.filter((f) => !have.has(key(f)));
          if (adds.length > 0) {
            pendingFilesRef.current.push(...adds);
            const label =
              adds.length === 1 ? `"${adds[0].name}"` : `${adds.length} files`;
            toast(`Queued ${label}`, {
              description: "Reconnecting — will send automatically.",
            });
          }
          return;
        }
        toast.error("Not connected yet");
        return;
      }
      for (const f of Array.from(files)) {
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
    [sendFile, status],
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

  // Drain the mobile-recovery queue once the peer is connected again, and
  // surface a clear failure message if reconnect ultimately gave up. Placed
  // after handleFiles so the drained files re-run all the size checks and
  // source-tracking that a normal pick goes through.
  useEffect(() => {
    if (status === "connected" && pendingFilesRef.current.length > 0) {
      const queued = pendingFilesRef.current;
      pendingFilesRef.current = [];
      const label = queued.length === 1 ? `"${queued[0].name}"` : `${queued.length} files`;
      toast.success(`Sending ${label}`);
      void handleFiles(queued);
      return;
    }
    if (status === "disconnected" && pendingFilesRef.current.length > 0) {
      const dropped = pendingFilesRef.current.length;
      pendingFilesRef.current = [];
      toast.error(`Couldn't send ${dropped} queued file${dropped === 1 ? "" : "s"}`, {
        description: "The bridge couldn't be restored. Reload and try again.",
      });
    }
  }, [status, handleFiles]);

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
      const { files, text: pastedText } = await readPaste(e);
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

  const handleSendClipboard = async () => {
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
  };

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
      if (sendText(t, "clipboard")) {
        toast.success("Clipboard auto-sent", {
          description: t.length > 60 ? `${t.slice(0, 60)}…` : t,
        });
      }
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
        const peerLabel =
          peerDeviceName?.trim() ||
          (peerDeviceKind ? deviceLabel(peerDeviceKind, "peer") : "other device");
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

  // Proactive prompt when a large file starts arriving and auto-save is off.
  // Placed after handleStreamToDiskClick so the reference is valid.
  const largeFilePromptedRef = useRef<Set<string>>(new Set());
  const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100 MB
  useEffect(() => {
    if (!streamToDiskSupported || saveDirectory) return;
    for (const f of incomingFiles) {
      if (f.done || largeFilePromptedRef.current.has(f.id)) continue;
      if (f.size >= LARGE_FILE_THRESHOLD) {
        largeFilePromptedRef.current.add(f.id);
        toast(`Receiving a large file - ${formatBytes(f.size)}`, {
          description:
            "Save it directly to a folder instead of downloading? Faster, and avoids filling browser memory.",
          duration: 12000,
          action: {
            label: "Pick folder",
            onClick: () => {
              void handleStreamToDiskClick();
            },
          },
        });
      }
    }
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
  const peerShown = peerDeviceName?.trim() || peerFallback;
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
    if (status === "disconnected") {
      return { eyebrow: "Disconnected", eyebrowDot: "bg-destructive", title: "Connection lost.", body: "We couldn't reach the other device. Use Retry now, or refresh the page on both devices." };
    }
    if (status === "stalled") {
      return { eyebrow: "Network blocked", eyebrowDot: "bg-destructive animate-pulse", title: "Network may be blocked.", body: "Your network is preventing peer-to-peer setup. Try a different network or enable a TURN server." };
    }
    if (isInitiator) {
      return { eyebrow: "Waiting", eyebrowDot: "bg-muted-foreground", title: "Waiting for the other device…", body: "Scan the QR code or enter the PIN on the other device to pair." };
    }
    if (stillTrying) {
      return { eyebrow: "Still trying", eyebrowDot: "bg-warning animate-pulse", title: "Still looking for the host…", body: "The host might be on a slow network. Hang on a moment longer." };
    }
    return { eyebrow: "Waiting", eyebrowDot: "bg-muted-foreground", title: "Waiting for the host…", body: "Hang tight - connecting to the host's session." };
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
            <Button onClick={endBridge} variant="outline" className="h-10">
              Go home
            </Button>
          </div>
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
            <Button onClick={endBridge} variant="outline" className="h-10">
              Go home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="mb-2">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", headerCopy.eyebrowDot)} />
          {headerCopy.eyebrow}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{headerCopy.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{headerCopy.body}</p>
      </div>
      <Card
        className={cn(
          "relative flex flex-wrap items-center justify-between gap-3 border-border/60 bg-card/70 px-4 py-3 backdrop-blur transition-shadow",
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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* My device - editable */}
          {editingName ? (
            <span className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-1.5 py-0.5 font-medium text-foreground">
              {deviceIcon(myDeviceKind)}
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
                className="h-6 w-32 px-1.5 text-xs"
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
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftName(deviceName);
                setEditingName(true);
              }}
              className="group inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted/50"
              title="Edit device name"
            >
              {deviceIcon(myDeviceKind)}
              <span>{myShown}</span>
              <Pencil className="h-3 w-3 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 font-medium",
              peerDeviceKind ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {deviceIcon(peerDeviceKind)}
            <span>{peerShown}</span>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {connected && throughputSamples.length > 1 && (
            <Sparkline
              samples={throughputSamples}
              className="hidden sm:block opacity-90"
              ariaLabel="Live throughput"
            />
          )}
          <StatusBadge
            status={status}
            quality={quality}
            attempt={reconnectAttempt}
            maxAttempts={maxReconnectAttempts}
          />
          {status === "disconnected" && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-[11px] sm:h-7 sm:px-2"
              onClick={() => manualReconnect()}
              title="Retry the connection now"
            >
              <RotateCw className="mr-1 h-3.5 w-3.5" />
              Retry now
            </Button>
          )}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 px-3 text-[11px] text-muted-foreground sm:h-7 sm:px-2"
            title="Open the help center in a new tab"
          >
            <a
              href="/help#troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the help center in a new tab"
            >
              <HelpCircle className="mr-1 h-3.5 w-3.5" />
              Help
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 text-[11px] text-muted-foreground hover:border-destructive/50 hover:text-destructive sm:h-7 sm:px-2"
            onClick={endBridge}
            title="Close this bridge and return home"
          >
            <PowerOff className="mr-1 h-3.5 w-3.5" />
            End bridge
          </Button>
        </div>
        {connected && (
          <div className="basis-full mt-1 divide-y divide-border/40 overflow-hidden rounded-md border border-border/40 bg-background/30">
            <div className="px-3 py-2">
              <SasBadge code={sasCode} />
            </div>
            {streamToDiskSupported && (
              <div className="flex items-start justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-foreground/90">
                    <HardDriveDownload className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Save incoming files to folder</span>
                  </div>
                  <p className="pl-[22px] text-[10.5px] leading-snug text-muted-foreground/80">
                    {saveDirectory
                      ? `Saving to: ${saveDirectory.label} · senders can transfer up to ${STREAMED_MAX_FILE_LABEL}`
                      : `Saves directly to disk · unlocks files up to ${STREAMED_MAX_FILE_LABEL}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!saveDirectory && resumeDirLabel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10.5px]"
                      onClick={handleResumeStreamToDisk}
                      title={`Resume saving incoming files to ${resumeDirLabel}`}
                    >
                      <FolderOpen className="mr-1 h-3.5 w-3.5" />
                      Resume
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={saveDirectory ? "secondary" : "outline"}
                    className="h-7 px-2 text-[10.5px]"
                    onClick={handleStreamToDiskClick}
                    title={
                      saveDirectory
                        ? `Saving incoming files to ${saveDirectory.label} - click to turn off`
                        : "Pick a folder on your computer and incoming files write straight to it as they arrive - no download button, no waiting, and the file never has to sit in browser memory. Recommended for files over 100 MB."
                    }
                  >
                    {saveDirectory ? "Turn off" : "Pick folder"}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2 text-[11px] font-medium text-foreground/90">
                  <Clipboard className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <Label htmlFor="auto-clip" className="cursor-pointer text-[11px] font-medium">
                    Auto-share clipboard
                  </Label>
                </div>
                <p className="pl-[22px] text-[10.5px] leading-snug text-muted-foreground/80">
                  Anything copied on either device sends automatically. Skip on shared or public computers.
                </p>
              </div>
              <Switch
                id="auto-clip"
                className="shrink-0"
                checked={autoClip}
                onCheckedChange={async (v) => {
                  unlockAudio();
                  setAutoClip(v);
                  if (v) {
                    lastClipRef.current = "";
                    try {
                      await navigator.clipboard.readText();
                      toast.success("Clipboard auto-share on", {
                        description:
                          "Copy something on either device - it sends automatically while this tab is focused.",
                      });
                    } catch (err) {
                      const name = err instanceof DOMException ? err.name : "";
                      if (name === "NotAllowedError" || name === "SecurityError") {
                        setAutoClip(false);
                        toast.error("Clipboard access blocked", {
                          description:
                            "Click the lock icon in your browser's address bar and allow clipboard access, then try again.",
                        });
                      } else {
                        toast.success("Clipboard auto-share on", {
                          description:
                            "Copy something on either device - it sends automatically while this tab is focused.",
                        });
                      }
                    }
                  }
                }}
                disabled={!connected}
              />
            </div>
          </div>
        )}
      </Card>

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
          void expandDataTransfer(e.dataTransfer).then((files) => {
            const list = files.length ? files : Array.from(e.dataTransfer.files);
            if (list.length) handleFiles(list);
          });
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2.5 border-2 border-dashed bg-card/40 p-5 sm:p-6 text-center backdrop-blur transition-all",
          dragOver
            ? "scale-[1.01] border-primary bg-primary/10 shadow-glow"
            : "border-border/70 hover:border-border",
        )}
      >
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-lg border border-border bg-elevated text-primary transition-all",
            dragOver && "scale-110 border-primary",
          )}
        >
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold hidden sm:block">Drop files or folders to send</p>
          <p className="text-sm font-semibold sm:hidden">Send files</p>
          <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">
            Drag, paste (⌘/Ctrl+V), or pick - works with screenshots too · up to {effectiveMaxLabel} each
            <span className="text-muted-foreground/70"> (depends on receiving device)</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
            Tap below to pick files - up to {effectiveMaxLabel} each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="h-11 w-full sm:h-8 sm:w-auto">
          Choose files
        </Button>
      </Card>

      {/* Text + clipboard */}
      <Card className="space-y-3 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Send a message or URL…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
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
        const allDone = outgoingFiles.every((f) => f.done);
        const anyInFlight = outgoingFiles.some((f) => !f.done && !f.error);
        const headerLabel = allDone ? "Sent" : anyInFlight ? "Sending" : "Sending";
        const headerClass = allDone ? "text-success" : "";
        return (
        <Card className="space-y-3 p-4">
          <h3 className={`text-sm font-semibold ${headerClass}`}>{headerLabel}</h3>
          {outgoingFiles.map((f) => {
            const elapsed = Math.max(0.001, ((f.completedAt ?? Date.now()) - f.startedAt) / 1000);
            const rate = f.sentBytes / elapsed;
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
                <Progress value={pct} />
                {f.done ? (
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
            const elapsed = Math.max(0.001, ((f.completedAt ?? Date.now()) - f.startedAt) / 1000);
            const rate = f.receivedBytes / elapsed;
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
                    {!f.done ? (
                      <>
                        <Progress value={pct} />
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
                        {f.savedToDisk && (
                          <span className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                            <FolderOpen className="h-3 w-3" />
                            Saved to {saveDirectory?.label ?? "folder"}
                            {f.savedAs && f.savedAs !== f.name ? ` · ${f.savedAs}` : ""}
                          </span>
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
        <Card className="space-y-2 p-4">
          <h3 className="text-sm font-semibold">Messages</h3>
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col rounded-lg border p-3 text-sm",
                  m.from === "me" ? "bg-primary/5" : "bg-muted/40",
                )}
              >
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {m.from === "me" ? "You" : peerDeviceName?.trim() || "Peer"}
                    {m.kind === "clipboard" ? " · clipboard" : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
                <span className="whitespace-pre-wrap break-words">{m.content}</span>
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
          onRemove={history.remove}
          onClear={history.clear}
          sentSourcesRef={sentSourcesRef}
          connected={connected}
        />
      )}
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
  onRemove: (id: string) => void;
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
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] text-muted-foreground"
            onClick={onClear}
            title="Clear history"
          >
            <Trash2 className="mr-1 h-3 w-3" /> Clear
          </Button>
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
  onRemove: (id: string) => void;
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
              navigator.clipboard.writeText(item.content);
              toast.success("Copied");
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
          onClick={() => onRemove(item.id)}
          title="Remove from history"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </li>
  );
}
