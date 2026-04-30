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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
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
export async function createWritableForName(
  dir: DirectoryHandleLike,
  name: string,
): Promise<OpenedWritable> {
  const safeSegments = name
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "." && s !== "..");
  if (safeSegments.length === 0) safeSegments.push("file");

  let cursor = dir;
  for (let i = 0; i < safeSegments.length - 1; i++) {
    const seg = safeSegments[i];
    if (!cursor.getDirectoryHandle) throw new Error("getDirectoryHandle unsupported");
    const sub = await cursor.getDirectoryHandle(seg, { create: true });
    cursor = sub;
  }
  const fileName = safeSegments[safeSegments.length - 1];
  const handle = await cursor.getFileHandle(fileName, { create: true });
  const writable = await (handle as unknown as {
    createWritable: (opts?: {
      keepExistingData?: boolean;
    }) => Promise<FileSystemWritableFileStream>;
  }).createWritable({ keepExistingData: false });
  const parent = cursor;
  const cleanup = async () => {
    try {
      await parent.removeEntry?.(fileName);
    } catch {}
  };
  return { writable, finalName: safeSegments.join("/"), cleanup };
}
