// Trusted nodes CRUD layer for QuickBridgeDB.
//
// A "node" is any browser instance that has been explicitly trusted by the
// local user after a real QR-paired session. The term "node" is used
// internally because the model extends beyond browsers (Pi, NAS, AI server)
// in later phases without requiring a rename. The UI surfaces these as
// "trusted devices" — language users understand.
//
// Trust levels are typed as a union from the start so future phases can add
// "temporary", "expired", and "blocked" without a schema migration.
// Phase 2 only writes and reads "trusted"; the other values exist in the
// type so TypeScript catches unhandled cases when they're added.

import { openQbDb, TRUSTED_STORE } from "./qb-db";
import type { DeviceKind } from "./device";

export const TRUSTED_NODES_CHANNEL = "qb-trusted-nodes";
// Singleton channel for broadcasting mutations
const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(TRUSTED_NODES_CHANNEL) : null;


// All capability identifiers.
// Phase 2 presence capabilities: files, clipboard, camera, microphone, location, storage, gpu, display.
// Phase 3 Continuity capabilities (finding 8 -- advertised in presence, validated at execution time):
//   browser.open     -- device can open URLs in a new tab (window.open).
//   filesystem.write -- device supports File System Access API (showSaveFilePicker).
//   notifications    -- device supports the Notifications API.
export type Capability =
  | "files"
  | "clipboard"
  | "clipboard.write"     // Phase 3 Continuity: device can receive paste intents
  | "camera"
  | "microphone"
  | "location"
  | "storage"
  | "gpu"
  | "display"
  | "browser.open"
  | "filesystem.write"
  | "notifications";

export type TrustLevel = "trusted" | "temporary" | "expired" | "blocked" | "unknown";

export type TrustedNode = {
  // IDB keyPath
  nodeId: string;
  // Peer's ECDSA P-256 public key in JWK format. Used to verify challenge
  // responses during one-click connect handshakes.
  publicKeyJwk: JsonWebKey;
  // Display name at last contact. Updated on every successful session so the
  // list stays fresh without a separate "sync" step.
  nickname: string;
  deviceKind: DeviceKind;
  trustLevel: TrustLevel;
  // What the peer advertised at time of last contact. Marked stale-by-design:
  // only used for offline display labels. Live capabilities always come from
  // the presence payload when the device is online.
  capabilitySnapshot: Capability[];
  // Wall-clock ms when this node was last seen online or completed a transfer.
  lastSeen: number;
  // Wall-clock ms when the trust record was first created.
  createdAt: number;
};

// Maximum trusted nodes retained. When the cap is hit, the least-recently-seen
// node is evicted before the new one is written. 50 is generous for personal
// use while keeping the IDB store small.
const MAX_TRUSTED_NODES = 50;

export async function getTrustedNode(nodeId: string): Promise<TrustedNode | null> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readonly");
    // Reject on transaction-level failures so the promise never hangs.
    tx.onerror = () => reject(tx.error ?? new Error("getTrustedNode transaction error"));
    tx.onabort = () =>
      reject(tx.error ?? new DOMException("getTrustedNode transaction aborted", "AbortError"));
    const req = tx.objectStore(TRUSTED_STORE).get(nodeId);
    req.onsuccess = () => resolve((req.result as TrustedNode) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTrustedNodes(): Promise<TrustedNode[]> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readonly");
    // Reject on transaction-level failures so the promise never hangs.
    tx.onerror = () => reject(tx.error ?? new Error("getAllTrustedNodes transaction error"));
    tx.onabort = () =>
      reject(tx.error ?? new DOMException("getAllTrustedNodes transaction aborted", "AbortError"));
    const req = tx.objectStore(TRUSTED_STORE).getAll();
    req.onsuccess = () => {
      const nodes = (req.result as TrustedNode[]) ?? [];
      // Sort descending by lastSeen so the most recent devices appear first.
      // Guard against malformed lastSeen values so sort remains stable.
      nodes.sort((a, b) => {
        const at = typeof a.lastSeen === "number" && isFinite(a.lastSeen) ? a.lastSeen : 0;
        const bt = typeof b.lastSeen === "number" && isFinite(b.lastSeen) ? b.lastSeen : 0;
        return bt - at;
      });
      resolve(nodes);
    };
    req.onerror = () => reject(req.error);
  });
}

// Writes a node record, replacing any existing entry for the same nodeId.
// Before writing, enforces the MAX_TRUSTED_NODES cap by evicting the
// least-recently-seen node if necessary.
export async function upsertTrustedNode(node: TrustedNode): Promise<void> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readwrite");

    // Resolve/reject on transaction boundary rather than on individual request
    // callbacks. This ensures the promise only settles once the engine has
    // durably committed (or rolled back) all writes in this transaction.
    // was saved when it wasn't.
    tx.oncomplete = () => {
      bc?.postMessage({ type: "MUTATED" });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));

    const store = tx.objectStore(TRUSTED_STORE);

    // Check if this nodeId already exists to skip the cap+evict logic.
    const getReq = store.get(node.nodeId);
    getReq.onsuccess = () => {
      const alreadyExists = !!getReq.result;
      if (alreadyExists) {
        // Overwrite in place; no cap check needed.
        store.put(node);
        return;
      }
      // New node: check count and evict if at cap.
      const countReq = store.count();
      countReq.onsuccess = () => {
        const count = countReq.result;
        if (count < MAX_TRUSTED_NODES) {
          store.put(node);
          return;
        }
        // At cap: find and delete the least-recently-seen entry.
        // The "lastSeen" index cursor in ascending order gives us the oldest first.
        const cursorReq = store.index("lastSeen").openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            cursor.delete();
          }
          // Whether or not we found a cursor, write the new node. If the count
          // was somehow wrong (cursor === null), we just add beyond the cap
          // rather than silently dropping the record.
          store.put(node);
        };
        // cursorReq.onerror propagates to tx.onerror automatically.
      };
      // countReq.onerror propagates to tx.onerror automatically.
    };
    // getReq.onerror propagates to tx.onerror automatically.
  });
}

export async function removeTrustedNode(nodeId: string): Promise<void> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readwrite");
    tx.oncomplete = () => {
      bc?.postMessage({ type: "MUTATED" });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    tx.objectStore(TRUSTED_STORE).delete(nodeId);
  });
}

// Updates only the lastSeen timestamp and, optionally, the nickname and
// capability snapshot. Called after every successful session with a trusted
// peer so the "last seen" label in the UI stays accurate without a full
// upsert (which would require re-reading the full record first).
export async function touchTrustedNode(
  nodeId: string,
  lastSeen: number,
  nickname?: string,
  capabilitySnapshot?: Capability[],
): Promise<void> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readwrite");
    tx.oncomplete = () => {
      bc?.postMessage({ type: "MUTATED" });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));

    const store = tx.objectStore(TRUSTED_STORE);
    const getReq = store.get(nodeId);
    getReq.onsuccess = () => {
      const existing = getReq.result as TrustedNode | undefined;
      if (!existing) {
        // Node no longer in the store; nothing to update. The transaction
        // will auto-commit with no writes, which fires tx.oncomplete → resolve.
        return;
      }
      const updated: TrustedNode = {
        ...existing,
        lastSeen,
        ...(nickname !== undefined ? { nickname } : {}),
        ...(capabilitySnapshot !== undefined ? { capabilitySnapshot } : {}),
      };
      store.put(updated);
    };
  });
}

// Updates only the display nickname. Used by the /devices management UI.
export async function renameTrustedNode(nodeId: string, nickname: string): Promise<void> {
  const db = await openQbDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRUSTED_STORE, "readwrite");
    tx.oncomplete = () => {
      bc?.postMessage({ type: "MUTATED" });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));

    const store = tx.objectStore(TRUSTED_STORE);
    const getReq = store.get(nodeId);
    getReq.onsuccess = () => {
      const existing = getReq.result as TrustedNode | undefined;
      if (!existing) return; // Nothing to rename; tx auto-commits → resolve.
      store.put({ ...existing, nickname });
    };
  });
}
