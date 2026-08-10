# Phase 3 Architecture: Continuity

**Internal document. Living file. Update as design decisions settle.**

*See also: ROADMAP.md (phase summary), PRINCIPLES.md, VISION.md*

---

## The principle

**Continuity is intent, not synchronization.**

The user is not thinking "transfer this URL." They are thinking "continue over there."

QuickBridge transmits intent, not just bytes. Every Continuity action is the same question asked in different forms: I have something here, I want it to happen there. The architecture must reflect that uniformity — not five separate features bolted together, but one abstraction instantiated five times.

---

## The closing principle (read this last, but keep it first)

> **The Continuity Runtime is intentionally generic. Every future device cooperation feature — whether clipboard, camera, notifications, AI workloads, or capabilities not yet imagined — should be expressible as a capability, an intent, and an executor flowing through the same pipeline. If a new feature requires a different transport, lifecycle, or execution model, the architecture should be questioned before the feature is built.**

This paragraph protects the architecture from slowly accumulating special cases. If something cannot be expressed as a capability check, a typed intent, and an executor, that is a signal to reconsider the feature — not to add a side channel.

---

## The abstraction

All five Continuity actions reduce to the same pipeline:

```
Trusted Environment
        ↓
   Capability
        ↓
     Intent
        ↓
    Payload
        ↓
   Execution
        ↓
      ACK
```

For example:

```
Environment: Work Laptop
Capability:  browser.open
Payload:     { url: "...", scrollY: 1832, selection: "...", title: "..." }
```

```
Environment: Desktop
Capability:  clipboard.write
Payload:     { text: "Hello" }
```

This is RPC (Remote Procedure Call), not file transfer. The Phase 3 architecture is built accordingly.

---

## The four internal layers

```
Continuity UI
       ↓
Continuity Runtime
       ↓
Capability Router
       ↓
Trusted Channel (existing Phase 2 DataChannel)
       ↓
WebRTC (unchanged)
```

The UI layer never knows about WebRTC. It emits a typed intent and receives an acknowledgement. Everything below is implementation detail.

**Note on naming:** Layer 3 is the Continuity Runtime, not the "Intent Router." It does far more than routing: it dispatches, validates, retries, tracks ACKs, deduplicates, manages timers, and records metrics. A router routes. A runtime orchestrates an entire execution lifecycle.

---

## Layer 1: Continuity Intents

Every action is a typed intent. All intents share the same envelope:

```ts
type ContinuityIntent =
  | OpenUrlIntent
  | ContinueReadingIntent
  | ClipboardIntent
  | OpenFileIntent
  | MediaShareIntent
  | CancelIntent;       // reserved; see intent cancellation section

interface IntentEnvelope {
  version: 1;           // bump when envelope schema changes; never remove
  intentId: string;     // crypto.randomUUID() derived — stable across retries
  type: ContinuityIntent["type"];
  senderNodeId: string; // nodeId of the SENDING device (used by receiver for
                        // permission lookups). Populated by the runtime, not
                        // the UI — cannot be spoofed by a modified payload.
                        // Session.tsx passes peerNodeHello.nodeId to
                        // handleIncomingIntent() independently as a second
                        // verification layer.
  targetNodeId: string; // recipient's nodeId (from trusted-nodes-db)
  payload: unknown;     // typed per intent; validated by schema on receipt
  createdAt: number;    // ms timestamp
  expiresAt: number;    // ms timestamp; per-intent TTL, see expiry policy
}
```

The `version` field costs one integer today and will prevent an unrecoverable mismatch in 18 months. It must be present on every intent from Milestone A onward. When the envelope schema changes, the version increments. Old receivers that do not understand the new version send `UNSUPPORTED_VERSION` and the sender surfaces a "device running older version" message rather than silently failing.

---

## Intent lifecycle

Every intent is in exactly one state at all times. No exceptions.

```
Created
    ↓
Queued            (held in memory; peer may be briefly offline)
    ↓
Sent              (dispatched over DataChannel)
    ↓
Received          (receiver has the message)
    ↓
Validated         (schema, expiry, duplicate check passed)
    ↓
Awaiting Permission  (permission setting is "ask"; waiting for user)
    ↓
Executing
    ↓
Succeeded  OR  Failed
    ↓
Acknowledged      (ACK sent back to originator)
    ↓
Archived          (stored in IntentLog; drives Recent Actions and analytics)
```

The sender tracks: Created, Queued, Sent, and whether an ACK has been received.
The receiver tracks: Received onward.
Both sides emit the `intentId` in every transition so the ACK can be correlated.

Without this lifecycle, every feature invents its own state tracking, retry logic, and error surface. With it, retry UI, history, analytics, and debugging all fall out of the same structure.

---

## Layer 2: Capability Registry

The UI is self-configuring. Actions are only shown when the peer advertises the required capability. No hardcoded `if (phone)` or `if (desktop)` branches.

### Capability map

| Capability | Enabled actions |
|---|---|
| `browser.open` | Send this tab, Continue reading |
| `clipboard.write` | Paste on |
| `filesystem.write` | Open file, Move photo |
| `camera` | Request camera |
| `notifications` | Background notifications |

Phase 2.5 already broadcasts `capabilities` in every presence payload and exposes them as `peerCapabilities: ReadonlyMap<string, Capability[]>` from `usePresence`. Phase 3 extends the `Capability` type in `trusted-nodes-db.ts` to cover the full set and adds `browser.open`, `filesystem.write`, and `notifications` to `detectLocalCapabilities()`.

**The DevicesPanel action surface is driven entirely by `peerCapabilities`. If a capability is not in the peer's presence payload, the action does not appear. No exceptions.**

### Capability versioning

Capabilities evolve. Plan for it from the start rather than retrofitting later.

Two options are acceptable:

**Feature flags on the capability:**

```ts
interface CapabilityDescriptor {
  name: "browser.open";
  features?: string[];  // e.g. ["scroll", "selection"]
}
```

**Dotted versioning:**

```
browser.open.v2
```

The current Phase 3 implementation should use feature flags (`features` array) since they are additive and backward-compatible. A receiver that sees `browser.open` without `features` treats it as the baseline capability. A receiver that sees `features: ["selection"]` knows the sender can restore scroll position and highlighted text.

### Capability refresh

Capabilities can change mid-session. A user may revoke filesystem or clipboard permission while the app is open.

The current Phase 2.5 implementation re-announces capabilities on every `trackSelf()` call, which fires on `visibilitychange`, network reconnect, and channel rebuild. This is sufficient for most cases.

For the edge case of a mid-session permission revocation without a visibility event: `detectLocalCapabilities()` should be called at dispatch time (not only at mount), and if the resulting capability set differs from what was last broadcast, `trackSelf()` should be called immediately to update the peer's view. The UI then hides the action that requires the revoked capability without a page reload.

---

## Continuity Runtime (Layer 3)

One dispatch function, not five:

```ts
async function dispatchIntent(intent: IntentEnvelope): Promise<void>
```

The runtime is responsible for:

- Serialising the intent to JSON
- Sending it over the trusted DataChannel (`msg.t = "continuity-intent"`)
- Starting an ACK timeout timer keyed by `intentId`
- Resolving the promise when an ACK arrives (any status)
- Surfacing a failure message on timeout

```
serialize intent
        ↓
send over DataChannel
        ↓
start ACK timeout (intentId → timer)
        ↓
on ACK received:   clear timer, update UI, write to IntentLog
on timeout:        surface "did not reach <device>" toast, write to IntentLog
```

The runtime lives in `src/lib/continuity-runtime.ts`. It does not import from `use-webrtc.ts` directly. It receives an `IntentTransport` interface at construction time:

```ts
interface IntentTransport {
  sendIntent(envelope: IntentEnvelope): void;
  sendAck(ack: IntentAck): void;
  connected(): boolean;
}
```

Session.tsx builds the concrete transport inline from the `sendContinuityIntent` / `sendIntentAck` functions returned by `useWebRTC`. The runtime never knows or cares that the underlying channel is WebRTC. A future native app, WebTransport, or LAN socket can supply a different transport without touching the runtime.

### Intent store

The runtime owns a single `Map<intentId, RuntimeIntent>`. Every timer, status, abort controller, ACK callback, and observability timestamp lives inside one `RuntimeIntent` entry. There is no second store, no parallel array, no React state. The map is the single source of truth for every in-flight intent.

```ts
interface RuntimeIntent {
  envelope: IntentEnvelope;
  status: IntentStatus;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  timer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
  ackReceivedAt?: number;
  executionStartedAt?: number;
  completedAt?: number;
  lastAck?: IntentAck;          // idempotency: replay on duplicate intentId
  onAckUpdate?: (ack: IntentAck, retryable: boolean) => void;
  targetNickname?: string;      // for error messages
}
```

### Ordering and concurrency

Every intent type declares an ordering policy (`"serial"` or `"parallel"`) and a concurrency contract (`"serial"`, `"parallel"`, or `"replace-existing"`):

- **serial** intents enter a FIFO async queue. They run one at a time per sender/receiver pair. Clipboard and URL intents are serial.
- **parallel** intents bypass the queue and run concurrently. File and media intents are parallel.
- **replace-existing** intents cancel any in-flight intent of the same type before running. Clipboard paste uses this so the latest clipboard text always wins.

### Executor cancellation

Each executor declares `cancellable: boolean`. When `true`, the runtime creates an `AbortController` and passes `signal` to `execute()`. When the runtime tears down mid-execution (DataChannel close) or a `replace-existing` executor preempts the current one, the signal fires. Instantaneous executors (URL open, clipboard write) declare `cancellable: false`.

### Payload size limits

`MAX_INTENT_PAYLOAD_BYTES` is enforced in two places: once on the sender before serializing the envelope, and once on the receiver before passing the payload to the executor. Both checks return `PAYLOAD_TOO_LARGE` on failure. This prevents an oversized payload from reaching the executor even if the sender check is bypassed.

### Analytics hook

Analytics calls do not belong in executor code. The runtime emits a structured event after every lifecycle transition and the analytics layer listens:

```
Intent
    ↓
Continuity Runtime
    ↓
Analytics Hook (one location)
    ↓
GA: continuity_action_dispatched { intent_type, ack_status }
```

No `gtag()` calls inside executors or UI components. If the analytics destination changes, one file changes.

---

## ACK protocol

Every intent gets an acknowledgement. Never fire-and-forget.

### Two acknowledgements, not one

There is an important distinction between *received* and *executed*:

```
Sender                        Receiver
  |                               |
  |-- continuity-intent --------> |  state: Received
  |                    validate   |  state: Validated
  |                  permission?  |  state: Awaiting Permission
  | <-- ACK (received) -----------|
  |                   ...user acts on permission prompt (may take minutes)
  |                    execute    |  state: Executing
  | <-- ACK (completed) ----------|  state: Succeeded
  |                               |
  UI: "Opened on Work Laptop"
```

Without the two-ACK model, an intent that is received but sitting behind a permission prompt appears successful to the sender, who then wonders why nothing happened.

### ACK message

```ts
interface IntentAck {
  intentId: string;
  status: IntentStatus;
  reasonCode?: IntentErrorCode;   // machine-readable; see error taxonomy
  reasonMessage?: string;         // human-readable; shown in toast on failure
}

type IntentStatus =
  | "received"          // message arrived; validation passed; may be awaiting permission
  | "accepted"          // permission granted; execution beginning
  | "completed"         // execution succeeded
  | "failed"            // execution attempted and failed
  | "expired"           // arrived after expiresAt
  | "cancelled"         // CancelIntent received before execution completed
  | "permission-denied" // permission setting is "never", or user dismissed prompt
  | "unsupported";      // version mismatch or unknown capability
```

The sender holds a `Map<intentId, { timer, resolve }>`. On any ACK: update the UI to reflect the specific status. On `completed`: show "Opened on Work Laptop." On `permission-denied`: show "Denied on [device]." On `unsupported`: show "Ask [device] to reload QuickBridge." On timeout (10s default): show "Did not reach [device]."

### Error taxonomy

```ts
type IntentErrorCode =
  | "PERMISSION_DENIED"
  | "CAPABILITY_UNAVAILABLE"
  | "INTENT_EXPIRED"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_VERSION"
  | "EXECUTION_FAILED"
  | "CANCELLED"
  | "PAYLOAD_TOO_LARGE";  // enforced before serialization on sender AND
                          // before execution on receiver (per-type limits
                          // in MAX_INTENT_PAYLOAD_BYTES)
```

The UI uses `reasonMessage`. Logging, analytics, and retry logic use `reasonCode`. The two must never be conflated: a human message that changes is not a stable code, and a stable code is not a human message.

---

## Layer 4: Execution Engine

Every intent on the receiving side follows the same lifecycle:

```
Received
    ↓
Validate (schema, expiry, intentId dedup)
    ↓
Capability check (does this device currently have the required capability?)
    ↓
Permission check (Always / Ask / Never per capability per trusted node)
    ↓
Execute
    ↓
Success or Failed
    ↓
Send ACK
    ↓
Archived in IntentLog
```

Capability checks always precede permission checks. If the device cannot fulfil the intent at all (capability missing), there is no need to prompt the user.

### IntentExecutor interface

Execution is not a `switch (intent.type)` statement. Each intent type has a dedicated executor that satisfies a shared interface:

```ts
interface IntentExecutor<T extends IntentEnvelope> {
  readonly type: string;
  readonly concurrency: ExecutorConcurrency;  // serial | parallel | replace-existing
  readonly cancellable: boolean;

  /** Returns true if this executor can handle the given intent on this device right now.
      Called at dispatch time, not from cached presence. */
  canExecute(intent: T): boolean;

  /** Validates the payload schema. Throws with INVALID_PAYLOAD on failure. */
  validate(intent: T): void;

  /** Performs the execution. Exceptions are caught by the runtime (never terminate it). */
  execute(
    intent: T,
    signal?: AbortSignal,
  ): Promise<{ status: "completed" | "failed"; reasonCode?: IntentErrorCode; reasonMessage?: string }>;
}
```

Executors are registered in an `ExecutorRegistry` singleton at module load time:

```ts
executorRegistry.register(openUrlExecutor);
executorRegistry.register(continueReadingExecutor);
executorRegistry.register(clipboardExecutor);
// Milestone D: register fileExecutor, mediaExecutor here
```

The runtime calls `registry.get(type)` instead of a switch statement. Adding a new intent type means implementing `IntentExecutor` and calling `register()`. The runtime itself is not modified.

**Executor isolation:** every exception thrown by an executor is caught by the runtime, which maps it to `EXECUTION_FAILED` and sends the terminal ACK. A single broken executor never terminates the runtime or prevents other intents from executing.

### Payload validation

Every executor's `validate()` method uses a schema library, not manual field checks. `if ("url" in payload)` is not validation.

Recommended: **Zod** (already widely used in TypeScript projects; schemas double as runtime documentation).

Example:

```ts
const OpenUrlPayloadSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  favicon: z.string().url().optional(),
});
```

A payload that fails schema validation throws immediately with `INVALID_PAYLOAD` and the intent is never executed. This prevents malformed peer payloads — even from trusted devices on mismatched versions — from reaching execution.

---

## Intent expiry policy

`expiresAt` exists on every intent. Different intents have different appropriate TTLs:

| Intent type | Default TTL | Rationale |
|---|---|---|
| Clipboard | 10 seconds | Clipboard content is ephemeral by nature |
| Open URL | 2 minutes | URL is stable but stale tabs are confusing |
| Continue Reading | 5 minutes | Reading position degrades quickly |
| Open File | 30 minutes | File metadata is durable; user may accept later |
| Media Share | 30 minutes | Large transfers may queue for a few minutes |
| Notification | 0 seconds | Immediate delivery only; expired on any delay |

TTLs are defined per executor, not hardcoded in the runtime. The runtime enforces the expiry; the executor declares it.

---

## Offline semantics

**Continuity is live, not asynchronous.**

If the target device is offline when the user dispatches an intent, the UI fails immediately with "Desktop is offline" — it does not queue the intent for later delivery.

Rationale: a clipboard payload sent 30 minutes ago is no longer what the user wanted to paste. A tab URL sent while the phone was in a pocket is not the tab the user wants to continue reading. Asynchronous delivery of intents optimises for delivery at the cost of relevance. The intent model is about *now*, not *eventually*.

The only exception is the brief reconnect window after a network event, where the runtime may hold an intent in the Queued state for up to the Presence reconnect timeout (roughly 5 seconds). If the peer does not come back online within that window, the intent fails.

This keeps QuickBridge clearly distinct from sync tools. **If a feature requires asynchronous delivery, it belongs in Phase 4 or later, not in the Continuity layer.**

---

## Intent cancellation

`CancelIntent` is reserved in the type union from Milestone A, even if no UI exposes it in Phase 3:

```ts
interface CancelIntent {
  type: "cancel";
  payload: { targetIntentId: string };
}
```

A receiver that receives a `CancelIntent` for an intent in the `Awaiting Permission` or `Executing` state should abort, send `ACK { status: "cancelled" }`, and archive both intents.

Reserving this from the start means the DataChannel router and executor interface do not need structural changes when cancellation UI is added in a later milestone.

---

## Permissions model

Per-capability permission settings, stored in `localStorage` keyed by `nodeId`:

```ts
type PermissionSetting = "always" | "ask" | "never";

interface NodePermissions {
  "browser.open": PermissionSetting;
  "clipboard.write": PermissionSetting;
  "filesystem.write": PermissionSetting;
  "camera": PermissionSetting;
  "notifications": PermissionSetting;
}
```

Defaults: `"ask"` for everything. Users can set `"always"` or `"never"` per trusted device in `/devices`.

On the receiving side, before execution:
- `"always"`: proceed silently
- `"ask"`: surface an inline prompt with a 15-second timeout (auto-deny on expiry); send `ACK { status: "received" }` immediately so the sender knows it arrived; send `ACK { status: "accepted" | "permission-denied" }` when the user responds
- `"never"`: send `ACK { status: "permission-denied", reasonCode: "PERMISSION_DENIED" }` immediately

Browsers stay predictable. Users stay in control.

---

## Intent Log

The IntentLog is the single source of truth that feeds Recent Actions, analytics, retry, and debugging. Define it at Milestone A — do not defer it to Milestone E when Recent Actions UI is built.

```ts
interface IntentLogEntry {
  intentId: string;
  type: ContinuityIntent["type"];
  targetNodeId: string;
  targetNickname: string;       // snapshot at dispatch time
  createdAt: number;
  status: IntentStatus;
  reasonCode?: IntentErrorCode;
  reasonMessage?: string;
  completedAt?: number;
}
```

The IntentLog is stored in `localStorage` (capped at 100 entries, oldest evicted first). It drives:

- **Recent Actions** (Milestone E UI): last 5 completed intents, one tap to repeat
- **Analytics**: `continuity_action_dispatched` GA event emitted from the analytics hook on `completed` or terminal failure status
- **Debugging**: visible in `/devices` as a per-device action history for user support
- **Retry**: the runtime can replay a logged intent if the user taps "Try again"

---

## UI principles

One click for common actions. Not menus.

```
[Send]  Desktop  Phone  Tablet  More...
```

Recent environments appear inline, ordered by last-contact timestamp. "More..." expands to the full devices list. The action button adapts its label to the intent type:

| Intent | Button label |
|---|---|
| Current tab | "Send tab" |
| Reading position | "Continue on [device]" |
| Clipboard | "Paste on [device]" |
| File | "Open on [device]" |
| Photo | "Move to [device]" |

The UI never shows a device that does not have the required capability. If no online peer has `browser.open`, the "Send tab" action does not render at all.

---

## Security invariants

These invariants must hold at all times. They are not aspirational — they are load-bearing.

- Every intent originates from a verified trusted environment (WebRTC DataChannel already enforces this; the existing mutual-auth challenge/response applies).
- Every intent is scoped to one session. An intent from a previous session is rejected by expiry check if it arrives late.
- Capability checks always precede permission checks. An intent for an unsupported capability is rejected before any user prompt.
- Permissions are evaluated before execution without exception.
- Expired intents never execute. The receiver discards any intent where `Date.now() > expiresAt` before reaching the executor.
- Duplicate `intentId` values never execute twice. The receiver maintains a seen-set per session. A repeated `intentId` is not dropped silently: the runtime replays the previous ACK for that `intentId` so the sender receives a consistent response rather than a timeout. Expired intents are still recorded in the seen-set so an intent cannot circumvent expiry by arriving twice.
- Every ACK references exactly one `intentId`. An ACK without a matching `intentId` in the sender's tracking map is silently discarded.
- A `CancelIntent` received after `completed` is a no-op. Execution that has already succeeded cannot be undone by a cancellation.

---

## Per-intent design notes

### Open URL / Send tab

```ts
const OpenUrlPayloadSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  favicon: z.string().optional(),
});
```

Receiver calls `window.open(url, "_blank")` after permission check. The executor checks `window.open` is not blocked by popup settings and returns `failed` with `EXECUTION_FAILED` if it is.

### Continue reading

Uses the same `browser.open` capability but carries a richer payload:

```ts
const ContinueReadingPayloadSchema = z.object({
  url: z.string().url(),
  scrollY: z.number().int().nonnegative(),
  selection: z.string().optional(),   // selected text at point of send
  title: z.string(),
  favicon: z.string().optional(),
  timestamp: z.number(),
});
```

The scroll position is the minimum. The selection is what makes it feel magical: the receiver opens the URL and can jump to the exact passage the sender was reading. The `OpenUrlExecutor` and `ContinueReadingExecutor` share 90% of their code; the only difference is scroll restoration and selection highlighting on load.

### Clipboard

Start with text only. Use `ClipboardItem` internally to be future-proof.

```ts
const ClipboardPayloadSchema = z.object({
  text: z.string().optional(),
  html: z.string().optional(),
  // image and file clipboard added in a later milestone
});
```

The executor calls `navigator.clipboard.write([new ClipboardItem({ ... })])`. Never use `navigator.clipboard.writeText()` directly — `ClipboardItem` handles richer payloads without a code change later.

### Open file / Move photo

Two-phase: metadata first, transfer on acceptance.

```
Sender                            Receiver
  |                                   |
  |-- continuity-intent (metadata) -> |
  |   { name, size, type, ... }       show "Accept?" prompt
  |                                   |
  | <--- ACK (accepted) --------------|
  |                                   |
  |== existing file transfer ========>|
  |                                   |
  | <--- ACK (completed) -------------|
```

This prevents streaming a 9 GB file to a sleeping laptop. The existing `use-webrtc.ts` transfer engine is reused unchanged for the byte transfer phase. The intent layer owns only the handshake and the two ACKs.

Build "Move photo" as "Media Share" from the start:

```ts
const MediaSharePayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("photo"), name: z.string(), size: z.number(), mimeType: z.string() }),
  z.object({ kind: z.literal("video"), name: z.string(), size: z.number(), mimeType: z.string() }),
  z.object({ kind: z.literal("audio"), name: z.string(), size: z.number(), mimeType: z.string() }),
]);
```

Supporting video and audio costs nothing at the architectural level. Do not narrow to photos only.

---

## Implementation order

Build by architectural dependency, not by roadmap feature order.

### Milestone A: Foundation (no UI)

- Extend `Capability` type in `trusted-nodes-db.ts` to include `browser.open`, `filesystem.write`, `notifications`
- Update `detectLocalCapabilities()` in `capabilities.ts` to detect the new capabilities (with feature flag detection for `supportsScroll`, `supportsSelection`)
- Define `IntentEnvelope`, `IntentAck`, `IntentStatus`, `IntentErrorCode`, `IntentLogEntry` types in `src/lib/continuity-types.ts`
- Implement `IntentExecutor` interface in `src/lib/continuity-executor.ts`
- Implement the Continuity Runtime in `src/lib/continuity-runtime.ts`: `dispatchIntent()`, ACK timeout, seen-set deduplication, IntentLog writes, analytics hook
- Implement the Execution Engine entry point: schema validation, lifecycle management, ACK sends
- Add `"continuity-intent"` and `"intent-ack"` to the DataChannel message router in `use-webrtc.ts`
- Implement the permissions model (`localStorage` storage, per-node per-capability settings) in `src/lib/continuity-permissions.ts`
- Add Zod schemas for all intent payloads
- No visible UI change. All behaviour is wired but dormant.

### Milestone B: Open URL

- Implement `OpenUrlExecutor` and `ContinueReadingExecutor` (share base class)
- Add "Send tab" and "Continue reading" actions to `DevicesPanel` — shown only when peer has `browser.open`
- Two-ACK flow: `received` on arrival, `completed` on `window.open` success
- Surface "Opened on [device]" toast on `completed`; "Did not reach [device]" on timeout

### Milestone C: Clipboard

- Implement `ClipboardExecutor`
- Add "Paste on [device]" to `DevicesPanel` — shown only when peer has `clipboard.write`
- Text first; `ClipboardItem` internally from day one

### Milestone D: Files and media

- Implement `FileExecutor` and `MediaExecutor` with two-phase handshake
- Add "Open on [device]" and "Move to [device]" to `DevicesPanel`
- Reuse `use-webrtc.ts` file transfer unchanged for the byte phase

### Milestone E: Surface and polish

- Recent Actions strip driven by IntentLog (last 5 completed, one tap to repeat)
- Permission management UI in `/devices` per trusted device per capability
- "Continue on Desktop" / "Paste on Phone" as persistent action shortcuts

---

## Explicitly deferred

Not because they are bad ideas — because they distract from proving the intent pipeline.

| Feature | Why deferred |
|---|---|
| Bi-directional clipboard sync | Creates confusing loops; hard to reason about ownership |
| Automatic tab synchronization | Implicit, unpredictable; violates "user stays in control" |
| Shared clipboard history | Requires persistent storage; out of scope for Phase 3 |
| Multi-device broadcast ("Send to all") | Increases complexity before the single-device model is proven |
| Background execution without user action | Browsers will block it; trust is not established for this yet |
| Capability chaining (Desktop to Phone Camera to Desktop OCR) | Powerful, premature — builds on Phase 3 not Phase 4 |
| AI workload routing | Phase 5 territory; depends on SDK |

All of these become significantly easier once the intent pipeline is proven with five concrete actions.

---

## Metrics

### Phase 3 kill criteria

Two metrics, both required before Phase 4 begins.

**Adoption metric:** At least 30% of transfers among sessions with 2+ trusted environments originate from a Continuity shortcut rather than a QR scan. Measures whether people found and used the feature.

**Behaviour-change metric:** Average Continuity Actions per Trusted Environment per Day reaches 1.0 within 60 days of Milestone B shipping.

| Value | Interpretation |
|---|---|
| < 0.5 | Users still think of QuickBridge as a file transfer tool |
| 1.0 to 3.0 | Users are beginning to rely on device cooperation |
| 5.0+ | QuickBridge is becoming part of daily computing workflow |

This metric measures whether users are changing their mental model, not just whether they found the shortcut once.

**Tracking:** `continuity_action_dispatched` GA event emitted from the analytics hook with `intent_type` and `ack_status` parameters. Emitted only on `completed` or terminal failure status — never on intermediate states like `received`. The daily per-environment average is computed in GA by dividing successful `continuity_action_dispatched` events by distinct sessions that have fired `trusted_device_added` (count >= 1) in the trailing 30 days.

If the adoption metric is met but the behaviour-change metric is not, the feature is being discovered but not becoming habitual. Stop and investigate UX before Milestone E. If neither metric is met after 60 days, revisit the Continuity model before Phase 4.

---

---

## Implementation status (Milestones A, B, C complete)

As of August 2026, Milestones A, B, and C are implemented. Milestones D and E remain.

| File | Purpose | Status |
|---|---|---|
| `src/lib/continuity-types.ts` | All types, Zod schemas, constants | Done |
| `src/lib/continuity-permissions.ts` | Per-node per-capability permission storage | Done |
| `src/lib/continuity-executor.ts` | IntentTransport, IntentExecutor, ExecutorRegistry, OpenUrl, ContinueReading, Clipboard executors | Done |
| `src/lib/continuity-runtime.ts` | ContinuityRuntime class | Done |
| `src/lib/trusted-nodes-db.ts` | Capability union extended | Done |
| `src/lib/capabilities.ts` | detectLocalCapabilities extended, VALID_CAPS updated | Done |
| `src/lib/analytics.ts` | trackContinuityAction added | Done |
| `src/hooks/use-webrtc.ts` | continuity-intent and intent-ack DataChannel branches; sendContinuityIntent, sendIntentAck returns | Done |
| `src/components/quickbridge/Session.tsx` | Runtime lifecycle, pending intent dispatch, ACK toasts | Done |
| `src/components/quickbridge/DevicesPanel.tsx` | Send tab, Paste on buttons; CAP_LABELS updated | Done |

### Known gaps (Milestones D/E)

- `FileExecutor` and `MediaExecutor` not yet registered. Types and schemas exist in `continuity-types.ts`.
- Permission prompt UI not implemented. The `"ask"` setting currently falls through to execute. The permissions model and storage are fully wired; Milestone E adds the inline prompt component.
- Recent Actions strip (Milestone E) not implemented. The `IntentLog` is being written to localStorage on every intent; the UI just has not been built yet.
- Capability feature flags (`features` array on `CapabilityDescriptor`) not implemented. The current presence payload broadcasts capability names only.

### Pending intent flow (DevicesPanel to Session)

When the user clicks "Send tab" or "Paste on" in `DevicesPanel`, the device may not be connected yet. The flow is:

1. `DevicesPanel` serialises a `PendingIntent` into `sessionStorage` at key `qb:ci:<sessionId>`.
2. `DevicesPanel` calls `sendTrustedConnect` and navigates to `/session/<sessionId>` as host.
3. `Session.tsx` watches for `peerTrustVerified` to become true (ECDSA handshake complete).
4. Once true, `Session.tsx` reads and removes the `PendingIntent` from `sessionStorage`, then calls `runtime.dispatchIntent()`.
5. The pending key is cleared regardless of dispatch success so a stale intent cannot replay on the next session.

---

## Staff-engineer architecture review: implementation findings

The following 17 findings from the August 2026 architecture review were incorporated into the implementation. Each entry records what was changed from the original design and why.

**Finding 1 -- FIFO serial queue.**
The runtime maintains a single `Promise` chain (`serialQueue`) for intents whose type has `INTENT_ORDERING = "serial"`. Parallel intents bypass it. This guarantees that clipboard and URL intents are applied in the order the user dispatched them.

**Finding 2 -- Executor concurrency contract.**
Each executor declares `concurrency: "serial" | "parallel" | "replace-existing"`. `ClipboardExecutor` uses `"replace-existing"`: if a second clipboard intent arrives while one is executing, the first is aborted and the latest wins. This prevents stale clipboard content from overwriting a newer paste.

**Finding 3 -- Single intent store.**
One `Map<intentId, RuntimeIntent>` owns every timer, status, abort controller, observability timestamp, and ACK callback for every in-flight intent. There is no second store, no parallel array, no React state in the runtime.

**Finding 4 -- Cancellation via AbortController.**
Executors that declare `cancellable: true` receive an `AbortSignal`. The runtime passes the signal and aborts the controller when the session tears down or a `replace-existing` executor preempts the current one. Instantaneous executors (URL open, clipboard write) declare `cancellable: false` to skip controller allocation.

**Finding 5 -- Idempotent intentId: replay previous ACK.**
The original design silently dropped duplicate `intentId` values. The implementation replays `RuntimeIntent.lastAck` instead. The sender receives a consistent response rather than a timeout, which prevents double-execution and removes an unnecessary failure mode.

**Finding 6 -- Session-scoped runtime.**
`ContinuityRuntime.teardown()` clears the intent store and seen-set. `IntentLog` in `localStorage` is not cleared. Refresh means a fresh runtime; history survives.

**Finding 7 -- Version check on every received intent.**
`IntentEnvelope.version` is checked against `INTENT_ENVELOPE_VERSION` (currently `1`) before any other processing. Unknown versions return `UNSUPPORTED_VERSION` immediately.

**Finding 8 -- `canExecute()` called at dispatch time, not from cached presence.**
`executor.canExecute(envelope)` is called inside `executeIntent`, not at the point the user clicks. If a user revokes clipboard permission between clicking and the DataChannel delivering the intent, the executor correctly reports unavailable.

**Finding 9 -- Seen-set retained until teardown.**
The seen-set is a session-scoped `Set<string>` inside `ContinuityRuntime`. It is not cleared on intent completion. Expired intents are recorded in the seen-set so a replayed expired intent cannot execute.

**Finding 10 -- Clock skew tolerance of 60 s.**
`CLOCK_SKEW_TOLERANCE_MS = 60_000`. The receiver checks `Date.now() > envelope.expiresAt + CLOCK_SKEW_TOLERANCE_MS`. Devices with slightly drifted clocks do not produce spurious expiry failures.

**Finding 11 -- Observability via `getDebugState()`.**
`ContinuityRuntime.getDebugState()` returns per-intent metrics: `ackLatencyMs`, `executionMs`, `permissionWait`, `retryCount`, `status`. Exposed for a future debug panel without requiring production log changes.

**Finding 12 -- Error-to-retry policy.**
`INTENT_RETRY_POLICY` maps each `IntentErrorCode` to `"no"`, `"yes"`, or `"after-reload"`. The `onAckUpdate` callback receives `retryable: boolean` so the UI can show "Try again" only when retry is meaningful.

**Finding 13 -- Executor isolation.**
`executeIntent` wraps `executor.execute()` in a try/catch. Any unhandled exception becomes `EXECUTION_FAILED`. The runtime continues processing other intents. A broken executor never terminates the pipeline.

**Finding 14 -- Payload size enforced twice.**
`MAX_INTENT_PAYLOAD_BYTES` is checked on the sender before calling `transport.sendIntent()` and on the receiver before calling `executor.validate()`. Both checks return `PAYLOAD_TOO_LARGE`. This prevents a large payload from consuming DataChannel bandwidth even if the sender check is somehow bypassed.

**Finding 15 -- IntentTransport interface.**
`IntentTransport` is defined in `continuity-executor.ts` and injected into `ContinuityRuntime` at construction. Session.tsx builds the concrete implementation inline from `sendContinuityIntent` / `sendIntentAck` (the functions returned by `useWebRTC`). The runtime has no direct dependency on `use-webrtc.ts`.

**Finding 16 -- ExecutorRegistry replaces switch statements.**
`executorRegistry.get(type)` replaces all `switch (intent.type)` branches in the runtime. Registering a new executor is the only change needed to support a new intent type.

**Finding 17 -- Testing strategy.**
Unit tests for `ContinuityRuntime` should mock `IntentTransport` and inject a controlled clock. Unit tests for each executor should mock `window.open` and `navigator.clipboard`. Integration tests should use two `ContinuityRuntime` instances connected by an in-memory transport. No tests have been written yet; this is Milestone E work.

---

## August 2026 hardening review: additional findings

The following 10 findings from the August 2026 production-readiness audit were incorporated into the implementation. Each entry records what was changed from the original design and why.

**Hardening finding 1 -- `replace-existing` was inverting its intent.**
The `ClipboardExecutor` concurrency policy `"replace-existing"` was cancelling all in-flight intents of the same type regardless of age. Because the serial FIFO queue processes the oldest intent first, the oldest intent was executing and killing newer ones waiting in the queue. This is backwards. Fixed by adding a `createdAt` guard: only intents whose `createdAt` is strictly less than the replacement intent's `createdAt` are cancelled. Newer work is now correctly preserved.

**Hardening finding 2 -- Intents silently dropped during runtime init micro-gap.**
The Continuity Runtime was created inside a React `useEffect`, which fires asynchronously after the DataChannel opens. Any intent arriving in the window between DC open and the effect firing was silently dropped, causing a timeout for the sender. Fixed by adding `incomingIntentBufferRef` to buffer intents that arrive before the runtime is ready. When the runtime is created, the buffer is immediately flushed synchronously.

**Hardening finding 3 -- Pending `sessionStorage` intent lost on early effect fire.**
The pending intent `useEffect` depended on `[peerTrustVerified, sessionId]`. If `peerTrustVerified` became true while the WebRTC status was still `"connecting"`, the effect fired, found the runtime null, and aborted with no retry. Because `status` was not in the dependency array, the effect never re-ran. Fixed by adding `status` to the dependency array and requiring `status === "connected"` before dispatching.

**Hardening finding 4 -- Corrupted `sessionStorage` payload immortal across sessions.**
If `JSON.parse(raw)` threw on a corrupted pending intent payload, `sessionStorage.removeItem(key)` was skipped, leaving the broken payload to fail again on every future session using the same key. Fixed by placing `sessionStorage.removeItem(key)` in a `try/finally` block that always executes regardless of parse outcome.

**Hardening finding 5 -- Replayed completed intents caused sender timeout.**
The idempotency check looked up `this.activeIntents.get(intentId)` to resend the cached ACK. Completed intents are removed from `activeIntents`. Replays after completion hit the seen-set guard but received no ACK, causing the sender to time out. Fixed by introducing a `completedIntents: Map<string, { ack, completedAt, timer }>` cache. After execution, the final ACK is stored with a 120-second self-cleaning TTL timer. The idempotency path now checks both `activeIntents` and `completedIntents`.

**Hardening finding 6 -- Rate limiting bypassed via duplicate intent IDs.**
The deduplication check (`seenIntentIds`) ran before the rate limiter. An attacker could spam thousands of copies of the same intentId without consuming any rate-limit budget. Fixed by running rate limiting first for new intent IDs. Duplicate IDs return the cached ACK without consuming a token, preserving efficient idempotent retries while preventing the bypass.

**Hardening finding 7 -- No session boundary on incoming intents.**
`IntentEnvelope` had no `sessionId` field. A stale intent from a previous session arriving after a reconnect would be processed by the new runtime as if it were fresh. Fixed by adding `sessionId: string` to `IntentEnvelope`. The `ContinuityRuntime` constructor now requires `sessionId`. The receiver silently rejects envelopes whose `sessionId` does not match the current session without sending any ACK.

**Hardening finding 8 -- Executors could hang indefinitely.**
There was no maximum execution time for executors. A browser API that never resolved (`window.open` in certain multi-tab environments, `navigator.clipboard.write` on a locked screen) would leave an intent permanently `"accepted"` with no resolution. Fixed by wrapping `executor.execute()` in `Promise.race` against a 30-second timeout that resolves to `EXECUTION_FAILED`.

**Hardening finding 9 -- Popup blocking and clipboard denial treated as generic failures.**
When `window.open()` returned `null` (popup blocked by the browser) or `navigator.clipboard.write()` threw a `NotAllowedError` (tab backgrounded without user gesture), the result was `EXECUTION_FAILED` -- indistinguishable from a crash. The `REQUIRES_USER_ACTION` state essential for Milestone E's "Tap to open" prompt had no protocol-level representation. Fixed by adding `"requires-user-action"` to `IntentStatus` and `TERMINAL_STATUSES`. Both URL executors return `status: "requires-user-action"` when `window.open` returns null. `ClipboardExecutor` does the same on permission errors. `Session.tsx` renders a distinct info toast for this status. `SESSION_UNAVAILABLE` was also added as an `IntentErrorCode` for intents rejected during reconnection or teardown.

**Hardening finding 10 -- `CancelExecutor` missing from registry.**
The `"cancel"` intent type had TTL, payload size limits, and a `CancelPayloadSchema` defined, but no executor was registered. Inbound cancel intents fell through to `CAPABILITY_UNAVAILABLE`. Fixed by implementing and registering `cancelExecutor` -- a stateless no-op that validates the payload and returns `"completed"`. Cancellation is now a first-class protocol operation end-to-end.

---

*Last updated: August 2026 -- Milestones A, B, C implementation + staff-engineer review + August 2026 hardening review*
*Source: Phase 3 design review, August 2026*
*See also: ROADMAP.md, PRINCIPLES.md, VISION.md*
