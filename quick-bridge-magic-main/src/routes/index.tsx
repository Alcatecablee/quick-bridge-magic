import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import {
  ArrowRight,
  Camera,
  ChevronDown,
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
import { QrDisplay } from "@/components/quickbridge/QrDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { QrScanner } from "@/components/quickbridge/QrScanner";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { DevicesPanel } from "@/components/quickbridge/DevicesPanel";
import { useTrustedNodes } from "@/hooks/use-trusted-nodes";
import { getOrCreateNodeIdentity, type NodeIdentity } from "@/lib/node-identity";
import { detectDeviceKind, type DeviceKind } from "@/lib/device";
import { Reveal } from "@/components/quickbridge/Reveal";
import { HeroSection } from "@/components/quickbridge/landing/HeroSection";
import { StickyScrollSection } from "@/components/quickbridge/landing/StickyScrollSection";
import { WorkflowComparison } from "@/components/quickbridge/landing/WorkflowComparison";
import { SecuritySection } from "@/components/quickbridge/landing/SecuritySection";
import { FaqSection } from "@/components/quickbridge/landing/FaqSection";
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

const HOME_TITLE =
  "QuickBridge 2026: Send Files and Make Your Devices Work Together, Free";
const HOME_DESCRIPTION =
  "Transfer files phone to PC in seconds with a QR scan. Then trust your devices once to send tabs, paste text, and move photos with a single click. No accounts, no installs, free.";
const HOME_URL = "https://quickbridge.app/";
const HOME_OG_IMAGE = "https://quickbridge.app/og-home.png";
const HOME_OG_ALT =
  "QuickBridge: send files from phone to PC instantly. Scan the QR in your browser. No app, no account.";

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QuickBridge",
  alternateName: "QuickBridge - File Transfer",
  url: HOME_URL,
  description: HOME_DESCRIPTION,
  dateModified: "2026-08-04",
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
    "Trust devices once: send tabs, paste clipboard, and move photos with a single click after the first pairing",
  ],
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    url: "https://quickbridge.app",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
    sameAs: ["https://x.com/just_clive_sa", "https://justc.live/"],
  },
  author: {
    "@type": "Person",
    name: "Clive Makazhu",
    url: "https://justc.live/",
    image: "https://justc.live/clive-profile.jpg",
    sameAs: ["https://quickbridge.app/about", "https://x.com/just_clive_sa"],
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
        text: "We use STUN to discover your public IP and traverse most NATs automatically. For stricter setups, including CGNAT (common on mobile carriers) and corporate firewalls, we fall back to a TURN relay server. When that happens, files route through the relay before reaching the other device. The relay only forwards encrypted bytes and cannot read your files. You will see a banner inside the session if a relay is active.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use QuickBridge with Discord, Slack, or iMessage?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste the session link into any chat app and the other person clicks it to open QuickBridge in their browser. The transfer runs directly between the two browsers from there. No Discord file size cap, no WhatsApp compression, no Slack upload limit.",
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
      name: "Is QuickBridge free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
      },
    },
    {
      "@type": "Question",
      name: "Who is QuickBridge best for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is best for anyone who needs to move files between two devices in real time without a USB cable, account, or app install. Both devices need to have a browser open at the same time. Choose a cloud service like Google Drive when the recipient will not be online right away or when the same file needs to reach several people at different times.",
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
      { property: "og:image:alt", content: HOME_OG_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESCRIPTION },
      { name: "twitter:image", content: HOME_OG_IMAGE },
      { name: "twitter:image:alt", content: HOME_OG_ALT },
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
  const [resumeTarget, setResumeTarget] = useState<ActiveSession | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  // Phase 2: local node identity for the DevicesPanel (loaded async from IDB).
  const [localIdentity, setLocalIdentity] = useState<NodeIdentity | null>(null);
  const [myDeviceKind] = useState<DeviceKind>(() =>
    typeof navigator !== "undefined" ? detectDeviceKind() : "computer",
  );
  // Trusted devices: used to flip the homepage hierarchy when the user has at
  // least one trusted device. `hasTrustedDevices` drives which mode renders.
  const { nodes: trustedNodes, loading: trustedLoading } = useTrustedNodes();
  const hasTrustedDevices = !trustedLoading && trustedNodes.length > 0;
  // Pairing section collapses for returning users. Starts closed; auto-opens
  // once IDB confirms there are no trusted devices so first-timers see QR immediately.
  const [pairingOpen, setPairingOpen] = useState(false);
  useEffect(() => {
    if (!trustedLoading && trustedNodes.length === 0) setPairingOpen(true);
  }, [trustedLoading, trustedNodes.length]);
  // Tracks whether the lobby Supabase channel failed permanently after retries.
  const [lobbyError, setLobbyError] = useState(false);
  // Incrementing this triggers the lobby useEffect to re-subscribe from scratch.
  const [lobbyRetryKey, setLobbyRetryKey] = useState(0);
  const navigate = useNavigate();

  const retryLobby = useCallback(() => {
    setLobbyError(false);
    setLobbyRetryKey((k) => k + 1);
  }, []);

  // Feature detect WebRTC + crypto.subtle on first client render.
  useEffect(() => {
    const supported =
      typeof RTCPeerConnection !== "undefined" &&
      typeof window.crypto?.subtle !== "undefined";
    setBrowserSupported(supported);
  }, []);

  // Load (or create on first visit) this device's ECDSA identity from IDB.
  // DevicesPanel is rendered conditionally on localIdentity so it always has
  // a valid nodeId to work with. Errors are surfaced when another tab is open
  // with an older DB version and blocks the upgrade.
  useEffect(() => {
    if (!browserSupported) return;
    void getOrCreateNodeIdentity()
      .then(setLocalIdentity)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("blocked")) {
          toast.error("Browser storage blocked", {
            description:
              "Close other QuickBridge tabs then reload to enable trusted devices.",
            duration: 8000,
          });
        }
      });
  }, [browserSupported]);

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
  useEffect(() => {
    if (!sessionId) return;
    console.log(`[QB] Lobby: subscribing to qb:${sessionId}`);
    redirectedRef.current = false;
    setWaitingPing(false);
    setLobbyError(false);
    let aborted = false;
    let activeCh: ReturnType<typeof supabase.channel> | null = null;
    let lobbyRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const topic = `qb:${sessionId}`;

    const goToSession = (reason: string) => {
      if (redirectedRef.current) return;
      console.log(`[QB] Lobby: redirecting to /session/${sessionId} (reason: ${reason})`);
      redirectedRef.current = true;
      setWaitingPing(true);
      navigate({ to: "/session/$id", params: { id: sessionId } });
    };

    // Named handlers so they can be re-attached on retry.
    const onPresenceSync = () => {
      if (!activeCh) return;
      const state = activeCh.presenceState() as Record<string, unknown[]>;
      const keys = Object.keys(state);
      console.log(`[QB] Lobby presence sync: keys=${keys.join(",") || "(empty)"}`);
      const hasGuest = Array.isArray(state["guest"]) && state["guest"].length > 0;
      if (hasGuest) goToSession("presence sync: guest detected");
    };
    const onPresenceJoin = ({ key }: { key: string }) => {
      console.log(`[QB] Lobby presence join: key=${key}`);
      if (key === "guest") goToSession("presence join: guest");
    };
    const onSignal = ({ payload }: { payload: unknown }) => {
      if (payload && (payload as { type?: string }).type === "hello") {
        console.log("[QB] Lobby: received hello broadcast from guest");
        goToSession("hello broadcast");
      }
    };

    let lobbyRetries = 0;
    const MAX_LOBBY_RETRIES = 3;

    const setupAndSubscribe = () => {
      const channel = supabase.channel(topic, {
        config: {
          broadcast: { self: false },
          presence: { key: "lobby" },
        },
      });
      activeCh = channel;
      channel.on("presence", { event: "sync" }, onPresenceSync);
      channel.on("presence", { event: "join" }, onPresenceJoin);
      channel.on("broadcast", { event: "signal" }, onSignal);
      channel.subscribe(async (status) => {
        console.log(`[QB] Lobby channel status: ${status}`);
        if (status === "SUBSCRIBED") {
          lobbyRetries = 0;
          // Track our own presence so Supabase delivers presence sync/join
          // events to this channel reliably. The session page will replace this
          // entry with the real `host` key once we navigate.
          try {
            await channel.track({ role: "lobby", t: Date.now() });
            console.log("[QB] Lobby: tracked presence as lobby");
          } catch {}
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (aborted) return;
          if (lobbyRetries >= MAX_LOBBY_RETRIES) {
            console.error("[QB] Lobby: channel subscribe failed after retries, giving up");
            if (!aborted) setLobbyError(true);
            return;
          }
          lobbyRetries++;
          const delay = Math.min(4000, 600 * Math.pow(1.5, lobbyRetries - 1));
          console.log(`[QB] Lobby: retry ${lobbyRetries}/${MAX_LOBBY_RETRIES} in ${Math.round(delay)}ms`);
          lobbyRetryTimer = setTimeout(() => {
            lobbyRetryTimer = null;
            if (aborted) return;
            try { supabase.removeChannel(channel); } catch {}
            setupAndSubscribe();
          }, delay);
        }
      });
    };

    setupAndSubscribe();

    return () => {
      console.log(`[QB] Lobby: cleaning up channel qb:${sessionId}, retryKey=${lobbyRetryKey}`);
      aborted = true;
      if (lobbyRetryTimer) {
        clearTimeout(lobbyRetryTimer);
        lobbyRetryTimer = null;
      }
      if (activeCh) {
        try { supabase.removeChannel(activeCh); } catch {}
      }
    };
  }, [sessionId, navigate, lobbyRetryKey]);

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
      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-14">
        {resumeTarget && (
          <div className="mx-auto mb-8 flex max-w-5xl flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                You have an active bridge
              </p>
              <p className="text-[12px] text-muted-foreground">
                {resumeTarget.role === "host" ? "Hosting" : "Joined"} session ·{" "}
                <span className="font-mono">{resumeTarget.id.slice(0, 6)}</span>
              </p>
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
        {/* Hero - clip-reveal animation, device visualization, and CTA.
            Visual presentation only; all functional state lives above. */}
        <HeroSection
          onScrollToQR={() => {
            if (typeof document !== "undefined") {
              document
                .getElementById("qr")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />

        {/* Two-mode explainer removed */}



        {/* Trusted devices panel: for returning users this is the primary
            section of the page. Shown right after the hero so their devices
            are the first thing they interact with. First-time visitors see
            nothing here (DevicesPanel renders null when nodes.length === 0). */}
        {localIdentity && (
          <Reveal className="mt-6 sm:mt-8">
            <DevicesPanel
              identity={localIdentity}
              nickname={readString(StorageKeys.deviceName) ?? ""}
              deviceKind={myDeviceKind}
            />
            {/* "Add another device" toggle — collapses the pairing card for
                returning users so QR setup doesn't dominate a page that is
                now primarily about acting on existing trusted relationships. */}
            {hasTrustedDevices && (
              <button
                type="button"
                onClick={() => {
                  const opening = !pairingOpen;
                  setPairingOpen(opening);
                  if (opening && typeof document !== "undefined") {
                    setTimeout(() => {
                      document.getElementById("qr")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                  }
                }}
                className="mt-3 flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/30 px-4 py-2.5 text-left transition-colors hover:bg-card/60"
                aria-expanded={pairingOpen}
              >
                <span className="text-[12.5px] font-medium text-muted-foreground">
                  {pairingOpen ? "Hide pairing" : "+ Add another device"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${pairingOpen ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </Reveal>
        )}

        {/* Continuity: sticky scroll storytelling section.
            Five one-click interactions cycle as the user scrolls.
            On reduced-motion, falls back to a simple vertical list. */}
        <section className="mt-16 sm:mt-24">
          <StickyScrollSection />
        </section>

        {/* Comparison: animated "old way vs. QuickBridge" workflow.
            Old-way steps build one by one, then QuickBridge appears. */}
        <Reveal as="section" className="mt-24 sm:mt-32">
          <WorkflowComparison />
        </Reveal>

        {/* Security Section (Trust flow & unboxed metrics) */}
        <Reveal as="section" className="mt-24 sm:mt-32">
          <SecuritySection />
        </Reveal>

        {/* Cards - pairing UI. Hidden for returning users until they expand
            "Add another device". First-time visitors see it immediately once
            IDB confirms they have no trusted devices (pairingOpen auto-sets). */}
        {(!hasTrustedDevices || pairingOpen) && (
        <Reveal as="section" id="pair" className={hasTrustedDevices ? "mt-8" : "mt-24 scroll-mt-24 sm:mt-32"}>
          <div className="mx-auto grid max-w-5xl gap-5 sm:gap-6 lg:grid-cols-5">
            {/* QR / pair card */}
            <Card id="qr" className="relative overflow-hidden border-border/80 bg-card/90 p-5 shadow-lg shadow-black/10 sm:p-7 lg:col-span-3 scroll-mt-24">
              {/* Card header - stacks on mobile */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {hasTrustedDevices ? "Add another device" : "Pair this device"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">Scan the QR, share a link, or share a PIN</p>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-2.5 text-[12px] text-muted-foreground sm:h-7 sm:text-[11px]"
                        disabled={!sessionId}
                        title="Start a fresh session (invalidates the current QR)"
                      >
                        <RefreshCw className="mr-1 h-3.5 w-3.5 sm:h-3 sm:w-3" /> Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Start a fresh session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This generates a new QR code and PIN. Any device that already scanned the current QR will not be able to connect with it. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep current</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSession}>
                          Start fresh
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* QR + actions: stack on mobile, side-by-side on sm+ */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex w-full max-w-[220px] shrink-0 flex-col items-center sm:w-[220px] sm:max-w-none">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                    {pairUrl ? "Scan to connect" : "Setting up…"}
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
                        aria-label="Copy pair link"
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
                        title="Copy PIN to clipboard"
                        aria-label="Copy PIN to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      On the other device, open this site and tap "Join with PIN".
                    </p>
                  </div>

                  {/* Status */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-[12.5px] text-muted-foreground sm:text-xs">
                    {lobbyError ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-destructive">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          <span className="font-medium">Could not connect to the signaling service.</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Check your internet connection and try again. The QR will not work until reconnected.
                        </p>
                        <button
                          type="button"
                          onClick={retryLobby}
                          className="mt-0.5 self-start text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Retry connection
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {waitingPing ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                        ) : (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60 animate-pulse" />
                        )}
                        <span>{waitingPing ? "Device detected. Opening session…" : "Waiting for a device to scan…"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Scanner card */}
            <Card id="scan" className="scroll-mt-24 border-border/80 bg-card/90 p-5 shadow-lg shadow-black/10 sm:p-7 lg:col-span-2">
              <div className="mb-4 sm:mb-5">
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
          </div>
        </Reveal>
        )}

        {/* Compatibility and Features sections removed */}

        {/* FAQ */}
        <Reveal as="section" id="faq" className="mt-24 scroll-mt-24 sm:mt-32">
          <FaqSection />
        </Reveal>

        {/* Cross-promo & CTA removed */}

        {/* Site-wide footer (shared with /why-quickbridge, /airdrop-alternative,
            and forthcoming /compare/* and /use/* pages). Single source of truth
            for the cross-page link graph - see src/lib/site-routes.ts. */}
        <SiteFooter />
      </main>

      {/* Sticky CTA removed */}
    </>
  );
}

