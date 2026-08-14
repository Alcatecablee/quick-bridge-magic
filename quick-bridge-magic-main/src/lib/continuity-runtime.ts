// ContinuityRuntime: the distributed intent pipeline for Phase 3.
//
// Architecture findings incorporated:
//   1  - FIFO serial queue for serial intents; parallel intents run concurrently.
//   2  - Executor concurrency: serial / parallel / replace-existing enforced here.
//   3  - Single Map<intentId, RuntimeIntent> store owns timers, ACKs, status.
//   4  - Cancellation: executor.cancellable drives AbortController lifecycle.
//   5  - Idempotency: duplicate intentId replays the previous ACK instead of dropping.
//   6  - Session-scoped: teardown() clears runtime state; IntentLog (localStorage) survives.
//   7  - Version check on every received intent.
//   8  - executor.canExecute() called at execution time, not from cached presence.
//   9  - Seen-set retained until teardown().
//  10  - Clock skew tolerance of 60 s on receiver expiry check.
//  11  - getDebugState() exposes per-intent observability data.
//  12  - Error-to-retry policy surfaced via INTENT_RETRY_POLICY.
//  13  - Every executor exception is caught; runtime continues.
//  14  - Payload size checked before serialization (sender) and before execution (receiver).
//  15  - Transport injected; runtime never imports use-webrtc.ts directly.
//  16  - Executor lookup via registry; no switch statements.
//  17  - (Testing strategy documented in docs/PHASE3_ARCHITECTURE.md.)
//
// No em dashes anywhere in this file.

import type { IntentTransport } from "./continuity-executor";
import {
  ExecutorRegistry,
  openUrlExecutor,
  continueReadingExecutor,
  clipboardExecutor,
  cancelExecutor,
  FileExecutor,
  MediaExecutor,
} from "./continuity-executor";
import {
  CLOCK_SKEW_TOLERANCE_MS,
  INTENT_ACK_TIMEOUT_MS,
  INTENT_DEFAULT_TTL_MS,
  INTENT_ENVELOPE_VERSION,
  INTENT_LOG_KEY,
  INTENT_LOG_MAX,
  INTENT_ORDERING,
  INTENT_RETRY_POLICY,
  MAX_INTENT_PAYLOAD_BYTES,
  RATE_LIMIT_MAX_INTENTS,
  RATE_LIMIT_WINDOW_MS,
  TERMINAL_STATUSES,
  VALID_INTENT_STATUSES,
  type ContinuityIntentType,
  type IntentAck,
  type IntentEnvelope,
  type IntentLogEntry,
  type IntentStatus,
  type RuntimeIntent,
} from "./continuity-types";
import {
  INTENT_CAPABILITY_MAP,
  getPermission,
} from "./continuity-permissions";
import { trackContinuityAction } from "./analytics";

export type { IntentTransport };

// Module-level counter used as last-resort uniqueness in generateId().
let _idCounter = 0;

// Returns the UTF-8 byte length of a JSON string.
// String.prototype.length counts UTF-16 code units, which underestimates
// CJK / emoji content by 2-4x. TextEncoder gives the true byte count that
// the DataChannel will transmit. (OPT-3 fix)
function byteLength(json: string): number {
  try {
    return new TextEncoder().encode(json).length;
  } catch {
    // TextEncoder is universal in all target environments but guard anyway.
    return json.length;
  }
}

// Pending intent stored in sessionStorage so DevicesPanel can hand off
// to Session.tsx across the one-click connect navigation.
export const PENDING_INTENT_KEY_PREFIX = "qb:ci:";

export interface PendingIntent {
  type: ContinuityIntentType;
  payload: unknown;
  targetNodeId: string;
  targetNickname: string;
}

export class ContinuityRuntime {
  private readonly transport: IntentTransport;
  private readonly localNodeId: string;

  // Single store for all in-flight intents (finding 3).
  private readonly activeIntents = new Map<string, RuntimeIntent>();

  // Completed intent cache for idempotency replays (max 120s TTL).
  private readonly completedIntents = new Map<string, { ack: IntentAck; completedAt: number; timer: ReturnType<typeof setTimeout> }>();

  // Seen-set retained until teardown() (finding 9).
  private readonly seenIntentIds = new Set<string>();

  // Serial FIFO queue for intents whose type has ordering = "serial" (finding 1).
  private serialQueue: Promise<void> = Promise.resolve();

  // Sliding-window rate limiter: records timestamps of received intents within
  // the last RATE_LIMIT_WINDOW_MS. Caps a compromised peer at RATE_LIMIT_MAX_INTENTS
  // per window. (C-2 fix: rate limiter was documented but never implemented)
  private readonly incomingTimestamps: number[] = [];

  private readonly sessionId: string;
  private readonly executorRegistry: ExecutorRegistry;

  constructor(
    transport: IntentTransport,
    localNodeId: string,
    sessionId: string,
    transferService?: import("./continuity-file-transfer").FileTransferService
  ) {
    this.transport = transport;
    this.localNodeId = localNodeId;
    this.sessionId = sessionId;
    
    this.executorRegistry = new ExecutorRegistry();
    this.executorRegistry.register(openUrlExecutor);
    this.executorRegistry.register(continueReadingExecutor);
    this.executorRegistry.register(clipboardExecutor);
    this.executorRegistry.register(cancelExecutor);
    
    if (transferService) {
      this.executorRegistry.register(new FileExecutor(transferService));
      this.executorRegistry.register(new MediaExecutor(transferService));
    }
  }

  // Call on session teardown (DataChannel close). Clears runtime state only;
  // IntentLog in localStorage survives (finding 6).
  teardown(): void {
    for (const ri of this.activeIntents.values()) {
      if (ri.timer) clearTimeout(ri.timer);
      if (ri.abortController) ri.abortController.abort();
    }
    for (const cache of this.completedIntents.values()) {
      clearTimeout(cache.timer);
    }
    this.completedIntents.clear();
    this.activeIntents.clear();
    this.seenIntentIds.clear();
    // Reset the serial queue so accumulated .then() closures from serial intents
    // can be garbage-collected. Without this, the chain grows unbounded over a
    // long session. (GAP-7 fix)
    this.serialQueue = Promise.resolve();
    // Rate-limit timestamps are session-scoped; clear on teardown.
    this.incomingTimestamps.length = 0;
  }

  // Exposed for lifecycle testing so the test suite can inject mock executors
  // without modifying the production registry pattern.
  registerTestExecutor(executor: import("./continuity-executor").IntentExecutor): void {
    this.executorRegistry.register(executor);
  }

  // --- Sender side ---

  // Dispatch an intent to a trusted peer over the DataChannel.
  // Checks payload size, transport connectivity, starts ACK timeout.
  dispatchIntent(
    type: ContinuityIntentType,
    targetNodeId: string,
    targetNickname: string,
    payload: unknown,
    onAckUpdate?: (ack: IntentAck, retryable: boolean) => void,
  ): void {
    // Payload size check before serialization (finding 14).
    // byteLength() uses TextEncoder for accurate UTF-8 byte count. String.length
    // underestimates CJK/emoji by 2-4x. (OPT-3 fix)
    const payloadJson = JSON.stringify(payload);
    const maxBytes = MAX_INTENT_PAYLOAD_BYTES[type] ?? 64 * 1024;
    if (byteLength(payloadJson) > maxBytes) {
      onAckUpdate?.(
        {
          intentId: "",
          status: "failed",
          reasonCode: "PAYLOAD_TOO_LARGE",
          reasonMessage: `Payload too large for "${type}".`,
        },
        false,
      );
      return;
    }

    if (!this.transport.connected()) {
      onAckUpdate?.(
        {
          intentId: "",
          status: "failed",
          reasonCode: "EXECUTION_FAILED",
          reasonMessage: "Device is offline.",
        },
        true,
      );
      return;
    }

    const intentId = this.generateId();
    const now = Date.now();
    const ttlMs = INTENT_DEFAULT_TTL_MS[type] ?? 120_000;

    const envelope: IntentEnvelope = {
      version: INTENT_ENVELOPE_VERSION,
      intentId,
      sessionId: this.sessionId,
      type,
      senderNodeId: this.localNodeId,
      targetNodeId,
      payload,
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    const ri: RuntimeIntent = {
      envelope,
      status: "received",
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      timer: null,
      abortController: null,
      onAckUpdate,
      targetNickname,
      timeline: [],   // C-1 fix: required field; populated by observability hooks
    };

    this.activeIntents.set(intentId, ri);

    // ACK timeout (finding 3 - timer lives in the RuntimeIntent store).
    ri.timer = setTimeout(() => {
      const current = this.activeIntents.get(intentId);
      if (!current) return;
      // Guard: if the intent already reached a terminal status via a real ACK,
      // the timeout fires but there is nothing left to do.
      if (TERMINAL_STATUSES.has(current.status)) return;
      this.activeIntents.delete(intentId);
      const timeoutAck: IntentAck = {
        intentId,
        status: "failed",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage: `Did not reach ${targetNickname}.`,
      };
      current.onAckUpdate?.(timeoutAck, true);
      this.writeIntentLog({
        intentId,
        type,
        direction: "sent",
        targetNodeId,
        targetNickname,
        createdAt: now,
        status: "failed",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage: "ACK timeout.",
        completedAt: Date.now(),
      });
    }, INTENT_ACK_TIMEOUT_MS);

    try {
      this.transport.sendIntent(envelope);
    } catch {
      clearTimeout(ri.timer);
      ri.timer = null;
      this.activeIntents.delete(intentId);
      onAckUpdate?.(
        {
          intentId,
          status: "failed",
          reasonCode: "EXECUTION_FAILED",
          reasonMessage: "Transport error.",
        },
        true,
      );
    }
  }

  // Handle an ACK from the remote peer (sender side).
  handleIncomingAck(ack: IntentAck): void {
    const ri = this.activeIntents.get(ack.intentId);
    // Silently discard unknown or already-resolved intentIds (security invariant).
    if (!ri) return;

    // Reject ACKs with unrecognised status values from mismatched peer versions.
    // Silently dropping prevents unknown future statuses from reaching business logic.
    if (!VALID_INTENT_STATUSES.has(ack.status)) return;

    // Guard against backward transitions: if the intent is already in a terminal
    // state, any further ACK (e.g. a duplicate, a late arrival after reconnect)
    // is discarded. TERMINAL_STATUSES is the authoritative set. (Part II state machine)
    if (TERMINAL_STATUSES.has(ri.status)) return;

    const now = Date.now();
    ri.ackReceivedAt = ri.ackReceivedAt ?? now;
    ri.status = ack.status;
    ri.updatedAt = now;

    if (ack.status === "received" || ack.status === "accepted") {
      // Two-ACK model: informational; keep timer running for the completion ACK.
      // Extend the timer for "accepted" since execution may take longer.
      if (ack.status === "accepted" && ri.timer) {
        clearTimeout(ri.timer);
        // GAP-2 fix: the extended "accepted" timer must fire with a callback,
        // log entry, and analytics — not just a silent Map.delete. Without this,
        // if the connection drops after "accepted" but before "completed", the
        // sender's UI freezes on the accepted state with no feedback.
        ri.timer = setTimeout(() => {
          const current = this.activeIntents.get(ack.intentId);
          if (!current) return;
          this.activeIntents.delete(ack.intentId);
          const timeoutAck: IntentAck = {
            intentId: ack.intentId,
            status: "failed",
            reasonCode: "EXECUTION_FAILED",
            reasonMessage: `${current.targetNickname ?? "Device"} accepted but did not complete in time.`,
          };
          current.onAckUpdate?.(timeoutAck, true);
          trackContinuityAction(current.envelope.type, "failed");
          this.writeIntentLog({
            intentId: ack.intentId,
            type: current.envelope.type,
            direction: "sent",
            targetNodeId: current.envelope.targetNodeId,
            targetNickname: current.targetNickname ?? "",
            createdAt: current.createdAt,
            status: "failed",
            reasonCode: "EXECUTION_FAILED",
            reasonMessage: "Accepted but did not complete in time.",
            completedAt: Date.now(),
          });
        }, INTENT_ACK_TIMEOUT_MS);
      }
      return;
    }

    // Terminal status: clear timer and store.
    if (ri.timer) { clearTimeout(ri.timer); ri.timer = null; }
    this.activeIntents.delete(ack.intentId);

    const retryable =
      ack.reasonCode != null
        ? INTENT_RETRY_POLICY[ack.reasonCode] === "yes"
        : false;

    ri.completedAt = Date.now();

    if (ack.status === "completed") {
      trackContinuityAction(ri.envelope.type, "completed");
    } else {
      trackContinuityAction(ri.envelope.type, ack.status);
    }

    this.writeIntentLog({
      intentId: ack.intentId,
      type: ri.envelope.type,
      direction: "sent",
      targetNodeId: ri.envelope.targetNodeId,
      targetNickname: ri.targetNickname ?? "",
      createdAt: ri.createdAt,
      status: ack.status,
      reasonCode: ack.reasonCode,
      reasonMessage: ack.reasonMessage,
      completedAt: ri.completedAt,
      ackLatencyMs:
        ri.ackReceivedAt != null ? ri.ackReceivedAt - ri.createdAt : undefined,
    });

    // Stored callback from dispatchIntent surfaces terminal ACKs to caller
    // (e.g. Session.tsx for toast messages).
    ri.onAckUpdate?.(ack, retryable);
  }

  // --- Receiver side ---

  // Handle an incoming intent from a trusted peer.
  // senderNodeId and senderNickname come from the verified session context,
  // NOT from the envelope, so they cannot be spoofed.
  handleIncomingIntent(
    envelope: IntentEnvelope,
    senderNodeId: string,
    senderNickname: string,
  ): void {
    // Version check (finding 7).
    if (envelope.version !== INTENT_ENVELOPE_VERSION) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "unsupported",
        reasonCode: "UNSUPPORTED_VERSION",
        reasonMessage: `This device only understands intent version ${INTENT_ENVELOPE_VERSION}.`,
      });
      return;
    }

    // Reject stale intents from previous sessions or other bridges.
    if (envelope.sessionId !== this.sessionId) {
      // Intentionally do not send an ACK, as the sender is presumably on a different session.
      return;
    }

    // Rate limit: sliding window over the last RATE_LIMIT_WINDOW_MS.
    // Evict timestamps outside the window, then reject if the count is at cap.
    // Evaluated BEFORE deduplication so attackers cannot bypass rate limits by
    // spamming unique IDs.
    const nowForLimit = Date.now();
    const windowStart = nowForLimit - RATE_LIMIT_WINDOW_MS;
    let trimIdx = 0;
    while (
      trimIdx < this.incomingTimestamps.length &&
      this.incomingTimestamps[trimIdx] < windowStart
    ) {
      trimIdx++;
    }
    this.incomingTimestamps.splice(0, trimIdx);

    // Idempotency: duplicate intentId replays the previous ACK (finding 5).
    // Note: Deduplication does not consume a rate limit token.
    if (this.seenIntentIds.has(envelope.intentId)) {
      const active = this.activeIntents.get(envelope.intentId);
      if (active?.lastAck) {
        this.transport.sendAck(active.lastAck);
        return;
      }
      const completed = this.completedIntents.get(envelope.intentId);
      if (completed) {
        this.transport.sendAck(completed.ack);
        return;
      }
      return;
    }

    if (this.incomingTimestamps.length >= RATE_LIMIT_MAX_INTENTS) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "failed",
        reasonCode: "RATE_LIMITED",
        reasonMessage: "Too many intents received. Please wait before sending more.",
      });
      return;
    }
    this.incomingTimestamps.push(nowForLimit);

    this.seenIntentIds.add(envelope.intentId);

    // Expiry check with clock skew tolerance (finding 10).
    const now = Date.now();
    if (now > envelope.expiresAt + CLOCK_SKEW_TOLERANCE_MS) {
      const expiredAck: IntentAck = {
        intentId: envelope.intentId,
        status: "expired",
        reasonCode: "INTENT_EXPIRED",
        reasonMessage: "Intent arrived after its expiry window.",
      };
      this.transport.sendAck(expiredAck);
      return;
    }

    // Payload size check on receiver side (finding 14).
    // byteLength() measures UTF-8 bytes, not JS String.length (UTF-16 code units).
    const payloadJson = JSON.stringify(envelope.payload);
    const maxBytes =
      MAX_INTENT_PAYLOAD_BYTES[envelope.type] ?? 64 * 1024;
    if (byteLength(payloadJson) > maxBytes) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "failed",
        reasonCode: "PAYLOAD_TOO_LARGE",
        reasonMessage: "Payload exceeds the allowed size for this intent.",
      });
      return;
    }

    // Executor lookup via registry - no switch statement (finding 16).
    const executor = this.executorRegistry.get(envelope.type);
    if (!executor) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "unsupported",
        reasonCode: "CAPABILITY_UNAVAILABLE",
        reasonMessage: `Intent type "${envelope.type}" is not supported on this device.`,
      });
      return;
    }

    // Capability check at execution time, not from cached presence (finding 8).
    if (!executor.canExecute(envelope)) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "unsupported",
        reasonCode: "CAPABILITY_UNAVAILABLE",
        reasonMessage: `This device cannot execute "${envelope.type}" right now.`,
      });
      return;
    }

    // Schema validation (finding 13 - throw caught here, not in executor).
    try {
      executor.validate(envelope);
    } catch (err) {
      this.transport.sendAck({
        intentId: envelope.intentId,
        status: "failed",
        reasonCode: "INVALID_PAYLOAD",
        reasonMessage:
          err instanceof Error ? err.message : "Invalid payload.",
      });
      return;
    }

    // Permission check.
    const requiredCap = INTENT_CAPABILITY_MAP[envelope.type];
    const permission = requiredCap
      ? getPermission(senderNodeId, requiredCap)
      : "always";

    // Send "received" ACK immediately so sender knows it arrived.
    const receivedAck: IntentAck = {
      intentId: envelope.intentId,
      status: "received",
    };
    this.transport.sendAck(receivedAck);

    const ri: RuntimeIntent = {
      envelope,
      status: "received",
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      timer: null,
      abortController: null,
      lastAck: receivedAck,
      timeline: [],   // C-1 fix: required field initialised; Milestone E appends events
    };
    this.activeIntents.set(envelope.intentId, ri);

    if (permission === "never") {
      const deniedAck: IntentAck = {
        intentId: envelope.intentId,
        status: "permission-denied",
        reasonCode: "PERMISSION_DENIED",
        reasonMessage: `${senderNickname} is not allowed to use this feature on your device.`,
      };
      ri.lastAck = deniedAck;
      this.transport.sendAck(deniedAck);
      this.activeIntents.delete(envelope.intentId);
      return;
    }

    if (permission === "ask") {
      // GAP-1: "ask" currently falls through to execute (treating it as "always")
      // until Milestone E adds the inline permission-prompt component.
      // The permission model (getPermission/setPermission) is fully wired; only
      // the UI prompt is deferred. Record when the wait would have started so
      // getDebugState() reports an accurate permissionWait metric once the prompt
      // is live. (GAP-6 fix: permissionWaitStartedAt was never written)
      ri.permissionWaitStartedAt = Date.now();
      if (import.meta.env.DEV) {
        // Visible in dev tools so this is never accidentally shipped without review.
        console.warn(
          "[QB] Continuity: permission prompt not yet implemented (Milestone E). " +
          `Executing "${envelope.type}" silently. Remove before Phase 3 public launch.`,
        );
      }
    }

    // Enqueue based on ordering policy (finding 1).
    const ordering = INTENT_ORDERING[envelope.type] ?? "serial";
    const executeNow = async () => {
      await this.executeIntent(envelope, ri, senderNodeId, senderNickname);
    };

    if (ordering === "serial") {
      this.serialQueue = this.serialQueue.then(executeNow, executeNow);
    } else {
      void executeNow();
    }
  }

  // --- Private execution ---

  private async executeIntent(
    envelope: IntentEnvelope,
    ri: RuntimeIntent,
    senderNodeId: string,
    senderNickname: string,
  ): Promise<void> {
    // Bail out if the intent was already resolved (race with teardown).
    if (!this.activeIntents.has(envelope.intentId)) return;

    const executor = this.executorRegistry.get(envelope.type);
    if (!executor) return;

    // replace-existing: abort any in-flight intents of the same type (finding 2).
    // BUG-4 fix: the displaced intent's sender is still waiting on an ACK timer.
    // Send a "cancelled" ACK so their timer fires immediately with the right status
    // rather than timing out after the full INTENT_ACK_TIMEOUT_MS window.
    if (executor.concurrency === "replace-existing") {
      for (const [id, existing] of this.activeIntents) {
        if (id !== envelope.intentId && existing.envelope.type === envelope.type && existing.envelope.createdAt < envelope.createdAt) {
          if (existing.abortController) existing.abortController.abort();
          const cancelledAck: IntentAck = {
            intentId: id,
            status: "cancelled",
            reasonCode: "CANCELLED",
            reasonMessage: "Replaced by a newer intent.",
          };
          try { this.transport.sendAck(cancelledAck); } catch {}
          existing.onAckUpdate?.(cancelledAck, false);
          this.activeIntents.delete(id);
        }
      }
    }

    ri.executionStartedAt = Date.now();
    ri.status = "accepted";
    ri.updatedAt = ri.executionStartedAt;

    const ac = executor.cancellable ? new AbortController() : null;
    ri.abortController = ac;

    const acceptedAck: IntentAck = {
      intentId: envelope.intentId,
      status: "accepted",
    };
    ri.lastAck = acceptedAck;
    this.transport.sendAck(acceptedAck);

    // Cancel protocol interception (finding 4).
    // The cancel executor is a no-op that just returns completed. The actual cancellation
    // must be performed by the runtime here before executor runs.
    if (envelope.type === "cancel") {
      const targetIntentId = (envelope.payload as any)?.targetIntentId;
      if (typeof targetIntentId === "string") {
        const target = this.activeIntents.get(targetIntentId);
        if (target && target.abortController) {
          target.abortController.abort();
          const cancelledAck: IntentAck = {
            intentId: targetIntentId,
            status: "cancelled",
            reasonCode: "CANCELLED",
            reasonMessage: "Cancelled by remote device.",
          };
          try { this.transport.sendAck(cancelledAck); } catch {}
          target.onAckUpdate?.(cancelledAck, false);
          this.activeIntents.delete(targetIntentId);
        }
      }
    }

    let result: {
      status: "completed" | "failed" | "requires-user-action";
      reasonCode?: import("./continuity-types").IntentErrorCode;
      reasonMessage?: string;
    };

    // Executor isolation (finding 13) + Timeout enforcement.
    try {
      const execPromise = executor.execute(envelope, ac?.signal ?? undefined);
      const timeoutPromise = new Promise<{ status: "failed"; reasonCode: "EXECUTION_FAILED"; reasonMessage: string }>((_, reject) => {
        setTimeout(() => reject(new Error("Executor timed out after 30 seconds.")), 30_000);
      });
      result = await Promise.race([execPromise, timeoutPromise]);
    } catch (err) {
      result = {
        status: "failed",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage:
          err instanceof Error ? err.message : "Unknown execution error.",
      };
    }

    // Bail if teardown ran during async execution.
    if (!this.activeIntents.has(envelope.intentId)) return;

    ri.completedAt = Date.now();
    ri.status = result.status as import("./continuity-types").IntentStatus;
    ri.updatedAt = ri.completedAt;

    const finalAck: IntentAck = {
      intentId: envelope.intentId,
      status: result.status,
      reasonCode: result.reasonCode,
      reasonMessage: result.reasonMessage,
    };
    ri.lastAck = finalAck;
    this.transport.sendAck(finalAck);

    this.activeIntents.delete(envelope.intentId);
    
    // Idempotency replay cache (120s TTL)
    const timer = setTimeout(() => {
      this.completedIntents.delete(envelope.intentId);
    }, 120_000);
    this.completedIntents.set(envelope.intentId, {
      ack: finalAck,
      completedAt: ri.completedAt,
      timer
    });

    // GAP-4 fix: for received intents, targetNickname should be the local device
    // name (we are the target), and senderNickname records who sent it.
    // The runtime does not hold the local nickname, so targetNickname is left
    // empty here; Milestone E can populate it from the DeviceName context.
    // The critical correction is moving the sender's name to senderNickname so
    // "Recent Actions" renders "Pasted from [peer]" rather than "Pasted on [peer]".
    this.writeIntentLog({
      intentId: envelope.intentId,
      type: envelope.type,
      direction: "received",
      targetNodeId: envelope.targetNodeId,
      targetNickname: "",           // local device (not available in runtime)
      senderNickname,               // who sent this intent — now correctly placed
      createdAt: envelope.createdAt,
      status: result.status,
      reasonCode: result.reasonCode as import("./continuity-types").IntentErrorCode | undefined,
      reasonMessage: result.reasonMessage,
      completedAt: ri.completedAt,
      executionMs:
        ri.executionStartedAt != null
          ? ri.completedAt - ri.executionStartedAt
          : undefined,
    });
  }

  // --- Observability (finding 11) ---

  getDebugState(): {
    intentId: string;
    type: string;
    status: IntentStatus;
    retryCount: number;
    ackLatencyMs?: number;
    executionMs?: number;
    permissionWait?: number;
  }[] {
    return Array.from(this.activeIntents.values()).map((ri) => ({
      intentId: ri.envelope.intentId,
      type: ri.envelope.type,
      status: ri.status,
      retryCount: ri.retryCount,
      ackLatencyMs:
        ri.ackReceivedAt != null
          ? ri.ackReceivedAt - ri.createdAt
          : undefined,
      executionMs:
        ri.completedAt != null && ri.executionStartedAt != null
          ? ri.completedAt - ri.executionStartedAt
          : undefined,
      permissionWait:
        ri.permissionWaitStartedAt != null
          ? Date.now() - ri.permissionWaitStartedAt
          : undefined,
    }));
  }

  // --- Intent log ---

  private writeIntentLog(entry: IntentLogEntry): void {
    try {
      const raw = localStorage.getItem(INTENT_LOG_KEY);
      const log: IntentLogEntry[] = raw
        ? (JSON.parse(raw) as IntentLogEntry[])
        : [];
      log.push(entry);
      if (log.length > INTENT_LOG_MAX) {
        log.splice(0, log.length - INTENT_LOG_MAX);
      }
      const serialised = JSON.stringify(log);
      try {
        localStorage.setItem(INTENT_LOG_KEY, serialised);
      } catch {
        // GAP-9 fix: quota exceeded — aggressively evict half the log and retry.
        // Silently giving up permanently would break analytics and Recent Actions.
        const trimmed = log.slice(Math.floor(log.length / 2));
        try {
          localStorage.setItem(INTENT_LOG_KEY, JSON.stringify(trimmed));
        } catch {
          // Still failing (e.g. private browsing with no storage): clear entirely
          // so future writes have a chance. The existing log is lost but the
          // alternative is permanent silence.
          try { localStorage.removeItem(INTENT_LOG_KEY); } catch {}
        }
      }
    } catch {
      // JSON.parse or localStorage.getItem failed (corrupted or unavailable storage).
      // Do not propagate: a log failure must never interrupt intent execution.
    }
  }

  static readIntentLog(): IntentLogEntry[] {
    try {
      const raw = localStorage.getItem(INTENT_LOG_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as IntentLogEntry[];
    } catch {
      return [];
    }
  }

  // --- Helpers ---

  private generateId(): string {
    // Prefer randomUUID (available everywhere QuickBridge runs).
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 21);
    }
    // OPT-4 fix: use getRandomValues instead of Math.random() for the fallback.
    // Math.random() is not cryptographically secure; intentId collision resistance
    // requires unpredictability. getRandomValues provides both at no extra cost.
    // Cast through globalThis.crypto to avoid the TypeScript control-flow narrowing
    // that collapses the crypto type to 'never' after the randomUUID branch above.
    const globalCrypto = globalThis.crypto as Crypto | undefined;
    if (globalCrypto?.getRandomValues) {
      const bytes = globalCrypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, (b: number) => b.toString(16).padStart(2, "0")).join("").slice(0, 21);
    }
    // Last resort for very old runtimes: timestamp + process-unique counter.
    // Not secure, but collision risk is negligible in practice.
    return `${Date.now().toString(36)}${(++_idCounter).toString(36)}`.slice(0, 21);
  }
}
