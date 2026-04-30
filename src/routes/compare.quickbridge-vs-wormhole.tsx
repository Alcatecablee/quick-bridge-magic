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
  "QuickBridge vs Wormhole - Browser P2P Without Cloud";
const PAGE_DESCRIPTION =
  "Wormhole uploads your encrypted files to its servers for 24 hours. QuickBridge sends them browser-to-browser with no server hop and no upload wait.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-wormhole";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-wormhole.png";

/**
 * Inline source list - every competitor claim on this page must trace to one
 * of these URLs. Surfaced in the visible Sources section at the bottom of the
 * page so any reader can audit the comparison. Updated when the upstream
 * sources change.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] = [
  {
    id: "wormhole-home",
    title: "wormhole.app (live homepage)",
    url: "https://wormhole.app/",
    fetched: "2026-04-28",
  },
  {
    id: "wormhole-faq",
    title: "Wormhole FAQ",
    url: "https://wormhole.app/faq",
    fetched: "2026-04-28",
  },
  {
    id: "wormhole-security",
    title: "Wormhole Security Design",
    url: "https://wormhole.app/security",
    fetched: "2026-04-28",
  },
  {
    id: "wormhole-roadmap",
    title: "Wormhole Roadmap",
    url: "https://wormhole.app/roadmap",
    fetched: "2026-04-28",
  },
  {
    id: "wormhole-why",
    title: "Why We Built Wormhole",
    url: "https://wormhole.app/why",
    fetched: "2026-04-28",
  },
  {
    id: "wormhole-legal",
    title: "Wormhole Terms & Privacy (operated by WebTorrent, LLC)",
    url: "https://wormhole.app/legal",
    fetched: "2026-04-28",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is Wormhole?",
    a: "Wormhole is a browser-based file-sharing service operated by WebTorrent, LLC. You drop files into the page and share a link. Files are encrypted in your browser with AES-128-GCM via the Web Crypto API before they leave the device. Per Wormhole's FAQ, files up to 5 GB are stored on Wormhole's servers (Backblaze B2) for 24 hours so the link keeps working after you close the tab; files larger than 5 GB transfer peer-to-peer via WebTorrent. The Wormhole homepage advertises a 10 GB ceiling overall.",
  },
  {
    q: "How is QuickBridge different from Wormhole?",
    a: "The headline difference is the server-touch model. Wormhole's typical flow uploads your encrypted files to its servers, and a 24-hour copy lets the recipient download even after you close your tab. QuickBridge never uploads anywhere - files travel directly between two browsers over an encrypted WebRTC channel (DTLS), and both browsers must be open during the transfer. QuickBridge wins for true zero-server-touch transfers and in-person QR handoff; Wormhole wins when you want to fire-and-forget a link the recipient will open later.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge is free, with no accounts, no email required, no ads, and no Pro tier. Files travel peer-to-peer over an encrypted WebRTC channel and are never persisted by QuickBridge - the signaling layer only helps the two browsers find each other and never sees the file contents.",
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
  headline: "QuickBridge vs Wormhole",
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

export const Route = createFileRoute("/compare/quickbridge-vs-wormhole")({
  component: CompareWormholePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "wormhole.app alternative, wormhole alternative, wormhole vs quickbridge, browser file transfer, no upload file sharing, peer-to-peer file transfer, end-to-end encrypted file sharing",
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

const COMPARISON_ROWS: { label: string; qb: Cell; wh: Cell; note: string }[] = [
  {
    label: "Files travel directly browser-to-browser, no server hop",
    qb: true,
    wh: "neutral",
    note: "Wormhole's typical flow uploads encrypted files to its servers (Backblaze) for 24 hours; files larger than 5 GB switch to peer-to-peer via WebTorrent. QuickBridge is always direct - bytes never persist on a server.",
  },
  {
    label: "Sender can close the tab after sharing the link",
    qb: false,
    wh: true,
    note: "Wormhole's 24-hour server copy keeps the link working after you close the page. QuickBridge requires both browsers to stay open for the duration of the transfer.",
  },
  {
    label: "End-to-end encryption",
    qb: true,
    wh: true,
    note: "QuickBridge uses WebRTC's mandatory DTLS (typically AES-256-GCM). Wormhole uses AES-128-GCM via the Web Crypto API before files leave the browser; the decryption key lives in the URL fragment and is never sent to Wormhole's server.",
  },
  {
    label: "Maximum advertised file size",
    qb: true,
    wh: true,
    note: "QuickBridge: up to 10 GB per file when the receiver enables auto-save (saves directly to disk on Chromium-based browsers), 2 GB otherwise. Wormhole's homepage advertises a 10 GB ceiling - files up to 5 GB use the cloud relay, 5-10 GB switches to peer-to-peer.",
  },
  {
    label: "No sign-up, no email required",
    qb: true,
    wh: true,
    note: "Both services let you send instantly without an account. Wormhole's product-update mailing list is opt-in.",
  },
  {
    label: "No ads, no third-party trackers",
    qb: true,
    wh: true,
    note: "QuickBridge: none. Wormhole's security page explicitly states 'No ads. No trackers. No kidding.'",
  },
  {
    label: "Open source",
    qb: true,
    wh: "neutral",
    note: "Wormhole's wormhole-crypto streaming-encryption module is open source per their security design; the full client and server are not. QuickBridge is in active development.",
  },
  {
    label: "Native desktop app",
    qb: false,
    wh: true,
    note: "Wormhole ships a Microsoft Store app (Windows 10, Xbox, HoloLens) per their roadmap. QuickBridge is browser-only - installable as a PWA on every major OS.",
  },
];

function CompareWormholePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      {/* Inline JSON-LD for SEO. Crawlers parse these regardless of position. */}
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
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">Compare</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">vs Wormhole</span>
        </nav>

        {/* Hero - matches Snapdrop pattern: keyword-led h1, verdict-first lead. */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs Wormhole
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">Short answer:</strong>{" "}
            Wormhole is excellent when you want to fire-and-forget a link the
            recipient will open later - your encrypted files sit on Wormhole's
            servers for 24 hours so they can download even after you close the
            tab. QuickBridge never uploads anywhere: the two browsers connect
            directly over an encrypted WebRTC channel, and bytes only ever
            exist on your two devices. Different tools for different jobs.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-wormhole" } as never}>
                Try QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/why-quickbridge">Why no-server-touch matters</Link>
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
            Every Wormhole column entry below is sourced from the live{" "}
            <a href="https://wormhole.app" rel="noopener" className="text-primary underline-offset-4 hover:underline">wormhole.app</a>{" "}
            home, the project's own{" "}
            <a href="https://wormhole.app/faq" rel="noopener" className="text-primary underline-offset-4 hover:underline">FAQ</a>,{" "}
            <a href="https://wormhole.app/security" rel="noopener" className="text-primary underline-offset-4 hover:underline">Security Design</a>, and{" "}
            <a href="https://wormhole.app/roadmap" rel="noopener" className="text-primary underline-offset-4 hover:underline">Roadmap</a>{" "}
            (see Sources at the bottom of this page).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">Wormhole</th>
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
                      <CmpCell value={row.wh} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Honest verdict - fairness signal for both readers and search engines.
            Google's product-review guidelines explicitly favor balanced verdicts
            that name use cases for the competitor too. */}
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
                  "You want bytes to never touch a server, even encrypted, even briefly. The transfer should be browser-to-browser, period.",
                  "You're handing off in person - phone in hand, laptop open - and a QR scan or 6-digit PIN is faster than copy-pasting a link.",
                  "You don't want a third-party storage provider (Backblaze, in Wormhole's case) in the trust chain.",
                  "You want a pricing model that stays free with no Pro tier on the roadmap.",
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
                Choose Wormhole when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You want to share a link and walk away - the recipient will open it later, possibly hours after you close your tab.",
                  "You'd rather upload to a server and share a link than coordinate two tabs being open at the same time.",
                  "You want a Microsoft Store app for Windows 10, Xbox, or HoloLens.",
                  "You're already used to the encrypted-link share-anywhere model and don't need an in-person pairing step.",
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

        {/* Status disclosure - Wormhole's roadmap lists "Peer-to-peer Mode (no
            cloud)" as upcoming, while their FAQ says >5 GB already uses P2P.
            Surface that nuance honestly so readers don't assume one source over
            the other. */}
        <Reveal as="section" className="mt-12">
          <Card className="border-border bg-muted/20 p-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status note (April 2026)
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">
              Wormhole's{" "}
              <a href="https://wormhole.app/roadmap" rel="noopener" className="text-primary underline-offset-4 hover:underline">
                roadmap
              </a>{" "}
              lists a fully cloudless &quot;Peer-to-peer Mode&quot; as
              upcoming, even though their{" "}
              <a href="https://wormhole.app/faq" rel="noopener" className="text-primary underline-offset-4 hover:underline">
                FAQ
              </a>{" "}
              already states that files larger than 5 GB transfer
              peer-to-peer via WebTorrent. Reading both sources together: today,
              files up to 5 GB are encrypted in your browser and uploaded to
              Wormhole&apos;s Backblaze servers (deleted after 24 hours), while
              files between 5 GB and 10 GB transfer browser-to-browser. A
              future cloudless mode that bypasses the upload entirely is on the
              roadmap. The comparison above reflects this present-day model.
              We will update this page if Wormhole&apos;s product changes.
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
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
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

        {/* Sources - visible audit trail for every competitor claim above. */}
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
                <span className="text-muted-foreground/70">- verified {src.fetched}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* CTA */}
        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Try a transfer that never touches a server
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge in two browsers, scan the QR or share the
                6-digit PIN, and watch a file move directly between your two
                devices - no upload, no cloud, no waiting.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-wormhole-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-wormhole" />
        <SiteFooter />
      </main>
    </div>
  );
}

function CmpCell({ value, highlight = false }: { value: Cell; highlight?: boolean }) {
  return (
    <td className={"px-5 py-3.5 align-top " + (highlight ? "bg-primary/5" : "")}>
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
        <span className="inline-flex items-center gap-1 text-muted-foreground/70" title="Different model - not a yes or no">
          <Minus className="h-4 w-4" />
          <span className="sr-only">Different model</span>
        </span>
      )}
    </td>
  );
}
