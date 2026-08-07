---
name: Phase 3 Continuity bug fixes
description: All confirmed bugs, design gaps, and optimisations fixed in the Phase 3 Continuity audit session, with precise file locations and the fix applied.
---

# Phase 3 Continuity -- Fixes Applied

## Status: all 16 items fixed; tsc --noEmit passes clean

### Critical
- **C-1 (TS compile errors)**: `timeline: []` was missing from both RuntimeIntent object literals in `continuity-runtime.ts` (dispatchIntent line ~185, handleIncomingIntent line ~453). Fixed by adding the field.
- **C-2 (Rate limiter missing)**: `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX_INTENTS` were declared and documented but never imported or used. Added sliding-window check in `handleIncomingIntent` using `this.incomingTimestamps: number[]` field.
- **BUG 1 (version no-op)**: Both branches of the ternary in `use-webrtc.ts` returned `INTENT_ENVELOPE_VERSION`. Fixed to `msg.version as typeof INTENT_ENVELOPE_VERSION`.
- **BUG 2 (clipboard.write not broadcast/not checked)**: Three-part fix: added `"clipboard.write"` to `Capability` union in `trusted-nodes-db.ts`; pushed it in `detectLocalCapabilities()` in `capabilities.ts` when `navigator.clipboard.writeText` exists; added to `VALID_CAPS`; changed `peerCanPaste` check in `DevicesPanel.tsx` from `"clipboard"` to `"clipboard.write"`.

### High
- **BUG 3 (double analytics)**: Removed duplicate `trackContinuityAction` call from `Session.tsx` onAckUpdate callback; runtime's `handleIncomingAck` already fires it for every terminal ACK.
- **BUG 4 (replace-existing no cancelled ACK)**: Displaced intent's sender was waiting 10s for timeout. Now sends `cancelled` ACK and fires `onAckUpdate` before deleting from `activeIntents`.
- **BUG 5 (stale connected() closure)**: `Session.tsx` transport's `connected()` closed over the render-time `status` value. Fixed to `statusRef.current === "connected"` using the already-existing `statusRef`.
- **GAP 2 (accepted timeout silent)**: Extended timer on "accepted" ACK now fires with `onAckUpdate`, `writeIntentLog`, and `trackContinuityAction` instead of a silent `Map.delete`.
- **TERMINAL_STATUSES/VALID_INTENT_STATUSES guards**: Both are now imported in `continuity-runtime.ts` and used in `handleIncomingAck` to reject unknown statuses and block backward transitions.

### Medium
- **GAP 1 ("ask" silently executes)**: Added `import.meta.env.DEV` console.warn so the gap is always visible in dev. The permission model is wired; the prompt UI is Milestone E.
- **GAP 4 (targetNickname inverted)**: For received intents, `writeIntentLog` now sets `targetNickname: ""` (local, unknown to runtime) and `senderNickname` correctly from the session context.
- **GAP 6 (permissionWaitStartedAt)**: Written inside the "ask" branch before the dev warning.
- **OPT 3 (String.length vs UTF-8)**: Added `byteLength()` helper using `TextEncoder`. Both sender check (dispatchIntent) and receiver check (handleIncomingIntent) now use it.

### Low
- **GAP 7 (serialQueue not reset)**: `teardown()` now resets `this.serialQueue = Promise.resolve()` and clears `incomingTimestamps`.
- **GAP 9 (writeIntentLog silent failure)**: Now retries after quota exceeded by evicting half the log; if still failing, clears entirely. Never silently swallows.
- **OPT 4 (Math.random in generateId)**: Fallback now uses `globalThis.crypto.getRandomValues`. Last resort uses timestamp + module-level counter (`_idCounter`).

## Deferred (proposed as follow-up tasks)
- **GAP 8**: Multi-tab duplicate execution -- needs BroadcastChannel/Web Locks leader election
- **Milestone E**: "ask" permission prompt UI component
- **RM-3**: `cancel` executor not registered -- incoming cancel intents return CAPABILITY_UNAVAILABLE
