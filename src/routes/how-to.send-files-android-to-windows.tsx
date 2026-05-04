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
  "How to Send Files from Android to Windows PC Without a Cable";
const PAGE_DESCRIPTION =
  "Transfer files from any Android phone to a Windows PC wirelessly. No USB, no app install, no Bluetooth pairing. Opens in your browser on both devices.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-android-to-windows";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Windows PC",
    body: "Visit quickbridge.app in Chrome, Edge, or Firefox. A QR code and a 6-digit PIN appear on screen. No account, nothing to install.",
  },
  {
    n: "02",
    title: "Scan the QR on your Android phone",
    body: "Open the Camera app or Google Lens and point it at the QR code. Tap the link. Chrome opens the transfer page. If QR scanning is awkward, go to quickbridge.app on your phone and enter the 6-digit PIN instead.",
  },
  {
    n: "03",
    title: "Confirm the emoji verification",
    body: "Both screens show a short emoji sequence. They should match. This confirms the WebRTC connection is direct and not being intercepted.",
  },
  {
    n: "04",
    title: "Pick your file on Android and tap Send",
    body: "Tap the file picker on the Android side. Your gallery, Downloads folder, and any file manager location are all accessible. Select one or more files and send. The transfer starts immediately.",
  },
  {
    n: "05",
    title: "Receive on Windows",
    body: "Each file arrives as a standard browser download. Enable auto-save on the Windows side to stream files up to 10 GB directly to disk without a per-file prompt.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Does this work for all Android brands, including Samsung, Pixel, and OnePlus?",
    a: "Yes. QuickBridge runs in Chrome for Android, which is available on every Android phone regardless of manufacturer. Samsung Internet also works. The transfer method is not specific to any Android skin or brand.",
  },
  {
    q: "Why not just use a USB cable?",
    a: "A USB cable is fine if you have the right cable handy and your Windows PC recognizes the phone. In practice, USB-C to USB-A adapters go missing, MTP mode sometimes fails to connect, and plugging in a phone to transfer one file is slower than opening two browser tabs. The wireless method here works in under a minute with no cable.",
  },
  {
    q: "How does this compare to Nearby Share (Quick Share)?",
    a: "Google's Quick Share (previously Nearby Share) works well between two Android devices or between Android and a Chromebook. It has limited Windows support and requires both devices to be on the same network with Bluetooth enabled. QuickBridge works across different networks, requires no Bluetooth, and runs on any OS with a modern browser.",
  },
  {
    q: "Can I send multiple files at once?",
    a: "Yes. The Android file picker lets you select multiple files in one batch. They queue and transfer in sequence over the same connection. You can also send follow-up files without re-scanning the QR.",
  },
  {
    q: "What is the file size limit?",
    a: "2 GB per file by default. Enable the auto-save option on the Windows side to raise that to 10 GB. Auto-save uses the File System Access API to stream directly to disk, which also frees up RAM for very large files.",
  },
  {
    q: "Are my files stored anywhere?",
    a: "No. The file streams from Android's Chrome directly to Windows's browser over an encrypted WebRTC data channel. QuickBridge's signaling servers only help the two devices find each other. They never see the file content.",
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

export const Route = createFileRoute("/how-to/send-files-android-to-windows")({
  component: HowToAndroidToWindowsPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "android to windows file transfer, send files android to pc no cable, phone to laptop wireless, android file transfer windows",
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

function HowToAndroidToWindowsPage() {
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
          <span className="text-foreground">Android to Windows</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/android.png" alt="Android" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/windows.png" alt="Windows" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Android to Windows{" "}
            <span className="text-muted-foreground">no cable, no Bluetooth pairing.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Android phones show up as external drives when plugged into Windows,
            but USB cables go missing and MTP mode breaks at the worst times.
            This guide shows you a wireless method that uses nothing but your
            browser on both sides.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-android-windows" } as never}>
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
            The usual methods and where they fail
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "USB + MTP",
                catch: "Needs the right cable and Windows to recognize the phone as a drive. MTP mode occasionally just fails to mount, and you end up restarting both devices.",
              },
              {
                label: "Bluetooth",
                catch: "Works for small files. Transferring 100 MB over Bluetooth takes several minutes. Pairing is also a multi-step process you have to redo on new machines.",
              },
              {
                label: "Cloud drive",
                catch: "Uploads to a server, then downloads on the other side. Doubles transfer time and uses your data allowance. Requires an account on both devices.",
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
            Five steps, under a minute
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
            What makes this faster than a USB transfer
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5 p-5">
              <h3 className="text-[15px] font-semibold text-foreground">On the same Wi-Fi</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                On a standard home router the connection is peer-to-peer on your
                local network. A 1 GB video that takes 3-4 minutes over USB
                often transfers in under 90 seconds on a 5 GHz Wi-Fi network.
                Your router speed is the ceiling.
              </p>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Across different networks</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                If your Android is on cellular and your Windows PC is on a
                different Wi-Fi, QuickBridge routes through a TURN relay. Speed
                is then limited by the slower of your two connections, but the
                transfer still completes. No cable can do that.
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
                alt="QuickBridge QR code pairing screen on a Windows PC"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Open QuickBridge on your Windows PC. The QR code is ready immediately.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker open on an Android phone"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                After scanning, tap the file picker on your Android to select what you want to send.
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
                Skip the cable. Open two browser tabs.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                QuickBridge on your Windows PC, Chrome on your Android, and
                your file is there in under a minute.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-android-windows-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-android-to-windows" />
        <SiteFooter />
      </main>
    </div>
  );
}
