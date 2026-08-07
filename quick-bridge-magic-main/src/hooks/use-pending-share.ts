// Reads files stored in the "qb-share-pending" cache by the service worker's
// Web Share Target handler and drains them (deletes after reading) so they are
// only dispatched once. Called on mount and on every visibilitychange so that
// files shared while the app was in the background are picked up when the user
// returns to the tab.
//
// Also checks for a ?share-error=1 URL param written by the SW when a share
// target request fails, shows a toast, and removes the param from the URL so
// it does not persist across reloads.

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const SHARE_CACHE = "qb-share-pending";

async function drainSharedFiles(): Promise<File[]> {
  if (typeof caches === "undefined") return [];
  try {
    const cache = await caches.open(SHARE_CACHE);
    const keys = await cache.keys();
    if (keys.length === 0) return [];
    const files: File[] = [];
    for (const req of keys) {
      const res = await cache.match(req);
      if (!res) continue;
      const blob = await res.blob();
      const encodedName = res.headers.get("X-QB-Share-Name");
      const name = encodedName
        ? decodeURIComponent(encodedName)
        : req.url.split("/").pop() ?? "file";
      files.push(new File([blob], name, { type: blob.type || "application/octet-stream" }));
      await cache.delete(req);
    }
    // After draining all entries, delete the cache itself to prevent bloat.
    // Failures here are non-fatal; the next drain will clean up remaining entries.
    try {
      await caches.delete(SHARE_CACHE);
    } catch {
      // best-effort
    }
    return files;
  } catch {
    return [];
  }
}

export function usePendingShare(onFiles: (files: File[]) => void): void {
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;

  useEffect(() => {
    let cancelled = false;

    // Check for a share-error param written by the service worker when the
    // Web Share Target handler fails. Show a toast and clean up the URL.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("share-error") === "1") {
        const url = new URL(window.location.href);
        url.searchParams.delete("share-error");
        window.history.replaceState(null, "", url.toString());
        toast.error("Some shared files could not be received.", {
          description: "Try sharing again or open the app first, then share.",
        });
      }
    }

    const check = async () => {
      const files = await drainSharedFiles();
      if (cancelled || files.length === 0) return;
      onFilesRef.current(files);
    };

    void check();

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
