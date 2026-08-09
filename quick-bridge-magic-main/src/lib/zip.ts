// Client-side ZIP creation using fflate streaming API.
//
// Files are stored at level 0 (ZipPassThrough - no compression) because most
// file formats (images, video, audio, PDF, DOCX) are already compressed
// internally; a second pass would burn CPU without reducing size.
//
// Key properties of this implementation:
//   - Sequential file reads via ReadableStream: only one file's chunk is in RAM
//     at a time, not the entire batch. Peak input RAM = one browser chunk (~1 MB).
//   - Folder structure preserved via webkitRelativePath when available.
//   - AbortSignal support: cancellation is checked at each chunk boundary.
//   - Filename deduplication: colliding names get a (2), (3) ... suffix.

import { Zip, ZipPassThrough } from "fflate";

export async function zipFiles(
  files: File[],
  archiveName: string,
  signal?: AbortSignal,
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    // Typed as BlobPart[] so the File constructor accepts the array directly
    // without an intermediate copy. Uint8Array is a valid BlobPart (it is
    // an ArrayBufferView), so every push below is type-safe; the cast is
    // only needed because TypeScript 5.8 introduced a generic Uint8Array<T>
    // that is no longer directly assignable to BlobPart[].
    const chunks: BlobPart[] = [];

    const zip = new Zip((err: Error | null, dat: Uint8Array, final: boolean) => {
      if (err) { reject(err); return; }
      chunks.push(dat as unknown as BlobPart);
      if (final) {
        // Pass the chunks array directly to the File constructor rather than
        // concatenating into a single Uint8Array first. The Blob/File
        // constructor accepts BlobPart[] and lets the browser handle
        // concatenation internally (often via virtual-memory mapping), which
        // avoids allocating another copy of the entire zip output in JS heap.
        resolve(new File(chunks, archiveName, { type: "application/zip" }));
      }
    });

    const onAbort = () => { reject(new DOMException("Aborted", "AbortError")); };
    signal?.addEventListener("abort", onAbort, { once: true });

    (async () => {
      const seen = new Set<string>();

      for (const file of files) {
        if (signal?.aborted) return;

        // Preserve subfolder hierarchy when files come from a folder drag.
        // webkitRelativePath is "FolderName/sub/file.txt" for folder picks;
        // empty string for individual file picks, so fall back to file.name.
        const rawPath =
          ((file as File & { webkitRelativePath?: string }).webkitRelativePath?.trim()) ||
          file.name ||
          "file";

        // Deduplicate archive paths so no entry silently overwrites another.
        let archivePath = rawPath;
        if (seen.has(archivePath)) {
          const dotIdx = archivePath.lastIndexOf(".");
          const base = dotIdx > 0 ? archivePath.slice(0, dotIdx) : archivePath;
          const ext  = dotIdx > 0 ? archivePath.slice(dotIdx) : "";
          let counter = 2;
          while (seen.has(`${base} (${counter})${ext}`)) counter++;
          archivePath = `${base} (${counter})${ext}`;
        }
        seen.add(archivePath);

        const entry = new ZipPassThrough(archivePath);
        zip.add(entry);

        // Read the file in browser-native streaming chunks (typically 64 KB to
        // 1 MB per chunk) so only one chunk is in RAM at a time from the input
        // side. The accumulated zip output chunks still grow, but we never hold
        // the entire input batch in memory simultaneously.
        const reader = file.stream().getReader();
        try {
          while (true) {
            if (signal?.aborted) {
              await reader.cancel();
              return;
            }
            const { done, value } = await reader.read();
            if (done) {
              entry.push(new Uint8Array(0), true);
              break;
            }
            entry.push(value, false);
          }
        } catch (err) {
          reader.cancel().catch(() => {});
          reject(err);
          return;
        }
      }

      zip.end();
    })()
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        reject(err);
      })
      .finally(() => {
        signal?.removeEventListener("abort", onAbort);
      });
  });
}
