import { useCallback, useState } from "react";
import { StorageKeys, readJSON, writeJSON, removeKey } from "./storage";

export type HistoryItem =
  | {
      kind: "text" | "clipboard";
      direction: "sent" | "received";
      content: string;
      ts: number;
      id: string;
    }
  | {
      kind: "file";
      direction: "sent" | "received";
      name: string;
      size: number;
      type: string;
      ts: number;
      id: string;
      sourceAvailable?: boolean; // true while in-memory File ref still exists (sent only)
    };

const MAX_ITEMS = 30;

export function useHistory(sessionId: string) {
  const key = StorageKeys.history(sessionId);
  const [items, setItems] = useState<HistoryItem[]>(() => {
    const loaded = readJSON<HistoryItem[]>(key, []);
    // sourceAvailable is only meaningful while the originating File object
    // exists in memory. It does not survive a page refresh, so we clear it
    // on load to prevent the history UI from showing a "Send again" button
    // for files whose in-memory reference is already gone.
    return loaded.map((item) =>
      item.kind === "file" && item.direction === "sent" && item.sourceAvailable
        ? { ...item, sourceAvailable: false }
        : item,
    );
  });

  const persist = useCallback(
    (next: HistoryItem[]) => {
      const trimmed = next.slice(0, MAX_ITEMS);
      setItems(trimmed);
      writeJSON(key, trimmed);
    },
    [key],
  );

  const add = useCallback(
    (item: HistoryItem) => {
      setItems((prev) => {
        // De-dupe by id; newer wins. Move to top.
        const filtered = prev.filter((p) => p.id !== item.id);
        const next = [item, ...filtered].slice(0, MAX_ITEMS);
        writeJSON(key, next);
        return next;
      });
    },
    [key],
  );

  const updateFileSource = useCallback(
    (id: string, sourceAvailable: boolean) => {
      setItems((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.id === id && p.kind === "file" && p.sourceAvailable !== sourceAvailable) {
            changed = true;
            return { ...p, sourceAvailable };
          }
          return p;
        });
        if (changed) writeJSON(key, next);
        return changed ? next : prev;
      });
    },
    [key],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((p) => p.id !== id);
        writeJSON(key, next);
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setItems([]);
    removeKey(key);
  }, [key]);

  return { items, add, remove, clear, updateFileSource, persist };
}
