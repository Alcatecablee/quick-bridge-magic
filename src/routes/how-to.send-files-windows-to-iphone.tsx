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
  "How to Send Files from Windows PC to iPhone (No iTunes)";
const PAGE_DESCRIPTION =
  "Transfer files from a Windows PC to an iPhone wirelessly. No iTunes, no iCloud required. Open a browser on both devices, scan the QR, and the file is there.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-windows-to-iphone";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Windows PC",
    body: "Go to quickbridge.app in Chrome or Edge. A QR code appears immediately. This is the session your iPhone will join.",
  },
  {
    n: "02",
    title: "Scan the QR with your iPhone camera",
    body: "Open the Camera app on your iPhone and point it at the QR code on your PC screen. Tap the banner that appears. Safari opens the transfer page on your iPhone.",
  },
  {
    n: "03",
    title: "Confirm the emoji codes on both screens",
    body: "A short emoji sequence appears on both the PC and iPhone. Verify they match before proceeding. This confirms the direct connection is genuine.",
  },
  {
    n: "04",
    title: "Drag the file onto the browser tab on your PC",
    body: "Drag any file from Windows Explorer into the QuickBridge browser tab. You can also click the file picker or paste from the clipboard. The file starts streaming to your iPhone immediately.",
  },
  {
    n: "05",
    title: "Open or save the file on your iPhone",
    body: "Safari shows a download notification. Tap it to open the file in a compatible app, save it to Files, or share it to Photos. iOS handles the routing based on the file type.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why can't I just use AirDrop from Windows?",
    a: "AirDrop requires both devices to be Apple. A Windows PC cannot AirDrop to an iPhone. QuickBridge bridges that gap by running in the browser on both sides, so Windows and iOS connect without any proprietary protocol.",
  },
  {
    q: "Where do files go when they arrive on my iPhone?",
    a: "Safari downloads files to the Downloads folder in the iOS Files app. You can access them there immediately. Images and videos can be saved to Photos from the Files app using the share sheet. Some file types open directly in compatible apps (PDFs open in Files or Preview, documents open in the relevant app if installed).",
  },
  {
    q: "Can I send large video files from Windows to iPhone?",
    a: "Yes, up to 2 GB per file. The iOS Files app handles the download. For files over 2 GB, the transfer is technically supported on the Windows sender side with auto-save enabled, but iOS Safari's download manager may time out for very large files depending on your network speed.",
  },
  {
    q: "Do I need an Apple ID or iCloud account?",
    a: "No. QuickBridge has nothing to do with Apple's ecosystem. The file travels directly from Chrome or Edge on Windows to Safari on iPhone over an encrypted WebRTC channel. No Apple account is involved at any point.",
  },
  {
    q: "My iPhone and PC are on different networks. Will it still work?",
    a: "Yes. QuickBridge connects across networks using STUN and TURN. The QR code pairing works regardless of whether both devices are on the same Wi-Fi or on completely separate connections.",
  },
  {
    q: "Is there a risk the file gets stored somewhere?",
    a: "No. The file content is encrypted end-to-end using WebRTC DTLS and travels directly between the two browsers. QuickBridge's servers only broker the initial connection. They never receive the file.",
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

export const Route = createFileRoute("/how-to/send-files-windows-to-iphone")({
  component: HowToWindowsToIphonePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "windows to iphone file transfer, send files from pc to iphone, pc to iphone no itunes, windows iphone wireless transfer",
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

function HowToWindowsToIphonePage() {
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
          <span className="text-foreground">Windows to iPhone</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/windows.png" alt="Windows" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/ios.png" alt="iPhone iOS" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Windows to iPhone.{" "}
            <span className="text-muted-foreground">No iTunes, no cable.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Getting a file from a Windows PC to an iPhone is one of those
            things that should be instant but usually involves installing
            something or fighting with iCloud storage limits. This guide skips
            all of that with a method that works from the browser on both sides.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-windows-iphone" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No sign-up · No app install
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            The options most people try first
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "iTunes",
                catch: "Requires installing iTunes on Windows, connecting a USB cable, and navigating Apple's sync model. Works, but feels like three steps too many for transferring one PDF.",
              },
              {
                label: "iCloud Drive",
                catch: "Needs an Apple ID and enough free iCloud storage. Uploads to Apple's servers, then syncs to the iPhone. Adds latency and depends on a stable internet connection on both ends.",
              },
              {
                label: "Email to yourself",
                catch: "Quick for small files. Most providers cap attachments at 25 MB. Not viable for videos, Zips, or any file over a few megabytes.",
              },
            ].map(({ label, catch: c }) => (
              <Card key={label} className="border-border bg-card p-4">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/80">{c}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Five steps from Windows to iPhone
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
            What happens to the file on iOS
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Where it lands</h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "Downloads folder in the iOS Files app",
                  "Tap on a PDF: opens in Files or any installed PDF reader",
                  "Tap on an image: view inline, then save to Photos via the share sheet",
                  "Tap on a document: opens in Pages, Word, or the relevant app",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Two-way transfer</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                The same connection works in both directions. While Windows has
                sent a file, the iPhone side can also pick a file from the Files
                app and send it back to the PC. One QR scan sets up a full
                bidirectional session.
              </p>
            </Card>
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
                alt="QuickBridge QR code on a Windows PC ready for iPhone to scan"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                The Windows PC shows the QR. Point your iPhone camera at it to connect.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/paired-mobile.png"
                alt="QuickBridge connected state in Safari on iPhone"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Safari on your iPhone shows the connected state. Files from Windows arrive here.
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
                File on your iPhone in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge in Chrome on your Windows PC, scan the QR
                with your iPhone camera, drag the file in.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-windows-iphone-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-windows-to-iphone" />
        <SiteFooter />
      </main>
    </div>
  );
}
