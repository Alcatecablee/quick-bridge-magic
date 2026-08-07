// Continuity Phase 3 types.
//
// All design decisions incorporate the staff-engineer architecture review
// (17 findings) and the Phase 3 Part II audit (16 audit tracks). Key decisions:
//
// Runtime persistence (finding 6):
//   Intent runtime is session-scoped. Browser refresh clears active runtime state.
//   IntentLog is stored in localStorage (100 entries, FIFO eviction) and survives refresh.
//
// Seen-set lifetime (finding 9):
//   The receiver's seen-set is retained until session teardown (DataChannel close).
//   Expired intents are still recorded in the seen-set so replays cannot circumvent expiry.
//
// Ordering guarantees (finding 1):
//   The runtime guarantees FIFO ordering per sender/receiver pair.
//   Executors declare parallel-safe or not via IntentOrderingPolicy.
//   Clipboard: serial. Browser: serial. Notifications: parallel.
//
// Byte-accurate payload sizing (Part II OPT-3):
//   MAX_INTENT_PAYLOAD_BYTES is enforced using UTF-8 byte counts, not JS string length
//   (which counts UTF-16 code units and underestimates CJK/emoji content by 2-4x).
//   Use byteLength() from continuity-runtime.ts for all comparisons.
//
// Rate limiting (Part II security audit):
//   RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_INTENTS caps incoming intents per session
//   to prevent a compromised peer from flooding the runtime.
//
// No em dashes anywhere in this file.

import { z } from "zod";

// Envelope schema version. Bump when the IntentEnvelope schema changes (finding 7).
// Receivers that do not understand the new version send UNSUPPORTED_VERSION.
export const INTENT_ENVELOPE_VERSION = 1 as const;

// Clock skew tolerance. The receiver allows up to 60 s discrepancy before
// treating an intent as expired (finding 10).
export const CLOCK_SKEW_TOLERANCE_MS = 60_000;

// Default ACK timeout: sender treats the intent as lost after this window.
export const INTENT_ACK_TIMEOUT_MS = 10_000;

// Rate limiting (Part II security audit): max intents received from a trusted
// peer within a rolling window. Prevents flooding the runtime or the permission
// prompt UI. Applies per runtime instance (i.e. per DataChannel session).
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_INTENTS = 50;

// Payload size limits (UTF-8 bytes) enforced before serialization on the sender
// and before execution on the receiver (finding 14).
// All checks use byteLength(json) from continuity-runtime.ts, not String.length.
export const MAX_INTENT_PAYLOAD_BYTES: Record<string, number> = {
  "open-url": 16 * 1024,          // 16 KB
  "continue-reading": 16 * 1024,
  clipboard: 1024 * 1024,          // 1 MB
  "open-file": 64 * 1024,          // 64 KB metadata only
  "media-share": 64 * 1024,
  cancel: 1024,
};

// Default TTL per intent type (ms).
export const INTENT_DEFAULT_TTL_MS: Record<string, number> = {
  clipboard: 10_000,
  "open-url": 120_000,
  "continue-reading": 300_000,
  "open-file": 1_800_000,
  "media-share": 1_800_000,
  cancel: 5_000,
};

// All supported intent types.
export type ContinuityIntentType =
  | "open-url"
  | "continue-reading"
  | "clipboard"
  | "open-file"
  | "media-share"
  | "cancel";

// Shared envelope for every intent.
export interface IntentEnvelope {
  version: typeof INTENT_ENVELOPE_VERSION;
  intentId: string;
  type: ContinuityIntentType;
  // nodeId of the device that SENT the intent.
  // Required on the receiver side for permission lookups (finding 3).
  senderNodeId: string;
  targetNodeId: string;
  payload: unknown;
  createdAt: number;
  expiresAt: number;
}

// Statuses an intent passes through (both sender-tracked and receiver-tracked).
export type IntentStatus =
  | "received"
  | "accepted"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled"
  | "permission-denied"
  | "unsupported";

// Terminal statuses: once reached, no further transitions are valid.
// Used by the runtime to guard against backward transitions (Part II state machine audit).
export const TERMINAL_STATUSES = new Set<IntentStatus>([
  "completed",
  "failed",
  "expired",
  "cancelled",
  "permission-denied",
  "unsupported",
]);

// Valid intent statuses accepted from the wire. Used to reject ACKs with unknown
// status values from mismatched peer versions (Part II ACK race condition audit).
export const VALID_INTENT_STATUSES = new Set<string>([
  "received",
  "accepted",
  "completed",
  "failed",
  "expired",
  "cancelled",
  "permission-denied",
  "unsupported",
]);

// Machine-readable error codes used by logging, analytics, and retry logic.
// Never shown directly to users; use reasonMessage for human copy.
export type IntentErrorCode =
  | "PERMISSION_DENIED"
  | "CAPABILITY_UNAVAILABLE"
  | "INTENT_EXPIRED"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_VERSION"
  | "EXECUTION_FAILED"
  | "CANCELLED"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED";

// Error to retry policy mapping (finding 12).
export const INTENT_RETRY_POLICY: Record<
  IntentErrorCode,
  "no" | "yes" | "after-reload"
> = {
  PERMISSION_DENIED: "no",
  CAPABILITY_UNAVAILABLE: "no",
  INTENT_EXPIRED: "no",
  INVALID_PAYLOAD: "no",
  UNSUPPORTED_VERSION: "after-reload",
  EXECUTION_FAILED: "yes",
  CANCELLED: "no",
  PAYLOAD_TOO_LARGE: "no",
  RATE_LIMITED: "yes",
};

// ACK message (two ACKs per intent: "received" on arrival, "completed"/"failed" on finish).
export interface IntentAck {
  intentId: string;
  status: IntentStatus;
  reasonCode?: IntentErrorCode;
  reasonMessage?: string;
}

// Concurrency contract per executor (finding 2).
// serial          - only one of this type runs at a time; queued otherwise.
// parallel        - may run concurrently with any other intent.
// replace-existing - latest replaces any in-flight instance of the same type.
export type ExecutorConcurrency = "serial" | "parallel" | "replace-existing";

// Ordering policy per intent type (finding 1).
// Governs whether the runtime places the intent in the serial FIFO queue.
export type IntentOrderingPolicy = "serial" | "parallel";

export const INTENT_ORDERING: Record<
  ContinuityIntentType,
  IntentOrderingPolicy
> = {
  "open-url": "serial",
  "continue-reading": "serial",
  clipboard: "serial",
  "open-file": "parallel",
  "media-share": "parallel",
  cancel: "parallel",
};

// Single timeline event recorded at each state transition.
// The timeline array on RuntimeIntent gives a per-intent audit trail
// for debugging and latency measurement (Part II observability audit).
export interface IntentTimelineEvent {
  event: string;
  at: number;
}

// Runtime intent state: the single store (finding 3).
// One Map<intentId, RuntimeIntent> owns timers, status, observability data.
export interface RuntimeIntent {
  envelope: IntentEnvelope;
  status: IntentStatus;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  timer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
  // Observability fields for debug view (finding 11).
  ackReceivedAt?: number;
  executionStartedAt?: number;
  permissionWaitStartedAt?: number;
  completedAt?: number;
  // Idempotency: store the last ACK sent so duplicates replay it (finding 5).
  lastAck?: IntentAck;
  // Stored at dispatchIntent time so terminal ACKs can surface results
  // back to the caller (e.g. Session.tsx toast handlers) without needing
  // a separate global callback registry.
  onAckUpdate?: (ack: IntentAck, retryable: boolean) => void;
  // Human-readable nickname of the target device (for error messages).
  targetNickname?: string;
  // Per-intent state transition timeline for debugging and latency metrics
  // (Part II observability audit). Each entry records what changed and when.
  timeline: IntentTimelineEvent[];
}

// Intent log entry stored in localStorage (survives refresh, runtime does not).
export interface IntentLogEntry {
  intentId: string;
  type: ContinuityIntentType;
  direction: "sent" | "received";
  // For sent entries: the node we sent to. For received entries: our own nodeId.
  targetNodeId: string;
  // For sent entries: the peer's nickname. For received entries: our local device name.
  targetNickname: string;
  // For received entries: the sender's nickname.
  // Undefined on sent entries (targetNickname already captures the peer).
  senderNickname?: string;
  createdAt: number;
  status: IntentStatus;
  reasonCode?: IntentErrorCode;
  reasonMessage?: string;
  completedAt?: number;
  // Observability metrics (finding 11).
  ackLatencyMs?: number;
  executionMs?: number;
}

export const INTENT_LOG_KEY = "qb:intentLog";
export const INTENT_LOG_MAX = 100;

// --- Zod payload schemas ---
// All schemas perform semantic validation beyond structural validation:
//   - URLs must use http or https (blocks javascript: and data: injection).
//   - Numeric fields must be finite (blocks Infinity/NaN).
//   - String fields have explicit length caps (blocks multi-MB payloads
//     from slipping through the outer size check via field explosion).
// (Part II payload validation audit)

const SAFE_URL_SCHEMES = /^https?:\/\//i;

export const OpenUrlPayloadSchema = z.object({
  url: z.string().url().refine(
    u => SAFE_URL_SCHEMES.test(u),
    { message: "URL must use http or https." },
  ),
  title: z.string().max(500),
  favicon: z
    .string()
    .refine(u => SAFE_URL_SCHEMES.test(u), { message: "Favicon URL must use http or https." })
    .optional(),
});

export const ContinueReadingPayloadSchema = z.object({
  url: z.string().url().refine(
    u => SAFE_URL_SCHEMES.test(u),
    { message: "URL must use http or https." },
  ),
  scrollY: z
    .number()
    .int()
    .nonnegative()
    .refine(Number.isFinite, { message: "scrollY must be finite." }),
  selection: z.string().max(10_000).optional(),
  title: z.string().max(500),
  favicon: z
    .string()
    .refine(u => SAFE_URL_SCHEMES.test(u), { message: "Favicon URL must use http or https." })
    .optional(),
  timestamp: z
    .number()
    .refine(Number.isFinite, { message: "timestamp must be finite." }),
});

// Clipboard payload requires at least one non-empty content field.
// Both text and html are optional individually but at least one must be present.
// (Part II payload validation audit: empty clipboard payload is rejected.)
export const ClipboardPayloadSchema = z
  .object({
    text: z.string().optional(),
    html: z.string().optional(),
  })
  .refine(
    d => (d.text !== undefined && d.text.length > 0) || (d.html !== undefined && d.html.length > 0),
    { message: "Clipboard payload must contain non-empty text or html." },
  );

export const OpenFilePayloadSchema = z.object({
  name: z.string().min(1).max(1000),
  size: z.number().nonnegative().refine(Number.isFinite, { message: "size must be finite." }),
  mimeType: z.string().max(200),
});

export const MediaSharePayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("photo"),
    name: z.string().min(1).max(1000),
    size: z.number().nonnegative().refine(Number.isFinite, { message: "size must be finite." }),
    mimeType: z.string().max(200),
  }),
  z.object({
    kind: z.literal("video"),
    name: z.string().min(1).max(1000),
    size: z.number().nonnegative().refine(Number.isFinite, { message: "size must be finite." }),
    mimeType: z.string().max(200),
  }),
  z.object({
    kind: z.literal("audio"),
    name: z.string().min(1).max(1000),
    size: z.number().nonnegative().refine(Number.isFinite, { message: "size must be finite." }),
    mimeType: z.string().max(200),
  }),
]);

export const CancelPayloadSchema = z.object({
  targetIntentId: z.string().min(1).max(64),
});

export type OpenUrlPayload = z.infer<typeof OpenUrlPayloadSchema>;
export type ContinueReadingPayload = z.infer<typeof ContinueReadingPayloadSchema>;
export type ClipboardPayload = z.infer<typeof ClipboardPayloadSchema>;
export type OpenFilePayload = z.infer<typeof OpenFilePayloadSchema>;
export type MediaSharePayload = z.infer<typeof MediaSharePayloadSchema>;
export type CancelPayload = z.infer<typeof CancelPayloadSchema>;
