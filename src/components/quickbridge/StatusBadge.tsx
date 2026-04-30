import { Loader2, Wifi, Globe } from "lucide-react";
import type { ConnectionQuality, ConnectionStatus } from "@/hooks/use-webrtc";
import { cn } from "@/lib/utils";

const LABELS: Record<ConnectionStatus, string> = {
  waiting: "Waiting for peer",
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
  stalled: "Network may be blocked",
};

interface Props {
  status: ConnectionStatus;
  quality?: ConnectionQuality;
  attempt?: number;
  maxAttempts?: number;
}

export function StatusBadge({ status, quality, attempt, maxAttempts }: Props) {
  const dotClass = cn(
    "h-2 w-2 rounded-full",
    status === "connected" && "bg-success animate-pulse",
    status === "connecting" && "bg-primary animate-pulse",
    status === "reconnecting" && "bg-warning animate-pulse",
    status === "waiting" && "bg-muted-foreground",
    status === "disconnected" && "bg-destructive",
    status === "stalled" && "bg-destructive animate-pulse",
  );
  const label =
    status === "reconnecting" && attempt && maxAttempts
      ? `Reconnecting · ${attempt}/${maxAttempts}`
      : LABELS[status];

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium backdrop-blur">
        {status === "reconnecting" || status === "connecting" ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : (
          <span className={dotClass} />
        )}
        <span>{label}</span>
      </div>
      {status === "connected" && quality && quality !== "unknown" && (
        <QualityBadge quality={quality} />
      )}
    </div>
  );
}

export function QualityBadge({ quality }: { quality: ConnectionQuality }) {
  if (quality === "unknown") return null;
  const isDirect = quality === "direct";
  return (
    <span
      title={
        isDirect
          ? "Direct peer-to-peer connection - fastest path."
          : "Relayed through a TURN server because a direct path was blocked. Still encrypted end-to-end, but slower."
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium backdrop-blur",
        isDirect
          ? "border-success/40 bg-success/10 text-success"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      {isDirect ? <Wifi className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {isDirect ? "Direct" : "Relay"}
    </span>
  );
}
