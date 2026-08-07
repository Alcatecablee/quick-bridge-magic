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
  "QuickBridge vs LocalSend 2026: Browser vs Native App";
const PAGE_DESCRIPTION =
  "In 2026, LocalSend is a fast LAN file transfer app that requires installation. QuickBridge needs no install and works across any network. Free.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-localsend";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-localsend.png";
const PAGE_OG_ALT =
  "QuickBridge vs LocalSend: file transfer with no app install required and no local network restriction.";

/**
 * Sources: every LocalSend claim below traces to one of these URLs,
 * verified directly before writing. Shown in the visible Sources section.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] =
  [
    {
      id: "localsend-github",
      title: "LocalSend GitHub README (localsend/localsend)",
      url: "https://github.com/localsend/localsend",
      fetched: "2026-05-16",
    },
    {
      id: "localsend-releases",
      title: "LocalSend Releases (v1.17.0, February 20, 2025)",
      url: "https://github.com/localsend/localsend/releases",
      fetched: "2026-05-16",
    },
    {
      id: "localsend-site",
      title: "localsend.org (official website)",
      url: "https://localsend.org",
      fetched: "2026-05-16",
    },
  ];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based peer-to-peer file transfer tool. Open quickbridge.app on any device with a modern browser, scan the QR code or enter the 6-digit PIN on the other device, and a direct encrypted WebRTC connection is established. It works whether both devices are on the same Wi-Fi or on completely different networks, including across the internet. No account, no installation, no driver.",
  },
  {
    q: "What is LocalSend?",
    a: "LocalSend is an open-source, cross-platform native app for transferring files over a local network. It is available on Windows, macOS, Linux, Android, and iOS. Devices on the same Wi-Fi automatically discover each other via mDNS (similar to Bonjour). File transfers use a REST API with HTTPS encryption and travel directly between devices without passing through any server or internet connection. LocalSend requires no account and works completely offline. As of February 2025, the latest stable version is v1.17.0, with over 8 million downloads globally.",
  },
  {
    q: "Does LocalSend work across different Wi-Fi networks?",
    a: "No. LocalSend is designed for local network transfers only. Device discovery uses mDNS, which does not route across different subnets or across the internet. If the two devices are on different networks, they will not find each other and cannot transfer. QuickBridge uses STUN and TURN servers to connect across any networks, including across the internet and across different carriers, without uploading files to any server.",
  },
  {
    q: "Do I need to install LocalSend?",
    a: "Yes. LocalSend is a native app that must be installed on each device. It is available from the Microsoft Store, Mac App Store, App Store (iOS), Google Play, and F-Droid, and as direct downloads from GitHub. QuickBridge runs entirely in a browser tab with no installation required on either device.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
  },
  {
    q: "Who is QuickBridge best for?",
    a: "QuickBridge is best for transfers across different networks where you cannot or do not want to install an app. Choose LocalSend when both devices are on the same local network and you prefer a native open-source app.",
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
  headline: "QuickBridge vs LocalSend 2026",
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
    { "@type": "ListItem", position: 3, name: "vs LocalSend", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/compare/quickbridge-vs-localsend")({
  component: CompareLocalSendPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "localsend alternative, localsend vs quickbridge, file transfer without installing app, cross network file transfer, localsend cross network, localsend no wifi",
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
  ls: Cell;
  note: string;
}[] = [
  {
    label: "Works without installing an app",
    qb: true,
    ls: false,
    note: "QuickBridge runs entirely in a browser tab. LocalSend requires installing a native app on each device. It is available on Windows, macOS, Linux, Android, and iOS via the respective app stores or GitHub releases.",
  },
  {
    label: "Transfers between devices on different networks",
    qb: true,
    ls: false,
    note: "QuickBridge uses STUN and TURN to connect across any networks. LocalSend uses mDNS for device discovery, which is local-network only. If the two devices are not on the same Wi-Fi or LAN, LocalSend cannot connect them.",
  },
  {
    label: "Automatic device discovery (no QR scan needed)",
    qb: false,
    ls: true,
    note: "LocalSend automatically discovers all other LocalSend devices on the same local network via mDNS, similar to how AirDrop works on Apple devices. No code or scan required. QuickBridge always uses an explicit QR scan or PIN entry, which adds a step on the same network but gives a consistent flow across all distance scenarios.",
  },
  {
    label: "Works completely offline (no internet connection at all)",
    qb: false,
    ls: true,
    note: "LocalSend operates entirely on the local network and requires no internet connection whatsoever. It works on isolated networks, air-gapped environments, and locations with no internet service. QuickBridge requires internet access for the initial signaling handshake, even when both devices are on the same Wi-Fi.",
  },
  {
    label: "No file size limit",
    qb: "neutral",
    ls: true,
    note: "LocalSend has no file size limit: transfers happen directly over the local network using the device's file system. QuickBridge limits files to 2 GB by default; on Chromium-based browsers with auto-save enabled, this extends to 10 GB via Service Worker streaming.",
  },
  {
    label: "Platforms supported",
    qb: "neutral",
    ls: true,
    note: "LocalSend is available on Windows, macOS, Linux, Android, and iOS. QuickBridge runs in any modern browser, so it also covers all these platforms plus ChromeOS and any other device with a browser, without requiring an install.",
  },
  {
    label: "No account required",
    qb: true,
    ls: true,
    note: "Both tools are fully account-free. No sign-up, no cloud account, no vendor account needed.",
  },
  {
    label: "Files never stored on a server",
    qb: true,
    ls: true,
    note: "Both tools transfer files directly between devices. LocalSend uses REST over the local network. QuickBridge uses WebRTC. Neither uploads file content to any external server.",
  },
  {
    label: "Text and clipboard sharing alongside files",
    qb: true,
    ls: true,
    note: "Both tools support sending plain text messages in addition to files. QuickBridge includes auto-clipboard monitoring (opt-in, one-tap confirmation). LocalSend has a text message field that can send text to any discovered device.",
  },
  {
    label: "Open source",
    qb: true,
    ls: true,
    note: "LocalSend is open source under the MIT license at github.com/localsend/localsend, with over 60,000 GitHub stars. QuickBridge is also open source on GitHub.",
  },
];

function CompareLocalSendPage() {
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
          <span className="text-foreground">vs LocalSend</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            QuickBridge vs LocalSend 2026
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            LocalSend is genuinely one of the best options for frequent transfers on the same network. Install it once, it works offline, it auto-discovers everything on your LAN, and there is no file size limit. Well, QuickBridge is built for everything LocalSend cannot do: different networks, no app to install, and one-off sends to a device that has never had anything set up.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-localsend" } as never}>
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
            No install · Works cross-network
          </p>
        </header>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Feature-by-feature comparison
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Every LocalSend column entry below is sourced from the{" "}
            <a
              href="https://github.com/localsend/localsend"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              LocalSend GitHub README
            </a>
            , the project's{" "}
            <a
              href="https://github.com/localsend/localsend/releases"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              releases page
            </a>
            , and{" "}
            <a
              href="https://localsend.org"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              localsend.org
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
                    <th className="px-5 py-3 font-medium">LocalSend</th>
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
                      <CmpCell value={row.ls} />
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
                  "The recipient doesn't have LocalSend installed and you can't ask them to install anything. Just send them to a URL.",
                  "The two devices are on different networks: a colleague on a corporate network, a phone on mobile data, a device in another building.",
                  "You're on a computer that doesn't allow installing software (work-managed PC, school computer).",
                  "You want to send files cross-network without any server storing them.",
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
                Choose LocalSend when...
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You frequently transfer files between devices on the same network and want zero-friction LAN discovery (devices appear automatically).",
                  "You need to transfer very large files with no size limit over a fast local network.",
                  "You need to work completely offline with no internet connection at all.",
                  "You're in a high-trust, air-gapped, or internet-restricted environment where even signaling servers must be avoided.",
                  "You want a persistent native app rather than a browser tab.",
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
              LocalSend is actively maintained. The latest stable release is
              v1.17.0, published February 20, 2025, on the{" "}
              <a
                href="https://github.com/localsend/localsend"
                rel="noopener"
                className="text-primary underline-offset-4 hover:underline"
              >
                localsend/localsend GitHub repository
              </a>
              , which has over 60,000 stars. The project is licensed under MIT.
              LocalSend is available from the Microsoft Store, Mac App Store,
              App Store (iOS), Google Play, and F-Droid, as well as direct binary
              downloads from GitHub Releases. It has been downloaded over 8 million
              times globally.
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
                No install. Works anywhere, any network.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge in a browser on any device, scan the QR with
                the other device, and the file moves directly. No app to install
                on either side.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-localsend-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-localsend" />
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
