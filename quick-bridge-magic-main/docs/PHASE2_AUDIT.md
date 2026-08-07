# Phase 2 Audit — Verified Gap Register

**Scope:** Phase 2 (Trusted Environments) and Phase 2.5 (Presence).
**Method:** Deep code audit cross-referenced against the live codebase.
**Status:** Living document. Strike items as they are resolved.

---

## Corrections to earlier findings

**50-device cap is already implemented.**
`trusted-nodes-db.ts` lines 52–141 define `MAX_TRUSTED_NODES = 50` and enforce it with an evict-oldest-by-`lastSeen` path on every `upsertTrustedNode` call. This was flagged as missing in an earlier review — that finding is out of date.

**Timeout and fromNodeId UI are already implemented.**
`Session.tsx` has a 30-second timeout with a named-device message and QR fallback for the initiator. Both sides surface the connecting device's nickname during the waiting phase. These were listed as "deferred" in the roadmap but were resolved after that entry was written.

---

## Open items

### ~~DOC-1~~ — `zip.ts` TypeScript error ✅ RESOLVED
**Severity:** LOW — CI blocker
**File:** `src/lib/zip.ts`

Changed `const chunks: Uint8Array[] = []` to `const chunks: BlobPart[] = []`. `Uint8Array` is a valid `BlobPart` (it is an `ArrayBufferView`), so all `.push(dat)` calls are still type-safe. The new declaration removes the generic `Uint8Array<ArrayBufferLike>` that TypeScript 5.8 introduced which was no longer directly assignable to `BlobPart[]`. `tsc --noEmit` should now exit clean on this file.

---

### ~~DOC-2~~ — Presence channel uses raw nodeId, not hashed ✅ RESOLVED
**Severity:** MEDIUM — privacy + roadmap integrity
**Files:** `src/lib/presence-channel.ts` (new), `src/hooks/use-presence.ts`

Implemented SHA-256 hashing. Channel names are now `qb:p:<first-32-hex-chars-of-SHA256("qb-presence:<nodeId>")>`. The hash is computed via `crypto.subtle.digest` with a module-level cache (one hash per nodeId per tab). `use-presence.ts` pre-computes all needed hashes in a parallel `Promise.all` before any `supabase.channel()` call; newly trusted peers compute their hash on-demand and then proceed with setup.

**Migration note (recorded decision):** This is a breaking change for any client still running pre-hash code. Old clients subscribed to `qb:p:<rawNodeId>` will not see new clients on `qb:p:<hash>` during the service-worker rollover window. The QR/PIN path is always available as a fallback. Full version negotiation is tracked under AUDIT-U.

---

### ~~DOC-3~~ — No "Resend invite" path after Connect timeout ✅ RESOLVED
**Severity:** LOW — UX gap
**File:** `src/components/quickbridge/Session.tsx`

Added a "Send invite again" button that appears when `trustedConnectTimedOut && isInitiator && trustedConnectTargetName`. The button calls `handleResendTrustedConnect`, a `useCallback` that: gets `localNodeId` from `getOrCreateNodeIdentity()` (cached after first call), reads `targetNodeId` from `trustedConnectTargetNodeIdRef` (populated from `sessionStorage` on mount), computes the hashed channel ID via `getPresenceChannelId`, opens a transient Supabase channel, broadcasts the `trusted-connect` payload, and cleans up after 3 seconds. Shows a success or error toast. The QR fallback below is unaffected.

---

### ~~DOC-4~~ — `connectingNodeId` stays set if `navigate()` throws ✅ RESOLVED (pre-existing)
**Severity:** LOW — spinner stuck
**File:** `src/components/quickbridge/DevicesPanel.tsx` — `handleConnect`

Verified: the existing code already chains `.catch(() => setConnectingNodeId(null))` on the `navigate()` promise. TanStack Router's `navigate()` always returns a Promise and does not throw synchronously before that Promise is created, so the `.catch()` covers all rejection paths. No code change required; marked resolved.

---

### ~~NEW-01~~ — `startOffer()` called fire-and-forget at five call sites ✅ RESOLVED
**Severity:** HIGH
**File:** `src/hooks/use-webrtc.ts`

All five bare `startOffer()` call sites now have `void … .catch()` guards that log with `qbWarn` and call `scheduleReconnect()` (or `scheduleReconnectRef.current()` inside `scheduleReconnect` itself where the direct reference is not in scope). The `aborted` flag is checked before calling `scheduleReconnect` at the four sites inside the signaling effect, preventing a torn-down effect from scheduling a new reconnect cycle. The fifth site inside `scheduleReconnect`'s setTimeout uses `?.catch()` because `startOfferRef.current?.()` may return `undefined`.

---

### ~~NEW-02~~ — Single empty `catch {}` swallows the entire DataChannel message handler ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

JSON.parse now has its own narrow `try/catch` that logs the malformed payload with `qbWarn` and returns early. The routing if-else chain runs outside any blanket catch, so handler bugs surface naturally. The three external callbacks (`onPeerNodeHelloRef`, `onNodeChallengeRef`, `onNodeVerifyRef`) each have their own `try/catch` with named `qbWarn` messages. An `else` fallthrough logs unknown message types with `qbWarn("[QB] DataChannel: unknown message type from peer", String(msg.t))`.

---

### ~~NEW-03~~ — Inbound text/clipboard content has no type check or size limit ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

Added a type-and-size guard before the `setMessages` call in the text/clipboard branch. If `msg.content` is not a string or exceeds `MAX_TEXT_BYTES`, the message is discarded and `qbWarn` logs the violation with the content type, actual length, and the cap. This mirrors the outgoing `sendText` enforcement and closes the peer-abuse path.

---

### ~~NEW-04~~ — Guest hello bootstrap `setTimeout` not tracked or cancelled ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

The 300 ms bootstrap delay is now stored in a `helloBootstrapTimer` local variable declared alongside `helloTimer` at the top of the signaling effect. The timer clears itself on fire (`helloBootstrapTimer = null`) and is cancelled in the effect cleanup block before `retryTimer` is cancelled. The `aborted` guard inside the callback is kept as a defence-in-depth check.

---

### ~~NEW-05~~ — Unmount does not abort active `WritableStreamDefaultWriter` instances ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

The effect cleanup now iterates `Object.values(incomingBuffersRef.current)` after cancelling grace timers. For each buffer with an open writer that has not already been aborted, it sets `buf.aborted = true` and chains `abort()` then `close()` then `cleanup()` onto `buf.writeQueue` using the same pattern as `abortIncomingDueToWriteError`. `setState` is never called in this path since the component may already be unmounting.

---

### ~~NEW-06~~ — IDB transfer-durability operations are void with no error path ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

All six `void` IDB calls now have `.catch(err => qbWarn(...))` with distinct message strings identifying the call site: prune on mount, clearInFlightTransfer after write error, clearInFlightTransfer on orphan cleanup, persistInFlightTransfer on stream-to-disk start (with a note that resume will restart from 0 if disconnected), clearInFlightTransfer after file-end, and clearInFlightTransfer on cancel. Failures are visible in dev tools without crashing the transfer.

---

### ~~NEW-07~~ — `disconnected` PC state triggers reconnect immediately with no ICE-recovery grace period ✅ RESOLVED
**Severity:** MEDIUM
**File:** `src/hooks/use-webrtc.ts`

`disconnected` is now handled in its own branch with a `DISCONNECTED_DEBOUNCE_MS = 1500` ms timer before `scheduleReconnect()` fires. `failed` and `closed` remain immediate. The timer ref (`disconnectedTimerRef`) is cancelled in the `connected` branch (ICE self-recovered), in the `failed`/`closed` branch (terminal, no point debouncing), and in `teardownPeer`. The `pc === pcRef.current` guard inside the timeout callback prevents a stale debounce from a replaced PC from triggering a reconnect on the new one.

---

### ~~NEW-08~~ — Session-scoped React state not reset when session identity changes ✅ RESOLVED
**Severity:** LOW
**Files:** `src/routes/session.$id.tsx`, `src/routes/s.$id.tsx`

Added `key={id}` to the `<Suspense>` wrapper that contains `<Session>` in both route files. When the session ID changes while the route stays mounted (e.g. one-click connect navigates from one session ID to another), React forces a full unmount and remount of the entire Session subtree including all hooks. This resets `messages`, `incomingFiles`, `outgoingFiles`, `sasCode`, `quality`, `reconnectAttempt`, and every other piece of session-scoped state atomically, with no risk of the reset logic becoming stale. The Suspense boundary also re-enters its loading state momentarily, which is the correct UX.

---

### ~~NEW-09~~ — PIN lookup state transitions not announced to screen readers ✅ RESOLVED
**Severity:** LOW — accessibility
**File:** `src/routes/join.tsx`

Added a `lookupAnnouncement` string state driven from each state transition in `submit()`: "Looking for device..." on start, "Device found. Connecting..." on match, "No device found for that PIN. Make sure the other device shows this PIN." on timeout, and "Could not reach the signaling service. Check your connection and try again." on channel error. The state feeds a `role="status" aria-live="polite" aria-atomic="true"` div with `className="sr-only"` placed at the top of the render tree, matching the pattern used in Session.tsx's connection status live region.

---

### ~~NEW-10~~ — `localStorage` nodeId validated only by length, not format ✅ RESOLVED
**Severity:** LOW
**File:** `src/lib/node-identity.ts`

Replaced the `length < 8` guard with a two-pattern regex check: `UUID_RE_LOCAL = /^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i` (covers `crypto.randomUUID()` output) and `FALLBACK_ID_RE_LOCAL = /^[0-9a-z]{4,}-[0-9a-z]{4,}$/i` (covers the timestamp-random fallback). A stored value must be 8-64 characters and pass at least one of these patterns; any value that fails (e.g. emoji, path segments, control characters) is discarded and a fresh nodeId is generated. This matches the same two-pattern validation used by `isValidNodeId` in `protocol.ts`.

---

### ~~NEW-11~~ — Concurrent rename submissions not guarded in `NodeRow` ✅ RESOLVED
**Severity:** LOW
**File:** `src/routes/devices.tsx`

Added a `renaming` boolean state to `NodeRow`. `commitRename` now returns immediately if `renaming` is true. When the guard passes, `setRenaming(true)` is called before `onRename`, and `setRenaming(false)` is called in `.finally()`. The Input is disabled and the checkmark button is disabled with `disabled:cursor-not-allowed disabled:opacity-40` while `renaming` is true; the checkmark icon is replaced with a `Loader2` spinner during the in-flight write so the user has visible feedback. This prevents both double-Enter and Enter + click from enqueuing two concurrent IDB writes that could clobber each other's rollback state.

---

## Summary table

| ID | Severity | File | Description | Status |
|---|---|---|---|---|
| NEW-01 | **HIGH** | `use-webrtc.ts` | `startOffer()` fire-and-forget at 5 call sites — unhandled rejection hangs UI | ✅ Resolved (prior) |
| DOC-2 | MEDIUM | `use-presence.ts` | Raw nodeId in channel name — roadmap said hashed, needs a recorded decision | ✅ Resolved |
| NEW-02 | MEDIUM | `use-webrtc.ts` | Single `catch {}` swallows entire DC message handler silently | ✅ Resolved (prior) |
| NEW-03 | MEDIUM | `use-webrtc.ts` | Inbound text/clipboard has no type check or size cap | ✅ Resolved (prior) |
| NEW-04 | MEDIUM | `use-webrtc.ts` | Guest hello bootstrap `setTimeout` not tracked or cancelled | ✅ Resolved (prior) |
| NEW-05 | MEDIUM | `use-webrtc.ts` | Unmount skips `WritableStreamDefaultWriter.abort()` — open handle on tab close | ✅ Resolved (prior) |
| NEW-06 | MEDIUM | `use-webrtc.ts` | `persist/clear/pruneInFlightTransfer` all void — IDB failures invisible | ✅ Resolved (prior) |
| NEW-07 | MEDIUM | `use-webrtc.ts` | `disconnected` PC state schedules reconnect immediately — no ICE-recovery window | ✅ Resolved (prior) |
| DOC-1 | LOW | `zip.ts` | One type error blocks clean `tsc --noEmit` | ✅ Resolved |
| DOC-3 | LOW | `Session.tsx` | No resend path after Connect timeout | ✅ Resolved |
| DOC-4 | LOW | `DevicesPanel.tsx` | `navigate()` fire-and-forget leaves `connectingNodeId` stuck on throw | ✅ Resolved (pre-existing) |
| NEW-08 | LOW | `session.$id.tsx`, `s.$id.tsx` | Session-scoped state not reset on cleanup — stale rows if router reuses component | ✅ Resolved |
| NEW-09 | LOW | `join.tsx` | PIN lookup state transitions not announced to screen readers | ✅ Resolved |
| NEW-10 | LOW | `node-identity.ts` | nodeId from localStorage validated only by length, not format | ✅ Resolved |
| NEW-11 | LOW | `devices.tsx` | Concurrent rename submissions not guarded — two in-flight IDB writes possible | ✅ Resolved |

---

## Recommended priority order

1. **NEW-01** — real hang path on every offer failure. Affects every connection on an unstable network.
2. **NEW-07** — premature reconnect that can disrupt an otherwise-recovering connection.
3. **NEW-02 + NEW-06** — make production failures visible. Currently silent; hardest bugs to diagnose without these.
4. **NEW-03** — closes a peer-abuse path before Continuity features open more text-passing surfaces.
5. **NEW-04 + NEW-05** — timer and writer hygiene. Low probability but hard to debug when they occur.
6. **DOC-1** — fast win; unblocks CI type gate.
7. **DOC-2** — needs a decision before it becomes a migration problem.
8. **DOC-3 + DOC-4 + NEW-08 through NEW-11** — polish and low-risk hardening.

---

## Extended audit dimensions

The items above are implementation-correctness findings. The categories below expand the audit scope to cover correctness over time, state convergence, security boundaries, operational resilience, and product consistency. Each category is currently unaudited. They are listed in rough priority order based on production impact.

---

### AUDIT-A: State machine

Audit the connection state machine, not individual functions.

States: Idle, Pairing, Connected, Trusted, Verified, Disconnected, Reconnecting, Connected.

Questions for every transition:
- Can this transition happen legally from the current state?
- Can every state be exited?
- Should verification survive reconnect, reset, or become "pending verification"?

Example gap: `Verified -> Disconnected -> Verified` is currently not explicitly handled. Many subtle bugs live in unguarded re-entry to Verified.

---

### AUDIT-B: State ownership

Every piece of state must have exactly one owner and a defined precedence when sources disagree.

Example: `peerNickname` may arrive from four sources simultaneously.

| Source | Value |
|---|---|
| `node-hello` | "Pixel 9" |
| Presence channel | "My Phone" |
| Trusted DB | "Pixel" |
| UI rename (in flight) | "Work Phone" |

Which wins? When? The answer must be written down, not left to implicit ordering.

---

### AUDIT-C: Event ordering

WebRTC is fully asynchronous. Audit every message handler assuming it can arrive in any order.

Scenarios to test:
- `node-hello` before peer connected
- `verify` before `challenge`
- `disconnect` during `offer`
- Presence join before identity loaded
- ICE candidate before remote description set

Every handler must be safe against out-of-order delivery.

---

### AUDIT-D: Duplicate event handling

Browsers produce duplicate events. Every handler must answer: is this idempotent?

Events to check for duplicate safety:
- `node-hello`
- `verify`
- `challenge`
- `trusted-connect`
- Reconnect trigger
- ICE restart

If a handler is not idempotent, it is a latent bug.

---

### AUDIT-E: Lost event handling

Audit what happens if these messages never arrive:

- `challenge`
- `verify`
- Presence leave
- Presence join
- `offer`
- `answer`
- ICE candidate

The session must either recover via timeout or fail with a clear user-visible message. Silent waiting forever is not acceptable.

---

### AUDIT-F: Browser lifecycle

Go beyond reconnect. Audit behaviour under every browser lifecycle transition.

Transitions to cover:
- Tab hidden
- Tab frozen (Page Lifecycle API)
- Tab discarded (OS evicts)
- Laptop lid close
- Phone lock screen
- Battery saver mode
- Safari background suspension
- Android Doze
- PWA (installed vs browser tab differences)
- Low memory eviction
- Refresh
- Back button
- Forward button
- Hard reload

Each produces different browser behaviour and needs a defined outcome.

---

### AUDIT-G: Storage corruption

Validate that QuickBridge can recover from every storage failure mode.

Scenarios:
- Trusted DB partially written (IDB transaction aborted mid-write)
- JSON record truncated
- Half-completed schema migration
- Old schema version present after downgrade
- `localStorage` quota exceeded
- IDB quota exceeded
- IDB unavailable (private browsing on some browsers)

Recovery path for each must be explicit: regenerate, prompt user, or degrade gracefully.

---

### AUDIT-H: Schema migration

Audit the identity and trusted-node record schema across versions.

Questions:
- Can a v1 identity upgrade to v2 cleanly?
- Can a v2 node connect to a v1 peer?
- Can a downgrade happen without data loss?
- Is a schema version field present on every persisted record?

No persisted record may lack a schema version field. This is an invariant (see Phase 2 Invariants document below).

---

### AUDIT-I: Cryptographic lifecycle

Audit the full key lifecycle, not just signature verification.

Stages: generation, storage, export guard, import, verification, rotation, deletion, recovery.

Failure cases to cover:
- Private key lost (IDB cleared)
- Public key changes on a returning device (key reset flow)
- Key regenerated after corruption
- Algorithm upgrade path (e.g. P-256 to P-384 in a future version)
- Browser drops or changes SubtleCrypto support

Each stage needs a defined success path and a defined failure path.

---

### AUDIT-J: Replay attack surface

The challenge/response uses a random nonce. Good.

Extend the audit to every message that carries a trust implication:

- `trusted-connect`: can a captured broadcast be replayed to initiate a session?
- `verify`: is a captured signature single-use?
- `hello`: does a replayed hello cause a double-trust prompt?
- Presence payload: does replaying a stale presence entry cause incorrect online/offline display?

Add timestamps or sequence numbers where replay is a realistic threat.

---

### AUDIT-K: Resource leak

Draw a creation/destruction table for every resource type.

| Resource | Created | Destroyed | Leak risk |
|---|---|---|---|
| Event listeners | `addEventListener` | `removeEventListener` in cleanup | Medium |
| `setInterval` / `setTimeout` | Inline | Cancel in ref cleanup | Medium |
| `RTCDataChannel` | `createDataChannel` | `dc.close()` in cleanup | High |
| `RTCPeerConnection` | `new RTCPeerConnection` | `pc.close()` in cleanup | High |
| `BroadcastChannel` | `new BroadcastChannel` | `.close()` in cleanup | Low |
| Supabase subscription | `.subscribe()` | `.unsubscribe()` in cleanup | Medium |
| `ReadableStream` | FSA open | `.cancel()` on abort | Medium |
| `WritableStreamDefaultWriter` | FSA write start | `.abort()` on unmount (see NEW-05) | High |
| Blob URLs | `createObjectURL` | `revokeObjectURL` after use | Medium |
| `AbortController` | Inline | `.abort()` in cleanup | Low |

Every row must have a confirmed destruction path.

---

### AUDIT-L: React rendering under load

Audit rendering behaviour when the trusted devices list is large.

Scenario: 50 trusted devices online simultaneously. Each presence update triggers a re-render. Trace the chain:

`Presence update -> useTrustedNodes -> DevicesPanel -> NodeRow * 50 -> Button -> Spinner`

Identify where `React.memo`, `useMemo`, or stable selectors can break the cascade. The devices panel must not visibly stutter on presence heartbeats.

---

### AUDIT-M: Error taxonomy

Replace generic `Error` throws with typed error categories so every failure is actionable.

Proposed taxonomy:
- `TransportError`: WebRTC or TURN failure
- `CryptoError`: key generation, import, or verification failure
- `PresenceError`: Supabase channel failure
- `StorageError`: IDB or localStorage failure
- `PermissionError`: camera, notifications, or FSA permission denied
- `VerificationError`: DTLS fingerprint or challenge/response mismatch
- `ProtocolError`: unexpected message type or malformed payload

Every `catch` block should produce one of these, not a raw `Error`.

---

### AUDIT-N: User-facing error messages

Audit every error path for the message shown to the user.

Replace vague messages with specific, actionable ones.

| Current | Target |
|---|---|
| "Connection failed" | "Device went offline" / "Verification failed" / "TURN relay unavailable" |
| (silent) | "Browser blocked storage: try disabling private browsing" |
| (silent) | "Peer rejected trust: the device may have reset its identity" |

Users forgive failures. They do not forgive mysteries.

---

### AUDIT-O: Retry policy

Every failure must have an explicit retry classification.

| Failure | Retry policy |
|---|---|
| ICE failed | Automatic retry with backoff |
| Presence timeout | Automatic retry |
| Verification failed | Never retry automatically (security boundary) |
| Storage quota exceeded | Do not retry; surface actionable message |
| TURN credential fetch failed | Retry once; fall back to public relay |
| IDB write failed | Log warning; do not retry silently |

---

### AUDIT-P: Local diagnostics

Even in a privacy-first product, local diagnostics are essential for bug reports.

The session log should be able to answer:
- Why did reconnect happen?
- Why did trust fail?
- Why did verification fail?
- How long did ICE negotiation take?
- Was relay used or direct P2P?
- How many offers were sent?
- How many reconnect attempts occurred?
- What was average RTT during the transfer?

This data stays local. It is surfaced in the UI only when the user explicitly opens a diagnostic view.

Without it, "sometimes it doesn't connect" becomes undebuggable.

---

### AUDIT-Q: Performance baselines

Phase 2 should make the product faster, not slower. Measure and record baselines for:

- Identity load time (IDB read on mount)
- Presence subscription time (channel join to first heartbeat)
- Offer creation time
- ICE negotiation time (offer to connected)
- DTLS handshake time
- DataChannel open time
- Verification round-trip time
- Trust handshake total time
- First byte transfer time
- Last byte transfer time

Regressions in these baselines are Phase 2 bugs.

---

### AUDIT-R: UX consistency

Every screen must be able to answer these questions visibly at all times:

- Who am I connected to?
- Is this connection verified?
- Is this connection encrypted?
- Am I using direct P2P or a relay?
- Can I trust this device?
- Can I reconnect to this device later?

These answers must never disappear during a state transition.

---

### AUDIT-S: Chaos testing

Intentionally inject failures to verify graceful recovery.

Scenarios:
- Drop packets mid-transfer
- Delay presence by 5 seconds
- Lose ICE candidates
- Kill DataChannel while file is in flight
- Corrupt a DataChannel message
- Disconnect WiFi during DTLS handshake
- Switch from WiFi to LTE mid-transfer
- Kill the browser process
- Clear IDB while connected
- Throw an exception in every message handler
- Restart the Supabase channel
- Close the laptop lid during ICE negotiation

QuickBridge must either recover or fail with a clear, specific message every time.

---

### AUDIT-T: Roadmap compliance gate

Every PR should automatically answer these five questions before merge:

1. Does this improve cooperation between computing resources?
2. Does this reduce friction on the next interaction, not just this one?
3. Does it preserve the connection lifecycle?
4. Is it production quality with no placeholders?
5. Does the trusted environments metric move in the right direction?

Add this as a section to the pull request template so it becomes a mandatory checklist, not a retrospective review.

---

### AUDIT-U: Protocol version negotiation

**Severity: HIGH for future deployments**

Every protocol message currently assumes both peers run identical code. This is safe today but becomes a silent failure vector the moment the protocol changes, because the PWA service worker means the two sides can be on different versions indefinitely.

Scenario: desktop updates to a new deployment. Phone's service worker still serves last week's code. `node-hello` from the desktop includes a field the phone's handler does not recognise. The phone silently ignores it. The handshake either hangs or produces inconsistent state with no diagnostic.

**Required additions to `node-hello`:**
```ts
protocolVersion: number        // current protocol version
minimumSupportedVersion: number // lowest version this peer will speak
featureFlags: string[]         // optional capabilities advertised
```

**Handler logic:** on receiving `node-hello`, compare the sender's `protocolVersion` against local `minimumSupportedVersion`. If incompatible, send a `protocol-error` message with a human-readable reason and close the channel cleanly. Never silently degrade.

This must be designed before Phase 2.5 ships any protocol changes, because retrofitting version negotiation after the fact requires a flag day.

**Unknown message handling:** every `msg.t` branch that falls through the switch should log `qbWarn("[QB] Unknown message type", msg.t)` rather than silently discarding. Protocol drift must be visible in local diagnostics.

---

### AUDIT-V: Multi-tab behaviour

**Severity: MEDIUM — unaudited scenario with real production occurrence**

Two QuickBridge tabs open in the same browser share the same node identity and the same Supabase presence channel. The current code has no coordination layer between tabs.

**TAB-01: Competing presence subscriptions**

Both tabs subscribe to the same presence channel with the same node identity. Supabase will see two joins from the same key. Depending on channel semantics, this may produce duplicate presence entries for the same device on the peer's screen, or the second join may silently evict the first subscription.

**TAB-02: Competing `trusted-connect` responses**

A `trusted-connect` broadcast arrives on the presence channel. Both tabs receive it. Both call `navigate()` to the session route. The user ends up with two tabs both attempting to connect to the same peer simultaneously, producing two competing `RTCPeerConnection` instances with the same session ID.

**Fix path:** a `BroadcastChannel` (name: `"qb:tab-leader"`) can elect one tab as the active connection owner using a first-write-wins lock on mount. Only the leader responds to incoming `trusted-connect` broadcasts and subscribes to presence. Follower tabs display a "QuickBridge is active in another tab" notice.

**TAB-03: Rename not reflected across tabs**

IDB writes do not fire `storage` events. A rename committed in Tab A will not update Tab B's in-memory `useTrustedNodes` state until Tab B remounts or refreshes. The `BroadcastChannel` leader pattern above also provides the right place to broadcast IDB mutation events to follower tabs so all tabs stay consistent without a full reload.

---

### AUDIT-W: Rate limiting and flood protection

**Severity: MEDIUM — security hardening before Spaces ships**

The DataChannel message handler currently has no per-message-type rate limits. A peer (or a script injected into a compromised peer tab) can send protocol messages at arbitrary frequency.

Specific gaps:

| Message | Risk if flooded | Mitigation |
|---|---|---|
| `node-hello` | Triggers trust prompt or challenge generation on every receipt | Max 1 hello per connection; ignore duplicates after first |
| `challenge` | Each challenge may generate a sign operation; sign is CPU-bound | Max 1 pending challenge at a time; discard extras |
| `verify` | Triggers IDB write per receipt | Guard with in-flight ref; ignore if challenge already resolved |
| `trusted-connect` broadcast | Triggers navigation on every receipt | Debounce; ignore if already navigating |
| Reconnect trigger | Reconnect loop could spin indefinitely without a ceiling | 6-attempt cap already exists; verify it cannot be reset by a peer message |

Maximum concurrent transfers, maximum pending challenges, and maximum reconnect attempts must each be constants, not unbounded. The reconnect ceiling (currently 6 attempts) is correct; verify a peer cannot reset it by sending a crafted signal message that causes the attempt counter to reset before the cap is reached.

---

### AUDIT-X: Clock-dependent logic

**Severity: LOW — subtle correctness issue**

Several pieces of logic depend on `Date.now()` or timestamp comparisons:

- `lastSeen` on trusted node records (used for display and for eviction order when the 50-node cap is hit)
- The 24-hour prune threshold for stale in-flight transfer records
- Any timeout durations computed as `Date.now() + N`

These break silently under:

- **NTP correction:** system clock jumps backward by seconds or minutes. `lastSeen` comparisons using `>` or `<` produce incorrect ordering. The eviction policy may evict the wrong node.
- **User manually sets clock backward:** `lastSeen` for a newly seen device may appear older than records written hours ago.
- **Timezone change:** does not affect `Date.now()` (UTC), but any code formatting timestamps for display using local time will shift without warning.
- **Sleep and wake:** `Date.now()` advances correctly after wake, but any timeout set with `setTimeout(fn, N)` before sleep fires immediately after wake regardless of elapsed wall time, because the browser suspends the timer. This is covered under AUDIT-F (browser lifecycle) but also applies to any clock-based record expiry.

**Fix:** store timestamps as UTC milliseconds (already done via `Date.now()`). Add a sanity check on `lastSeen` reads: if a stored `lastSeen` is in the future relative to `Date.now()`, clamp it to `Date.now()` before using it for comparisons. This handles backward clock jumps without corrupting the record.

---

### AUDIT-Y: Testing strategy

**Severity: LOW — process gap; no production behaviour is broken today**

The codebase currently has no automated test coverage for the protocol layer. This means every bug in the audit above was found by reading code, not by a failing test. The following testing layers would catch entire categories of bugs before they ship.

**Unit tests (highest immediate value)**

Every protocol message handler should have a unit test that feeds a message object directly and asserts the resulting state change. Start with the handlers that currently have the widest silent catch blocks (see NEW-02).

Priority order: `node-hello`, `challenge`, `verify`, `trusted-connect`, `file-start`, `file-end`, `file-cancel`, `text`.

**Property-based tests**

Feed randomly ordered sequences of valid protocol messages into the handler and assert that no sequence produces an impossible state (see AUDIT-A and AUDIT-B). Libraries: `fast-check` works with Vitest.

Example property: for any ordering of `[node-hello, challenge, verify]`, the final trust state is either `trusted` or `unverified`, never `undefined` or an exception.

**Fuzz tests**

Feed malformed JSON, truncated messages, messages with missing fields, messages with extra fields, and messages with wrong field types into `dc.onmessage`. Assert that no input causes an unhandled exception or leaves the UI in a permanently blocked state.

This directly targets the NEW-02 vulnerability (silent swallow of the entire message handler).

**Chaos / soak test**

A 24-hour session between two browser tabs with randomised connection drops every 2 to 10 minutes. Assert at the end:

- Memory usage has not grown monotonically (no leak)
- Presence is still subscribed and responsive
- Reconnect succeeds after every injected drop
- No JavaScript errors in the console

This catches the timer and writer hygiene issues (NEW-04, NEW-05) that only manifest over time.

---

## Phase 2 Invariants

A companion document to this bug register. Where the register tracks what is broken today, the invariants document defines what must always be true regardless of implementation. Future refactors may change any code; if an invariant is violated, the change is wrong.

File location: `docs/PHASE2_INVARIANTS.md`

Starting invariants:

```
A trusted environment can only be created after a successful QR or PIN session.
A trusted environment must never authenticate itself to itself.
Every signed challenge is single-use.
Verification must complete before a "Verified" badge is shown.
A device cannot be "Verified" and "Unverified" simultaneously.
Only one active identity exists per browser profile.
Every RTCPeerConnection has exactly one owner.
Every timer has a cleanup path.
Every subscription has an unsubscribe path.
Every async operation has an error path.
Every persisted record has a schema version.
No state transition may leave the UI permanently blocked.
No file data touches any server at any point.
```

This document should be created and reviewed before Phase 2.5 work begins.

---

*Owner: Clive Makazhu*
*Last updated: August 2026*
*See also: ROADMAP.md, PRINCIPLES.md*
