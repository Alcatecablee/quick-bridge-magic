import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { normalizePin, pinChannelName } from "@/lib/pin";

const JOIN_TITLE = "Join with PIN - QuickBridge";
const JOIN_DESCRIPTION =
  "Enter the 6-digit PIN from the other device to join a QuickBridge transfer session - no install, no account, end-to-end encrypted in your browser.";
const JOIN_URL = "https://quickbridge.app/join";

export const Route = createFileRoute("/join")({
  component: JoinPage,
  head: () => ({
    meta: [
      { title: JOIN_TITLE },
      { name: "description", content: JOIN_DESCRIPTION },
      { property: "og:title", content: JOIN_TITLE },
      { property: "og:description", content: JOIN_DESCRIPTION },
      { property: "og:url", content: JOIN_URL },
      { name: "twitter:title", content: JOIN_TITLE },
      { name: "twitter:description", content: JOIN_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: JOIN_URL }],
  }),
});

const LOOKUP_TIMEOUT_MS = 6000;

function JoinPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const pin = normalizePin(digits);
    if (pin.length !== 6) {
      toast.error("Enter the 6-digit PIN shown on the other device");
      return;
    }
    setBusy(true);
    const channel = supabase.channel(pinChannelName(pin), {
      config: { broadcast: { self: false }, presence: { key: `lookup-${crypto.randomUUID()}` } },
    });

    let resolved = false;
    const cleanup = () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
    const timer = window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      setBusy(false);
      toast.error("No device found for that PIN", {
        description: "Make sure the other device is showing this PIN on its home screen.",
      });
    }, LOOKUP_TIMEOUT_MS);

    channel.on("broadcast", { event: "match" }, ({ payload }) => {
      if (resolved) return;
      const sid = (payload as { sessionId?: string })?.sessionId;
      if (typeof sid !== "string" || !/^[a-z0-9]{6,}$/i.test(sid)) return;
      resolved = true;
      window.clearTimeout(timer);
      cleanup();
      navigate({ to: "/s/$id", params: { id: sid } });
    });

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event: "lookup", payload: { ts: Date.now() } });
      }
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader
        maxWidthClass="max-w-3xl"
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
      <main className="relative mx-auto max-w-md px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <KeyRound className="h-3 w-3 text-primary" />
            Pair without a camera
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Enter the PIN</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            On the other device, find the 6-digit PIN under the QR code.
          </p>
        </div>
        <Card className="space-y-4 p-5">
          <Input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={7}
            value={
              digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)}` : digits
            }
            onChange={(e) => setDigits(normalizePin(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="123 456"
            className="h-14 text-center font-mono text-2xl tracking-[0.35em]"
            disabled={busy}
            aria-label="6-digit pairing PIN"
          />
          <Button
            onClick={() => void submit()}
            disabled={busy || normalizePin(digits).length !== 6}
            className="h-11 w-full"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking up…
              </>
            ) : (
              "Connect"
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            The PIN is derived from the session and refreshes whenever the host resets.
          </p>
        </Card>
      </main>
    </div>
  );
}
