import { useState } from "react";
import { ShieldCheck, ChevronDown } from "./icons";
import type { SasCode } from "@/lib/sas";
import { cn } from "@/lib/utils";

interface SasBadgeProps {
  code: SasCode | null;
  className?: string;
}

// Verification badge: shows the 4-emoji safety code on both peers. Click to
// reveal the matching 4-word phrase. If two devices show the same code, no
// signaling intermediary has tampered with the connection.
export function SasBadge({ code, className }: SasBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!code) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-[11px] text-muted-foreground",
          className,
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Securing channel…</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full text-[11px]", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 font-medium text-foreground/90">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Verify connection</span>
            <span className="text-base leading-none" aria-hidden>
              {code.emoji.join(" ")}
            </span>
          </div>
          <p className="text-[10.5px] leading-snug text-muted-foreground/80 pl-[22px]">
            {open
              ? code.words.join(" · ")
              : "Both devices should show the same emojis."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border/60 px-2 text-[10.5px] font-medium text-primary/85 transition-colors hover:border-primary/60 hover:text-primary focus-visible:border-primary focus-visible:outline-none"
          aria-expanded={open}
          title="Tap to compare these codes with the other device - if they match, the connection is verified secure."
        >
          {open ? "Hide words" : "Compare codes"}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
    </div>
  );
}
