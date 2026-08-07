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
  "How to Send a PDF from Phone to PC 2026 (Any Device, Free)";
const PAGE_DESCRIPTION =
  "Open on your phone. On your laptop, scan the QR. PDFs transfer instantly in 2026: no email, no WhatsApp, any phone and any computer combo. Free.";
const PAGE_URL = "https://quickbridge.app/how-to/send-pdf-phone-to-pc";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-howto-send-pdf.png";
const PAGE_OG_ALT =
  "How to send PDFs from phone to laptop. Any device combination, browser to browser. QuickBridge.";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-06-15";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your laptop or desktop",
    body: "Go to quickbridge.app in any browser. The QR code and a 6-digit PIN appear immediately. Leave this tab open.",
  },
  {
    n: "02",
    title: "Join from your phone",
    body: "On your phone, scan the QR with the Camera app or open quickbridge.app and enter the PIN. The transfer page opens in your mobile browser.",
  },
  {
    n: "03",
    title: "Match the verification codes",
    body: "Both screens display a short emoji sequence. Confirm they are the same on both devices before sending.",
  },
  {
    n: "04",
    title: "Find and send your PDF",
    body: "Tap the file picker on your phone. On iPhone, the Files app opens, navigate to where the PDF is saved. On Android, look in Documents or Downloads. Select the PDF and tap Send.",
  },
  {
    n: "05",
    title: "Download on your laptop",
    body: "The PDF arrives as a standard browser download. Open it in your default PDF reader from there. Nothing was uploaded to any server.",
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
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
  },
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based peer-to-peer file transfer tool. Open the site on both devices, scan the QR code or enter the 6-digit PIN, and files stream directly between the two browsers over an encrypted WebRTC channel. No account, no app install, and no server storage.",
  },
  {
    q: "Who is QuickBridge best for?",
    a: "QuickBridge is best for anyone who needs to move files between two devices in real time without a USB cable, account, or app install. Both devices need to have a browser open at the same time. Choose a cloud service like Google Drive or WeTransfer when the recipient will not be online right away, or when you need the same file to reach several people at different times.",
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
  author: { "@type": "Person", name: "Clive Makazhu", url: "https://justc.live/", sameAs: ["https://quickbridge.app/about", "https://x.com/just_clive_sa"] },
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  totalTime: "PT2M",
  step: STEPS.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
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

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "How-to Guides", item: "https://quickbridge.app/how-to" },
    { "@type": "ListItem", position: 3, name: "PDF phone to PC", item: PAGE_URL },
  ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <Link to="/how-to" className="hover:text-foreground">How-to</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">PDF phone to PC</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            PDF from your phone to your laptop.{" "}
            <span className="text-muted-foreground">No email, no WhatsApp in 2026.</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            You've got a PDF on your phone and need it on your laptop right now.
            Emailing it to yourself is an unnecessary detour through a mail
            server. WhatsApp compresses it. This moves the PDF directly from
            one browser to the other: untouched, in under a minute.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-pdf-phone-pc" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · File arrives intact
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
        </Reveal>

        <RelatedPages currentHref="/how-to/send-pdf-phone-to-pc" />
        <SiteFooter />
      </main>
    </div>
  );
}
