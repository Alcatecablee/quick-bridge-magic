// Presence channel ID derivation.
//
// Each device's personal Supabase Realtime channel is named
// "qb:p:<channelId>" where <channelId> is the first 32 hex chars (16 bytes)
// of SHA-256("qb-presence:<nodeId>").
//
// WHY HASH INSTEAD OF USING THE RAW NODE ID:
//   nodeIds are only exchanged during the WebRTC DataChannel handshake, so they
//   are not freely discoverable today. However, Supabase Realtime exposes channel
//   subscription metadata that could in principle be read by any holder of the
//   anon key (which is in the client bundle). If channel names were raw nodeIds,
//   a passive observer who captured a nodeId (e.g. from a network log during
//   pairing) could subscribe to that device's presence channel and track its
//   online/offline state indefinitely.
//
//   Hashing with SHA-256 is a one-way transformation: knowing only the channel
//   name cannot reveal the nodeId (the pre-image is not recoverable from the
//   truncated 32-hex-char digest). Note that the mapping IS deterministic: a
//   party who already knows a nodeId can recompute its channel name. The defence
//   is therefore against passive correlation by observers who see channel names
//   (e.g. Supabase dashboard) but do not know any nodeIds -- not against a party
//   who already has the nodeId. Knowing the channel name does not reveal the nodeId.
//
// MIGRATION NOTE:
//   This hash was introduced after the initial Phase 2 release. Any client
//   running code before this change subscribes to "qb:p:<rawNodeId>" while new
//   clients use "qb:p:<hash>". During the service-worker rollover window
//   (~24 hours on typical networks) two clients may run different code and fail
//   to find each other's presence channels. The QR/PIN pairing path is always
//   available as a fallback and is unaffected by the presence channel naming.
//   Protocol version negotiation (AUDIT-U) will add an explicit mechanism to
//   detect and handle version mismatches in a future phase.
//
// Module-level cache: each nodeId is hashed at most once per tab lifetime.
// SHA-256 via WebCrypto is fast (~0.1 ms) but asynchronous; the cache ensures
// repeated calls for the same nodeId (which happen on every channel rebuild)
// do not each wait on a microtask.

export const PRESENCE_CHAN_PREFIX = "qb:p:";

const _channelIdCache = new Map<string, string>();

/**
 * Returns the Supabase channel suffix for a given nodeId.
 * The suffix is the first 32 hex chars of SHA-256("qb-presence:<nodeId>").
 * Results are cached in memory for the tab's lifetime.
 */
export async function getPresenceChannelId(nodeId: string): Promise<string> {
  const cached = _channelIdCache.get(nodeId);
  if (cached !== undefined) return cached;

  const data = new TextEncoder().encode(`qb-presence:${nodeId}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  )
    .join("")
    .slice(0, 32);

  _channelIdCache.set(nodeId, hex);
  return hex;
}

/**
 * Synchronous cache lookup only. Returns the pre-computed channel suffix for
 * a nodeId if it was previously computed via getPresenceChannelId, or null if
 * the hash has not been computed yet.
 *
 * Use this inside callback closures that cannot be async (e.g. inside a
 * Supabase subscribe callback) when the hash should already be in the cache
 * from an earlier async call during channel setup.
 */
export function getCachedPresenceChannelId(nodeId: string): string | null {
  return _channelIdCache.get(nodeId) ?? null;
}
