---
name: Continuity Phase 3 implementation
description: Key decisions and constraints from the Phase 3 distributed intent runtime build.
---

# Phase 3 Continuity implementation notes

## Files created
- `src/lib/continuity-types.ts` -- all types, Zod schemas, constants (INTENT_ENVELOPE_VERSION=1, CLOCK_SKEW_TOLERANCE_MS=60000, ACK_TIMEOUT=10000)
- `src/lib/continuity-permissions.ts` -- per-capability per-nodeId permissions in localStorage keyed `qb:perm:<nodeId>`
- `src/lib/continuity-executor.ts` -- IntentTransport interface, IntentExecutor interface, ExecutorRegistry singleton, OpenUrl/ContinueReading/Clipboard executors registered
- `src/lib/continuity-runtime.ts` -- ContinuityRuntime class (session-scoped; IntentLog in localStorage survives refresh)

## Files modified
- `src/lib/trusted-nodes-db.ts` -- Capability union now includes `"browser.open" | "filesystem.write" | "notifications"`
- `src/lib/capabilities.ts` -- detectLocalCapabilities adds browser.open (always), filesystem.write (showSaveFilePicker), notifications (Notification in window); VALID_CAPS updated
- `src/lib/analytics.ts` -- added `trackContinuityAction(intentType, ackStatus)` event
- `src/hooks/use-webrtc.ts` -- two new optional positional params at end: `onContinuityIntent` and `onIntentAck`; two new returns: `sendContinuityIntent` and `sendIntentAck`; handles `"continuity-intent"` and `"intent-ack"` DataChannel message types
- `src/components/quickbridge/Session.tsx` -- instantiates ContinuityRuntime when peerTrustVerified; dispatches pending intents from sessionStorage; shows toast on terminal ACKs
- `src/components/quickbridge/DevicesPanel.tsx` -- "Send tab" and "Paste on" action buttons; stores PendingIntent in sessionStorage before connect; CAP_LABELS updated

## Key design decisions (17 staff-engineer review findings)

1. FIFO serial queue per sender/receiver pair for serial intents; parallel intents bypass the queue
2. ExecutorConcurrency: serial / parallel / replace-existing per executor (clipboard uses replace-existing)
3. Single Map<intentId, RuntimeIntent> owns timers, ACKs, onAckUpdate, status
4. AbortController created per executor only when executor.cancellable=true
5. Duplicate intentId replays the previous lastAck instead of re-executing
6. Runtime is session-scoped (refresh clears it); IntentLog in localStorage (`qb:intentLog`, 100 entries FIFO) survives
7. INTENT_ENVELOPE_VERSION=1; receiver sends UNSUPPORTED_VERSION for unknown versions
8. executor.canExecute() called at execution time, not from cached presence
9. Seen-set retained until teardown() (DataChannel close); expired intents still recorded
10. Clock skew tolerance: +/- 60 s on receiver expiry check
11. getDebugState() exposes per-intent observability (ackLatencyMs, executionMs, permissionWait)
12. INTENT_RETRY_POLICY maps each IntentErrorCode to no/yes/after-reload
13. All executor exceptions caught in executeIntent; runtime never terminates
14. MAX_INTENT_PAYLOAD_BYTES enforced before serialization (sender) and before execution (receiver)
15. IntentTransport interface injected; runtime never imports use-webrtc.ts directly
16. ExecutorRegistry replaces switch statements; new type = implement + register
17. (Testing strategy: unit test each executor and runtime separately)

## Pending intent flow

DevicesPanel stores `PendingIntent` in sessionStorage at key `qb:ci:<sessionId>` before navigating.
Session.tsx reads and removes it in a `useEffect` gated on `peerTrustVerified`.
SessionStorage is cleared whether dispatch succeeds or fails to prevent stale retry.

## DataChannel wire format

continuity-intent: `{ t: "continuity-intent", version: 1, intentId, type, senderNodeId, targetNodeId, payload, createdAt, expiresAt }`
intent-ack: `{ t: "intent-ack", intentId, status, reasonCode?, reasonMessage? }`

## Known limitations (Milestones D/E not implemented)

- File intent (open-file, media-share) executors not registered -- types and schemas exist
- Permission prompt UI not implemented -- "ask" setting falls through to execute for MVP
- Recent Actions panel (Milestone E) not implemented -- IntentLog is written, just not displayed
- "Paste on" reads local clipboard via navigator.clipboard.readText() -- requires clipboard-read permission on Chrome; Safari may silently fail
