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
  "How to Send Files from Windows PC to Android Phone (Wireless)";
const PAGE_DESCRIPTION =
  "Push files from a Windows computer to your Android phone without a USB cable. Drag and drop in your browser, scan a QR on your phone, done.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-windows-to-android";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Windows PC",
    body: "Go to quickbridge.app in Chrome or Edge. A QR code and 6-digit PIN appear. This is the host session your Android will join.",
  },
  {
    n: "02",
    title: "Scan the QR on your Android phone",
    body: "Use your Android camera or Chrome's built-in QR scanner to scan the code on the PC screen. The transfer page opens on your phone. If scanning is awkward, go to quickbridge.app on your phone and enter the PIN.",
  },
  {
    n: "03",
    title: "Confirm the emoji codes match",
    body: "Both screens show the same emoji sequence. Check they match before sending. This confirms the direct encrypted connection.",
  },
  {
    n: "04",
    title: "Drag a file onto the browser window on your PC",
    body: "Drag any file from Windows Explorer into the QuickBridge tab. You can also click the file picker or paste an image from the clipboard. The transfer starts immediately.",
  },
  {
    n: "05",
    title: "Open the file on your Android phone",
    body: "Your phone's browser receives the file and prompts you to download it. It lands in your Downloads folder. Photos can be moved to the gallery from there.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I send to my phone without both devices being on the same Wi-Fi?",
    a: "Yes. QuickBridge uses STUN and TURN to connect across different networks. Your PC on an office network and your Android on cellular will still pair and transfer. On the same Wi-Fi, the connection is direct and faster.",
  },
  {
    q: "Can I send multiple files from Windows to Android at once?",
    a: "Yes. Select multiple files in Windows Explorer and drag them all into the browser tab together. They queue and transfer in sequence.",
  },
  {
    q: "What is the file size limit?",
    a: "2 GB per file by default. The Android browser receives files via a standard download prompt, so the limit is the browser's download buffer. For very large files, send them one at a time.",
  },
  {
    q: "Will the file go into my Android's gallery or Downloads folder?",
    a: "Downloads folder by default. On most Android phones you can then open the file from the notification and move or share it to your gallery, cloud storage, or any app. Some browsers offer a 'save to Photos' option directly.",
  },
  {
    q: "Is this faster than emailing the file to myself?",
    a: "Yes, considerably. Emailing uploads the file to a mail server, which then delivers it to your phone. QuickBridge streams directly from your Windows browser to your Android browser, skipping any upload. On a good home Wi-Fi network, a 500 MB video arrives in seconds rather than minutes.",
  },
  {
    q: "Does QuickBridge store any of my files?",
    a: "No. The file travels directly between the two browsers. QuickBridge's servers handle only the initial handshake so the browsers can find each other. File content never passes through any server.",
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

export const Route = createFileRoute("/how-to/send-files-windows-to-android")({
  component: HowToWindowsToAndroidPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "windows to android file transfer, send files from computer to phone, pc to android wireless, send file to android from windows",
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

function HowToWindowsToAndroidPage() {
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
          <span className="text-foreground">Windows to Android</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/windows.png" alt="Windows" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/android.png" alt="Android" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Windows to Android.{" "}
            <span className="text-muted-foreground">Drag, scan, done.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            You have a file on your Windows PC and need it on your Android
            phone. Emailing it to yourself works but feels ridiculous. Bluetooth
            is painfully slow for anything over a few megabytes. This guide
            shows you a faster way that takes five steps and under a minute.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-windows-android" } as never}>
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
            Five steps to get a file from your PC to your phone
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
            Things you can send from Windows
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Documents: PDF, Word, Excel, PowerPoint",
              "Images: JPG, PNG, RAW, PSD, or any other format",
              "Videos up to 2 GB (or 10 GB with auto-save enabled on Android)",
              "ZIP archives, executables, and any file type without filtering",
              "Screenshots pasted directly from the Windows clipboard",
              "Multiple files dragged together in a single batch",
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
                alt="QuickBridge QR code on a Windows PC ready for Android to scan"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                The PC shows the QR code. Your Android scans it to join the session.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/paired-mobile.png"
                alt="QuickBridge connected state on an Android phone ready to receive"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Once paired, the Android side is ready to receive whatever you drag in on the PC.
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
                Your file on your phone in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your PC, scan the QR with Chrome on your
                Android, drag the file in, done.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-windows-android-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-windows-to-android" />
        <SiteFooter />
      </main>
    </div>
  );
}
