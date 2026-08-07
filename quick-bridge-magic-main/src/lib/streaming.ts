// Helpers around the File System Access API for stream-to-disk receive.
// Only Chromium-family browsers (Chrome, Edge, Opera, Brave, Arc) ship this;
// on everything else we fall back to in-memory Blob assembly.

export interface DirectoryHandleLike {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileSystemFileHandle>;
  getDirectoryHandle?: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<DirectoryHandleLike>;
  removeEntry?: (name: string, options?: { recursive?: boolean }) => Promise<void>;
  queryPermission?: (
    descriptor?: { mode?: "read" | "readwrite" },
  ) => Promise<PermissionState>;
  requestPermission?: (
    descriptor?: { mode?: "read" | "readwrite" },
  ) => Promise<PermissionState>;
  name?: string;
}

export interface SaveDirectory {
  handle: DirectoryHandleLike;
  label: string;
}

export function streamToDiskSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof (window as unknown as { showDirectoryPicker?: () => unknown }).showDirectoryPicker ===
    "function"
  );
}

// --- IndexedDB persistence for the chosen save directory ----------------------
// FileSystemDirectoryHandle is structured-cloneable, so we can stash the
// handle across page refreshes. The browser still gates actual access behind
// a permission grant, which we re-check on load.

const DB_NAME = "qb-streaming";
const STORE = "handles";
const HANDLE_KEY = "saveDirectory";
// Tracks FSA transfers that are currently receiving data so we can clean up
// orphaned partial files if the page is refreshed mid-transfer.
const TRANSFERS_STORE = "transfers";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    // v2: adds the "transfers" store for in-flight FSA transfer tracking.
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(TRANSFERS_STORE)) {
        // keyPath:"id" means the record itself carries the key (transfer ID).
        db.createObjectStore(TRANSFERS_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- In-flight FSA transfer tracking -----------------------------------------
// When a receiver that streams to disk refreshes mid-transfer, the writable
// stream is gone but the partial file stays on disk. Without this tracking,
// the sender's resume attempt causes the receiver to ack offset:0, a fresh
// writable opens, collision detection appends a counter suffix, and the user
// ends up with an orphaned "file (1).ext" alongside the restarted "file.ext".
//
// We persist a lightweight record when a writable opens and clear it on
// success. On the next resume attempt (resumeFrom > 0, no in-memory buffer),
// we look up the record, delete the orphaned file, then ack offset:0 so the
// restart writes to the original filename without a suffix.

export interface InFlightRecord {
  id: string;        // transfer ID (IDB key)
  finalName: string; // actual on-disk path (e.g. "folder/sub/file.txt")
  size: number;      // expected total bytes
  ts: number;        // unix ms for stale-entry pruning
}

/** Persist an opened FSA transfer. Call immediately after createWritableForName. */
export async function persistInFlightTransfer(
  id: string,
  finalName: string,
  size: number,
): Promise<void> {
  try {
    const db = await openDb();
    const record: InFlightRecord = { id, finalName, size, ts: Date.now() };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, "readwrite");
      tx.objectStore(TRANSFERS_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/** Remove the record for a completed or cleanly cancelled transfer. */
export async function clearInFlightTransfer(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, "readwrite");
      tx.objectStore(TRANSFERS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Look up an in-flight FSA transfer by transfer ID.
 * Returns undefined when not found or on any IDB error.
 */
export async function getInFlightTransfer(id: string): Promise<InFlightRecord | undefined> {
  try {
    const db = await openDb();
    return await new Promise<InFlightRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, "readonly");
      const req = tx.objectStore(TRANSFERS_STORE).get(id);
      req.onsuccess = () => resolve(req.result as InFlightRecord | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

/**
 * Delete all in-flight transfer records older than maxAgeMs (default 24 h).
 * Call on component mount to keep the store tidy; stale records accumulate
 * when the page closes after an abort without a clean clearInFlightTransfer.
 */
export async function pruneStaleInFlightTransfers(
  maxAgeMs = 24 * 60 * 60 * 1000,
): Promise<void> {
  try {
    const db = await openDb();
    const cutoff = Date.now() - maxAgeMs;
    const all = await new Promise<InFlightRecord[]>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, "readonly");
      const req = tx.objectStore(TRANSFERS_STORE).getAll();
      req.onsuccess = () => resolve(req.result as InFlightRecord[]);
      req.onerror = () => reject(req.error);
    });
    const stale = all.filter((r) => r.ts < cutoff);
    if (stale.length === 0) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, "readwrite");
      for (const r of stale) tx.objectStore(TRANSFERS_STORE).delete(r.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Remove a file at a slash-delimited path (e.g. "subfolder/file.txt") within
 * a directory handle. Navigates intermediate directories before removing the
 * leaf. Best-effort: silently ignores missing files or denied permission.
 */
export async function removeFileAtPath(
  dir: DirectoryHandleLike,
  path: string,
): Promise<void> {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return;
  let cursor: DirectoryHandleLike = dir;
  for (let i = 0; i < segments.length - 1; i++) {
    try {
      const next = await cursor.getDirectoryHandle?.(segments[i]);
      if (!next) return;
      cursor = next;
    } catch {
      return; // directory doesn't exist — nothing to clean up
    }
  }
  try {
    await cursor.removeEntry?.(segments[segments.length - 1]);
  } catch {}
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function persistDirectoryHandle(handle: DirectoryHandleLike): Promise<void> {
  try {
    const db = await openDb();
    await idbPut(db, HANDLE_KEY, handle);
  } catch {}
}

export async function clearPersistedDirectory(): Promise<void> {
  try {
    const db = await openDb();
    await idbDelete(db, HANDLE_KEY);
  } catch {}
}

// Returns the previously chosen save directory if the browser still
// considers the grant valid. If the permission is in "prompt" state the
// caller must invoke requestPersistedDirectoryPermission() from a user
// gesture - browsers will not auto-grant without one.
export async function loadPersistedDirectory(): Promise<{
  directory: SaveDirectory | null;
  needsPrompt: boolean;
  label: string | null;
}> {
  if (!streamToDiskSupported()) {
    return { directory: null, needsPrompt: false, label: null };
  }
  try {
    const db = await openDb();
    const handle = await idbGet<DirectoryHandleLike>(db, HANDLE_KEY);
    if (!handle) return { directory: null, needsPrompt: false, label: null };
    const label = handle.name ?? "selected folder";
    const state = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
    if (state === "granted") {
      return { directory: { handle, label }, needsPrompt: false, label };
    }
    if (state === "prompt") {
      return { directory: null, needsPrompt: true, label };
    }
    // denied: drop the stale handle so we don't keep prompting
    await idbDelete(db, HANDLE_KEY).catch(() => {});
    return { directory: null, needsPrompt: false, label: null };
  } catch {
    return { directory: null, needsPrompt: false, label: null };
  }
}

export async function requestPersistedDirectoryPermission(): Promise<SaveDirectory | null> {
  if (!streamToDiskSupported()) return null;
  try {
    const db = await openDb();
    const handle = await idbGet<DirectoryHandleLike>(db, HANDLE_KEY);
    if (!handle) return null;
    const state = await handle.requestPermission?.({ mode: "readwrite" });
    if (state === "granted") {
      return { handle, label: handle.name ?? "selected folder" };
    }
    if (state === "denied") {
      await idbDelete(db, HANDLE_KEY).catch(() => {});
    }
    return null;
  } catch {
    return null;
  }
}

export async function pickSaveDirectory(): Promise<SaveDirectory | null> {
  if (!streamToDiskSupported()) return null;
  try {
    const handle = await (
      window as unknown as {
        showDirectoryPicker: (opts?: {
          mode?: "read" | "readwrite";
          id?: string;
        }) => Promise<DirectoryHandleLike>;
      }
    ).showDirectoryPicker({ mode: "readwrite", id: "quickbridge-saves" });
    void persistDirectoryHandle(handle);
    return { handle, label: handle.name ?? "selected folder" };
  } catch {
    return null;
  }
}

// Soft pre-check before accepting a large incoming file. Browsers report
// the per-origin storage quota, which on Chromium maps roughly to free
// disk space (typically ~60% of free space). It is best-effort: if the
// estimate is unavailable we return null and the caller proceeds.
export async function estimateFreeSpace(): Promise<number | null> {
  try {
    const nav = navigator as Navigator & {
      storage?: { estimate?: () => Promise<{ usage?: number; quota?: number }> };
    };
    if (!nav.storage?.estimate) return null;
    const est = await nav.storage.estimate();
    if (typeof est.quota === "number" && typeof est.usage === "number") {
      return Math.max(0, est.quota - est.usage);
    }
  } catch {}
  return null;
}

export interface OpenedWritable {
  writable: FileSystemWritableFileStream;
  finalName: string;
  // Best-effort removal of the (possibly partial) file from its parent
  // directory. Call after closing/aborting the writable.
  cleanup: () => Promise<void>;
}

// Resolve a file handle inside a directory, expanding any path segments
// embedded in the file name (e.g. "folder/sub/file.txt") so dropped folders
// land on disk with their structure preserved. Names are sanitized to avoid
// directory traversal.
//
// Collision handling: if a file with the same name already exists, we append
// a counter suffix ("report (2).pdf") rather than silently clobbering it.
// This prevents a second transfer of the same filename from truncating the
// first file's on-disk bytes.
//
// Cleanup tracking: we track each intermediate directory we CREATE (not ones
// that already existed) so the cleanup closure can remove them in reverse
// order after a cancellation, preventing empty subdirectories from piling up
// in the user's save folder.
export async function createWritableForName(
  dir: DirectoryHandleLike,
  name: string,
): Promise<OpenedWritable> {
  const safeSegments = name
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "." && s !== "..");
  if (safeSegments.length === 0) safeSegments.push("file");

  // Track (parent, name) pairs for directories we create so cleanup can
  // remove them in reverse order (deepest first). Directories that already
  // existed are skipped so we don't accidentally remove the user's own folders.
  const createdDirEntries: Array<{ parent: DirectoryHandleLike; name: string }> = [];

  let cursor = dir;
  for (let i = 0; i < safeSegments.length - 1; i++) {
    const seg = safeSegments[i];
    if (!cursor.getDirectoryHandle) throw new Error("getDirectoryHandle unsupported");
    const parentBeforeStep = cursor;
    // Probe whether this directory segment already exists.
    let existed = false;
    try {
      await parentBeforeStep.getDirectoryHandle?.(seg);
      existed = true;
    } catch {}
    const sub = await cursor.getDirectoryHandle(seg, { create: true });
    if (!existed) createdDirEntries.push({ parent: parentBeforeStep, name: seg });
    cursor = sub;
  }

  // Avoid clobbering an existing file: probe the directory for the target
  // name and, if it already exists, append a counter suffix. Cap at 99
  // iterations to bound the loop; beyond that we accept the TOCTOU risk.
  const rawFileName = safeSegments[safeSegments.length - 1];
  const dotIdx = rawFileName.lastIndexOf(".");
  const base = dotIdx > 0 ? rawFileName.slice(0, dotIdx) : rawFileName;
  const ext = dotIdx > 0 ? rawFileName.slice(dotIdx) : "";
  let fileName = rawFileName;
  for (let counter = 1; counter <= 99; counter++) {
    let exists = false;
    try {
      await cursor.getFileHandle(fileName);
      exists = true;
    } catch {}
    if (!exists) break;
    fileName = `${base} (${counter})${ext}`;
  }

  const handle = await cursor.getFileHandle(fileName, { create: true });
  const writable = await (handle as unknown as {
    createWritable: (opts?: {
      keepExistingData?: boolean;
    }) => Promise<FileSystemWritableFileStream>;
  }).createWritable({ keepExistingData: false });

  const leafParent = cursor;
  const leafName = fileName;
  const finalSegments = [...safeSegments.slice(0, -1), fileName];

  const cleanup = async () => {
    // Remove the leaf file first.
    try { await leafParent.removeEntry?.(leafName); } catch {}
    // Remove intermediate directories we created, deepest first. We use the
    // default non-recursive remove so a directory that already has other files
    // (placed there by a concurrent transfer or the user) is left intact.
    for (let i = createdDirEntries.length - 1; i >= 0; i--) {
      const { parent: p, name: n } = createdDirEntries[i];
      try { await p.removeEntry?.(n); } catch {}
    }
  };

  return { writable, finalName: finalSegments.join("/"), cleanup };
}
