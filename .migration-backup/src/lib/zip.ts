// Client-side ZIP creation using fflate. Files are stored at level 0 (no
// compression) so the archive completes quickly: most file formats (images,
// video, audio, PDF, DOCX) are already compressed at the byte level, and a
// second pass would only burn CPU without reducing size. For plain-text
// payloads the sender can still send files individually if they care about
// compression; this feature is about convenience, not shrinkage.

import { zip as fflateZip } from "fflate";

export async function zipFiles(
  files: File[],
  archiveName = "quickbridge-batch.zip",
): Promise<File> {
  const entries: Record<string, Uint8Array> = {};

  await Promise.all(
    files.map(async (file) => {
      const buf = await file.arrayBuffer();
      // Deduplicate names that collide inside the archive by appending a
      // suffix. Without this, a second file with the same base name silently
      // overwrites the first inside the zip.
      let safeName = file.name || "file";
      if (safeName in entries) {
        const dotIdx = safeName.lastIndexOf(".");
        const base = dotIdx > 0 ? safeName.slice(0, dotIdx) : safeName;
        const ext = dotIdx > 0 ? safeName.slice(dotIdx) : "";
        let counter = 2;
        while (`${base} (${counter})${ext}` in entries) counter++;
        safeName = `${base} (${counter})${ext}`;
      }
      entries[safeName] = new Uint8Array(buf);
    }),
  );

  return new Promise((resolve, reject) => {
    fflateZip(entries, { level: 0 }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(new File([data], archiveName, { type: "application/zip" }));
    });
  });
}
