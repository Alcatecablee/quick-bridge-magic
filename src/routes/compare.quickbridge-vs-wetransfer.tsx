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
  "QuickBridge vs WeTransfer: No Upload, No Account";
const PAGE_DESCRIPTION =
  "WeTransfer uploads your files to the cloud and expires them in 3 days. QuickBridge sends files directly between browsers. No upload, no account, no expiry.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-wetransfer";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-wetransfer.png";

/**
 * Inline source list. Every WeTransfer claim on this page traces to one of
 * these URLs, fetched directly before writing. Shown in the visible Sources
 * section so any reader can audit the comparison.
 *
 * Note: WeTransfer restructured its plans in December 2024 (Pro/Plus/Premium
 * merged into Ultimate; free limit raised from 2 GB to 3 GB; expiry shortened
 * from 7 days to 3 days). All figures below reflect the December 2024+ model.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] =
  [
    {
      id: "wt-pricing",
      title: "WeTransfer Pricing page",
      url: "https://wetransfer.com/pricing",
      fetched: "2026-04-28",
    },
    {
      id: "wt-about",
      title: "WeTransfer About page",
      url: "https://wetransfer.com/about",
      fetched: "2026-04-28",
    },
    {
      id: "wt-new-plans",
      title:
        "WeTransfer Help: New WeTransfer subscription plans (December 2024)",
      url: "https://help.wetransfer.com/hc/en-us/articles/23265597795346-New-WeTransfer-subscription-plans",
      fetched: "2026-04-28",
    },
  ];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is WeTransfer?",
    a: "WeTransfer is a cloud-based file transfer service used by around 65 million people monthly across 155 countries. You upload files to WeTransfer's servers and they generate a download link that the recipient opens. Free accounts can send up to 3 GB per month across up to 10 transfers, with links expiring after 3 days. WeTransfer funds the free tier through advertising displayed as wallpaper backgrounds.",
  },
  {
    q: "How is QuickBridge different from WeTransfer?",
    a: "The core difference is where the file goes. WeTransfer uploads your file to its cloud servers, stores it there, then lets the recipient download it (even hours or days later). QuickBridge never uploads anything: the file travels directly between your browser and the recipient's browser over an encrypted WebRTC channel. This means no cloud storage, no expiry date, no server that can see your file, and no account required. The trade-off is that both browsers must be open at the same time.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge is completely free with no accounts, no ads, and no sign-up. Files travel directly between the two browsers over an encrypted WebRTC data channel. The signaling layer only helps the two browsers find each other and never handles file data.",
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
  headline: "QuickBridge vs WeTransfer",
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

export const Route = createFileRoute("/compare/quickbridge-vs-wetransfer")({
  component: CompareWeTransferPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "wetransfer alternative, wetransfer no signup, wetransfer alternative free, browser file transfer, p2p file sharing, wetransfer vs quickbridge, no upload file transfer",
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
  wt: Cell;
  note: string;
}[] = [
  {
    label: "Files travel directly browser-to-browser (no server upload)",
    qb: true,
    wt: false,
    note: "WeTransfer uploads your file to their cloud servers; the recipient then downloads from those servers. QuickBridge streams the file directly from your browser to the recipient's browser over WebRTC. WeTransfer's servers never handle the data.",
  },
  {
    label: "No account or sign-up required",
    qb: true,
    wt: false,
    note: 'WeTransfer free requires creating an account (\'Create account\' on the pricing page). QuickBridge requires no account, email, or login. Open the page and share the QR or PIN.',
  },
  {
    label: "No file expiry",
    qb: true,
    wt: false,
    note: "WeTransfer free transfers expire after 3 days; paid Ultimate plans remove the expiry. QuickBridge has no expiry because nothing is stored. The transfer is live while both browsers are connected.",
  },
  {
    label: "No advertising",
    qb: true,
    wt: false,
    note: "WeTransfer's free and Starter tiers display advertising wallpapers (confirmed on the pricing page). Paying for Ultimate removes ads. QuickBridge has no ads on any tier.",
  },
  {
    label: "End-to-end encrypted",
    qb: true,
    wt: "neutral",
    note: 'QuickBridge uses WebRTC\'s mandatory DTLS encryption: the key is negotiated between the two browsers and the server never sees the data. WeTransfer encrypts files in transit (TLS) and at rest, but the keys are held server-side, meaning WeTransfer\'s infrastructure can technically access the file. The pricing page lists "Data encryption" for all tiers, but this is storage encryption, not E2E.',
  },
  {
    label: "No monthly transfer cap",
    qb: true,
    wt: false,
    note: "WeTransfer free is capped at 10 transfers per month and 3 GB total per rolling 30-day window. QuickBridge has no monthly cap; you can start as many transfers as you need.",
  },
  {
    label: "No app install required",
    qb: true,
    wt: true,
    note: "Both run in the browser. Neither needs a native app installed.",
  },
  {
    label: "Works across different networks",
    qb: true,
    wt: true,
    note: "Both work across different networks. WeTransfer does it by storing the file centrally; QuickBridge does it by using STUN and TURN relays to establish a direct peer-to-peer channel.",
  },
  {
    label: "Recipient can download later (async)",
    qb: false,
    wt: true,
    note: "Because WeTransfer stores your file server-side, the recipient can download at any time while the link is live. QuickBridge requires both browsers to be open simultaneously: it is a live transfer, not a drop-and-collect service.",
  },
];

function CompareWeTransferPage() {
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
          <span className="text-foreground">vs WeTransfer</span>
        </nav>

        {/* Hero */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs WeTransfer
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">
              Short answer:
            </strong>{" "}
            WeTransfer is the gold standard for "upload once, share a link"
            convenience: great when the recipient isn't online yet, or when you
            need to send the same file to multiple people. QuickBridge is what
            you reach for when you need the file to move right now without
            touching a server: no account, no upload, no 3-day countdown, and
            no server that can read what you sent.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link
                to="/"
                search={{ utm_source: "compare-wetransfer" } as never}
              >
                Try QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/why-quickbridge">
                Why no-server-touch matters
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
            Every WeTransfer column entry below is sourced from the live{" "}
            <a
              href="https://wetransfer.com/pricing"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              wetransfer.com/pricing
            </a>{" "}
            page and the official{" "}
            <a
              href="https://help.wetransfer.com/hc/en-us/articles/23265597795346-New-WeTransfer-subscription-plans"
              rel="noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              December 2024 plan-change article
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
                    <th className="px-5 py-3 font-medium">WeTransfer</th>
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
                      <CmpCell value={row.wt} />
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
                  "Both people are online at the same time and you want the file to move immediately, browser to browser.",
                  "You don't want your file to touch any server. The content should only exist on the two devices involved.",
                  "You have no account and don't want to create one just to send a single file.",
                  "You're transferring something private and the 3-day window in a third-party cloud feels like an unnecessary exposure.",
                  "You hit WeTransfer's 10-transfer-per-month or 3 GB/month free cap and need an alternative.",
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
                Choose WeTransfer when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "The recipient isn't online right now. WeTransfer lets them download the file at their convenience within the link's active window.",
                  "You need to send the same file to multiple recipients via a single link.",
                  "You're sending large deliverables to a client and want a branded, professional download page (available on paid tiers).",
                  "You want an audit trail or email confirmation that a file was downloaded.",
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
              WeTransfer restructured its plans in{" "}
              <a
                href="https://help.wetransfer.com/hc/en-us/articles/23265597795346-New-WeTransfer-subscription-plans"
                rel="noopener"
                className="text-primary underline-offset-4 hover:underline"
              >
                December 2024
              </a>
              . The free file-size limit was raised from 2 GB to 3 GB per
              transfer; the transfer expiry was simultaneously shortened from 7
              days to 3 days; and a new 10-transfer-per-month cap was
              introduced. Legacy Pro and Plus plans were merged into the single
              "Ultimate" tier at $25/month. All figures on this page reflect the
              December 2024 model as verified from the live pricing page in
              April 2026.
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
                Send a file right now. No upload, no account.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan the QR with the
                recipient's phone, and the file travels directly between the two
                browsers. Nothing is stored anywhere.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link
                  to="/"
                  search={{ utm_source: "compare-wetransfer-cta" } as never}
                >
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-wetransfer" />
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
