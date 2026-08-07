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
  "How to Send Videos from Phone to PC Without Losing Quality";
const PAGE_DESCRIPTION =
  "Open this on your phone. On your PC, open the same site and scan the QR. Videos arrive at original quality. No WhatsApp compression, no email limits.";
const PAGE_URL = "https://quickbridge.app/how-to/send-videos-phone-to-pc";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-howto-send-videos.png";
const PAGE_OG_ALT =
  "How to send videos from phone to PC at full resolution. No compression, no cloud. QuickBridge.";

const PUBLISHED = "2026-05-16";
const MODIFIED = "2026-05-16";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your computer",
    body: "Go to quickbridge.app in any browser on your Windows or Mac. A QR code and 6-digit PIN appear on screen. This is the session your phone will join.",
  },
  {
    n: "02",
    title: "Scan the QR code with your phone",
    body: "Open the Camera app on your iPhone or Android and hold it over the QR code on your computer screen. The transfer page opens in your mobile browser. Alternatively, open quickbridge.app on your phone and enter the PIN.",
  },
  {
    n: "03",
    title: "Confirm the emoji codes match",
    body: "Both screens show the same sequence of emoji. Check they match before proceeding. This confirms a direct, encrypted connection between the two browsers.",
  },
  {
    n: "04",
    title: "Select your video and tap Send",
    body: "Tap the file picker on your phone. Choose the video from your camera roll or Files app. It starts streaming immediately over the direct connection. No upload step.",
  },
  {
    n: "05",
    title: "Save the video on your computer",
    body: "On Chrome, Edge, or Brave, auto-save streams the video directly to disk as it arrives. On other browsers, a download prompt appears. Either way, the file is byte-for-byte identical to what was on your phone.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Will the video arrive compressed?",
    a: "No. QuickBridge sends the exact bytes your phone provides. There is no transcoding, resizing, or quality reduction at any point. A 1 GB video recorded in 4K arrives as a 1 GB 4K video.",
  },
  {
    q: "Is there a video file size limit?",
    a: "2 GB per file by default. On Chromium-based browsers (Chrome, Edge, Brave) with the File System Access API, the limit is 10 GB and the file streams directly to disk rather than buffering in RAM, so large video files do not crash the browser.",
  },
  {
    q: "What video formats does it support?",
    a: "Any format your phone produces: MP4, MOV, HEVC, AVI, MKV, or anything else. QuickBridge does not inspect or convert the file. Whatever the phone sends, the computer receives.",
  },
  {
    q: "How fast is the transfer?",
    a: "On the same Wi-Fi network, QuickBridge transfers directly between the two browsers at local network speed, typically 20 to 80 MB/s depending on your router. A 1 GB video takes 15 to 50 seconds. Over different networks, it uses an encrypted relay, which is slower but still faster than uploading to a cloud service.",
  },
  {
    q: "Can I send multiple videos at once?",
    a: "Yes. The file picker on iOS and Android supports multi-select. Select several videos and they queue and transfer in sequence over the same connection, without re-scanning the QR.",
  },
  {
    q: "Why is this better than WhatsApp or Telegram?",
    a: "WhatsApp compresses videos to reduce data usage and limits file size to 2 GB. Telegram has a 2 GB limit and routes files through its servers. QuickBridge sends the original file directly from your phone to your computer, no server involved, no compression.",
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
    { "@type": "ListItem", position: 3, name: "Videos phone to PC", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/how-to/send-videos-phone-to-pc")({
  component: HowToVideosPhoneToPcPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send videos from phone to pc, transfer video from phone to computer, phone video to laptop, send video without compression, video transfer without whatsapp",
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

function HowToVideosPhoneToPcPage() {
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
          <span className="text-foreground">Videos phone to PC</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Videos from phone to PC.{" "}
            <span className="text-muted-foreground">No compression, no upload.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Sending a video via WhatsApp compresses it into a blurry shadow of the
            original. Emailing it runs into size limits. Uploading to Google Drive
            takes as long as watching the video twice. This guide transfers your
            video directly from phone to PC at original quality, no server in the
            middle.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-videos-phone-pc" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · Original quality preserved
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why the usual methods fall short for video
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "WhatsApp",
                catch: "Compresses video to save mobile data. A 200 MB 4K clip can arrive as a 20 MB 480p file. The compression is applied server-side and cannot be disabled.",
              },
              {
                label: "Email",
                catch: "Most providers cap attachments at 25 MB. A one-minute 4K video is already over that limit before it reaches your outbox.",
              },
              {
                label: "Google Drive / iCloud",
                catch: "Uploads the full video to a server first, then the computer downloads it again. A 1 GB video takes two full upload-download cycles before it lands on your PC.",
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
            Five steps to send a video without compression
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
            What arrives on your computer
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Original file size: no compression at any stage",
              "Original resolution: 4K, 1080p, 720p, exactly as recorded",
              "Original codec: MP4, MOV, HEVC, whatever your phone produces",
              "All formats supported: no file type filtering or conversion",
              "Up to 2 GB per file (10 GB on Chrome or Edge with auto-save)",
              "Multiple videos in one session, no re-scanning required",
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
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker on a phone with a video selected ready to send"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Select your video from the phone's file picker. Multi-select works for batches.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge showing a completed video transfer with file size confirmation"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Transfer complete. The full original file is on your computer, untouched.
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
                Full-quality video on your PC in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan with your phone, pick the
                video, done. No accounts. No compression. Nothing uploaded anywhere.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-videos-phone-pc-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        {/* Cross-promo: natural next step after getting the video onto the PC */}
        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <span className="text-3xl" aria-hidden>🎬</span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Next step</p>
                <h3 className="mt-1 text-[17px] font-semibold text-foreground">
                  Got the video on your PC? Now edit it privately with CalmClip.
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  CalmClip is a browser-based video editor that runs entirely on your device. AI transcription, silence removal, word-level captions, and multi-ratio export -- nothing is uploaded anywhere. Built by the same maker as QuickBridge.
                </p>
                <a
                  href="https://calmclip.video"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Open CalmClip (free) <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-videos-phone-to-pc" />
        <SiteFooter />
      </main>
    </div>
  );
}
