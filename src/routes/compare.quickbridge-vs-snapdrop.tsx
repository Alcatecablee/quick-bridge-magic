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
  "QuickBridge vs Snapdrop - Cross-Network File Transfer";
const PAGE_DESCRIPTION =
  "Snapdrop only pairs devices on the same Wi-Fi network. QuickBridge sends files between any two browsers on any network, no install or sign-up needed.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-snapdrop";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-snapdrop.png";

/**
 * Inline source list - every competitor claim on this page must trace to one
 * of these URLs. Surfaced in the visible Sources section at the bottom of the
 * page so any reader can audit the comparison. Updated when the upstream
 * sources change.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] = [
  {
    id: "snapdrop-net",
    title: "snapdrop.net (live homepage meta)",
    url: "https://snapdrop.net/",
    fetched: "2026-04-26",
  },
  {
    id: "snapdrop-readme",
    title: "Snapdrop GitHub README (RobinLinus/snapdrop)",
    url: "https://github.com/RobinLinus/snapdrop",
    fetched: "2026-04-26",
  },
  {
    id: "snapdrop-faq",
    title: "Snapdrop FAQ (docs/faq.md)",
    url: "https://github.com/RobinLinus/snapdrop/blob/master/docs/faq.md",
    fetched: "2026-04-26",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based peer-to-peer file transfer tool. Unlike Snapdrop, which discovers devices on the same local network, QuickBridge pairs devices with a QR code or 6-digit PIN so transfers work whether both devices are on the same Wi-Fi or on entirely different networks. Files stream directly between the two browsers over a DTLS-encrypted WebRTC channel with no server storage. No account, no install, and no local network requirement.",
  },
  {
    q: "What is Snapdrop?",
    a: "Snapdrop is an open-source web app that pairs devices on the same local network and lets them transfer files browser-to-browser using WebRTC. It was created by Robin Linus and is described on snapdrop.net as a tool for sharing files with people nearby. The project's GitHub README also notes that Snapdrop has been acquired by LimeWire - at the time of this page (April 2026) snapdrop.net still serves the classic open-source product.",
  },
  {
    q: "How is QuickBridge different from Snapdrop?",
    a: "Snapdrop discovers devices that share the same local network - it cannot pair two devices on different Wi-Fi networks or across mobile data. QuickBridge pairs devices by QR code or short PIN, so it works on the same Wi-Fi for maximum speed and across different networks via STUN and TURN. Both are browser-based, both use WebRTC encryption, and neither stores your files on a server.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge is free, has no accounts, no ads, and no sign-up. Files travel directly between your two browsers over an encrypted WebRTC channel. The signaling layer only helps the two browsers find each other and never sees the file contents.",
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
  headline: "QuickBridge vs Snapdrop",
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

export const Route = createFileRoute("/compare/quickbridge-vs-snapdrop")({
  component: CompareSnapdropPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "snapdrop alternative, snapdrop cross network, snapdrop replacement, browser file transfer, webrtc file sharing, snapdrop vs quickbridge",
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

const COMPARISON_ROWS: { label: string; qb: Cell; sd: Cell; note: string }[] = [
  {
    label: "Works across different networks (cross-Wi-Fi, mobile data)",
    qb: true,
    sd: false,
    note: "Snapdrop pairs by shared local network only. QuickBridge uses STUN and TURN to bridge networks.",
  },
  {
    label: "No app install required",
    qb: true,
    sd: true,
    note: "Both run entirely in the browser. Both can be added to the home screen as a PWA.",
  },
  {
    label: "End-to-end encrypted (WebRTC / DTLS)",
    qb: true,
    sd: true,
    note: "Both use WebRTC, which mandates DTLS encryption for the data channel.",
  },
  {
    label: "No server-side file storage",
    qb: true,
    sd: true,
    note: "Files travel peer-to-peer in both. Neither product persists file contents server-side.",
  },
  {
    label: "No sign-up, no ads",
    qb: true,
    sd: true,
    note: "Both are free, no accounts, no advertising in the official builds.",
  },
  {
    label: "QR-code pairing for cross-device handoff",
    qb: true,
    sd: false,
    note: "Snapdrop auto-discovers peers on your network - no QR step. QuickBridge uses a QR/PIN so devices on different networks can still find each other.",
  },
  {
    label: "Targeted pairing with a specific person (PIN)",
    qb: true,
    sd: "neutral",
    note: "Snapdrop shows everyone on your local network as random animal names; you pick a name. QuickBridge pairs only with the device that scans your QR or enters your PIN.",
  },
  {
    label: "Open source",
    qb: true,
    sd: true,
    note: "QuickBridge is in active development. Snapdrop's classic codebase is open-source on GitHub; the GitHub README notes the project has been acquired by LimeWire.",
  },
];

function CompareSnapdropPage() {
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
          <span className="text-foreground">vs Snapdrop</span>
        </nav>

        {/* Hero - mirrors the homepage recipe (font-black, muted-grey
            highlight, 13.5/15 lead at max-w-3xl). The verdict paragraph is
            longer than other heroes but uses the same type scale. */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs Snapdrop
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">Short answer:</strong>{" "}
            Snapdrop is excellent if both devices are on the same Wi-Fi. The
            moment they're on different networks - phone on cellular, laptop on
            office Wi-Fi, two homes - Snapdrop can't pair them. QuickBridge is
            built for that case: scan a QR or share a short PIN, and the two
            browsers connect over the public internet using the same WebRTC
            encryption Snapdrop uses on the LAN.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-snapdrop" } as never}>
                Try QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/airdrop-alternative">Why use a browser-based tool?</Link>
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
            Every Snapdrop column entry below is sourced from the live{" "}
            <a href="https://snapdrop.net" rel="noopener" className="text-primary underline-offset-4 hover:underline">snapdrop.net</a>{" "}
            page or the project's own{" "}
            <a href="https://github.com/RobinLinus/snapdrop/blob/master/docs/faq.md" rel="noopener" className="text-primary underline-offset-4 hover:underline">FAQ</a>{" "}
            (see Sources at the bottom of this page).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">Snapdrop</th>
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
                      <CmpCell value={row.sd} />
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
                  "The two devices are on different networks - phone on cellular, laptop on Wi-Fi, two homes, or office vs home.",
                  "You're sharing with someone you don't share a network with, and you don't want to add them to your Wi-Fi just to send one file.",
                  "You want explicit pairing (QR or PIN) instead of seeing every device on the network.",
                  "You want predictable, documented per-file caps (2 GB by default, up to 10 GB with receiver auto-save) instead of relying on whatever your browser's memory limit happens to be.",
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
                Choose Snapdrop when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "Both devices are on the same Wi-Fi and you prefer auto-discovery to scanning a QR code.",
                  "You want to self-host the transfer tool on your own infrastructure - Snapdrop's classic codebase is open-source on GitHub.",
                  "Your use case is sharing among family or roommates already on the same router, where the LAN constraint is a feature, not a limit.",
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

        {/* Status disclosure - Snapdrop's GitHub README announces an acquisition
            by LimeWire. Surface that uncertainty honestly so readers can decide
            for themselves rather than discover it after a broken expectation. */}
        <Reveal as="section" className="mt-12">
          <Card className="border-border bg-muted/20 p-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status note (April 2026)
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">
              Snapdrop's{" "}
              <a href="https://github.com/RobinLinus/snapdrop" rel="noopener" className="text-primary underline-offset-4 hover:underline">
                GitHub README
              </a>{" "}
              states the project has been acquired by LimeWire, with the live
              site offering up to 40 GB free cloud storage for signed-up users.
              At the time we verified for this page, snapdrop.net was still
              serving the classic peer-to-peer LimeWire-free product. The
              comparison above reflects the classic Snapdrop behaviour as
              documented in the project's own FAQ. We will update this page if
              snapdrop.net's product changes.
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
                Try it across two different networks right now
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan the QR with your phone
                on cellular, and watch a file move browser-to-browser without a
                LAN.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-snapdrop-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-snapdrop" />
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
