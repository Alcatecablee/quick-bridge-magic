---
name: Presence channel hashing
description: Presence channel naming changed from raw nodeId to SHA-256 hash; key facts and migration implications.
---

## Rule
All Supabase Realtime presence channels must be named `qb:p:<channelSuffix>` where `channelSuffix` is the first 32 hex chars of `SHA-256("qb-presence:<nodeId>")`, NOT the raw nodeId.

## Implementation
- `src/lib/presence-channel.ts`: `getPresenceChannelId(nodeId)` async, cached in a module-level Map for the tab's lifetime. `getCachedPresenceChannelId(nodeId)` for sync call sites where the hash is already known. `PRESENCE_CHAN_PREFIX = "qb:p:"`.
- `src/hooks/use-presence.ts`: pre-computes hashes for all trusted nodes in `Promise.all` before opening any channel. Channel map stored in `channelIdMapRef`. Old local constant `CHAN_PREFIX` removed.

**Why:** Supabase channel listing is accessible to any holder of the anon key (which is in the client bundle). Raw nodeIds in channel names would let a passive observer who captured a nodeId (e.g. from a network log during pairing) subscribe and track a device's presence indefinitely. SHA-256 is one-way, breaking this correlation.

**How to apply:** Any code that opens a Supabase channel for a device's presence must call `getPresenceChannelId(nodeId)` and prefix with `PRESENCE_CHAN_PREFIX`. The pattern `qb:p:<rawNodeId>` is now incorrect.

## Migration note
This was a breaking change from the initial Phase 2 release. Old clients (pre-hash) subscribe to `qb:p:<rawNodeId>`; new clients subscribe to `qb:p:<hash>`. They cannot find each other during the service-worker rollover window (~24 hours on typical networks). The QR/PIN path is unaffected. Full version negotiation (AUDIT-U) will handle this explicitly in a future phase.
