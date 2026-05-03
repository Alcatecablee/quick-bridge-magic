import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Copy,
  KeyRound,
  Link2,
  RefreshCw,
  Loader2,
  Share2,
} from "@/components/quickbridge/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const chromeLogo = "/logos/chrome.png";
const safariLogo = "/logos/safari.png";
const firefoxLogo = "/logos/firefox.png";
const edgeLogo = "/logos/edge.png";
const braveLogo = "/logos/brave.png";
const iosLogo = "/logos/ios.png";
const androidLogo = "/logos/android.png";
const macosLogo = "/logos/macos.png";
const windowsLogo = "/logos/windows.png";
const linuxLogo = "/logos/linux.png";
import { QrDisplay } from "@/components/quickbridge/QrDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { QrScanner } from "@/components/quickbridge/QrScanner";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import {
  PhoneIllustration,
  ScanIllustration,
  DesktopIllustration,
  FlowConnector,
  EncryptionIllustration,
  P2PIllustration,
  CrossPlatformIllustration,
  BigFilesIllustration,
  MultiContentIllustration,
  ResilientIllustration,
  InstantIllustration,
  NoServerIllustration,
} from "@/components/quickbridge/FlowIllustrations";

import { CrossEcosystemMatrix } from "@/components/quickbridge/CrossEcosystemMatrix";
import { Reveal } from "@/components/quickbridge/Reveal";
import { generateSessionId } from "@/lib/session";
import {
  StorageKeys,
  readString,
  writeString,
  removeKey,
  readActiveSession,
  clearActiveSession,
  type ActiveSession,
} from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { formatPin, pinChannelName, pinFromSessionId } from "@/lib/pin";
import { isStandalone, onInstallAvailabilityChange, promptInstall } from "@/lib/pwa";

const HOME_TITLE =
  "Send Files Between Phone and PC Instantly - QuickBridge";
const HOME_DESCRIPTION =
  "Send files, photos, links, and text between phone and PC in seconds. No app, no account, no cable. Encrypted browser-based transfer for any device.";
const HOME_URL = "https://quickbridge.app/";
const HOME_OG_IMAGE = "https://quickbridge.app/og-home.png";

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QuickBridge",
  alternateName: "QuickBridge - File Transfer",
  url: HOME_URL,
  description: HOME_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  applicationSubCategory: "FileTransfer",
  operatingSystem: "Web Browser (Android, iOS, Windows, macOS, Linux, ChromeOS)",
  browserRequirements: "Requires a modern browser with WebRTC support (Chrome, Edge, Safari, Firefox)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Send files up to 10 GB device-to-device (with receiver auto-save; 2 GB otherwise)",
    "End-to-end encrypted with WebRTC DTLS",
    "QR code pairing - no accounts",
    "Cross-platform: Android, iOS, Windows, macOS, Linux, ChromeOS",
    "Works across networks via STUN/TURN",
    "Installable as a Progressive Web App",
  ],
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    url: "https://quickbridge.app",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to send files between phone and PC with QuickBridge",
  description:
    "Three steps to transfer files, photos, links, or text directly between any two devices using a QR code - no app, no account, no cable.",
  totalTime: "PT30S",
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  supply: [{ "@type": "HowToSupply", name: "Two devices with a modern browser" }],
  tool: [{ "@type": "HowToTool", name: "Any modern web browser (Chrome, Safari, Edge, Firefox)" }],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Open QuickBridge on your computer",
      text: "Visit quickbridge.app on your computer. A live session and QR code are ready before the page finishes painting.",
      url: "https://quickbridge.app/#how",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Scan the QR code with your phone",
      text: "Point your phone's camera at the QR code, or enter the 6-digit PIN. The transfer page opens automatically.",
      url: "https://quickbridge.app/#how",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Send anything",
      text: "Drag files, paste text, or share clipboard. Everything streams directly between devices, end-to-end encrypted.",
      url: "https://quickbridge.app/#how",
    },
  ],
};

const HOME_FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is QuickBridge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is a browser-based way to send files, text, links, and clipboard content between your devices. It works without apps, cables, accounts, or upload steps. Just open the page, scan a QR code, and your devices connect directly. Transfers are peer-to-peer, end-to-end encrypted, and never stored on a server. It supports cross-platform sharing between phones, PCs, Macs, Linux, Android, and iPhone, and works in any modern browser. You can send large files up to 10 GB with auto-save enabled, or 2 GB otherwise. It also includes auto-reconnect, TURN fallback for tricky networks, and optional clipboard syncing.",
      },
    },
    {
      "@type": "Question",
      name: "Where do my files go?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nowhere except the other device. Files travel directly between your two browsers over a WebRTC data channel encrypted with DTLS. No copy is stored on any QuickBridge server.",
      },
    },
    {
      "@type": "Question",
      name: "What does Supabase see, then?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Only the signaling handshake: the SDP offer/answer and ICE candidates needed for the two browsers to find each other. No file contents, no message bodies, no metadata about what you sent.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a file size limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Up to 10 GB per file when the receiver enables auto-save (saves directly to disk); 2 GB per file otherwise so the receiver's tab doesn't run out of memory. The transfer uses 16 KB chunks with an 8 MB backpressure threshold so big files stream smoothly.",
      },
    },
    {
      "@type": "Question",
      name: "What if my devices are on different networks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We use STUN to traverse most NATs, and a free TURN relay as fallback for strict corporate or carrier networks. The relay still moves encrypted bytes; it can't read them.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to install anything?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. QuickBridge runs entirely in the browser. You can optionally install it as a PWA for one-tap access, but it's never required.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if the connection drops?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge automatically reconnects with exponential backoff (up to 6 attempts). Active outgoing transfers are flagged so you can resume after recovery.",
      },
    },
  ],
};

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send files phone to pc, transfer files without usb, airdrop alternative, airdrop for android, airdrop for windows, copy text phone to computer, transfer photos wirelessly, share links between devices",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:url", content: HOME_URL },
      { property: "og:image", content: HOME_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESCRIPTION },
      { name: "twitter:image", content: HOME_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
  }),
});

function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [origin, setOrigin] = useState("");
  const [waitingPing, setWaitingPing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [pin, setPin] = useState<string>("");
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<ActiveSession | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [scanCount, setScanCount] = useState<number | null>(null);
  const navigate = useNavigate();

  // Feature detect WebRTC + crypto.subtle on first client render.
  useEffect(() => {
    const supported =
      typeof RTCPeerConnection !== "undefined" &&
      typeof window.crypto?.subtle !== "undefined";
    setBrowserSupported(supported);
  }, []);

  // Fetch QR scan count for social proof. Errors are swallowed silently so a
  // missing table (pre-migration) never breaks the homepage.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("qr_scans")
      .select("total")
      .single()
      .then(({ data }: { data: { total: number } | null }) => {
        if (data?.total) setScanCount(data.total);
      });
  }, []);

  // On mount, surface a "Resume bridge" banner if we have a recent active
  // session marker (heartbeat written by the Session page every 5s). 60s
  // window is generous enough to survive a manual back-nav + tab refresh,
  // tight enough to avoid resurrecting genuinely abandoned sessions.
  useEffect(() => {
    const s = readActiveSession();
    if (s && Date.now() - s.ts < 60_000) {
      setResumeTarget(s);
    } else if (s) {
      // Stale marker - clear so we don't keep checking.
      clearActiveSession();
    }
  }, []);

  const dismissResume = () => {
    clearActiveSession();
    setResumeTarget(null);
  };
  const goResume = () => {
    if (!resumeTarget) return;
    if (resumeTarget.role === "host") {
      navigate({ to: "/session/$id", params: { id: resumeTarget.id } });
    } else {
      navigate({ to: "/s/$id", params: { id: resumeTarget.id } });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      let detectedOrigin = window.location.origin;
      if (
        window.location.hostname === "localhost" &&
        import.meta.env.VITE_DEV_DOMAIN
      ) {
        detectedOrigin = `https://${import.meta.env.VITE_DEV_DOMAIN}`;
      }
      setOrigin(detectedOrigin);
      setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }
    const stored = readString(StorageKeys.hostSessionId);
    if (stored && /^[a-z0-9]{6,}$/i.test(stored)) {
      setSessionId(stored);
    } else {
      const id = generateSessionId();
      writeString(StorageKeys.hostSessionId, id);
      setSessionId(id);
    }
  }, []);

  const resetSession = () => {
    const id = generateSessionId();
    removeKey(StorageKeys.hostSessionId);
    writeString(StorageKeys.hostSessionId, id);
    setSessionId(id);
    toast.success("Started a fresh session", {
      description: "The previous QR will no longer connect.",
    });
  };

  const pairUrl = useMemo(() => (origin ? `${origin}/s/${sessionId}` : ""), [origin, sessionId]);

  // Derive a 6-digit PIN deterministically from the current session id so the
  // host can advertise it without any DB and the lookup channel is implicit.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void pinFromSessionId(sessionId).then((p) => {
      if (!cancelled) setPin(p);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Listen on the PIN channel and answer guest lookups with the real session id.
  useEffect(() => {
    if (!pin || !sessionId) return;
    const channel = supabase.channel(pinChannelName(pin), {
      config: { broadcast: { self: false }, presence: { key: "pin-host" } },
    });
    channel.on("broadcast", { event: "lookup" }, () => {
      channel.send({ type: "broadcast", event: "match", payload: { sessionId } });
    });
    channel.subscribe();
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [pin, sessionId]);

  // PWA install button visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    setInstalled(isStandalone());
    return onInstallAvailabilityChange((v) => setCanInstall(v));
  }, []);

  // Defer video iframe mount until the section is near the viewport.
  // This prevents the entire Framer Motion video bundle from loading on
  // initial page paint — critical for mobile first-load performance.
  useEffect(() => {
    const el = videoSectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVideoReady(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoReady(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleInstall = async () => {
    const r = await promptInstall();
    if (r === "accepted") toast.success("Installed");
    else if (r === "unavailable") {
      toast("Install from your browser menu", {
        description: "On iOS Safari: Share → Add to Home Screen.",
      });
    }
  };

  const copyPin = async () => {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("PIN copied");
    } catch {
      toast.error("Could not copy PIN");
    }
  };

  const sharePairLink = async () => {
    if (!pairUrl) return;
    if (canShare) {
      try {
        await navigator.share({
          title: "Open this QuickBridge link",
          text: "Open on your other device to pair",
          url: pairUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed - fall through to clipboard.
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(pairUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const copyPairLink = async () => {
    if (!pairUrl) return;
    try {
      await navigator.clipboard.writeText(pairUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  // Passive lobby detector - see /session/$id for the real WebRTC handshake.
  const redirectedRef = useRef(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    if (!sessionId) return;
    redirectedRef.current = false;
    setWaitingPing(false);
    const channel = supabase.channel(`qb:${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: "lobby" },
      },
    });
    const goToSession = () => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setWaitingPing(true);
      navigate({ to: "/session/$id", params: { id: sessionId } });
    };
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      const hasGuest = Array.isArray(state["guest"]) && state["guest"].length > 0;
      if (hasGuest) goToSession();
    });
    channel.on("presence", { event: "join" }, ({ key }) => {
      if (key === "guest") goToSession();
    });
    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      if (payload && (payload as { type?: string }).type === "hello") {
        goToSession();
      }
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track our own presence so Supabase delivers presence sync/join
        // events to this channel reliably. The session page will replace this
        // entry with the real `host` key once we navigate.
        try {
          await channel.track({ role: "lobby", t: Date.now() });
        } catch {}
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  return (
    <>
      {!browserSupported && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-start justify-center px-4 pt-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive shadow-lg">
            <p className="font-semibold">Browser not supported</p>
            <p className="mt-1 text-destructive/80">
              QuickBridge requires WebRTC and the Web Crypto API. Please open
              this page in a recent version of Chrome, Edge, Safari, or Firefox.
            </p>
          </div>
        </div>
      )}
      {/* Structured data: WebApplication + HowTo + FAQPage. Crawlers parse
          JSON-LD anywhere in the document; multiple blocks are valid. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_FAQ_JSONLD) }}
      />
      <AppHeader
        maxWidthClass="max-w-6xl"
        showWordmark
        rightSlot={
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2.5 text-[11px]"
              onClick={() => {
                if (typeof document !== "undefined") {
                  document
                    .getElementById("qr")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              title="Go to QR code"
            >
              <Camera className="h-3.5 w-3.5" /> Scan
            </Button>
            <SiteNav />
          </div>
        }
      />
      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        {resumeTarget && (
          <div className="mb-5 flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Link2 className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  You have an active bridge
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {resumeTarget.role === "host" ? "Hosting" : "Joined"} session ·{" "}
                  <span className="font-mono">{resumeTarget.id.slice(0, 6)}</span>
                </p>
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button onClick={goResume} className="h-9 flex-1 sm:flex-none">
                Resume bridge
              </Button>
              <Button onClick={dismissResume} variant="ghost" className="h-9 text-muted-foreground">
                Dismiss
              </Button>
            </div>
          </div>
        )}
        {/* Hero - this is the canonical hero treatment for the whole site.
            Every other page mirrors this recipe (font-black, muted-grey
            highlight, 13.5/15 lead at max-w-3xl). Don't change in isolation. */}
        <section className="mb-7 text-center sm:mb-10">
          <h1 className="text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            Move files between any device,{" "}
            <span className="text-muted-foreground">on any network.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            No apps. No cables. No upload step. Nothing stored, nothing running in the background.
          </p>
          <p className="mx-auto mt-2 max-w-md text-balance text-[13px] font-medium text-foreground sm:text-[14px]">
            Works across different networks. Direct when possible, securely relayed when needed.
          </p>

          {/* Visual flow: phone → QR → computer (one-glance "what happens if I use this") */}
          <div
            className="mx-auto mt-6 flex max-w-md items-center justify-between gap-2 rounded-xl border border-border bg-card/40 px-4 py-4 sm:mt-7 sm:max-w-xl sm:gap-4 sm:px-8 sm:py-5"
            aria-label="How it works in three steps"
          >
            <div className="flex flex-1 flex-col items-center gap-2">
              <PhoneIllustration className="h-9 w-9 text-primary sm:h-11 sm:w-11" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
                Phone
              </span>
            </div>
            <FlowConnector className="h-3 w-10 shrink-0 text-muted-foreground/60 sm:h-4 sm:w-14" animDelay="0s" />
            <div className="flex flex-1 flex-col items-center gap-2">
              <ScanIllustration className="h-9 w-9 text-primary sm:h-11 sm:w-11" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
                Scan QR
              </span>
            </div>
            <FlowConnector className="h-3 w-10 shrink-0 text-muted-foreground/60 sm:h-4 sm:w-14" animDelay="0.35s" />
            <div className="flex flex-1 flex-col items-center gap-2">
              <DesktopIllustration className="h-9 w-9 text-primary sm:h-11 sm:w-11" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
                Computer
              </span>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { value: "Zero", label: "accounts needed", sub: "No sign-up, ever" },
            { value: "10 GB", label: "max file size", sub: "With auto-save on" },
            { value: "< 5 s", label: "to connect", sub: "Scan → paired" },
            { value: "10", label: "platforms", sub: "Any modern browser" },
          ].map(({ value, label, sub }) => (
            <div
              key={label}
              className="relative flex flex-col gap-0.5 overflow-hidden rounded-xl border border-primary/25 bg-card px-4 py-4 text-center"
              style={{ boxShadow: "0 0 20px -4px color-mix(in oklch, var(--primary) 22%, transparent)" }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)", opacity: 0.55 }}
              />
              <span
                className="text-[26px] font-black leading-none tracking-tight sm:text-[30px]"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, oklch(0.85 0.09 245) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {value}
              </span>
              <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/90">
                {label}
              </span>
              <span className="text-[10.5px] text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>

        {/* QR scan counter - only renders once the table exists and has data */}
        {scanCount !== null && (
          <div className="mb-8 -mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card px-4 py-1.5">
              <span
                className="text-[15px] font-black tabular-nums leading-none"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, oklch(0.85 0.09 245) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {scanCount.toLocaleString()}
              </span>
              <span className="text-[12px] text-muted-foreground">QR codes scanned so far</span>
            </div>
          </div>
        )}

        {/* Cards */}
        <section className="mb-8 grid gap-4 sm:gap-5 lg:grid-cols-5">
          {/* QR / pair card */}
          <Card id="qr" className="relative overflow-hidden border-border bg-card p-4 sm:p-6 lg:col-span-3 scroll-mt-24">
            {/* Card header - stacks on mobile */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Pair this device</p>
                <p className="text-[12px] text-muted-foreground">Scan or share the link</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {sessionId ? (
                    <>Session · {sessionId.slice(0, 6)}</>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Session · <Skeleton className="inline-block h-2.5 w-10 align-middle" />
                    </span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2.5 text-[12px] text-muted-foreground sm:h-7 sm:text-[11px]"
                  onClick={resetSession}
                  disabled={!sessionId}
                  title="Start a fresh session (invalidates the current QR)"
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5 sm:h-3 sm:w-3" /> Reset
                </Button>
              </div>
            </div>

            {/* QR + actions: stack on mobile, side-by-side on sm+ */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div className="flex w-full max-w-[220px] shrink-0 flex-col items-center sm:w-[220px] sm:max-w-none">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  {pairUrl ? "Step 1: Scan with your phone" : "Setting up…"}
                </p>
                {pairUrl ? (
                  <QrDisplay text={pairUrl} size={220} pulse={false} />
                ) : (
                  <div className="flex h-[220px] w-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/20">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground/60">Generating…</span>
                  </div>
                )}
                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                  {pairUrl ? "Connects in under 5 seconds" : "Almost ready…"}
                </p>
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
                {/* Mobile-first action row: Share + Copy */}
                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <Button onClick={sharePairLink} className="h-11">
                    <Share2 className="mr-2 h-4 w-4" />
                    {canShare ? "Share link" : "Copy link"}
                  </Button>
                  <Button onClick={copyPairLink} variant="outline" className="h-11">
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>

                {/* Desktop: full URL display */}
                <div className="hidden rounded-lg border border-border bg-muted/30 p-3 sm:block">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Pair link
                  </div>
                  <div className="flex items-center gap-2">
                    {pairUrl ? (
                      <code className="flex-1 truncate font-mono text-xs text-foreground/90">{pairUrl}</code>
                    ) : (
                      <Skeleton className="h-3.5 flex-1 rounded" />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0"
                      onClick={copyPairLink}
                      title="Copy pair link"
                      disabled={!pairUrl}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* PIN block - alternative to QR for cameras-blocked situations */}
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <KeyRound className="h-3 w-3" /> Or share this PIN
                    </div>
                    <Link
                      to="/join"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Open /join →
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {pin ? (
                      <code className="font-mono text-xl font-semibold tracking-[0.18em] text-foreground tabular-nums sm:text-2xl">
                        {formatPin(pin)}
                      </code>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                        <Skeleton className="h-5 w-28 rounded" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0"
                      onClick={copyPin}
                      disabled={!pin}
                      title="Copy PIN"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    On the other device, open this site and tap “Join with PIN”.
                  </p>
                </div>

                {/* Status */}
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-[12.5px] text-muted-foreground sm:text-xs">
                  <div className="flex items-center gap-2">
                    {waitingPing ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60 animate-pulse" />
                    )}
                    <span>{waitingPing ? "Device detected. Opening session…" : "Waiting for a device to scan…"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Scanner card */}
          <Card id="scan" className="scroll-mt-24 border-border bg-card p-4 sm:p-6 lg:col-span-2">
            <div className="mb-3 sm:mb-4">
              <p className="text-sm font-semibold">Scan a QR code</p>
              <p className="text-[12px] text-muted-foreground">If another device is showing one</p>
            </div>
            {scanning ? (
              <QrScanner
                onResult={(text) => {
                  setScanning(false);
                  try {
                    const url = new URL(text);
                    if (typeof window !== "undefined" && url.origin === window.location.origin) {
                      navigate({ to: url.pathname + url.search + url.hash });
                    } else {
                      window.location.href = url.toString();
                    }
                  } catch {
                    toast.error("Invalid QR");
                  }
                }}
                onCancel={() => setScanning(false)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center sm:gap-4 sm:py-8">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-elevated text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Scan the QR on your computer</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    The image never leaves your browser.
                  </p>
                </div>
                <Button onClick={() => setScanning(true)} className="h-11 w-full">
                  <Camera className="mr-2 h-4 w-4" /> Start scanning
                </Button>
                <Link
                  to="/join"
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card/40 text-[12px] font-medium text-foreground transition-colors hover:bg-card"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Join with PIN
                </Link>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Link2 className="h-3 w-3" /> Or paste the pair link in the address bar
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* How it works - video demo */}
        <Reveal as="section" id="how" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Three steps. No setup. No accounts.
            </h2>
          </div>
          <div ref={videoSectionRef} className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
            <div className="relative w-full bg-[#0b0d12]" style={{ paddingBottom: "56.25%" }}>
              {videoReady && (
                <iframe
                  src="/video"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: "none" }}
                  title="How QuickBridge works"
                  allow="autoplay"
                />
              )}
            </div>
          </div>
        </Reveal>

        {/* Why QuickBridge - problem -> frustration -> solution narrative.
            Anchored on the speed + simplicity positioning, not encryption. */}
        <Reveal as="section" id="why" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
              Why QuickBridge
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Why does sending files still feel slow?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              You email yourself files. You upload to cloud storage. You plug
              in a cable. It works, but it is slow, fiddly, and unnecessary.
              There is a simpler way.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                Art: InstantIllustration,
                title: "Skip the upload step",
                body: "Other tools upload first, then share. QuickBridge starts streaming the moment you drop a file. No 'preparing your transfer' screen.",
              },
              {
                Art: P2PIllustration,
                title: "Go device-to-device",
                body: "Works on the same Wi-Fi, across different networks, or over mobile data. Files travel directly between your two browsers with no data center in between.",
              },
              {
                Art: NoServerIllustration,
                title: "No middleman",
                body: "Your files never sit on a QuickBridge server. There is nothing to delete, nothing to expire, nothing for anyone else to read.",
              },
            ].map(({ Art, title, body }) => (
              <Card key={title} className="border-border bg-card p-5">
                <Art className="mb-3 h-12 w-12 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/screenshots/live-full.png"
              alt="QuickBridge live session — a file transfer in progress between two devices"
              className="w-full"
              loading="lazy"
            />
          </div>
          <p className="mx-auto mt-8 max-w-xl text-balance text-center text-[14.5px] font-medium text-foreground sm:text-[16px]">
            Open. Scan. Send. Any device, any network, no setup required.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              to="/why-quickbridge"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
            >
              Read the full story
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>

        {/* Cross-ecosystem matrix - infograph showing the gap that native OS
            sharing leaves (only same-ecosystem) vs QuickBridge's full coverage. */}
        <Reveal as="section" id="cross-ecosystem-matrix" className="scroll-mt-24 mt-16 sm:mt-20">
          <CrossEcosystemMatrix />
        </Reveal>

        {/* Compatibility strip */}
        <Reveal as="section" className="mt-10 sm:mt-14">
          <div className="rounded-2xl border border-border bg-card/40 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Works in every modern browser, on every modern device
            </p>
            <div className="mt-6 grid grid-cols-3 items-center gap-x-3 gap-y-6 sm:grid-cols-5 lg:grid-cols-10 lg:gap-x-4">
              {[
                { src: chromeLogo, name: "Chrome" },
                { src: safariLogo, name: "Safari" },
                { src: firefoxLogo, name: "Firefox" },
                { src: edgeLogo, name: "Edge" },
                { src: braveLogo, name: "Brave" },
                { src: iosLogo, name: "iOS", contain: "wide" },
                { src: androidLogo, name: "Android" },
                { src: macosLogo, name: "macOS", contain: "wide" },
                { src: windowsLogo, name: "Windows" },
                { src: linuxLogo, name: "Linux" },
              ].map(({ src, name, contain }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2"
                  title={name}
                >
                  <img
                    src={src}
                    alt={name}
                    className={
                      contain === "wide"
                        ? "h-9 w-16 object-contain transition-transform duration-200 hover:scale-110 sm:h-10 sm:w-20"
                        : "h-9 w-9 object-contain transition-transform duration-200 hover:scale-110 sm:h-10 sm:w-10"
                    }
                    loading="lazy"
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Features */}
        <Reveal as="section" id="features" className="mt-20 scroll-mt-24 sm:mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">Built right</p>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              The transfer tool you wish your IT department gave you.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              Engineered for speed, privacy, and zero friction. Open the page, scan, send. That's it.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {[
              {
                Art: EncryptionIllustration,
                title: "End-to-end encrypted",
                body: "Every byte travels over a WebRTC data channel secured with DTLS. No middleman, no server-side decryption.",
              },
              {
                Art: P2PIllustration,
                title: "Direct peer-to-peer",
                body: "After the QR handshake, your devices talk directly. No upload step, no download wait, just streaming.",
              },
              {
                Art: CrossPlatformIllustration,
                title: "Cross-platform",
                body: "Phone, PC, Mac, Linux, Android, iPhone. Anything with a modern browser is in.",
              },
              {
                Art: BigFilesIllustration,
                title: "Big files welcome",
                body: "Send up to 10 GB per file when the receiver enables auto-save - 2 GB otherwise. Backpressure-aware chunking, no artificial throttling, no paywall.",
              },
              {
                Art: MultiContentIllustration,
                title: "More than files",
                body: "Push text, links, and clipboard between devices. Optional auto-share keeps both clipboards in sync.",
              },
              {
                Art: ResilientIllustration,
                title: "Resilient by design",
                body: "Reconnects automatically when your connection drops. Switches to relay mode if a corporate firewall blocks a direct path. Live status shows exactly what is happening.",
              },
            ].map(({ Art, title, body }) => (
              <Card
                key={title}
                className="group relative overflow-hidden border-border bg-card p-5 transition-colors hover:border-primary/40 sm:p-6"
              >
                <Art className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal as="section" id="faq" className="mt-20 scroll-mt-24 sm:mt-28">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
              <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Questions, answered honestly.
              </h2>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Don't see what you're looking for? The whole product fits in your browser tab. Try it.
              </p>
            </div>
            <div className="lg:col-span-3">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    q: "What is QuickBridge?",
                    a: "QuickBridge is a browser-based way to send files, text, links, and clipboard content between your devices. It works without apps, cables, accounts, or upload steps. Just open the page, scan a QR code, and your devices connect directly. Transfers are peer-to-peer, end-to-end encrypted, and never stored on a server. It supports cross-platform sharing between phones, PCs, Macs, Linux, Android, and iPhone, and works in any modern browser. You can send large files up to 10 GB with auto-save enabled, or 2 GB otherwise. It also includes auto-reconnect, TURN fallback for tricky networks, and optional clipboard syncing.",
                  },
                  {
                    q: "Where do my files go?",
                    a: "Nowhere except the other device. Files travel directly between your two browsers over a WebRTC data channel encrypted with DTLS. No copy is stored on any QuickBridge server.",
                  },
                  {
                    q: "What does Supabase see, then?",
                    a: "Only the signaling handshake: the SDP offer/answer and ICE candidates needed for the two browsers to find each other. No file contents, no message bodies, no metadata about what you sent.",
                  },
                  {
                    q: "Is there a file size limit?",
                    a: "Up to 10 GB per file when the receiver enables auto-save (saves directly to disk); 2 GB per file otherwise so the receiver's tab doesn't run out of memory. The transfer uses 16 KB chunks with an 8 MB backpressure threshold so big files stream smoothly.",
                  },
                  {
                    q: "What if my devices are on different networks?",
                    a: "We use STUN to traverse most NATs, and a free TURN relay as fallback for strict corporate or carrier networks. The relay still moves encrypted bytes; it can't read them.",
                  },
                  {
                    q: "Do I need to install anything?",
                    a: "No. QuickBridge runs entirely in the browser. You can optionally install it as a PWA for one-tap access, but it's never required.",
                  },
                  {
                    q: "What happens if the connection drops?",
                    a: "QuickBridge automatically reconnects with exponential backoff (up to 6 attempts). Active outgoing transfers are flagged so you can resume after recovery.",
                  },
                ].map((item, i) => (
                  <AccordionItem key={item.q} value={`item-${i}`} className="border-border">
                    <AccordionTrigger className="text-left text-[14.5px] font-medium text-foreground hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Reveal>

        {/* CTA banner */}
        <Reveal as="section" className="mt-20 sm:mt-28">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
                AirDrop for any device
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Stop emailing yourself files.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Scroll back up, scan the QR, and you're connected in under 5 seconds.
              </p>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-6 h-11 px-6"
              >
                Try it now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Site-wide footer (shared with /why-quickbridge, /airdrop-alternative,
            and forthcoming /compare/* and /use/* pages). Single source of truth
            for the cross-page link graph - see src/lib/site-routes.ts. */}
        <SiteFooter />
      </main>

      {/* Sticky mobile CTA - appears on scroll */}
      <StickyScanCta />
    </>
  );
}


function StickyScanCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:hidden">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2.5 text-[13px] font-medium text-foreground shadow-lg backdrop-blur"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        Scan QR to connect instantly
      </button>
    </div>
  );
}
