// TrustPrompt: contextual card shown after a first successful transfer to
// invite the user to save the peer as a trusted device for instant reconnection.
//
// Displayed rules (enforced by Session.tsx):
// - Only shown while the DataChannel is open (status === "connected").
// - Requires at least one completed transfer in the current session.
// - Not shown if the peer is already trusted.
// - Not shown after the user dismisses it once per session.
// - Not shown if the cryptographic verification failed (would be misleading).
//
// Clicking "Trust this device" writes the record to IndexedDB and signals
// Session.tsx to hide the card. "Not now" only hides for the session; it
// does not block future sessions from showing the prompt again.

import { useState } from "react";
import { Smartphone, Tablet, Monitor, ShieldCheck, X, Loader2 } from "./icons";
import { Button } from "@/components/ui/button";
import type { DeviceKind } from "@/lib/device";

interface Props {
  peerNickname: string;
  peerDeviceKind: DeviceKind;
  completedTransferCount: number;
  onTrust: () => Promise<void> | void;
  onDismiss: () => void;
}

function PeerIcon({ kind }: { kind: DeviceKind }) {
  const cls = "h-3.5 w-3.5 shrink-0 text-muted-foreground";
  if (kind === "phone") return <Smartphone className={cls} />;
  if (kind === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

export function TrustPrompt({
  peerNickname,
  peerDeviceKind,
  completedTransferCount,
  onTrust,
  onDismiss,
}: Props) {
  // Guard against double-tap: disable the button while the async IDB write is
  // in flight. Without this, rapid taps fire upsertTrustedNode twice and leave
  // the button interactive while the first write is still pending.
  const [trusting, setTrusting] = useState(false);

  const transferText =
    completedTransferCount === 1
      ? "You just completed a transfer."
      : `You completed ${completedTransferCount} transfers.`;

  const handleTrust = async () => {
    if (trusting) return;
    setTrusting(true);
    try {
      await onTrust();
    } finally {
      setTrusting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/50">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Trust Device
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <PeerIcon kind={peerDeviceKind} />
            <h3 className="text-[16px] font-bold tracking-tight text-foreground truncate">
              Trust &ldquo;{peerNickname}&rdquo;?
            </h3>
          </div>
        </div>
        <button
          onClick={onDismiss}
          disabled={trusting}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {transferText} Save this device to connect with one tap next time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 px-4 text-[12px] font-medium"
            disabled={trusting}
            onClick={() => void handleTrust()}
          >
            {trusting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Trust this device"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-4 text-[12px] font-medium text-muted-foreground"
            disabled={trusting}
            onClick={onDismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
