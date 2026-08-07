# File Transfer Robustness

An honest assessment of how QuickBridge handles file transfers, where it is solid, and where its real limits are. Written against the actual production code.

---

## How transfers work

QuickBridge uses WebRTC DataChannels (SCTP under the hood) for all file movement. SCTP is ordered and reliable while the connection is alive, so chunk ordering and delivery are guaranteed by the transport layer, not application code.

Signaling (offer/answer/ICE candidates) runs over a Supabase Realtime channel. Once the peer connection is established, Supabase is no longer in the data path.

---

## What is solid

### Chunking and backpressure

Files are split into 64 KB chunks. Before each chunk is written to the DataChannel, the sender checks `channel.bufferedAmount`. If it exceeds 8 MB the sender pauses and waits for a `bufferedamountlow` event (threshold: 1 MB) before resuming. This prevents the send buffer from growing unbounded, which on low-RAM Android devices would cause a browser crash or OOM kill.

### Transfer serialization

Outgoing transfers are strictly serialized through a promise chain. Only one file is actively pumped into the DataChannel at a time. This avoids chunk interleaving between concurrent files and keeps memory usage predictable.

### Chunk attribution

Every chunk is prefixed with a 16-byte UUID that identifies the transfer it belongs to. If two transfers somehow overlap (e.g. after a resume), chunks are always attributed to the correct file.

### Mid-transfer resume

If the WebRTC connection drops during a transfer, the reconnect sequence sends a `file-resume-ack` message containing the receiver's current byte offset. The sender slices the file from that offset and resumes rather than restarting from zero. This matters for large files on mobile networks where brief disconnects are common.

### Per-device memory caps

Receivers advertise their safe in-memory buffering limit via the presence capability payload (`memBytes`). The values are computed from the user agent: 300 MB for iOS Safari (killed aggressively by the OS), 500 MB for Android browsers, and 2 GB for desktop. The sender enforces this cap so a 1 GB transfer is never pushed to an iOS device that can only safely hold 300 MB in a tab. When the receiver has enabled stream-to-disk, memory is constant and the cap rises to 10 GB.

### TURN relay

TURN relay is active in production. Cloudflare TURN credentials are fetched dynamically at startup via `/api/turn-credentials` and refreshed every 23 hours. TURN is essential on mobile networks because carrier-grade NAT (CGNAT), used by most mobile carriers, blocks direct peer-to-peer connections. A "Force relay" button in the UI lets users manually force all traffic through the relay server when auto-ICE fails to find a working path.

### Android share sheet

The service worker intercepts Web Share Target POSTs from the Android system share sheet, stashes files in a `qb-share-pending` cache, and the app drains them when the tab becomes visible. Files shared from Android Files, Google Photos, or any app using the system share menu arrive correctly.

### Screen Wake Lock

The app holds a Screen Wake Lock for the duration of the connection, including the full reconnection window (up to 48 seconds across six attempts). The lock is reacquired correctly after the browser auto-releases it on tab hide: the code listens for the sentinel's own `release` event and nulls the ref so the `visibilitychange` handler can reacquire on return to the foreground. This prevents the screen from locking mid-transfer on Chrome and Edge on Android. iOS Safari does not implement the Wake Lock API; on those devices, keeping the screen on is the user's responsibility.

---

## Integrity verification

SHA-256 is computed incrementally on both sides as chunks move through the DataChannel. The sender feeds every payload slice into an `IncrementalSha256` instance while streaming, and includes the hex digest in the `file-end` control message. The receiver runs the same computation across the same bytes (chunk payloads only, header bytes excluded) and compares digests when `file-end` arrives. A green "Verified" badge appears on completed incoming files when the digests match; a red "Integrity check failed" badge appears if they differ. The hash covers the full file even across resume sessions: on the sender side, a pre-hash pass covers bytes already acknowledged by the receiver before streaming the remainder.

## Reconnection strategy

Reconnection uses a two-stage approach rather than immediately rebuilding the full peer connection:

**Stage 1: ICE restart (first 2 attempts)**. `pc.restartIce()` plus a new offer with `iceRestart: true` replaces only the ICE credentials and candidates, preserving the existing `RTCPeerConnection` and `RTCDataChannel`. This is 2 to 3 times faster than a full teardown because it skips DTLS re-handshake. The initiator triggers the restart directly; the non-initiator sends a `request-ice-restart` signal and the initiator responds with the new offer. In-flight transfer state is not marked retryable during ICE restarts.

**Stage 2: Full teardown (attempt 3 onwards)**. If both ICE restart attempts fail, the peer connection is torn down and a fresh offer/answer cycle begins. Active transfers are marked retryable. After 6 total failed attempts with exponential backoff (capped at 8 seconds per wait), the session gives up permanently.

**Auto-relay escalation**. On the first full-teardown attempt (attempt 3), if relay mode is not already active, it is activated automatically. This ensures TURN is used from the very first full rebuild rather than burning another round of STUN-only ICE that would likely fail for the same reason the restarts did (CGNAT, corporate firewall). A toast notifies the user of the automatic switch. Users can also activate relay manually from the stalled-connection diagnostic card.

### Browser backgrounding on Android Chrome

Chrome on Android aggressively throttles or suspends background tabs, especially under memory pressure. If the user switches apps during a large transfer, the DataChannel can stall or drop. The Screen Wake Lock (see above) keeps the screen on while the tab is in the foreground, reducing accidental lock-screen suspensions. If Chrome actually kills the tab in the background, the transfer will not automatically resume and the session will need to be restarted.

Practical advice: keep the QuickBridge tab in the foreground for the duration of long transfers. Install the PWA (Add to Home Screen) for a slightly more stable execution environment than a browser tab.

### FSA orphan cleanup on receiver refresh

When the receiver is streaming to disk (File System Access API) and refreshes mid-transfer, the partial file stays on disk but the writable stream is gone. On reconnect the sender retries the transfer; the receiver has no in-memory buffer and responds with offset 0. Before creating a new writable, the receiver checks IndexedDB for a record of the previous in-flight write. If found, it removes the orphaned partial file so the restarted write opens cleanly at the original filename rather than producing a collision-suffixed copy such as "file (1).txt". The in-flight record is written when a writable opens and cleared on successful completion. Records older than 24 hours are pruned on mount.

### Public TURN fallback is rate-limited

If the Cloudflare credential fetch fails, the connection falls back to `openrelay.metered.ca`, a free public TURN server with undisclosed bandwidth and concurrency limits. Under load or on high-traffic days this server may throttle or reject connections. Setting `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` in the environment overrides the default and points to a private relay.

### No upfront transfer time estimate

The 10 GB per-file cap is enforced, but nothing tells the user how long a transfer will take before it starts. Speed is displayed as a live sparkline during transfer. For very large files over slow mobile hotspots this can mean unexpected multi-minute transfers with no prior warning.

---

## Mobile Android: practical breakdown

| Scenario | Expected behavior |
|---|---|
| Both devices on the same WiFi | Direct P2P connection. Fast, no relay needed. |
| One device on mobile data, one on WiFi | TURN relay used in most cases due to CGNAT. Slightly slower but reliable. |
| Both devices on mobile data, different carriers | TURN relay almost always required. Works. |
| Corporate or school WiFi with strict NAT | Use "Force relay" button if auto-ICE stalls. |
| Transfer interrupted by lock screen | Screen Wake Lock prevents accidental lock-screen on Chrome/Android while the tab is in the foreground. If the OS locks anyway (battery saver, memory pressure), the reconnect sequence restores the session. |
| User switches apps mid-transfer | Wake Lock holds while the tab is active. If Chrome kills the tab in the background, the session ends. Keep the tab visible for large transfers. |
| File shared via Android share sheet | Works. Service worker stashes the file and the app picks it up on return. |
| Large file (1 GB+) over mobile hotspot | Works but takes time. Per-device memory cap ensures the receiver is not overwhelmed. Keep the tab active. |

---

## Environment variables that affect reliability

| Variable | Effect |
|---|---|
| `VITE_TURN_URLS` | Override the default TURN server URL(s) |
| `VITE_TURN_USERNAME` | TURN credential username |
| `VITE_TURN_CREDENTIAL` | TURN credential password |

Setting all three to a private Metered, Twilio, or Xirsys TURN account eliminates dependency on the public relay fallback and gives predictable performance.

---

## Summary

For typical transfers up to a few hundred MB with both devices awake and on screen, the implementation is production-grade. The chunking, backpressure, resume logic, integrity verification, per-device memory caps, and screen wake lock are all solid. The main real-world risk on Android is Chrome killing the tab if it is backgrounded for a long time under memory pressure, which is a platform constraint rather than a code issue.
