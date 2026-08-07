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
  "How to Send Files from Android to Mac (No App, No Cable)";
const PAGE_DESCRIPTION =
  "Open this on your Android phone. On your Mac, open the same site and scan the QR. No Android File Transfer app, no USB, no Google account needed.";
const PAGE_URL = "https://quickbridge.app/how-to/send-files-android-to-mac";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-howto-android-to-mac.png";
const PAGE_OG_ALT =
  "How to send files from Android to Mac. Cross-platform transfer in one browser tab. QuickBridge.";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-16";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Mac",
    body: "Go to quickbridge.app in Chrome, Firefox, or Safari on your Mac. The QR code appears as soon as the page loads. No login, nothing to download.",
  },
  {
    n: "02",
    title: "Scan the QR with your Android phone",
    body: "Open the Camera app on your Android phone and hold it over the QR on your Mac screen. A link appears in the viewfinder, tap it. Chrome opens the transfer page on your phone. If QR scanning is awkward, open quickbridge.app on your phone and type in the 6-digit PIN instead.",
  },
  {
    n: "03",
    title: "Match the emoji codes",
    body: "A short emoji sequence appears on both screens. Confirm they are identical. This verifies the direct WebRTC connection is genuine.",
  },
  {
    n: "04",
    title: "Pick files on your Android and send",
    body: "Tap the file picker on your Android. Your gallery, Downloads folder, and any file manager location are all available. Multiple files work in one batch.",
  },
  {
    n: "05",
    title: "Files arrive in your Mac's Downloads",
    body: "Safari or Chrome on the Mac receives each file as a standard download. For files over 2 GB, enable auto-save on the Mac side first to stream directly to disk.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why doesn't Android connect to Mac natively like it does with Windows?",
    a: "Windows has MTP support built in, so Android phones mount cleanly. macOS has never supported MTP. Plug an Android into a Mac and it shows up as a camera at best, or nothing at all. The Android File Transfer app was the fix for years, and Google deprecated it in 2023. The method here avoids all of that.",
  },
  {
    q: "Do I need Google Drive or a Google account?",
    a: "No. QuickBridge does not route files through Google's servers. The file travels directly from Chrome on Android to your Mac's browser over an encrypted WebRTC channel. No Google account is involved.",
  },
  {
    q: "Does this work if I'm not on the same Wi-Fi as my Mac?",
    a: "Yes. QuickBridge can connect devices across different networks using STUN and TURN. Your Android on cellular and your Mac on a home network will still pair. Speed over TURN will be lower than a local transfer, but it works.",
  },
  {
    q: "Can I send videos directly from the Android camera roll?",
    a: "Yes. The Android file picker includes your gallery. You can select videos, photos, or mixed batches. The files arrive on the Mac exactly as they were captured: MP4, MOV, HEVC, or whatever format your phone uses.",
  },
  {
    q: "How large a file can I send?",
    a: "2 GB per file with the standard browser download prompt. Enable the auto-save toggle on the Mac side to raise this to 10 GB per file.",
  },
  {
    q: "Is the transfer private? Can QuickBridge see my files?",
    a: "No. Files are encrypted end to end using WebRTC DTLS. QuickBridge's servers only exchange connection metadata so the two browsers can find each other. They never see the file content.",
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
  author: { "@type": "Person", name: "Clive", url: "https://quickbridge.app/about" },
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

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "How-to Guides", item: "https://quickbridge.app/how-to" },
    { "@type": "ListItem", position: 3, name: "Android to Mac", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/how-to/send-files-android-to-mac")({
  component: HowToAndroidToMacPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "android to mac file transfer, send files android to macbook, android mac wireless transfer, android file transfer alternative mac",
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

function HowToAndroidToMacPage() {
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
          <span className="text-foreground">Android to Mac</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/android.png" alt="Android" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/macos.png" alt="macOS" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Android to Mac{" "}
            <span className="text-muted-foreground">without Android File Transfer.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            macOS has no native support for browsing an Android phone's storage.
            Google's Android File Transfer app was deprecated in 2023. This
            guide shows you a wireless method that works today, with just a
            browser on each device.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-android-mac" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · No app install
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why Android to Mac is harder than Android to Windows
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Windows ships with MTP support built in. Plug in your phone and it
            mounts as a drive. macOS does not support MTP. Plug an Android into
            a Mac and it shows up as a camera at best, invisible at worst. The
            options people reach for have real limitations.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Android File Transfer",
                catch: "Google discontinued this app. It no longer installs cleanly on recent macOS versions and is listed as deprecated on Google's own support page.",
              },
              {
                label: "Google Photos",
                catch: "Backs up photos, not arbitrary files. Cannot transfer APKs, ZIP archives, or documents from the Downloads folder. Requires a Google account.",
              },
              {
                label: "AirDrop",
                catch: "AirDrop only works between Apple devices. An Android phone cannot AirDrop to a Mac under any circumstances.",
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
            Five steps, nothing to install
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
            What you can send
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Photos and videos from the gallery (any format your phone captures)",
              "Documents from the Downloads folder or any file manager location",
              "APK files, ZIP archives, or any file type without restriction",
              "Plain text, links, or clipboard contents pushed directly to the Mac",
              "Multiple files in one session without re-scanning the QR",
              "Files up to 10 GB when auto-save is enabled on the Mac",
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
                alt="QuickBridge QR code pairing screen on a Mac"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Open QuickBridge in Safari or Chrome on your Mac. The QR appears right away.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker on an Android phone ready to send"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                On your Android, tap the file picker and choose the files you want on your Mac.
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
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Android to Mac in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your Mac, scan the QR with Chrome on your
                Android, and your files are there.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-android-mac-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-android-to-mac" />
        <SiteFooter />
      </main>
    </div>
  );
}
