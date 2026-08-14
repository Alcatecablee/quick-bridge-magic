# QuickBridge: Roadmap

**Internal document. Living file. Update as phases complete or criteria change.**

Phases are sequential. Do not start a phase until the previous one meets its kill criteria. Each phase has a clear success condition. If the condition is not met within the window, stop and revisit before continuing.

---

## The metric that matters

Track one number obsessively:

**Average trusted environments per user.**

What it tells you:

- 1.2: People are trying it once and walking away.
- 2.0: People are connecting their own environments. Good.
- 3.5: QuickBridge is becoming part of their daily workflow.
- 5+: It is becoming infrastructure. This is the target.

This metric directly measures whether the vision is becoming real.

---

## What success looks like

Success is not 100 million users.

Success is: people stop thinking about which environment they are using.

They stop saying "send it to my phone." They say "open it here."

The environment boundary dissolves.

---

## The architecture

Three layers. Everything reuses the middle one.

```
EXPERIENCE LAYER
  Transfer (the first capability)
  Clipboard Sync
  Tab Continuity
  Spaces (ephemeral rooms)
  Developer SDK

BRIDGE LAYER (where value compounds)
  Discovery
  Pairing
  Trusted Environments (local, no accounts)
  Presence
  Permissions
  Resume and reconnection
  Encryption
  Transfer engine

TRANSPORT LAYER
  WebRTC (today)
  DTLS
  ICE / STUN / TURN
  SCTP
```

The Bridge Layer is the real investment. The transport layer is an implementation detail. If a better primitive replaces today's transport in 2029, the Bridge Layer and everything above it survive unchanged. Nobody pays for signaling. They pay for "it just works."

---

## Trusted Environments model

Each browser stores a small record per trusted environment:

```
Environment ID  (UUID generated at first pairing)
Public Key      (used for mutual authentication on reconnect)
Nickname        (editable: "My Phone", "Work Laptop")
Last Seen       (timestamp)
Capabilities    (what this environment can offer)
Signature       (to detect tampering)
```

When two trusted environments meet again, they authenticate each other cryptographically using the stored public keys. No login. No cloud account. No "My Devices" service. The trust lives locally, not on any QuickBridge server.

The UI this enables:

```
Your environments

  Pixel 9           Last seen 2 hours ago
  Work MacBook      Last seen 3 days ago
  Tablet            Offline
```

One click opens a connection instantly if online, or generates a fresh QR if not. The QR is the fallback, not the main event.

---

## Capabilities

Trusted environments advertise what they can offer. This changes what QuickBridge connects from environments to capabilities.

```
Phone
  Camera, Microphone, Location
  Biometrics, Notifications
  Sensors, Clipboard, Files

Desktop / Laptop
  Display, Keyboard, Storage
  Compute, Execution environment
  Network gateway, Clipboard, Files

Tablet
  Touch, Camera, Clipboard, Files
```

Actions this makes possible:

- One environment asks another for its camera.
- One environment delegates execution to another with more compute.
- One environment asks another to continue a tab or task it started.
- One environment requests a capability it lacks from the nearest trusted environment that has it.

In ten years a trusted environment may be a headset, a car, a Raspberry Pi, an AI agent, or a cloud session. The model survives the hardware changing.

---

## Phase 1: Make transfer unbeatable (complete)

The foundation has to be bulletproof before anything else compounds on top of it.

**Goals:**
- Connections remain stable on mobile, even during long sessions.
- Fallback relay works silently; relay status is shown to users.
- Large transfers complete without memory issues.
- Every completed transfer is cryptographically verified.
- Mobile screens stay on during active transfers.

**Status:** Implemented and acceptance-tested. Production validation ongoing.

- Reconnection: two-stage ICE restart then full teardown, exponential backoff, auto-relay escalation.
- Relay: Cloudflare TURN with 23-hour refresh, open-relay fallback, quality badge, force-relay toggle.
- Memory safety: 64 KB chunks, 8 MB backpressure, stream-to-disk via File System Access API. Receivers broadcast a per-device safe memory cap (300 MB iOS, 500 MB Android, 2 GB desktop) so the sender never sends more than the receiver can hold in RAM.
- Integrity: SHA-256 computed incrementally on both sides, pre-hash pass covers already-acknowledged bytes on resume. Verified/failed badge shown on every completed incoming file.
- Screen lock: Screen Wake Lock acquired on connect, held through reconnection attempts, reacquired correctly after the browser auto-releases the sentinel on tab hide. Covers Chrome/Edge/Android; iOS Safari does not support the API.
- FSA orphan cleanup: if the receiver refreshes mid-transfer while streaming to disk, the partial file is removed before the restart creates a new writable, preventing "file (1).ext" leftovers.

Phase 1: Transfer
[x] Implemented
[x] Acceptance tested
[ ] Production validation ongoing

**Kill criteria:** Transfer feels boring and reliable on both iOS and Android. No critical bug survives more than 48 hours. Do not move to Phase 2 until this is true.

---

## Phase 2: Trusted Environments ("Pair once. Forget forever.")

The pivot from session-based to relationship-based.

**What to build:**
1. On first successful pairing, offer to remember the environment. Store the trusted record locally on both sides.
2. On load, check for trusted environments and show their presence status.
3. When a known environment comes online, show it as active without any QR scan.
4. One-click connect to a trusted environment; generate a session automatically.
5. Manage trusted environments: rename, remove, see last-seen.

The handshake on reconnect: when two known environments meet, they exchange a signed challenge using their stored public keys. If both sides verify, the session proceeds without QR. This is the technical heart of "pair once."

**What not to build yet:** Capabilities delegation, rooms, SDK, any collaboration features.

Phase 2: Trusted Environments
[x] Implemented
[x] Acceptance tested
[ ] Production validation ongoing

- Trust prompt: shown after first successful transfer; disabled and spinner-guarded during the async IDB write to prevent double-tap duplicates. An in-flight guard in `Session.tsx` (`trustingInFlightRef`) prevents concurrent calls from reaching the write layer.
- Mutual authentication: ECDSA P-256 challenge/response on reconnect. Both sides challenge each other independently. Private key never leaves the browser; JWK import rejects any key that carries a `d` field.
- One-click connect: fixed a critical silent failure where `crypto.randomUUID()` (36 chars, hyphens) was used as the session ID. The recipient's protocol validator rejects UUIDs. Replaced with `generateSessionId()` throughout.
- Per-node presence channels: privacy-preserving (channel ID is hashed from the node ID), with exponential backoff, visibility/network recovery, and incremental peer channel management.
- Trusted devices list: rename, remove, last-seen display. All IDB writes now resolve on `tx.oncomplete` (not `req.onsuccess`) so a storage-quota rollback cannot produce a false success.
- Key reset: calm re-trust prompt when a returning device presents a new key; distinct from impersonation detection.
- Protocol hardening: `FALLBACK_ID_RE` tightened to require at least 4 chars per segment; all DataChannel and broadcast messages validated before reaching business logic.

**Known gaps (all resolved):**

- One-click connect timeout and feedback: the initiator shows a 30-second countdown with the target device's name, followed by a clear timeout message and a "Send invite again" button. Resolved in `Session.tsx`.
- `tsc --noEmit` exits clean. The `zip.ts` type error (`Uint8Array<ArrayBufferLike>` not assignable to `BlobPart[]`) was fixed by declaring `const chunks: BlobPart[]`. Verified August 2026.
- `fromNodeId` is surfaced in the guest UI: the recipient sees "Connecting from {name}. Hang tight." during the waiting phase, populated via the `qb:tc:from:{sessionId}` sessionStorage key set by `DevicesPanel` before navigating.

**Kill criteria:** Within 60 days of launch, at least 40% of sessions that fire a `trusted_device_added` event should carry `trusted_device_count >= 2`. This is the measurable proxy for "average trusted environments per user" given the serverless, account-free architecture: there are no user accounts to aggregate over, so the metric is tracked client-side via a `trusted_device_added` GA event fired after each successful trust write, carrying the browser's total trusted node count. Monitor in Google Analytics under Events > trusted_device_added, filter by `trusted_device_count` parameter. If the threshold is not met, stop and revisit before Phase 3.

---

## Phase 2.5: Presence

Continuity depends on Presence. Continuity is not a feature. It is proof that Presence works.

Presence means: trusted environments know each other are reachable, know each other's capabilities, and can connect without user action.

**What to build:**
- Lightweight always-on presence channel per environment ID.
- Homepage shows live online/offline status per trusted environment.
- Capabilities broadcast on presence join so each environment knows what others can offer.
- Graceful reconnect when an environment goes offline and comes back.

Phase 2.5: Presence
[x] Implemented
[x] Acceptance tested
[ ] Production validation ongoing

- Per-node hashed channels: `qb:p:<sha256[:32]>`, bounded to 51 max (1 self + 50 peers). Re-entrancy guards on all CLOSED handlers prevent call-stack overflow on Supabase's synchronous CLOSED callback.
- Online/offline state: join/leave/sync events all handled. Capabilities cleared on leave so stale caps never survive a reconnect.
- Capabilities broadcast: `detectLocalCapabilities()` detects real browser APIs (clipboard, camera, microphone, location, FSA). `parseCapabilities()` validates incoming peer payloads and drops any unrecognised value.
- Reconnect paths: (1) Network offline/online: 1500ms debounce then full teardown and rebuild of all channels, retry counter reset. (2) CHANNEL_ERROR/TIMED_OUT/CLOSED: exponential backoff 800ms→16s, MAX_RETRIES=8. (3) Visibility (tab return, phone unlock): re-tracks self presence AND rebuilds any peer channel whose backoff exhausted during suspend — this is the key fix that makes presence survive a long phone lock screen without a page reload.

**Known limits (not blockers):**
- Mobile network handoff without an explicit offline/online event (silent IP change) recovers via Supabase CHANNEL_ERROR backoff, which may take 5–15s rather than the target 5s. Acceptable for the current phase.
- Transient send-channel cleanup timer is not cancellable on unmount (timer ID intentionally discarded). Double-remove is caught by try/catch. Minor polish, not a correctness issue.
- Protocol version negotiation (AUDIT-U) is not yet implemented. Two clients on different code versions may fail to find each other's presence channels during the service-worker rollover window. QR/PIN pairing is always available as a fallback.

**Kill criteria:** Known environments appear online/offline accurately within 5 seconds. Presence survives a mobile network handoff without user action. If not reliable, do not ship Continuity on top of it.

---

## Phase 3: Continuity

With Presence working, build the one-click actions that make the relationship feel real.

**The principle:** Continuity is intent, not synchronization. The user is not thinking "transfer this URL." They are thinking "continue over there." QuickBridge transmits intent, not just bytes.

**Architecture:** Every Continuity action is the same abstraction instantiated five times: Intent to a Capability on a Trusted Environment, executed and acknowledged. The UI never touches WebRTC. It emits a typed intent; the intent engine routes, executes, and returns an ACK. See `docs/PHASE3_ARCHITECTURE.md` for the full design.

**Four internal layers:**
- Continuity UI (emits typed intents, receives ACKs)
- Intent Engine (dispatch, ACK timeout, deduplication by intentId)
- Capability Router (routes to the execution handler for the given capability)
- Trusted Channel (existing Phase 2 DataChannel, unchanged)

**Build order (by dependency, not feature list):**
- Milestone A: Intent engine, capability registry extension, ACK protocol, permissions model. No UI.
- Milestone B: Open URL. Covers "Send this tab" and "Continue reading" with 90% shared code.
- Milestone C: Clipboard (text first, ClipboardItem internally for future-proofing).
- Milestone D: Files and media (two-phase metadata/accept handshake, reuse existing transfer engine).
- Milestone E: Recent actions surface and permission management UI in `/devices`.

**What not to build in Phase 3:** bi-directional clipboard sync, auto tab sync, multi-device broadcast, background execution without user action, capability chaining, AI workload routing. All deferred until the intent pipeline is proven.

**Milestones A, B, C -- Complete.**
Core implementation and the 16-point lifecycle validation matrix are passing. The Continuity Runtime invariants are validated, including cancellation, timeout, deduplication, reconnect, initialization, TTL handling, and executor failure isolation.

All core code for Milestones A, B, and C has been implemented and hardened against the following invariants:

| Criterion | Status |
|---|---|
| Intent envelope schema validation (Zod) | Done |
| Permission model | Done |
| Executor architecture (registry, isolation, timeouts) | Done |
| DataChannel transport (IntentTransport interface) | Done |
| Idempotent intent IDs (sender + receiver) | Done |
| Duplicate delivery handling (completedIntents cache, 120s TTL) | Done |
| ACK handling (including late ACKs, duplicate ACKs) | Done |
| Cancellation protocol (`CancelExecutor`) | Done |
| Queue replacement semantics (newer kills older via `createdAt`) | Done |
| Runtime initialization has no delivery gap (buffer + flush) | Done |
| Pending session handoff is reliable (`try/finally` + `status` dep) | Done |
| Session teardown cancels all in-flight work | Done |
| Stale-session intents rejected (`sessionId` on every envelope) | Done |
| Executor timeouts (30s hard limit via `Promise.race`) | Done |
| Popup/clipboard restrictions handled explicitly (`requires-user-action`) | Done |
| Completed-intent replay cache with TTL | Done |
| Rate limiting (checked before deduplication) | Done |
| Multi-path deduplication (seen-set survives teardown) | Done |
| TypeScript passes (`tsc --noEmit` exits 0) | Done |
| Manual lifecycle test matrix | **Complete** |

**Milestone D:** Files and media. **Now starting.**
Prerequisite satisfied: Milestones A/B/C lifecycle matrix passes.

**Milestone E:** Recent actions surface, inline permission prompts (`REQUIRES_USER_ACTION` state), permission management UI. Not started.

Phase 3 Product Kill Criteria
[ ] 30% of transfers from users with 2+ trusted environments originate from Continuity
[ ] Average Continuity Actions per Trusted Environment per Day reaches 1.0 within 60 days of Milestone B shipping

---

## Phase 4: Spaces (ephemeral rooms)

A Space is a temporary secure mesh. Multiple environments join via QR or PIN. Everything shared inside disappears when the Space closes.

Use cases:
- In-person meetings: scan QR on the room display, everyone joins, share files and notes, walk out.
- Classrooms: teacher creates a Space, students scan, teacher pushes resources.
- Events: organiser runs a Space for the day.

"Spaces" not "Rooms." More neutral, no video call connotations.

**Kill criteria:** Average participants per Space reaches 3 or more within 30 days of launch. Spaces must not degrade the reliability achieved in Phase 1. If either fails, stop before adding features inside Spaces.

**Prerequisite:** Trusted environment metric at 2.0+. Do not build Spaces until Phase 3 is shipped and that number is real.

---

## Phase 5: Developer SDK

Only build this after Phases 2, 3, and 4 are live and used.

The SDK story at that point is credible: "This SDK is the exact infrastructure powering QuickBridge Transfer, QuickBridge Clipboard, and QuickBridge Spaces. We have been running it in production."

That is a sentence developers trust. Shipping an SDK before proving the primitives with your own products produces a speculative SDK nobody integrates.

The SDK surface:

```ts
const bridge = await QuickBridge.connect()

bridge.send(data)
bridge.sendFile(file)
bridge.onMessage(handler)
bridge.onCapability("camera", handler)
bridge.onDisconnect(handler)
```

Developers want `connect()` and `send()`. The SDK is that abstraction, backed by years of production edge case handling they would never want to build themselves.

Pricing: per-session or per-gigabyte-relayed. The relay costs real money. Everything else is cheap. The moat is not the signaling. It is the reliability and the abstraction.

**Kill criteria:** Ten independent developers ship production applications using the SDK within 90 days of public availability. If not, the abstraction or documentation needs work before broader promotion.

---

## Things we won't build yet

These are all valid long-term directions. None of them are roadmap items until Trusted Environments is proven.

```
Universal clipboard sync
Remote camera delegation
Compute sharing
Enterprise features (SAML, RBAC, audit logs)
Capability routing
AI workload delegation
Separate clipboard product
Collaboration features
```

**Why:** every item on that list depends on Trusted Environments succeeding. Building any of them before Phase 2 hits its kill criteria is building on an unproven foundation.

File these for Phase 5 conversations. They are proof the Bridge Layer is valuable, not things to build now.

---

*Last updated: August 2026 -- Phase 3 Milestones A/B/C hardening complete; lifecycle test matrix pending*
*Owner: Clive Makazhu*
*See also: VISION.md, PRINCIPLES.md, docs/PHASE3_ARCHITECTURE.md*
