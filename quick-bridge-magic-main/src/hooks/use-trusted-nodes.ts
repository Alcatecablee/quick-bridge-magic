// React hook wrapping the trusted-nodes IndexedDB CRUD layer.
//
// Provides a simple, consistent interface for components that need to read and
// mutate the list of trusted devices. Mutations apply optimistic state updates
// for immediate UI feedback, but roll back to the previous state on IDB
// failure so the UI never shows a change that did not persist.

import { useCallback, useEffect, useState } from "react";
import {
  getAllTrustedNodes,
  removeTrustedNode,
  renameTrustedNode,
  type TrustedNode,
} from "@/lib/trusted-nodes-db";

export interface UseTrustedNodesResult {
  nodes: TrustedNode[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  remove: (nodeId: string) => Promise<void>;
  rename: (nodeId: string, nickname: string) => Promise<void>;
}

export function useTrustedNodes(): UseTrustedNodesResult {
  const [nodes, setNodes] = useState<TrustedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    void getAllTrustedNodes()
      .then(setNodes)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("qb-trusted-nodes") : null;
    if (!bc) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "MUTATED") {
        load();
      }
    };
    bc.addEventListener("message", handler);
    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
    };
  }, [load]);

  const remove = useCallback(async (nodeId: string) => {
    // Snapshot before the optimistic update so we can roll back on IDB failure.
    const snapshot = nodes;
    setNodes((prev) => prev.filter((n) => n.nodeId !== nodeId));
    try {
      await removeTrustedNode(nodeId);
    } catch (e) {
      // IDB write failed: restore the previous state and surface the error.
      setNodes(snapshot);
      throw e instanceof Error ? e : new Error(String(e));
    }
  // nodes is a dependency because the snapshot must capture the current list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const rename = useCallback(async (nodeId: string, nickname: string) => {
    // Snapshot before the optimistic update.
    const snapshot = nodes;
    setNodes((prev) =>
      prev.map((n) => (n.nodeId === nodeId ? { ...n, nickname } : n)),
    );
    try {
      await renameTrustedNode(nodeId, nickname);
    } catch (e) {
      // IDB write failed: restore the previous state and surface the error.
      setNodes(snapshot);
      throw e instanceof Error ? e : new Error(String(e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  return { nodes, loading, error, refresh: load, remove, rename };
}
