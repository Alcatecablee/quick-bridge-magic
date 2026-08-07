// Presence hook for Phase 2 Trusted Devices.
//
// Architecture: per-node channels
//
//   Each device has one personal Supabase Realtime channel named
//   "qb:p:<nodeId>". The device tracks its own presence there and listens
//   for incoming "trusted-connect" broadcasts on that channel.
//
//   To monitor a trusted peer's online state, we subscribe to their channel
//   ("qb:p:<peerNodeId>") as a non-tracking subscriber. When a device comes
//   online it calls channel.track() on its own channel, and subscribers to
//   that channel see the presence join/leave events.
//
//   To send a "trusted-connect" invitation, we broadcast on the TARGET's
//   channel. The target subscribes to their own channel and receives it there.
//
// Privacy benefit: with a single global channel every subscriber sees all
// nodeIds of everyone online. With per-node channels, a device's online
// state is only visible to peers who explicitly subscribe, which requires
// knowing the nodeId ahead of time (i.e. trusting them first).
//
// Scaling: bounded by the trusted-node eviction limit (50 peers), so the
// channel count per device is at most 51 (1 self + 50 peer channels).
//
// Reconnection: a state machine per channel retries with exponential backoff
// up to MAX_RETRIES on CHANNEL_ERROR, TIMED_OUT, or CLOSED. The online/offline
// and visibilitychange events trigger a full channel rebuild so presence is
// recovered transparently after network loss or device suspend.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { DeviceKind } from "@/lib/device";
import { validateTrustedConnect } from "@/lib/protocol";
import {
  getPresenceChannelId,
  PRESENCE_CHAN_PREFIX,
} from "@/lib/presence-channel";
import type { Capability } from "@/lib/trusted-nodes-db";
import { parseCapabilities } from "@/lib/capabilities";

// Channel naming: each device owns one personal channel at
// "qb:p:<sha256[:32]>" where the suffix is the first 32 hex chars of
// SHA-256("qb-presence:<nodeId>"). See src/lib/presence-channel.ts for the
// full rationale (privacy, collision resistance, migration notes).

// Backoff constants for failed channel subscriptions.
const BASE_BACKOFF_MS = 800;
const MAX_BACKOFF_MS = 16_000;
const MAX_RETRIES = 8;

function backoffMs(attempt: number): number {
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt));
}

export interface UsePresenceParams {
  /** Subscribe only when there is at least one trusted peer. */
  enabled: boolean;
  /** This device's stable nodeId from node-identity. */
  localNodeId: string;
  /** Display name broadcast in the self presence payload. */
  localNickname: string;
  /** Device type broadcast in the self presence payload. */
  localDeviceKind: DeviceKind;
  /** nodeIds of peers the local user trusts. Drives which channels we subscribe
   * to and which incoming trusted-connect broadcasts we honour. */
  trustedNodeIds: string[];
  /** Capabilities this device supports, broadcast in the self presence payload. */
  localCapabilities?: Capability[];
  /** Called when a trusted peer broadcasts a "trusted-connect" invitation
   * addressed to this device. Handler should navigate to the session URL. */
  onTrustedConnect?: (fromNodeId: string, sessionId: string) => void;
}

export interface UsePresenceResult {
  /** nodeIds of trusted devices currently detected as online. */
  onlineNodeIds: Set<string>;
  /** Live capabilities advertised by each online trusted peer, keyed by nodeId.
   * Populated from the presence payload on join/sync; cleared on leave. */
  peerCapabilities: ReadonlyMap<string, Capability[]>;
  /** Broadcast a one-click connection invitation to a trusted peer. */
  sendTrustedConnect: (targetNodeId: string, sessionId: string) => void;
}

export function usePresence({
  enabled,
  localNodeId,
  localNickname,
  localDeviceKind,
  localCapabilities,
  trustedNodeIds,
  onTrustedConnect,
}: UsePresenceParams): UsePresenceResult {
  const [onlineNodeIds, setOnlineNodeIds] = useState<Set<string>>(new Set());

  // Stable refs: values that can change without needing channel teardown.
  const onTrustedConnectRef = useRef(onTrustedConnect);
  useEffect(() => {
    onTrustedConnectRef.current = onTrustedConnect;
  }, [onTrustedConnect]);

  const nicknameRef = useRef(localNickname);
  useEffect(() => {
    nicknameRef.current = localNickname;
  }, [localNickname]);

  const deviceKindRef = useRef(localDeviceKind);
  useEffect(() => {
    deviceKindRef.current = localDeviceKind;
  }, [localDeviceKind]);

  const localCapsRef = useRef<Capability[]>(localCapabilities ?? []);
  useEffect(() => {
    localCapsRef.current = localCapabilities ?? [];
  }, [localCapabilities]);

  // Source of truth for the online set. Kept in a ref so event handlers do not
  // go stale; flushed to React state via flushOnlineSet().
  const onlineSetRef = useRef(new Set<string>());

  // Current set of trusted peers (ref so broadcast handlers stay current).
  const trustedSetRef = useRef(new Set(trustedNodeIds));

  const flushOnlineSet = useCallback(() => {
    setOnlineNodeIds(new Set(onlineSetRef.current));
  }, []);

  // Peer capability snapshot: populated from presence payloads on join/sync,
  // cleared on leave. Separate from the IDB capabilitySnapshot (which persists
  // the last-known capabilities for offline display). This is the live view.
  const peerCapsMapRef = useRef<Map<string, Capability[]>>(new Map());
  const [peerCapabilities, setPeerCapabilities] = useState<
    ReadonlyMap<string, Capability[]>
  >(new Map());

  const flushPeerCaps = useCallback(() => {
    setPeerCapabilities(new Map(peerCapsMapRef.current));
  }, []);

  // Self channel: this device's personal channel.
  const selfChRef = useRef<RealtimeChannel | null>(null);
  const selfRetriesRef = useRef(0);
  const selfRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selfSubscribedRef = useRef(false);
  // Set true in cleanup to stop in-flight retries from re-opening channels.
  const selfDestroyedRef = useRef(false);

  // Peer channels: one per trusted peer, keyed by their nodeId.
  const peerChRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const peerRetriesRef = useRef<Map<string, number>>(new Map());
  const peerTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Tracks which peer channels are currently in SUBSCRIBED state.
  const peerSubscribedRef = useRef<Set<string>>(new Set());

  // Timer for the online-event rebuild debounce. Stored in a ref so that
  // rapid online events cancel each other rather than stacking up rebuilds.
  const onlineRebuildTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transient channels created by sendTrustedConnect when no peer channel
  // exists. Tracked so they can all be cleaned up on unmount.
  const transientChannelsRef = useRef<Set<RealtimeChannel>>(new Set());

  // Maps nodeId -> pre-computed hashed channel suffix (first 32 hex chars of
  // SHA-256("qb-presence:<nodeId>")). Populated before channel setup so all
  // supabase.channel() calls use the hashed name rather than the raw nodeId.
  // The Map persists for the tab's lifetime; entries are never evicted because
  // the set of trusted nodes is bounded to 50 (MAX_TRUSTED_NODES).
  const channelIdMapRef = useRef<Map<string, string>>(new Map());

  // Signals that the hook has been unmounted. Prevents any async callback from
  // sending on a channel or updating state after teardown.
  const mountedRef = useRef(true);

  // Forward refs so retry callbacks always call the latest function version.
  const setupSelfChannelRef = useRef<() => void>(() => {});
  const setupPeerChannelRef = useRef<(nodeId: string) => void>(() => {});

  // --- Helpers ---

  const removePeerChannel = useCallback(
    (nodeId: string, updateOnline = true) => {
      const timer = peerTimerRef.current.get(nodeId);
      if (timer) {
        clearTimeout(timer);
        peerTimerRef.current.delete(nodeId);
      }
      const ch = peerChRef.current.get(nodeId);
      if (ch) {
        // Clear the ref BEFORE calling removeChannel. Supabase fires the
        // subscribe callback synchronously with "CLOSED" during removeChannel,
        // and the CLOSED handler also calls removeChannel. Clearing the ref
        // first means that re-entrant call sees no live channel and returns
        // early, preventing an infinite recursion that overflows the call stack.
        peerChRef.current.delete(nodeId);
        peerSubscribedRef.current.delete(nodeId);
        try {
          supabase.removeChannel(ch);
        } catch {}
      }
      peerRetriesRef.current.delete(nodeId);
      peerSubscribedRef.current.delete(nodeId);
      if (updateOnline) {
        onlineSetRef.current.delete(nodeId);
        peerCapsMapRef.current.delete(nodeId);
        flushOnlineSet();
        flushPeerCaps();
      }
    },
    [flushOnlineSet, flushPeerCaps],
  );

  const trackSelf = useCallback(
    async (ch: RealtimeChannel) => {
      try {
        await ch.track({
          nodeId: localNodeId,
          nickname: nicknameRef.current || "This device",
          deviceKind: deviceKindRef.current,
          capabilities: localCapsRef.current,
        });
      } catch {
        // Non-fatal: the next visibilitychange or reconnect will re-track.
      }
    },
    [localNodeId],
  );

  // --- Self channel setup ---

  const setupSelfChannel = useCallback(() => {
    if (!enabled || !localNodeId) return;
    if (selfDestroyedRef.current) return;
    if (selfChRef.current) return; // Already open.

    let ch: RealtimeChannel;
    try {
      // Use the pre-computed hashed channel ID. Fall back to the raw nodeId
      // only if the hash has not been computed yet (should not happen since
      // the main lifecycle effect pre-computes all hashes before calling
      // setupSelfChannel, but the fallback prevents a hard crash).
      const channelSuffix = channelIdMapRef.current.get(localNodeId) ?? localNodeId;
      ch = supabase.channel(`${PRESENCE_CHAN_PREFIX}${channelSuffix}`, {
        config: {
          presence: { key: localNodeId },
          broadcast: { self: false },
        },
      });
    } catch {
      // Supabase client threw synchronously. Schedule a retry.
      if (selfDestroyedRef.current) return;
      const retries = ++selfRetriesRef.current;
      if (retries > MAX_RETRIES) return;
      selfRetryTimerRef.current = setTimeout(() => {
        selfRetryTimerRef.current = null;
        if (!selfDestroyedRef.current) setupSelfChannelRef.current();
      }, backoffMs(retries));
      return;
    }

    // Assign the ref BEFORE subscribe so that if the callback fires
    // synchronously the `selfChRef.current === ch` identity check is correct.
    selfChRef.current = ch;

    ch
      .on(
        "broadcast",
        { event: "trusted-connect" },
        ({ payload }: { payload: unknown }) => {
          const validated = validateTrustedConnect(payload);
          if (!validated) return;
          const { fromNodeId, targetNodeId, sessionId } = validated;
          // Reject if not addressed to us or sender is not trusted.
          if (targetNodeId !== localNodeId) return;
          if (!trustedSetRef.current.has(fromNodeId)) return;
          onTrustedConnectRef.current?.(fromNodeId, sessionId);
        },
      )
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          selfRetriesRef.current = 0;
          selfSubscribedRef.current = true;
          await trackSelf(ch);
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          // Treat CLOSED the same as an error: attempt to reconnect.
          // Browsers can close channels silently (e.g. during suspend or a
          // brief network drop) without firing CHANNEL_ERROR first.
          selfSubscribedRef.current = false;
          // Guard: if teardownSelfChannel already cleared the ref, skip — that
          // function already called removeChannel and we must not call it again.
          // Clear the ref FIRST before calling removeChannel so that any
          // re-entrant CLOSED callback (fired synchronously by Supabase) sees
          // a null ref and returns early instead of recursing into stack overflow.
          if (selfChRef.current !== ch) return;
          selfChRef.current = null;
          try {
            supabase.removeChannel(ch);
          } catch {}
          if (selfDestroyedRef.current) return;
          const retries = ++selfRetriesRef.current;
          if (retries > MAX_RETRIES) return;
          selfRetryTimerRef.current = setTimeout(() => {
            selfRetryTimerRef.current = null;
            if (!selfDestroyedRef.current) setupSelfChannelRef.current();
          }, backoffMs(retries));
        }
      });
  }, [enabled, localNodeId, trackSelf]);

  setupSelfChannelRef.current = setupSelfChannel;

  const teardownSelfChannel = useCallback(() => {
    if (selfRetryTimerRef.current) {
      clearTimeout(selfRetryTimerRef.current);
      selfRetryTimerRef.current = null;
    }
    const ch = selfChRef.current;
    if (ch) {
      // Clear ref FIRST — same re-entrancy guard as removePeerChannel.
      selfChRef.current = null;
      selfSubscribedRef.current = false;
      void ch.untrack().catch(() => {});
      try {
        supabase.removeChannel(ch);
      } catch {}
    }
    selfSubscribedRef.current = false;
  }, []);

  // --- Peer channel setup ---

  const setupPeerChannel = useCallback(
    (nodeId: string) => {
      if (!enabled || nodeId === localNodeId) return;
      if (peerChRef.current.has(nodeId)) return; // Already open.

      let ch: RealtimeChannel;
      try {
        // Use the pre-computed hashed channel ID (see channelIdMapRef).
        // The fallback to raw nodeId covers the edge case where the hash is
        // not yet in the map, e.g. if setupPeerChannel is called directly
        // before the incremental effect's async hash finishes.
        const channelSuffix = channelIdMapRef.current.get(nodeId) ?? nodeId;
        ch = supabase.channel(`${PRESENCE_CHAN_PREFIX}${channelSuffix}`, {
          config: {
            presence: { key: nodeId },
            broadcast: { self: false },
          },
        });
      } catch {
        // Supabase client threw synchronously. Schedule a retry.
        const retries = (peerRetriesRef.current.get(nodeId) ?? 0) + 1;
        if (retries > MAX_RETRIES) {
          peerRetriesRef.current.delete(nodeId);
          return;
        }
        peerRetriesRef.current.set(nodeId, retries);
        const timer = setTimeout(() => {
          peerTimerRef.current.delete(nodeId);
          if (trustedSetRef.current.has(nodeId)) {
            setupPeerChannelRef.current(nodeId);
          }
        }, backoffMs(retries));
        peerTimerRef.current.set(nodeId, timer);
        return;
      }

      // Assign ref BEFORE subscribe so the identity check in the error handler
      // is correct even if the callback fires synchronously.
      peerChRef.current.set(nodeId, ch);

      // syncOnline checks whether the peer's own presence key appears in the
      // channel state. Using `nodeId in state` rather than
      // `Object.keys(state).length > 0` prevents false-online results caused
      // by any other metadata that may exist on the channel.
      const syncOnline = () => {
        const state = ch.presenceState();
        const presences = state[
          nodeId as keyof typeof state
        ] as Array<Record<string, unknown>> | undefined;
        const online = Array.isArray(presences) && presences.length > 0;
        if (online) {
          onlineSetRef.current.add(nodeId);
          const caps = parseCapabilities(presences[0]?.capabilities);
          // Always update the caps entry when a peer is online: set it if
          // non-empty, delete it if empty. Without the delete branch, stale
          // caps from a previous session survive a reconnect where the peer
          // re-announces with empty capabilities (e.g. permissions revoked).
          if (caps.length > 0) {
            peerCapsMapRef.current.set(nodeId, caps);
          } else {
            peerCapsMapRef.current.delete(nodeId);
          }
        } else {
          onlineSetRef.current.delete(nodeId);
          peerCapsMapRef.current.delete(nodeId);
        }
        flushOnlineSet();
        flushPeerCaps();
      };

      ch
        .on("presence", { event: "sync" }, syncOnline)
        .on(
          "presence",
          { event: "join" },
          (payload: {
            key: string;
            newPresences?: Array<Record<string, unknown>>;
          }) => {
            if (payload.key === nodeId) {
              onlineSetRef.current.add(nodeId);
              const caps = parseCapabilities(
                payload.newPresences?.[0]?.capabilities,
              );
              // Always update the caps entry on join: set if non-empty, delete
              // if empty. Without the delete branch, stale caps from a prior
              // session survive if the missed-leave + rejoin path is taken and
              // the peer re-announces with empty capabilities.
              if (caps.length > 0) {
                peerCapsMapRef.current.set(nodeId, caps);
              } else {
                peerCapsMapRef.current.delete(nodeId);
              }
              flushOnlineSet();
              flushPeerCaps();
            }
          },
        )
        .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
          if (key === nodeId) {
            onlineSetRef.current.delete(nodeId);
            peerCapsMapRef.current.delete(nodeId);
            flushOnlineSet();
            flushPeerCaps();
          }
        })
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            peerRetriesRef.current.set(nodeId, 0);
            peerSubscribedRef.current.add(nodeId);
            syncOnline();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            // Treat CLOSED the same as an error so a silently closed channel
            // triggers a reconnect rather than staying dead indefinitely.
            onlineSetRef.current.delete(nodeId);
            // Clear capabilities: we can no longer verify they are current.
            // The peer will re-announce fresh capabilities when the channel
            // reconnects and syncOnline runs.
            peerCapsMapRef.current.delete(nodeId);
            flushOnlineSet();
            flushPeerCaps();
            peerSubscribedRef.current.delete(nodeId);
            // Guard: if removePeerChannel already cleared the ref, skip removal
            // here — it already called removeChannel and a second call would
            // fire CLOSED again, recurse, and overflow the call stack.
            // Clear the ref FIRST before calling removeChannel for the same
            // re-entrancy reason (see removePeerChannel for the full comment).
            if (peerChRef.current.get(nodeId) !== ch) return;
            peerChRef.current.delete(nodeId);
            try {
              supabase.removeChannel(ch);
            } catch {}
            const retries = (peerRetriesRef.current.get(nodeId) ?? 0) + 1;
            if (retries > MAX_RETRIES) {
              peerRetriesRef.current.delete(nodeId);
              return;
            }
            peerRetriesRef.current.set(nodeId, retries);
            const timer = setTimeout(() => {
              peerTimerRef.current.delete(nodeId);
              if (trustedSetRef.current.has(nodeId)) {
                setupPeerChannelRef.current(nodeId);
              }
            }, backoffMs(retries));
            peerTimerRef.current.set(nodeId, timer);
          }
        });
    },
    [enabled, localNodeId, flushOnlineSet, flushPeerCaps],
  );

  setupPeerChannelRef.current = setupPeerChannel;

  // --- Main lifecycle effect ---
  // Runs when identity or enabled flag changes. Creates the self channel and
  // subscribes to channels for the current trusted peer set.

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !localNodeId) return;

    selfDestroyedRef.current = false;
    selfRetriesRef.current = 0;

    // Compute hashed channel IDs for this device and all current trusted peers
    // before opening any Supabase channels. All SHA-256 digests run in parallel
    // (typically < 1 ms each) so the delay before channels open is imperceptible.
    // The local flag prevents the async continuation from running if the effect
    // was cleaned up before the hashes resolved (e.g. rapid enabled toggles).
    let setupAborted = false;
    const peerIdsForSetup = [...trustedSetRef.current].filter(id => id !== localNodeId);
    const allIdsForSetup = [localNodeId, ...peerIdsForSetup];

    void Promise.all(allIdsForSetup.map(id => getPresenceChannelId(id))).then(hashes => {
      if (setupAborted || selfDestroyedRef.current) return;
      allIdsForSetup.forEach((id, i) => channelIdMapRef.current.set(id, hashes[i]));
      setupSelfChannelRef.current();
      for (const id of peerIdsForSetup) {
        if (trustedSetRef.current.has(id)) setupPeerChannelRef.current(id);
      }
    }).catch(err => {
      // SubtleCrypto unavailable or blocked (e.g. non-secure context, browser bug).
      // Channels cannot be named without a hash, so presence is unavailable for
      // this session. Log the error so it is visible in production diagnostics.
      console.error("[QB] presence: channel ID hash failed during startup — presence disabled", err);
    });

    return () => {
      setupAborted = true;
      mountedRef.current = false;
      selfDestroyedRef.current = true;
      teardownSelfChannel();
      for (const id of [...peerChRef.current.keys()]) {
        removePeerChannel(id, false);
      }
      onlineSetRef.current.clear();
      setOnlineNodeIds(new Set());
      peerCapsMapRef.current.clear();
      setPeerCapabilities(new Map());

      // Cancel any pending online rebuild timer.
      if (onlineRebuildTimerRef.current) {
        clearTimeout(onlineRebuildTimerRef.current);
        onlineRebuildTimerRef.current = null;
      }

      // Clean up any lingering transient send channels.
      for (const ch of transientChannelsRef.current) {
        try {
          supabase.removeChannel(ch);
        } catch {}
      }
      transientChannelsRef.current.clear();
    };
    // Intentionally excludes trustedNodeIds: the incremental effect below
    // handles peer channel adds/removes without full teardown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, localNodeId]);

  // --- Incremental peer channel management ---
  // Adds channels for newly trusted peers; removes them for untrusted peers;
  // cleans up stale online entries. Does not teardown the self channel.

  useEffect(() => {
    const newSet = new Set(trustedNodeIds);
    trustedSetRef.current = newSet;

    if (!enabled || !localNodeId) return;

    for (const id of trustedNodeIds) {
      if (id !== localNodeId && !peerChRef.current.has(id)) {
        if (channelIdMapRef.current.has(id)) {
          // Hash already cached from the main effect's startup batch; set up
          // the peer channel synchronously.
          setupPeerChannel(id);
        } else {
          // Peer was added after initial setup (e.g. user trusted a new device
          // while the panel was open). Compute the hash, cache it, then set up.
          void getPresenceChannelId(id).then(hash => {
            channelIdMapRef.current.set(id, hash);
            // Re-check: the peer may have been untrusted during the async gap.
            if (trustedSetRef.current.has(id) && !peerChRef.current.has(id)) {
              setupPeerChannelRef.current(id);
            }
          }).catch(err => {
            // SubtleCrypto failure: peer channel cannot be opened without a hash.
            // The peer will remain invisible in the online list until the next
            // full presence rebuild (e.g. network recovery or page reload).
            console.warn("[QB] presence: channel ID hash failed for incremental peer", id, err);
          });
        }
      }
    }

    for (const id of [...peerChRef.current.keys()]) {
      if (!newSet.has(id)) removePeerChannel(id);
    }

    for (const id of [...onlineSetRef.current]) {
      if (!newSet.has(id)) onlineSetRef.current.delete(id);
    }
    for (const id of [...peerCapsMapRef.current.keys()]) {
      if (!newSet.has(id)) peerCapsMapRef.current.delete(id);
    }
    flushOnlineSet();
    flushPeerCaps();
  }, [trustedNodeIds, enabled, localNodeId, setupPeerChannel, removePeerChannel, flushOnlineSet, flushPeerCaps]);

  // --- Visibility: re-track presence after browser suspend/tab hide ---
  // Browsers quietly release presence tracking during suspend without firing
  // a CHANNEL_ERROR, so we proactively re-announce when the tab regains focus.
  //
  // We also rebuild any peer channels that died during suspension. After a
  // long phone lock screen the backoff retries (up to MAX_RETRIES) can exhaust
  // before the tab returns, leaving peer channels permanently dead until the
  // next network event. Rebuilding them here ensures presence recovers as soon
  // as the screen turns back on, satisfying the Phase 2.5 kill criteria
  // ("presence survives a mobile network handoff without user action").

  useEffect(() => {
    if (!enabled || !localNodeId) return;
    const handler = () => {
      if (document.visibilityState === "visible") {
        // Re-announce self presence if the self channel is still subscribed.
        const ch = selfChRef.current;
        if (ch && selfSubscribedRef.current) void trackSelf(ch);

        // Rebuild any peer channels that died silently during suspend. Only
        // targets peers whose channel is no longer in peerChRef (meaning it
        // was removed by the CLOSED/error handler or never opened). Peers with
        // live channels are untouched. The retry counter is reset before each
        // rebuild so the fresh channel gets a full backoff budget rather than
        // inheriting exhausted retries from the previous attempt.
        for (const id of trustedSetRef.current) {
          if (id !== localNodeId && !peerChRef.current.has(id)) {
            peerRetriesRef.current.delete(id);
            setupPeerChannelRef.current(id);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enabled, localNodeId, trackSelf]);

  // --- Network events: rebuild all channels on recovery ---

  useEffect(() => {
    if (!enabled || !localNodeId) return;

    const handleOffline = () => {
      // Immediately mark all peers as offline and clear their capabilities;
      // they will re-announce both when they rejoin on network recovery.
      onlineSetRef.current.clear();
      peerCapsMapRef.current.clear();
      flushOnlineSet();
      flushPeerCaps();
    };

    const handleOnline = () => {
      // Cancel any previously scheduled rebuild to prevent stacking multiple
      // rebuilds when the online event fires more than once in quick succession.
      if (onlineRebuildTimerRef.current) {
        clearTimeout(onlineRebuildTimerRef.current);
      }

      // Wait briefly for the network to stabilise, then rebuild everything.
      onlineRebuildTimerRef.current = setTimeout(() => {
        onlineRebuildTimerRef.current = null;
        if (selfDestroyedRef.current) return;

        teardownSelfChannel();
        for (const id of [...peerChRef.current.keys()]) {
          // updateOnline=false: we clear the sets below in one batch to avoid
          // a flush per peer that would schedule N re-renders instead of one.
          removePeerChannel(id, false);
        }
        onlineSetRef.current.clear();
        // Clear capabilities: they are stale — peers will re-announce fresh
        // capabilities when their channels reconnect and syncOnline runs.
        peerCapsMapRef.current.clear();
        flushOnlineSet();
        flushPeerCaps();

        selfRetriesRef.current = 0;
        setupSelfChannelRef.current();
        for (const id of trustedSetRef.current) {
          if (id !== localNodeId) setupPeerChannelRef.current(id);
        }
      }, 1500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, localNodeId, teardownSelfChannel, removePeerChannel, flushOnlineSet, flushPeerCaps]);

  // --- sendTrustedConnect ---
  // Broadcasts on the TARGET's channel. We are subscribed to it as a peer
  // channel, so the channel object should already be in peerChRef. The
  // transient fallback handles the rare edge case where the channel has not
  // opened yet (e.g. very early in startup).

  const sendTrustedConnect = useCallback(
    (targetNodeId: string, sessionId: string) => {
      if (!mountedRef.current) return;
      if (!targetNodeId || !sessionId) return;
      if (!trustedSetRef.current.has(targetNodeId)) return;

      const payload = { fromNodeId: localNodeId, targetNodeId, sessionId };

      // Prefer the persistent peer channel if it is currently subscribed.
      const ch = peerChRef.current.get(targetNodeId);
      if (ch && peerSubscribedRef.current.has(targetNodeId)) {
        void ch
          .send({ type: "broadcast", event: "trusted-connect", payload })
          .catch(() => {
            // Silent: the transient path below would have the same reliability
            // story. Presence-level online/offline already guards the UI.
          });
        return;
      }

      // Transient channel: subscribe to get a Realtime connection, send, then
      // clean up after a short delay so the message has time to flush.
      // Compute the hashed channel ID for the target before creating the channel
      // so the transient channel uses the same naming as the persistent peer
      // channel that the target device subscribes to for its self-presence.
      void getPresenceChannelId(targetNodeId).then(targetChannelId => {
        if (!mountedRef.current) return;
        let tmp: RealtimeChannel;
        try {
          tmp = supabase.channel(`${PRESENCE_CHAN_PREFIX}${targetChannelId}`, {
            config: { broadcast: { self: false } },
          });
        } catch {
          return;
        }

        transientChannelsRef.current.add(tmp);

        tmp.subscribe((status: string) => {
          if (!mountedRef.current) return;
          if (status === "SUBSCRIBED") {
            void tmp
              .send({ type: "broadcast", event: "trusted-connect", payload })
              .catch(() => {})
              .finally(() => {
                const timer = setTimeout(() => {
                  transientChannelsRef.current.delete(tmp);
                  try {
                    supabase.removeChannel(tmp);
                  } catch {}
                }, 3000);
                // If the hook unmounts before the timer fires, the main effect
                // cleanup iterates transientChannelsRef and removes the channel.
                void timer;
              });
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            transientChannelsRef.current.delete(tmp);
            try {
              supabase.removeChannel(tmp);
            } catch {}
          }
        });
      }).catch(err => {
        // SubtleCrypto unavailable or blocked. Cannot compute the target channel
        // name so the trusted-connect broadcast is silently dropped. The
        // caller's online/offline guard should prevent attempts to reach an
        // offline peer, so this path is only hit under extraordinary conditions
        // (e.g. non-secure context, browser crypto policy).
        console.warn("[QB] presence: sendTrustedConnect hash failed for target", targetNodeId, err);
      });
    },
    [localNodeId],
  );

  return { onlineNodeIds, peerCapabilities, sendTrustedConnect };
}
