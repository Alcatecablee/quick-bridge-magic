// Recursive drop expander: turns a DataTransferItemList containing files and
// folders into a flat File[]. Folder names are preserved as a path prefix in
// File.name so the receiver can reconstruct hierarchy by name.

interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (cb: (f: File) => void, err?: (e: unknown) => void) => void;
  createReader?: () => FileSystemDirectoryReaderLike;
}

interface FileSystemDirectoryReaderLike {
  readEntries: (cb: (entries: FileSystemEntryLike[]) => void, err?: (e: unknown) => void) => void;
}

const MAX_ENTRIES = 5000; // safety cap

async function entryToFile(entry: FileSystemEntryLike): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!entry.file) return reject(new Error("not a file"));
    entry.file(
      (f) => resolve(f),
      (e) => reject(e),
    );
  });
}

async function readAllEntries(dir: FileSystemEntryLike): Promise<FileSystemEntryLike[]> {
  const reader = dir.createReader?.();
  if (!reader) return [];
  const out: FileSystemEntryLike[] = [];
  // readEntries returns at most ~100 entries per call; loop until empty batch.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch: FileSystemEntryLike[] = await new Promise((resolve, reject) => {
      reader.readEntries(
        (entries) => resolve(entries),
        (e) => reject(e),
      );
    });
    if (!batch || batch.length === 0) break;
    out.push(...batch);
    if (out.length > MAX_ENTRIES) break;
  }
  return out;
}

async function walk(
  entry: FileSystemEntryLike,
  prefix: string,
  out: File[],
  state: { capped: boolean },
): Promise<void> {
  if (out.length >= MAX_ENTRIES) {
    state.capped = true;
    return;
  }
  if (entry.isFile) {
    try {
      const f = await entryToFile(entry);
      const relName = prefix ? `${prefix}${f.name}` : f.name;
      if (relName === f.name) {
        out.push(f);
      } else {
        // Re-wrap to embed the folder path in the visible name; bytes are zero-copy.
        const renamed = new File([f], relName, { type: f.type, lastModified: f.lastModified });
        out.push(renamed);
      }
    } catch {}
    return;
  }
  if (entry.isDirectory) {
    const children = await readAllEntries(entry);
    const nextPrefix = `${prefix}${entry.name}/`;
    for (const child of children) {
      await walk(child, nextPrefix, out, state);
    }
  }
}

export interface ExpandResult {
  files: File[];
  // True when the entry count hit the MAX_ENTRIES safety cap and some files
  // were silently omitted. The caller should surface a warning to the user.
  capped: boolean;
  // True when items were present in the DataTransfer but no usable files
  // could be extracted (e.g. the user dropped an empty folder). Lets the
  // caller distinguish a real empty drop from a no-op event.
  hadItems: boolean;
}

export async function expandDataTransfer(dt: DataTransfer): Promise<ExpandResult> {
  const out: File[] = [];
  const state = { capped: false };
  const items = dt.items;
  if (items && items.length > 0) {
    const entries: FileSystemEntryLike[] = [];
    const looseFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== "file") continue;
      const entry =
        (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntryLike | null })
          .webkitGetAsEntry?.() ?? null;
      if (entry) {
        entries.push(entry);
      } else {
        const f = item.getAsFile();
        if (f) looseFiles.push(f);
      }
    }
    for (const e of entries) await walk(e, "", out, state);
    if (out.length === 0 && looseFiles.length === 0) {
      // Some browsers return only files, no entries.
      const flat = Array.from(dt.files);
      return { files: flat, capped: false, hadItems: flat.length > 0 || entries.length > 0 };
    }
    out.push(...looseFiles);
    return { files: out, capped: state.capped, hadItems: true };
  }
  const flat = Array.from(dt.files);
  return { files: flat, capped: false, hadItems: flat.length > 0 };
}

// For a paste event: returns any files (image/png from screenshots, plus any
// text payload as a separate string).
export interface PasteResult {
  files: File[];
  text: string | null;
  // True when the clipboard had at least one item, even if it wasn't a
  // file or plain-text. Lets the caller show a "nothing to send" hint
  // rather than silently ignoring the paste gesture.
  hadContent: boolean;
}

export async function readPaste(e: ClipboardEvent): Promise<PasteResult> {
  const dt = e.clipboardData;
  if (!dt) return { files: [], text: null, hadContent: false };
  const files: File[] = [];
  let itemCount = 0;
  if (dt.items && dt.items.length > 0) {
    itemCount = dt.items.length;
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
  } else if (dt.files && dt.files.length > 0) {
    itemCount = dt.files.length;
    files.push(...Array.from(dt.files));
  }
  let text: string | null = null;
  try {
    const t = dt.getData("text/plain");
    if (t) text = t;
  } catch {}
  const hadContent = itemCount > 0 || text !== null;
  return { files, text, hadContent };
}
