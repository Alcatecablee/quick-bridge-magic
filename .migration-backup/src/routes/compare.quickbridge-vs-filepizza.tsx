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
  "QuickBridge vs FilePizza: QR Pairing vs Link Sharing";
const PAGE_DESCRIPTION =
  "FilePizza generates a one-way download link. QuickBridge pairs two devices with a QR scan for a two-way session. Here's how the two WebRTC tools compare.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-filepizza";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-filepizza.png";
const PAGE_OG_ALT =
  "QuickBridge vs FilePizza: browser-to-browser P2P transfer with no server upload and no torrent client.";

/**
 * Sources: every FilePizza claim below traces to one of these URLs,
 * verified directly before writing. Shown in the visible Sources section.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] =
  [
    {
      id: "filepizza-github",
      title: "FilePizza GitHub README (kern/filepizza)",
      url: "https://github.com/kern/filepizza",
      fetched: "2026-05-16",
    },
    {
      id: "filepizza-site",
      title: "file.pizza (live app, v2)",
      url: "https://file.pizza",
      fetched: "2026-05-16",
    },
  ];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based peer-to-peer file transfer tool. Open quickbridge.app on two devices, scan the QR code or enter the 6-digit PIN, and both devices enter a shared session. Either side can send files, text, or clipboard content. The connection stays open until you close it, so you can send multiple batches without re-pairing. No account, no install.",
  },
  {
    q: "What is FilePizza?",
    a: "FilePizza (file.pizza) is a browser-based WebRTC file transfer tool. The sender selects a file, receives a temporary link (called a 'tempalink'), and shares that link with the recipient. The recipient visits the link and the file downloads directly from the sender's browser via WebRTC. The sender must keep their browser tab open for the entire duration of the transfer. When the sender closes the tab, the link expires. FilePizza is open source (BSD 3-Clause license) on GitHub (kern/filepizza), actively maintained as of May 2026, and self-hostable.",
  },
  {
    q: "What happens if the sender closes their browser in FilePizza?",
    a: "The transfer stops and the download link becomes invalid. This is by design: FilePizza has no server storage, so the file only exists in the sender's browser tab. If the transfer is interrupted, the recipient must ask the sender to reopen the tab and generate a new link. QuickBridge sessions allow the sender to leave and re-enter; files that have already been sent are stored in the session history for the duration of the session.",
  },
  {
    q: "Can multiple people download the same file from FilePizza at once?",
    a: "Yes. FilePizza v2 supports multiple simultaneous downloaders. Once a recipient has fully received the file, their browser continues to seed the file to other recipients still downloading, reducing the bandwidth load on the sender. QuickBridge sessions are one-to-one: a single pair of devices connected by QR or PIN.",
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
const MODIFIED = "2026-05-16";

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBridge vs FilePizza",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  author: { "@type": "Person", name: "Clive", url: "https://quickbridge.app/about" },
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
    { "@type": "ListItem", position: 3, name: "vs FilePizza", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/compare/quickbridge-vs-filepizza")({
  component: CompareFilePizzaPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "filepizza alternative, filepizza vs quickbridge, browser file transfer webrtc, peer to peer file sharing browser, file.pizza alternative",
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
  fp: Cell;
  note: string;
}[] = [
  {
    label: "Pairing model",
    qb: "neutral",
    fp: "neutral",
    note: "QuickBridge: the receiver opens a session on their device, and the sender scans the QR code or enters the PIN to join. Both devices enter a shared session. FilePizza: the sender selects the file first, receives a temporary link, and shares that link with whoever should receive the file. The receiver visits the URL to start the download.",
  },
  {
    label: "Sender must keep browser tab open during transfer",
    qb: false,
    fp: true,
    note: "In FilePizza, the file lives in the sender's browser tab. The tab must remain open for the entire transfer or the link expires and the download stops. In QuickBridge, files are streamed during the transfer but the session itself persists independently of file transfers.",
  },
  {
    label: "Two-way transfers in the same session",
    qb: true,
    fp: false,
    note: "QuickBridge sessions are bidirectional: either side can send files or text to the other at any point. FilePizza is one-directional by design: the sender holds the file, and the recipient downloads it. The recipient cannot send files back through the same link.",
  },
  {
    label: "Text and clipboard sharing",
    qb: true,
    fp: false,
    note: "QuickBridge includes a text field in the session for sending links, 2FA codes, addresses, and any plain text. FilePizza is a file transfer tool only and does not include a text messaging channel.",
  },
  {
    label: "Multiple simultaneous recipients",
    qb: false,
    fp: true,
    note: "FilePizza v2 supports multiple simultaneous downloaders: completed recipients seed to incomplete ones, reducing bandwidth on the sender. QuickBridge pairs exactly two devices per session.",
  },
  {
    label: "Password-protected transfers",
    qb: false,
    fp: true,
    note: "FilePizza offers optional password protection on a link. The recipient must enter the password before the download begins. QuickBridge relies on emoji verification of the shared session for security rather than a password.",
  },
  {
    label: "No account required",
    qb: true,
    fp: true,
    note: "Both tools are fully account-free. Open the site and transfer.",
  },
  {
    label: "Files never stored on a server",
    qb: true,
    fp: true,
    note: "Both tools transfer files directly via WebRTC without uploading to a server. FilePizza's README states: 'data is never stored on an intermediary server.' QuickBridge's signaling layer handles only the initial connection handshake.",
  },
  {
    label: "Open source",
    qb: true,
    fp: true,
    note: "QuickBridge is open source on GitHub. FilePizza is open source under the BSD 3-Clause license at github.com/kern/filepizza.",
  },
  {
    label: "Self-hostable",
    qb: "neutral",
    fp: true,
    note: "FilePizza publishes a detailed self-hosting guide: Next.js app, optional Redis for state, configurable STUN/TURN servers. QuickBridge does not currently publish a self-hosting guide.",
  },
];

function CompareFilePizzaPage() {
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
          <span className="text-foreground">vs FilePizza</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs FilePizza
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">
              Short answer:
            </strong>{" "}
            Both are browser-based WebRTC tools with no accounts and no server
            storage. The difference is the pairing model. FilePizza generates a
            download link: the sender picks a file, gets a URL, and shares it.
            QuickBridge scans a QR code to open a persistent two-way session
            where either side can send files, text, or clipboard content.
            FilePizza wins for multi-recipient downloads. QuickBridge wins for
            phone-to-PC sessions where you want to send multiple things back and
            forth.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-filepizza" } as never}>
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
            No sign-up · Encrypted end-to-end
          </p>
        </header>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Feature-by-feature comparison
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Every FilePizza column entry below is sourced from the{" "}
            <a
              href="https://github.com/kern/filepizza"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              FilePizza GitHub README
            </a>{" "}
            and the live{" "}
            <a
              href="https://file.pizza"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              file.pizza
            </a>{" "}
            application (see Sources at the bottom).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">FilePizza</th>
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
                      <CmpCell value={row.fp} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            The honest verdict
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5 p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose QuickBridge when...
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're transferring between two specific devices (your phone and your PC) and want a persistent two-way session.",
                  "You want to send multiple files, text snippets, and clipboard content in the same session without generating a new link each time.",
                  "The recipient should also be able to send files back to you.",
                  "You prefer QR code pairing over link sharing, which is especially useful when one device is a phone.",
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
                Choose FilePizza when...
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "You're distributing a file to multiple recipients at once and want them all to download from the same link.",
                  "You want password-protected download links.",
                  "You prefer a link-sharing model where you send a URL and anyone with it can download.",
                  "You want to self-host the tool on your own server with configurable STUN/TURN.",
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
              FilePizza is actively maintained as of May 2026, with recent
              automated dependency updates on the{" "}
              <a
                href="https://github.com/kern/filepizza"
                rel="noopener"
                className="text-primary underline-offset-4 hover:underline"
              >
                kern/filepizza GitHub repository
              </a>
              . The live app at{" "}
              <a
                href="https://file.pizza"
                rel="noopener"
                className="text-primary underline-offset-4 hover:underline"
              >
                file.pizza
              </a>{" "}
              runs v2, which introduced Service Worker streaming for large files
              and added Safari/Mobile Safari support that was absent in v1. The
              project uses no tagged releases; versioning is tracked on the main
              branch.
            </p>
          </Card>
        </Reveal>

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

        <Reveal as="section" className="mt-16">
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                A two-way session in under ten seconds
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan the QR with your phone,
                and both devices can send files, text, and clipboard content to
                each other. No accounts, no links to manage.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-filepizza-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-filepizza" />
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
