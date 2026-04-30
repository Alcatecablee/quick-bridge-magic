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
  "QuickBridge vs PairDrop: No Setup, Just Scan and Send";
const PAGE_DESCRIPTION =
  "PairDrop is a powerful, self-hostable LAN file tool with cross-network rooms and persistent pairing. QuickBridge skips the setup: scan a QR code and send.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-pairdrop";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-pairdrop.png";

/**
 * Inline source list. Every PairDrop claim on this page traces to one of
 * these URLs, fetched directly before writing. Shown in the visible Sources
 * section so any reader can audit the comparison.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] =
  [
    {
      id: "pairdrop-net",
      title: "pairdrop.net (live app, v1.11.2)",
      url: "https://pairdrop.net/",
      fetched: "2026-04-28",
    },
    {
      id: "pairdrop-readme",
      title: "PairDrop GitHub README (schlagmichdoch/PairDrop)",
      url: "https://github.com/schlagmichdoch/PairDrop",
      fetched: "2026-04-28",
    },
    {
      id: "pairdrop-faq",
      title: "PairDrop FAQ (docs/faq.md)",
      url: "https://github.com/schlagmichdoch/pairdrop/blob/master/docs/faq.md",
      fetched: "2026-04-28",
    },
  ];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is PairDrop?",
    a: "PairDrop is an open-source browser-based file sharing app (v1.11.2 at the time of this page) built as a fork of Snapdrop. It adds cross-network transfers to Snapdrop's local-network model, using persistent device pairing (6-digit PIN or QR code) and temporary public rooms (5-letter code or QR). Files travel over WebRTC; the signaling server is not involved in the transfer itself. When two devices cannot establish a direct WebRTC connection across a NAT, PairDrop routes traffic through its own TURN server. PairDrop is self-hostable via Docker or Node.js and has over 10,000 GitHub stars.",
  },
  {
    q: "How is QuickBridge different from PairDrop?",
    a: "Both are browser-based, open-source, free, ad-free tools that transfer files over WebRTC without requiring accounts. The main difference is in the pairing model. PairDrop has three separate modes: LAN auto-discovery (devices on the same Wi-Fi appear automatically), persistent device pairs (set up once with a 6-digit PIN), and temporary public rooms (5-letter code for one-off cross-network sessions). QuickBridge uses a single flow for every scenario (scan a QR code or enter a PIN) and the same connection works whether both devices are on the same Wi-Fi or different networks entirely. PairDrop is richer in features; QuickBridge is simpler for a one-time cross-device send.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge is completely free, with no accounts, no ads, and no sign-up. Files travel directly between the two browsers over an encrypted WebRTC channel. The signaling layer only helps the two browsers find each other and never handles file data.",
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

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBridge vs PairDrop",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

export const Route = createFileRoute("/compare/quickbridge-vs-pairdrop")({
  component: ComparePairDropPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "pairdrop alternative, pairdrop vs quickbridge, browser file transfer, webrtc file sharing, cross network file transfer, pairdrop cross network",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: PAGE_OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: PAGE_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

type Cell = true | false | "neutral";

const COMPARISON_ROWS: {
  label: string;
  qb: Cell;
  pd: Cell;
  note: string;
}[] = [
  {
    label: "Same-LAN auto-discovery (no pairing code needed)",
    qb: false,
    pd: true,
    note: "PairDrop automatically shows all devices on the same local network; no code required. QuickBridge always uses an explicit QR code or PIN regardless of network, which means one extra step on the same Wi-Fi but a consistent flow in every scenario.",
  },
  {
    label: "Cross-network transfers (different Wi-Fi, mobile data)",
    qb: true,
    pd: true,
    note: "Both tools work across different networks. PairDrop does it via persistent device pairs (6-digit PIN) or temporary public rooms (5-letter code). QuickBridge uses the same QR/PIN flow for all connections, local or remote.",
  },
  {
    label: "Single unified pairing flow for all scenarios",
    qb: true,
    pd: "neutral",
    note: "QuickBridge has one pairing model: QR code or PIN, works on any network. PairDrop has three separate modes (LAN auto-discovery, persistent pairs, and temporary public rooms), each with its own setup. More powerful, but more to learn.",
  },
  {
    label: "No app install required",
    qb: true,
    pd: true,
    note: "Both run entirely in a modern web browser and can be added to the home screen as a PWA. Neither requires downloading a native app.",
  },
  {
    label: "No sign-up, no ads, no accounts",
    qb: true,
    pd: true,
    note: "Both are free with no accounts required. PairDrop is funded by voluntary Buy Me a Coffee donations (confirmed in README). QuickBridge has no ads or paid tiers.",
  },
  {
    label: "End-to-end encrypted (WebRTC / DTLS)",
    qb: true,
    pd: true,
    note: "Both use WebRTC, which mandates DTLS encryption for data channels. PairDrop's FAQ states: \"WebRTC encrypts the files in transit.\" Both tools' signaling servers help devices find each other but are not involved in the file transfer itself.",
  },
  {
    label: "Self-hostable on your own infrastructure",
    qb: "neutral",
    pd: true,
    note: "PairDrop ships detailed Docker and Node.js hosting guides, lets you configure your own STUN/TURN servers, and has a WebSocket fallback for environments where WebRTC is blocked. QuickBridge does not currently publish a self-hosting guide.",
  },
  {
    label: "OS Share menu / context menu / CLI integration",
    qb: false,
    pd: true,
    note: "PairDrop supports sending files directly from the Windows context menu, the iOS/Android Share sheet, and a command-line interface. QuickBridge is browser-only: you drag and drop or pick files from the browser UI.",
  },
  {
    label: "Open source",
    qb: true,
    pd: true,
    note: "Both projects are open source on GitHub. PairDrop (schlagmichdoch/PairDrop) has over 10,000 stars and was last updated five days before this page was written.",
  },
];

function ComparePairDropPage() {
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

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-[12px] text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">Compare</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">vs PairDrop</span>
        </nav>

        {/* Hero */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs PairDrop
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">
              Short answer:
            </strong>{" "}
            PairDrop is the most feature-complete open-source AirDrop alternative
            in a browser: LAN auto-discovery, persistent device pairs, public
            rooms, context-menu integration, CLI support. QuickBridge is built
            for a narrower job: scan one QR code (or share a PIN), and a file
            moves between any two browsers, on any network, in seconds. If you
            want a Swiss Army knife, choose PairDrop. If you want a scalpel for
            one-off cross-device sends, QuickBridge is faster to start.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link
                to="/"
                search={{ utm_source: "compare-pairdrop" } as never}
              >
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
            Free forever · No sign-up · Encrypted end-to-end
          </p>
        </header>

        {/* Comparison table */}
        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Feature-by-feature comparison
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Every PairDrop column entry below is sourced from the live{" "}
            <a
              href="https://pairdrop.net/"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              pairdrop.net
            </a>{" "}
            app, the project's{" "}
            <a
              href="https://github.com/schlagmichdoch/PairDrop"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              GitHub README
            </a>
            , and the project's own{" "}
            <a
              href="https://github.com/schlagmichdoch/pairdrop/blob/master/docs/faq.md"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              FAQ
            </a>{" "}
            (see Sources at the bottom of this page).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">
                      QuickBridge
                    </th>
                    <th className="px-5 py-3 font-medium">PairDrop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-muted/10">
                      <td className="px-5 py-3.5 align-top">
                        <span className="font-medium text-foreground">
                          {row.label}
                        </span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                          {row.note}
                        </span>
                      </td>
                      <CmpCell value={row.qb} highlight />
                      <CmpCell value={row.pd} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Honest verdict */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            The honest verdict
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5 p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose QuickBridge when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're doing a one-time send to a colleague or friend and want to be up and running in under ten seconds. One QR scan, done.",
                  "The two devices are on different networks and you don't want to learn three different pairing modes (LAN, persistent pair, public room).",
                  "You're sending from a device you've never transferred to before and don't want to manage a persistent pairs list.",
                  "You want the simplest possible mental model: one QR or PIN, one connection, one transfer.",
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
                Choose PairDrop when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're on the same Wi-Fi and want zero-setup discovery: just open PairDrop and your devices appear automatically.",
                  "You transfer between the same set of devices regularly and want persistent pairing so you never enter a code again.",
                  "You want to self-host the tool on your own server with your own STUN/TURN configuration.",
                  "You need OS-level integration: send files from the Windows right-click menu, the iOS Share sheet, or the command line.",
                  "You want a richer feature set: text messages, ZIP bundling, video preview, HEIC conversion, 30+ language UI.",
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

        {/* Status note */}
        <Reveal as="section" className="mt-12">
          <Card className="border-border bg-muted/20 p-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status note (April 2026)
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">
              PairDrop is actively maintained. The{" "}
              <a
                href="https://github.com/schlagmichdoch/PairDrop"
                rel="noopener"
                className="text-primary underline-offset-4 hover:underline"
              >
                GitHub repository
              </a>{" "}
              (schlagmichdoch/PairDrop) received its most recent commit on
              April 22, 2026, five days before this page was written. The live
              app at pairdrop.net displays version v1.11.2. Unlike Snapdrop,
              PairDrop has not been acquired by any third party; it remains a
              volunteer open-source project. One thing worth understanding
              before choosing either tool: when two devices are on different
              networks behind a NAT and cannot establish a direct WebRTC
              connection, PairDrop routes traffic through its own TURN server.
              This is the same model QuickBridge uses for cross-network
              transfers. The live pairdrop.net UI surfaces this honestly with a
              notice: "Traffic is routed through the server if WebRTC is not
              available."
            </p>
          </Card>
        </Reveal>

        {/* FAQ */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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

        {/* Sources */}
        <Reveal as="section" className="mt-14" id="sources">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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

        {/* CTA */}
        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 bg-grid opacity-30"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Try it in under ten seconds. No setup required.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan the QR with your phone,
                and the file moves browser-to-browser. No accounts, no modes to
                choose between, no persistent pair to manage.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link
                  to="/"
                  search={{ utm_source: "compare-pairdrop-cta" } as never}
                >
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-pairdrop" />
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
