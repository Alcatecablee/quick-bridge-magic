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

async function walk(entry: FileSystemEntryLike, prefix: string, out: File[]): Promise<void> {
  if (out.length > MAX_ENTRIES) return;
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
      await walk(child, nextPrefix, out);
    }
  }
}

export async function expandDataTransfer(dt: DataTransfer): Promise<File[]> {
  const out: File[] = [];
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
    for (const e of entries) await walk(e, "", out);
    if (out.length === 0 && looseFiles.length === 0) {
      // Some browsers return only files, no entries.
      return Array.from(dt.files);
    }
    out.push(...looseFiles);
    return out;
  }
  return Array.from(dt.files);
}

// For a paste event: returns any files (image/png from screenshots, plus any
// text payload as a separate string).
export interface PasteResult {
  files: File[];
  text: string | null;
}

export async function readPaste(e: ClipboardEvent): Promise<PasteResult> {
  const dt = e.clipboardData;
  if (!dt) return { files: [], text: null };
  const files: File[] = [];
  if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
  } else if (dt.files && dt.files.length > 0) {
    files.push(...Array.from(dt.files));
  }
  let text: string | null = null;
  try {
    const t = dt.getData("text/plain");
    if (t) text = t;
  } catch {}
  return { files, text };
}
