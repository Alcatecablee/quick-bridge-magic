import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus, X as XIcon } from "@/components/quickbridge/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { RelatedPages } from "@/components/quickbridge/RelatedPages";
import { Reveal } from "@/components/quickbridge/Reveal";

const PAGE_TITLE =
  "QuickBridge vs Nearby Share 2026: Cross-Network vs LAN";
const PAGE_DESCRIPTION =
  "In 2026, Nearby Share works only between nearby Android and Windows devices. QuickBridge runs in any browser and transfers files across any network.";
const PAGE_URL =
  "https://quickbridge.app/compare/quickbridge-vs-nearby-share";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-nearby-share.png";
const PAGE_OG_ALT =
  "QuickBridge vs Nearby Share: cross-platform transfer from Android to any device. No app needed.";

/**
 * Sources: every Nearby Share / Quick Share claim below traces to one of
 * these URLs, verified directly before writing. Shown in the Sources section.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] =
  [
    {
      id: "quick-share-wikipedia",
      title: "Quick Share: Wikipedia",
      url: "https://en.wikipedia.org/wiki/Quick_Share",
      fetched: "2026-05-16",
    },
    {
      id: "android-help",
      title: "Use Quick Share on your Android device: Android Help",
      url: "https://support.google.com/android/answer/9286773",
      fetched: "2026-05-16",
    },
    {
      id: "android-central",
      title:
        "How to use Quick Share on your Android phone: Android Central",
      url: "https://www.androidcentral.com/how-use-nearby-share-your-android-phone",
      fetched: "2026-05-16",
    },
  ];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based peer-to-peer file transfer tool. Open quickbridge.app on any device, scan the QR code or enter the 6-digit PIN on the other device, and a direct encrypted WebRTC connection is established. The pairing flow is identical whether both devices are on the same Wi-Fi or on completely different networks. No app, no account, no sign-up.",
  },
  {
    q: "What is Nearby Share (Quick Share)?",
    a: "Nearby Share is Google's proximity-based wireless transfer feature, rebranded Quick Share in 2024 following a merger with Samsung's Nearby Share. It is built into Android 6.0 and later via Google Play Services, and available as a downloadable app for 64-bit Windows 10 and later. It uses Bluetooth Low Energy for device discovery and Wi-Fi Direct or Wi-Fi Aware for the actual transfer, so devices typically need to be within a few meters of each other. ChromeOS 91 and later also includes the feature natively. There is no native support for iPhone or macOS (a very limited Android-to-iPhone experiment via AirDrop interoperability was introduced for Pixel 10 devices in November 2025 and routes files through Google's servers for 24 hours).",
  },
  {
    q: "Can Nearby Share send files across different networks?",
    a: "For direct peer-to-peer transfers, Nearby Share requires the devices to be physically nearby (within roughly 5 meters) because it uses Bluetooth for discovery and Wi-Fi Direct for the transfer, neither of which routes through the internet. Quick Share also offers a QR code or link-based sharing mode that works across the internet, but in that mode files are uploaded to Google's servers and are available for download for 24 hours, with a 10 GB daily cap for Samsung Cloud sharing. QuickBridge uses STUN and TURN to connect across any networks, same room or different countries, without uploading files to any server.",
  },
  {
    q: "Does Nearby Share work with iPhone?",
    a: "No, not in general. Nearby Share / Quick Share is available on Android 6.0+, ChromeOS 91+, and Windows 10+ (64-bit). A limited interoperability with AirDrop was announced for Pixel 10 devices in November 2025 and is planned to expand to other Android brands, but transfers in that mode route through Google servers for 24 hours and require the iPhone user to have AirDrop set to 'Everyone for 10 minutes'. QuickBridge runs in any modern browser on any platform including iPhone and Mac with no special permissions required.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
  },
  {
    q: "Who is QuickBridge best for?",
    a: "QuickBridge is best for cross-platform transfers involving non-Google-ecosystem devices or transfers across different networks. Choose Nearby Share when both devices are Android, Chromebook, or a Windows PC with the Google app installed.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const PUBLISHED = "2026-05-16";
const MODIFIED = "2026-06-15";

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBridge vs Nearby Share 2026 (Quick Share)",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  author: { "@type": "Person", name: "Clive Makazhu", url: "https://justc.live/", sameAs: ["https://quickbridge.app/about", "https://x.com/just_clive_sa"] },
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Comparisons", item: "https://quickbridge.app/compare" },
    { "@type": "ListItem", position: 3, name: "vs Nearby Share", item: PAGE_URL },
  ],
};

export const Route = createFileRoute(
  "/compare/quickbridge-vs-nearby-share"
)({
  component: CompareNearbySharePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "nearby share alternative, quick share alternative, nearby share vs quickbridge, send files without nearby share, quick share iphone, cross network file transfer",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: PAGE_OG_IMAGE },
      { property: "og:image:alt", content: PAGE_OG_ALT },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: PAGE_OG_IMAGE },
      { name: "twitter:image:alt", content: PAGE_OG_ALT },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

type Cell = true | false | "neutral";

const COMPARISON_ROWS: {
  label: string;
  qb: Cell;
  ns: Cell;
  note: string;
}[] = [
  {
    label: "Works without installing an app",
    qb: true,
    ns: false,
    note: "QuickBridge runs entirely in a browser tab, nothing to install. Nearby Share is built into the Android OS (via Google Play Services) for Android users, and requires downloading the Quick Share for Windows app on Windows. There is no browser-based version.",
  },
  {
    label: "Transfers between devices on different networks",
    qb: true,
    ns: "neutral",
    note: "QuickBridge uses STUN and TURN to connect across any networks, same room or different countries, without uploading to a server. Nearby Share's P2P mode uses Wi-Fi Direct, which requires physical proximity regardless of Wi-Fi network. Its QR/link sharing mode works across the internet but uploads files to Google's servers for 24 hours (10 GB daily limit).",
  },
  {
    label: "Requires physical proximity between devices",
    qb: false,
    ns: true,
    note: "Nearby Share P2P discovery uses Bluetooth Low Energy, which typically has a range of a few meters. Devices must be physically close for the automatic discovery to work. QuickBridge pairs by QR code scan or PIN entry and has no proximity requirement.",
  },
  {
    label: "iPhone and macOS support",
    qb: true,
    ns: false,
    note: "QuickBridge runs in any modern browser including Safari on iPhone and Mac. Nearby Share / Quick Share is supported on Android 6.0+, ChromeOS 91+, and Windows 10+ (64-bit). A very limited Android-to-iPhone transfer mode via AirDrop interoperability was introduced for Pixel 10 devices in November 2025. It routes files through Google servers and requires the iPhone to have AirDrop set to 'Everyone'. No general iPhone or macOS support exists.",
  },
  {
    label: "Files never uploaded to any server",
    qb: true,
    ns: "neutral",
    note: "QuickBridge streams files directly between the two browsers over WebRTC. No file content touches a server. Nearby Share's P2P mode is also direct (Wi-Fi Direct), but its QR/link sharing mode uploads files to Google's servers for 24 hours before the recipient downloads them.",
  },
  {
    label: "Works on Linux",
    qb: true,
    ns: false,
    note: "QuickBridge runs in any browser, including Firefox and Chrome on Linux. There is no official Quick Share client for Linux. Unofficial third-party clients exist but are not maintained by Google.",
  },
  {
    label: "No account required",
    qb: true,
    ns: "neutral",
    note: "QuickBridge has no accounts whatsoever. Nearby Share in 'Everyone nearby' visibility mode works without a Google account. However, sharing to 'Contacts only' or 'Your devices', and using the QR/link sharing mode for cross-network transfers, all require a Google account.",
  },
  {
    label: "Automatic device discovery (no QR scan needed)",
    qb: false,
    ns: true,
    note: "Nearby Share automatically shows nearby compatible devices via Bluetooth discovery. No code or scan needed if both devices are within range. QuickBridge always requires an explicit QR scan or PIN entry, which adds a step on the same network but gives a consistent, distance-independent flow.",
  },
  {
    label: "Text and clipboard sharing alongside files",
    qb: true,
    ns: false,
    note: "QuickBridge supports sending text, links, and clipboard content in the same session as file transfers. Nearby Share transfers files and links only.",
  },
  {
    label: "End-to-end encrypted",
    qb: true,
    ns: true,
    note: "QuickBridge uses WebRTC's mandatory DTLS encryption for data channels. Quick Share states that 'all Quick Share transfers are protected by end-to-end encryption' (Wikipedia, sourced from Google).",
  },
];

function CompareNearbySharePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-[12px] text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <Link to="/compare" className="hover:text-foreground">Compare</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">vs Nearby Share</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            QuickBridge vs Nearby Share 2026
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            Quick Share (previously Nearby Share) is great when you are in the same room with another Android or Windows device. No code, no scan, devices just show up. QuickBridge handles everything it cannot do: different networks, iPhone, Mac, Linux, and any situation where the two devices are not physically close.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-nearby-share" } as never}>
                Try QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/airdrop-alternative">
                Why browser-based transfer works
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · Works on iPhone, Android, Windows, Mac, Linux
          </p>
        </header>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Feature-by-feature comparison
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Every Nearby Share / Quick Share entry below is sourced from{" "}
            <a
              href="https://en.wikipedia.org/wiki/Quick_Share"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              Wikipedia (Quick Share)
            </a>
            ,{" "}
            <a
              href="https://support.google.com/android/answer/9286773"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              Android Help
            </a>
            , and{" "}
            <a
              href="https://www.androidcentral.com/how-use-nearby-share-your-android-phone"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              Android Central
            </a>{" "}
            (see Sources at the bottom).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">Nearby Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-muted/10">
                      <td className="px-5 py-3.5 align-top">
                        <span className="font-medium text-foreground">{row.label}</span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                          {row.note}
                        </span>
                      </td>
                      <CmpCell value={row.qb} highlight />
                      <CmpCell value={row.ns} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            The honest verdict
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5 p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose QuickBridge when...
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're sending to or from an iPhone or Mac. Nearby Share does not support them.",
                  "The two devices are not in the same room: a colleague's laptop in another office, a phone on a different Wi-Fi network.",
                  "You're on Linux. There is no official Quick Share client for Linux.",
                  "You want a consistent experience across all device combinations without learning multiple modes.",
                  "You want text and clipboard sharing alongside files in the same session.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose Nearby Share when...
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're transferring between two Android devices or between Android and a Windows PC, and they're in the same room.",
                  "You want zero-friction discovery: just open Quick Share and nearby devices appear, no QR scan.",
                  "You're already in the Google ecosystem and want the feature baked into the OS without opening a browser.",
                  "You're sending to up to 8 nearby devices at once.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12">
          <Card className="border-border bg-muted/20 p-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status note (May 2026)
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">
              Google rebranded Nearby Share as Quick Share in 2024 after merging
              it with Samsung's own Nearby Share feature. As of May 2026, Quick
              Share is available on Android 6.0 and later (via Google Play
              Services), ChromeOS 91 and later, and as a downloadable app for
              64-bit Windows 10 and later. In November 2025, Google announced
              limited Android-to-iPhone transfers via AirDrop interoperability,
              currently restricted to Pixel 10 devices with plans to expand to
              other brands. In that mode, files route through Google's servers
              for 24 hours. Quick Share does not have a browser-based interface.
            </p>
          </Card>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-6 w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="border-border"
              >
                <AccordionTrigger className="text-left text-[14.5px] font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal as="section" className="mt-14" id="sources">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Sources
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {SOURCES.map((src) => (
              <li key={src.id}>
                <a
                  href={src.url}
                  rel="noopener"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {src.title}
                </a>{" "}
                <span className="text-muted-foreground/70">
                  · verified {src.fetched}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Works on iPhone, Android, Windows, Mac, and Linux
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on any device, scan the QR with the other
                device, and the file moves directly between browsers. No proximity
                required. No accounts. Nothing installed.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-nearby-share-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-nearby-share" />
        <SiteFooter />
      </main>
    </div>
  );
}

function CmpCell({
  value,
  highlight = false,
}: {
  value: Cell;
  highlight?: boolean;
}) {
  return (
    <td
      className={
        "px-5 py-3.5 align-top " + (highlight ? "bg-primary/5" : "")
      }
    >
      {value === true ? (
        <span className="inline-flex items-center gap-1 text-success">
          <Check className="h-4 w-4" />
          <span className="sr-only">Yes</span>
        </span>
      ) : value === false ? (
        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">No</span>
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-muted-foreground/70"
          title="Different model - not a yes or no"
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Different model</span>
        </span>
      )}
    </td>
  );
}
