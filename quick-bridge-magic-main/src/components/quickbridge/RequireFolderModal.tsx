import { useEffect } from "react";
import { FolderOpen, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FolderGateMode = "firstTime" | "reGrant";

interface RequireFolderModalProps {
  mode: FolderGateMode;
  folderLabel: string | null;
  isPicking: boolean;
  onPick: () => void;
  onPickDifferent: () => void;
  onLeave: () => void;
}

export function RequireFolderModal({
  mode,
  folderLabel,
  isPicking,
  onPick,
  onPickDifferent,
  onLeave,
}: RequireFolderModalProps) {
  // Prevent Escape key from closing anything; the modal is non-dismissible.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, []);

  const isFirstTime = mode === "firstTime";

  return (
    // Full-screen overlay, pointer-events block the session UI beneath.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="folder-gate-title"
      aria-describedby="folder-gate-desc"
    >
      <div
        className={cn(
          "relative mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl",
          "flex flex-col gap-5",
        )}
      >
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <FolderOpen className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-1.5">
          <h2
            id="folder-gate-title"
            className="text-base font-semibold leading-snug text-foreground"
          >
            {isFirstTime ? "Choose a save folder" : "Folder access required"}
          </h2>
          <p id="folder-gate-desc" className="text-sm leading-relaxed text-muted-foreground">
            {isFirstTime
              ? "Choose where QuickBridge should save files you receive. Files stream straight to your disk the moment they arrive, with no download button."
              : folderLabel
                ? `QuickBridge can no longer access "${folderLabel}". Grant access again to continue receiving files automatically.`
                : "QuickBridge can no longer access your save folder. Grant access again to continue receiving files automatically."}
          </p>
        </div>

        {/* Primary action */}
        <Button
          id="folder-gate-pick-btn"
          className="w-full gap-2"
          disabled={isPicking}
          onClick={onPick}
          aria-label={isFirstTime ? "Pick save folder" : "Grant folder access"}
        >
          {isPicking ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
          )}
          {isPicking
            ? "Opening folder picker..."
            : isFirstTime
              ? "Pick save folder"
              : "Grant access"}
        </Button>

        {/* Secondary: pick a different folder (reGrant only) */}
        {!isFirstTime && (
          <button
            type="button"
            id="folder-gate-different-btn"
            className={cn(
              "text-center text-xs text-muted-foreground underline-offset-2 hover:underline",
              isPicking && "pointer-events-none opacity-40",
            )}
            disabled={isPicking}
            onClick={onPickDifferent}
            aria-label="Pick a different save folder"
          >
            Pick a different folder
          </button>
        )}

        {/* Session escape hatch: always accessible */}
        <div className="border-t border-border pt-3">
          <button
            type="button"
            id="folder-gate-leave-btn"
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={onLeave}
            aria-label="Leave session"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Leave session
          </button>
        </div>
      </div>
    </div>
  );
}
