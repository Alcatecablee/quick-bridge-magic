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
  "How to Transfer Files Windows to Android 2026 (Wireless)";
const PAGE_DESCRIPTION =
  "In 2026, push files from a Windows PC to your Android phone without a USB cable. Drag files in your browser, scan the QR on your phone, and done.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-windows-to-android";
const PAGE_OG_IMAGE =
  "https://quickbridge.app/og-howto-windows-to-android.png";
const PAGE_OG_ALT =
  "How to push files from Windows to Android without USB. Drag, drop, scan, done. QuickBridge.";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-06-15";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Windows PC",
    body: "Go to quickbridge.app in Chrome or Edge. A QR code and 6-digit PIN appear on screen. This is the session your Android will join.",
  },
  {
    n: "02",
    title: "Scan the QR on your Android phone",
    body: "Use your Android camera or Chrome's built-in QR scanner to scan the code on your PC screen. The transfer page opens in Chrome on your phone. If scanning is awkward, open quickbridge.app on your phone and enter the PIN instead.",
  },
  {
    n: "03",
    title: "Confirm the emoji codes match",
    body: "Both screens show the same emoji sequence. Check they match before sending. This confirms the direct encrypted connection.",
  },
  {
    n: "04",
    title: "Drag a file onto the browser window on your PC",
    body: "Drag a file from Windows Explorer into the QuickBridge browser tab. You can also use the file picker or paste an image from your clipboard. The transfer starts immediately.",
  },
  {
    n: "05",
    title: "Open the file on your Android phone",
    body: "Your phone's browser shows the incoming file and prompts you to download it. It lands in your Downloads folder. Photos can be saved to your gallery from there.",
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
    a: "Yes. Emailing uploads the file to a server, which then delivers it to your phone. QuickBridge streams directly from your Windows browser to your Android, skipping the upload entirely. On home Wi-Fi, a 500 MB video arrives in seconds rather than the minutes an email server would take.",
  },
  {
    q: "Does QuickBridge store any of my files?",
    a: "No. The file travels directly between the two browsers. QuickBridge's servers handle only the initial handshake so the browsers can find each other. File content never passes through any server.",
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
    { "@type": "ListItem", position: 3, name: "Windows to Android", item: PAGE_URL },
  ],
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
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            Windows to Android.{" "}
            <span className="text-muted-foreground">Drag, scan, done in 2026.</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            Emailing a file to yourself is technically a solution. It's just an
            annoying one. Bluetooth is worse: slow and fiddly to pair for a
            single transfer. This guide gets a file from Windows to Android in
            under a minute without any of that, using nothing but a browser on
            both sides.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-windows-android" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · No app install
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-windows-to-android" />
        <SiteFooter />
      </main>
    </div>
  );
}
