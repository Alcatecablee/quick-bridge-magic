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
  "How to Send a PDF from Your Phone to a Laptop (Any Phone, Any OS)";
const PAGE_DESCRIPTION =
  "Transfer a PDF from your mobile to your office laptop or home computer without email or WhatsApp. Works between iPhone and Windows, Android and Mac, or any combination.";
const PAGE_URL = "https://quickbridge.app/how-to/send-pdf-phone-to-pc";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your laptop or desktop",
    body: "Go to quickbridge.app in any browser. A QR code and 6-digit PIN appear. Leave this tab open.",
  },
  {
    n: "02",
    title: "Join from your phone",
    body: "On your phone, scan the QR with the Camera app or go to quickbridge.app and enter the PIN. The transfer page opens in your mobile browser.",
  },
  {
    n: "03",
    title: "Match the verification codes",
    body: "Both screens display a short emoji sequence. Confirm they are the same on both devices before sending.",
  },
  {
    n: "04",
    title: "Find and send your PDF",
    body: "Tap the file picker on your phone. On iPhone, go to Files and navigate to where the PDF is saved. On Android, open the Documents or Downloads section. Select the PDF and tap Send.",
  },
  {
    n: "05",
    title: "Download on your laptop",
    body: "The PDF arrives as a standard browser download. It opens in your default PDF reader from there. Nothing was uploaded to any server along the way.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "I received a PDF on WhatsApp. Can I send that to my laptop?",
    a: "Yes. On Android, WhatsApp saves received files to internal storage and they appear in your file picker under Documents or the WhatsApp folder. On iPhone, long-press the file in WhatsApp, choose Share, then share it to Files. Once in Files, the QuickBridge file picker can reach it.",
  },
  {
    q: "My PDF is in my email app. Can I transfer it without forwarding the email?",
    a: "Yes. Save the attachment to your phone's local storage first. On iPhone, tap the attachment in Mail and choose Save to Files. On Android, tap Download in Gmail or your email app. Then use the QuickBridge file picker to select it from Downloads.",
  },
  {
    q: "Does this work from an office laptop on a corporate network?",
    a: "Usually yes. QuickBridge uses WebRTC, which works over most corporate networks because it uses standard HTTPS ports for signaling. If the office Wi-Fi blocks peer-to-peer connections, QuickBridge falls back to a TURN relay, which routes through port 443 and passes most firewalls. If your phone is on cellular and your laptop on the office Wi-Fi, the TURN fallback handles cross-network transfers.",
  },
  {
    q: "Will the PDF be altered in transit?",
    a: "No. QuickBridge sends the binary file as-is. The PDF your laptop receives is byte-for-byte identical to the one on your phone. No conversion, no re-rendering.",
  },
  {
    q: "Can I send multiple PDFs in one session?",
    a: "Yes. Select multiple files in the file picker, or send them one after another without re-scanning. The connection stays open until you close the tab.",
  },
  {
    q: "Is there a file size limit for PDFs?",
    a: "2 GB by default. PDFs are rarely that large, so this is not a practical constraint. If you are working with very large technical documents or scanned archives, the 2 GB limit is per file.",
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

export const Route = createFileRoute("/how-to/send-pdf-phone-to-pc")({
  component: HowToPdfPhoneToPcPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send pdf from phone to laptop, transfer pdf mobile to computer, pdf from iphone to windows, android pdf to laptop",
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

function HowToPdfPhoneToPcPage() {
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
          <span className="text-foreground">PDF phone to PC</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            PDF from your phone to your laptop.{" "}
            <span className="text-muted-foreground">No email, no WhatsApp.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            You have a PDF on your phone and need it on your work laptop fast.
            Emailing it to yourself adds an unnecessary bounce through a mail
            server. Sending via WhatsApp compresses the file. This guide moves
            the PDF directly from your phone's browser to your laptop's
            browser, untouched, in about a minute.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-pdf-phone-pc" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No sign-up · File arrives intact
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Where your PDF might be on your phone
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            The file picker in QuickBridge gives you access to all of these.
            Knowing where your PDF is saved helps you find it quickly in the
            picker.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { where: "Received via WhatsApp", path: "Android: WhatsApp/Media/WhatsApp Documents. iPhone: long-press the file in WhatsApp, share to Files first." },
              { where: "Downloaded from the web", path: "Android: Downloads folder. iPhone: Files > Downloads." },
              { where: "Received by email", path: "Android: Downloads folder after tapping Download. iPhone: save the attachment to Files first via the share sheet." },
              { where: "Saved in iCloud Drive", path: "iPhone: Files > iCloud Drive. Needs an active iCloud connection to appear." },
            ].map(({ where, path }) => (
              <Card key={where} className="border-border bg-card p-4">
                <p className="text-[13px] font-semibold text-foreground">{where}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{path}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Five steps from your phone to your laptop
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
            What you'll see
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Real screenshots from the app, not mockups.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker on a phone with a PDF selected"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Navigate to the PDF in your phone's Files app and tap Send.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge showing a completed PDF transfer on the laptop"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                The PDF downloads to your laptop exactly as it was on your phone.
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
                PDF on your laptop in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your laptop, scan with your phone, pick the
                PDF, done. Intact, uncompressed, no account.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-pdf-phone-pc-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-pdf-phone-to-pc" />
        <SiteFooter />
      </main>
    </div>
  );
}
