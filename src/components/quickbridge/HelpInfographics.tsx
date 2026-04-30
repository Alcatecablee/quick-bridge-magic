import { ArrowRight, Eye, Lock, QrCode, Smile, Sparkles } from "lucide-react";

/**
 * Visual explainers for /help. Built as Tailwind + inline SVG components
 * (not standalone HTML/CDN infographics) so they ship in the production
 * bundle, respect dark/light theme tokens, and stack cleanly on mobile.
 *
 * Two pieces:
 *   - TransferFlowInfographic   - 4-step process (Open → Pair → Verify → Send)
 *   - EncryptionScopeInfographic - what signaling sees vs what stays direct
 */

type StepDef = {
  Icon: typeof QrCode;
  num: string;
  title: string;
  body: string;
};

const STEPS: StepDef[] = [
  {
    Icon: Sparkles,
    num: "01",
    title: "Open on both devices",
    body: "Visit quickbridge.app on the phone and the computer. Any modern browser works.",
  },
  {
    Icon: QrCode,
    num: "02",
    title: "Pair with QR or PIN",
    body: "Scan the QR shown on one device with the camera on the other, or type the 6-digit PIN.",
  },
  {
    Icon: Smile,
    num: "03",
    title: "Verify the emoji code",
    body: "Both devices show the same short emoji string. Matches? You're talking to the right device.",
  },
  {
    Icon: ArrowRight,
    num: "04",
    title: "Send anything, instantly",
    body: "Files, photos, links, messages. They stream straight between the two browsers, end-to-end encrypted.",
  },
];

export function TransferFlowInfographic() {
  return (
    <figure
      className="rounded-2xl border border-border bg-card/50 p-5 sm:p-7"
      aria-labelledby="transfer-flow-caption"
    >
      {/* Step grid - horizontal on desktop, stacked on mobile */}
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, num, title, body }, i) => (
          <li
            key={num}
            className="relative rounded-xl border border-border bg-background/40 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {num}
              </p>
            </div>
            <h3 className="mt-3 text-[14px] font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              {body}
            </p>
            {/* Connector arrow into the next step (desktop only). The last
                card has nothing to point to. */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="pointer-events-none absolute right-[-14px] top-1/2 hidden -translate-y-1/2 text-primary/60 lg:inline-flex"
              >
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Annotated path: shows the role of signaling vs the direct channel */}
      <div className="mt-6 grid gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-5">
        <div className="text-center sm:text-right">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Phone
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">
            Your file source or destination.
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center px-2">
          {/* Direct encrypted path */}
          <div className="flex w-full items-center gap-2 sm:w-44">
            <span className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          </div>
          <p className="mt-1.5 text-center text-[10.5px] uppercase tracking-wider text-primary/80">
            Direct, encrypted
          </p>

          {/* Signaling path - dotted, labelled "discovery only" */}
          <div className="mt-3 flex w-full items-center gap-2 sm:w-44">
            <span className="h-px flex-1 border-t border-dashed border-muted-foreground/40" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              signaling
            </span>
            <span className="h-px flex-1 border-t border-dashed border-muted-foreground/40" />
          </div>
          <p className="mt-1 text-center text-[10.5px] text-muted-foreground/80">
            Connection hints only
          </p>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Computer
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">
            The other end of the bridge.
          </p>
        </div>
      </div>

      <figcaption
        id="transfer-flow-caption"
        className="mt-4 text-center text-[12px] leading-relaxed text-muted-foreground"
      >
        File data takes the solid line - browser-to-browser, end-to-end
        encrypted. The dashed signaling line only carries small connection
        hints, never your file content.
      </figcaption>
    </figure>
  );
}

type ScopeItem = { label: string; sub: string };

const SIGNALING_ITEMS: ScopeItem[] = [
  {
    label: "SDP offer & answer",
    sub: "Tiny text describing how the two browsers can find each other.",
  },
  {
    label: "ICE candidates",
    sub: "Network address hints used to attempt a direct connection.",
  },
];

const DIRECT_ITEMS: ScopeItem[] = [
  { label: "File contents", sub: "Photos, videos, documents, archives." },
  { label: "File names & sizes", sub: "Sent on the encrypted channel." },
  { label: "Clipboard text", sub: "Snippets, links, OTP codes." },
  { label: "Chat messages", sub: "Anything you type in the session." },
  { label: "Transfer progress", sub: "Bytes-sent counters and ack frames." },
];

export function EncryptionScopeInfographic() {
  return (
    <figure
      className="rounded-2xl border border-border bg-card/50 p-5 sm:p-7"
      aria-labelledby="scope-caption"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* What signaling sees */}
        <div className="rounded-xl border border-border bg-background/40 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Eye className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-[13px] font-semibold text-foreground">
              What signaling sees
            </p>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            A short, ephemeral exchange between the two browsers - then it's
            out of the picture for the rest of the session.
          </p>
          <ul className="mt-4 space-y-2.5">
            {SIGNALING_ITEMS.map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-border/70 bg-background/60 p-3"
              >
                <p className="text-[13px] font-medium text-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {item.sub}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* What stays direct & encrypted */}
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Lock className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-[13px] font-semibold text-foreground">
              What stays direct &amp; end-to-end encrypted
            </p>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Everything that's actually <em>yours</em> rides the WebRTC data
            channel between the two devices. We can't read it, and there's
            no copy on a server.
          </p>
          <ul className="mt-4 space-y-2.5">
            {DIRECT_ITEMS.map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-primary/15 bg-background/60 p-3"
              >
                <p className="text-[13px] font-medium text-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {item.sub}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figcaption
        id="scope-caption"
        className="mt-4 text-center text-[12px] leading-relaxed text-muted-foreground"
      >
        Signaling is just an introduction. Once the two browsers have shaken
        hands, the file path bypasses our servers entirely.
      </figcaption>
    </figure>
  );
}
