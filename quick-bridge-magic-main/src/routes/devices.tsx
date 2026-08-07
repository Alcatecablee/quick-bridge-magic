// Trusted Devices management page: /devices
//
// Lists all saved trusted devices with their last-seen timestamp. Users can
// rename a device (click the name or the pencil icon) and remove a device
// (trash button). Removing a device means the next session between the two
// devices will show the TrustPrompt again as if they're meeting for the first
// time, since the cryptographic verification record is gone.
//
// Empty state: shown when no devices have been trusted yet, with a link back
// to start a bridge.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTrustedNodes } from "@/hooks/use-trusted-nodes";
import {
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  Pencil,
  Check as CheckIcon,
  X,
  ArrowLeft,
  Loader2,
} from "@/components/quickbridge/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { DeviceKind } from "@/lib/device";
import type { TrustedNode } from "@/lib/trusted-nodes-db";
import { useCallback, useState } from "react";
import { AppHeader } from "@/components/quickbridge/Wordmark";

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const cls = "h-4 w-4 shrink-0 text-muted-foreground";
  if (kind === "phone") return <Smartphone className={cls} />;
  if (kind === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function formatDate(ts: number): string {
  // Guard against malformed timestamps (zero, NaN, non-finite) so the
  // Intl formatter never throws a RangeError and breaks the render.
  if (typeof ts !== "number" || !isFinite(ts) || ts <= 0) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "Unknown";
  }
}

interface NodeRowProps {
  node: TrustedNode;
  onRemove: (nodeId: string) => Promise<void>;
  onRename: (nodeId: string, nickname: string) => Promise<void>;
}

function NodeRow({ node, onRemove, onRename }: NodeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.nickname);
  const [removing, setRemoving] = useState(false);
  // Guards against concurrent rename submissions (e.g. rapid Enter key + click).
  // Two simultaneous IDB writes for the same nodeId can interleave: if the first
  // fails and rolls back state, the second's optimistic update may re-apply the
  // stale name, leaving the UI inconsistent. This flag allows at most one
  // in-flight write at a time.
  const [renaming, setRenaming] = useState(false);

  const commitRename = useCallback(() => {
    if (renaming) return; // Reject concurrent submissions.
    const name = draft.trim();
    if (name && name !== node.nickname) {
      // Keep the row in edit mode until the IDB write settles so the user
      // can see it was saved (or retry on failure) rather than having the
      // input disappear mid-flight.
      setRenaming(true);
      onRename(node.nodeId, name)
        .then(() => setEditing(false))
        .catch((e: unknown) => {
          toast.error(
            e instanceof Error ? e.message : "Could not rename device. Try again.",
          );
          setEditing(false);
        })
        .finally(() => setRenaming(false));
    } else {
      setDraft(node.nickname);
      setEditing(false);
    }
  }, [draft, node.nickname, node.nodeId, onRename, renaming]);

  const cancelEdit = useCallback(() => {
    setDraft(node.nickname);
    setEditing(false);
  }, [node.nickname]);

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      await onRemove(node.nodeId);
    } finally {
      setRemoving(false);
    }
  }, [node.nodeId, onRemove]);

  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <DeviceIcon kind={node.deviceKind} />

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") cancelEdit();
              }}
              className="h-7 text-[13px]"
              maxLength={40}
              disabled={renaming}
            />
            <button
              onClick={commitRename}
              disabled={renaming}
              className="rounded-md p-1 text-primary hover:bg-primary/10 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Save name"
            >
              {renaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(node.nickname); setEditing(true); }}
            className="group flex items-center gap-1.5 text-left"
            aria-label={`Rename ${node.nickname}`}
          >
            <p className="text-[13px] font-medium text-foreground group-hover:underline">
              {node.nickname}
            </p>
            <Pencil className="h-3 w-3 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Last seen {formatDate(node.lastSeen)}
        </p>
      </div>

      {/* Removal requires confirmation because it permanently deletes the
          cryptographic trust record. The other device is not notified. */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={removing}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Remove ${node.nickname}`}
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {node.nickname}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the trust record for {node.nickname} on this device.
              The next session will prompt to re-establish trust. The other
              device still holds its own record and will need to do the same to
              fully unpair.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                handleRemove().catch((e: unknown) => {
                  toast.error(
                    e instanceof Error ? e.message : "Could not remove device. Try again.",
                  );
                });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DevicesPage() {
  const { nodes, loading, error, remove, rename } = useTrustedNodes();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader
        maxWidthClass="max-w-xl"
        rightSlot={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Home
          </Link>
        }
      />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-7">
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
            Trusted devices
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Devices you can connect to in one tap.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
            Could not load trusted devices. Try reloading the page.
          </div>
        )}

        {!loading && !error && nodes.length === 0 && (
          <div className="rounded-xl border border-border bg-card/40 p-6 text-center">
            <p className="text-[13.5px] font-medium text-foreground">
              No trusted devices yet
            </p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Complete a file transfer and tap "Trust this device" to save a
              device for instant reconnection.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-[12.5px] font-medium text-primary hover:underline"
            >
              Start a bridge
            </Link>
          </div>
        )}

        {!loading && !error && nodes.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border bg-card/40 px-4">
            {nodes.map((node) => (
              <NodeRow
                key={node.nodeId}
                node={node}
                onRemove={remove}
                onRename={rename}
              />
            ))}
          </div>
        )}

        {!loading && !error && nodes.length > 0 && (
          <p className="mt-6 text-[11.5px] text-muted-foreground">
            Removing a device clears the trust record on this side only. The other
            device still has your record. Run the same removal there to fully
            unpair.
          </p>
        )}
      </main>
    </div>
  );
}
