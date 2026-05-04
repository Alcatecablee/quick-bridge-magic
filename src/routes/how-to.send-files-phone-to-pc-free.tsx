import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "@/components/quickbridge/icons";
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
  "How to Send Files from Phone to PC for Free (No Subscription)";
const PAGE_DESCRIPTION =
  "Transfer files from any phone to any PC free, with no subscription, no ads, and no sign-up. Runs in your browser. Files go directly between devices.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-phone-to-pc-free";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your PC",
    body: "Go to quickbridge.app in any browser. A QR code appears. No account, no credit card, no trial period.",
  },
  {
    n: "02",
    title: "Scan the QR on your phone",
    body: "Open your camera and point it at the QR code on your PC screen. Tap the link. The transfer page opens on your phone.",
  },
  {
    n: "03",
    title: "Verify the emoji codes",
    body: "Both screens show a matching emoji sequence. Confirm they match before sending.",
  },
  {
    n: "04",
    title: "Select your file on your phone and send",
    body: "Tap the file picker, choose your file, tap Send. The transfer starts immediately.",
  },
  {
    n: "05",
    title: "File arrives on your PC",
    body: "The browser download prompt appears. Your file saves to Downloads. Nothing was uploaded to any server.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Is QuickBridge actually free, or does it have a paid tier?",
    a: "QuickBridge is free, no paid tier, no premium plan, and no advertising. The architecture makes this sustainable: files travel directly between your two browsers, so there are no storage costs or bandwidth costs to pass on. The only server infrastructure involved is the signaling layer, which exchanges a small amount of connection metadata to help the two browsers find each other.",
  },
  {
    q: "What is the catch with other 'free' file transfer tools?",
    a: "Most free-tier tools restrict file size (WeTransfer limits free transfers to 2 GB), show ads, require an account, or have transfer quotas per day or week. Some compress your files. QuickBridge has none of these restrictions because it never stores your files, so there is nothing to charge for.",
  },
  {
    q: "Does 'free forever' mean it will eventually require payment?",
    a: "The business decision to keep QuickBridge free forever is intentional and reflects the architecture: no file storage means no storage cost, and no storage cost means no reason to charge. This is documented in the project roadmap, which explicitly skips a monetization phase to preserve the 'no accounts, nothing stored' identity.",
  },
  {
    q: "Are there limits on how many files I can send?",
    a: "No. Send as many files as you want in a session. There is no daily quota, no transfer count limit, and no rate throttling. The only per-file limit is size: 2 GB with the standard browser prompt, or 10 GB with auto-save enabled on the PC.",
  },
  {
    q: "Does it work on a work or school computer where I cannot install software?",
    a: "Yes. QuickBridge runs entirely in the browser. No installation, no admin rights, no browser extension. If the browser can open quickbridge.app, the transfer works.",
  },
  {
    q: "What do I do if the QR code pairing fails?",
    a: "Use the 6-digit PIN shown on the PC screen instead. Go to quickbridge.app on your phone and enter the PIN manually. This bypasses any QR scanning issues and produces the same direct connection.",
  },
];

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  step: STEPS.map((s) => ({
    "@type": "HowToStep",
    name: s.title,
    text: s.body,
  })),
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export const Route = createFileRoute("/how-to/send-files-phone-to-pc-free")({
  component: HowToFreeTransferPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send files phone to pc free, free file transfer no subscription, phone to computer free no account, wireless file transfer free",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: "https://quickbridge.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: "https://quickbridge.app/og-image.png" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

function HowToFreeTransferPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">How-to</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Free file transfer</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Phone to PC for free.{" "}
            <span className="text-muted-foreground">No subscription, no account.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Most free-tier tools cap your file size, show you ads, or push you
            toward a subscription after the first transfer. QuickBridge is free
            because it never stores your files. No storage cost means no reason
            to charge. The five steps below work today and will still work the
            same way in two years.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-free" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No sign-up · No ads
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why most 'free' tools aren't really free
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Tool</th>
                  <th className="px-5 py-3 font-medium">Free limit</th>
                  <th className="px-5 py-3 font-medium">Catch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { tool: "WeTransfer", limit: "2 GB per transfer", catch: "Transfers expire after 7 days. Ads between transfers." },
                  { tool: "Google Drive", limit: "15 GB total storage", catch: "Shared across Gmail, Photos, and Drive. Fills up fast." },
                  { tool: "Dropbox", limit: "2 GB total storage", catch: "2 GB fills in days. Paid plans start at around $10/month." },
                  { tool: "QuickBridge", limit: "Unlimited transfers", catch: "None. Files never touch a server, so there is nothing to charge for." },
                ].map((row) => (
                  <tr key={row.tool} className={`hover:bg-muted/10 ${row.tool === "QuickBridge" ? "bg-primary/5" : ""}`}>
                    <td className="px-5 py-3.5 font-semibold text-foreground">{row.tool}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.limit}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.catch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Five steps, completely free
          </h2>
          <ol className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-black text-primary">
                  {step.n}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What you get, at no cost
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Unlimited transfers, no daily or monthly cap",
              "Files up to 2 GB per file (10 GB with auto-save)",
              "Works between any phone and any computer with a browser",
              "End-to-end encrypted via WebRTC DTLS",
              "No account required on either device",
              "No ads at any point in the transfer flow",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What you'll see
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Real screenshots from the app, not mockups.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/qr-code.png"
                alt="QuickBridge open on a PC with no account required"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                No sign-in screen, no trial countdown. The QR is there the moment you open the page.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge transfer complete, nothing was stored or uploaded"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Transfer complete. The file is on your PC and nothing was uploaded to any server.
              </figcaption>
            </figure>
          </div>
        </Reveal>

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

        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Free. Always.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge, scan the QR, send your file. No account, no
                expiry, no catch.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-free-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-phone-to-pc-free" />
        <SiteFooter />
      </main>
    </div>
  );
}
