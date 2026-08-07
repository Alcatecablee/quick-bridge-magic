// QuickBridgeDB: shared IndexedDB connection for Phase 2+ persistent state.
//
// The database is separate from the existing "qb-streaming" database used for
// FSA transfer tracking. This keeps the Phase 1 streaming layer independent.
//
// Schema (v1):
//   identity      { id: "self", nodeId, privateKey, publicKeyJwk, createdAt }
//   trustedNodes  { nodeId, publicKeyJwk, nickname, deviceKind, trustLevel,
//                   capabilitySnapshot, lastSeen, createdAt }
//
// Object stores are created once here; both node-identity.ts and
// trusted-nodes-db.ts import openQbDb() from this module so the upgrade
// callback runs exactly once and neither module races to create stores.

export const QB_DB_NAME = "QuickBridgeDB";

// Exported so callers can detect the blocked scenario and surface a reload hint
// without string-matching on an opaque error message from inside this module.
export const QB_DB_BLOCKED_MESSAGE =
  "QuickBridgeDB upgrade blocked by another tab";
export const QB_DB_VERSION = 1;

export const IDENTITY_STORE = "identity";
export const TRUSTED_STORE = "trustedNodes";

let _db: IDBDatabase | null = null;
// In-flight singleton: prevents multiple concurrent indexedDB.open() calls
// from racing when openQbDb() is called before the first open settles.
let _openInFlight: Promise<IDBDatabase> | null = null;

export function openQbDb(): Promise<IDBDatabase> {
  // Return the cached connection if still open. IDB connections are
  // long-lived and survive across async operations in the same tab.
  if (_db) return Promise.resolve(_db);
  // Return the in-flight promise if a open is already in progress.
  if (_openInFlight) return _openInFlight;

  _openInFlight = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const req = indexedDB.open(QB_DB_NAME, QB_DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // identity store: always exactly one record with id="self"
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        db.createObjectStore(IDENTITY_STORE, { keyPath: "id" });
      }

      // trustedNodes store: one record per paired peer, keyed by nodeId
      if (!db.objectStoreNames.contains(TRUSTED_STORE)) {
        const store = db.createObjectStore(TRUSTED_STORE, { keyPath: "nodeId" });
        // Index by lastSeen for sorted display and LRU eviction
        store.createIndex("lastSeen", "lastSeen", { unique: false });
        // Index by trustLevel for filtered queries (e.g. show only "trusted")
        store.createIndex("trustLevel", "trustLevel", { unique: false });
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      // If the connection closes unexpectedly (e.g., database deleted in
      // DevTools), clear the cache so the next call re-opens cleanly.
      _db.onclose = () => { _db = null; };
      // If another tab opens a newer version of the DB, close this connection
      // gracefully so the upgrade can proceed. The next openQbDb() call in
      // this tab will re-open at the new version.
      _db.onversionchange = () => {
        _db?.close();
        _db = null;
      };
      resolve(_db);
    };

    req.onerror = () => reject(req.error ?? new Error("Failed to open QuickBridgeDB"));
    req.onblocked = () => {
      // Another tab has an open connection to an older version. Reject
      // with a clear message so callers can surface a reload hint.
      reject(new Error(QB_DB_BLOCKED_MESSAGE));
    };
  }).finally(() => {
    _openInFlight = null;
  });

  return _openInFlight;
}
