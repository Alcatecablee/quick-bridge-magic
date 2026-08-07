---
name: Phase 2 hardening
description: Issues found and fixed across the Phase 2 Trusted Environments implementation (use-presence, node-identity, qb-db, trusted-nodes-db, Session, devices, DevicesPanel).
---

# Phase 2 hardening

## What was fixed

**use-presence.ts**
- Channel ref assigned BEFORE `.subscribe()` starts (was after, causing dead channels to be cached as live after early CHANNEL_ERROR, blocking retries forever)
- CLOSED state now treated same as CHANNEL_ERROR/TIMED_OUT for both self and peer channels (was silently ignored, leaving presence permanently dead)
- Online rebuild timer tracked in `onlineRebuildTimerRef` and cancelled before new timer (was untracked, multiple online events stacked rebuilds, could tear down freshly rebuilt lifecycle)
- `syncOnline` fixed to check `nodeId in state` instead of `Object.keys(state).length > 0` (was producing false-online for any channel metadata)
- `peerSubscribedRef` Set added; `sendTrustedConnect` now checks subscription state before sending on an existing channel
- `mountedRef` added; `sendTrustedConnect` returns early if unmounted
- Transient fallback channel (for send without existing peer channel) tracked in `transientChannelsRef`, cleaned up on unmount
- try/catch added around `supabase.channel()` with retry fallback for synchronous throws
- `sendTrustedConnect` validates target is trusted, non-empty, sessionId non-empty before broadcasting

**qb-db.ts**
- `_openInFlight` singleton added — concurrent `openQbDb()` calls all wait on the same Promise instead of racing `indexedDB.open()`
- `onversionchange` handler added — closes the cached connection gracefully so another tab can upgrade the schema
- `req.onerror` now provides a fallback error message if `req.error` is null

**node-identity.ts**
- `tx.onerror` and `tx.onabort` handlers added to the outer read transaction in `_doLoadOrCreate` — prevents the Promise hanging indefinitely on transaction-level failures

**trusted-nodes-db.ts**
- `tx.onerror` and `tx.onabort` added to `getTrustedNode` and `getAllTrustedNodes` read transactions
- `getAllTrustedNodes` sort now guards against non-finite/NaN `lastSeen` values

**Session.tsx**
- `handleNodeChallenge`: `.catch()` added to `signChallenge` — crypto errors no longer become silent unhandled rejections that prevent verify from being sent
- `handleNodeVerify`: `.catch()` added to `Promise.all([verifyChallenge, getTrustedNode])` — IDB/crypto errors no longer leave auth state silently stuck
- Trusted-connect session awareness added: reads `qb:tc:from:{sessionId}` (guest) and `qb:tc:to:{sessionId}` (host) from sessionStorage to display connecting device name during waiting state
- Initiator timeout: 30s timer shows "[device] hasn't connected yet" and prompts QR fallback for trusted-connect sessions
- sessionStorage keys cleaned up on unmount and after connect

**devices.tsx**
- `formatDate` now guards against zero/NaN/non-finite timestamps and wraps in try/catch to prevent RangeError render crash
- `void onRename(...)` replaced with `.catch(toast.error)` — IDB rename errors now surface to the user
- `void handleRemove()` replaced with `.catch(toast.error)` — IDB remove errors now surface to the user

**DevicesPanel.tsx**
- `relativeTime` now guards against zero/NaN/non-finite timestamps (was rendering "NaNd ago")
- `connectingNodeId` state cleared on navigation failure so the panel is never permanently stuck in connecting state
- Stores `qb:tc:from:{sessionId}` (fromNodeId) in sessionStorage before guest navigation
- Stores `qb:tc:to:{sessionId}` (targetNodeId) in sessionStorage before host navigation

## Known remaining items (proposed as follow-up tasks)
- zip.ts TypeScript error + Session.tsx refs (pendingHelloAfterIdentityRef etc.) cause tsc --noEmit to exit non-zero
- Phase 2.5 capabilities broadcast not implemented (types exist, no broadcast yet)
- use-trusted-nodes.ts snapshot-based rollback vulnerable to concurrent tab mutations
