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
  "How to Send Photos from Phone to PC Without Email or Cloud";
const PAGE_DESCRIPTION =
  "Transfer photos from your phone to a Windows or Mac without uploading to iCloud, Google Photos, or emailing them. Browser-to-browser, no accounts needed.";
const PAGE_URL = "https://quickbridge.app/how-to/send-photos-phone-to-pc";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your computer",
    body: "Go to quickbridge.app in any browser on your Windows or Mac. A QR code appears on the host screen.",
  },
  {
    n: "02",
    title: "Scan the QR with your phone",
    body: "Open the Camera app on your iPhone or Android and scan the QR code on your computer screen. The transfer page opens in your mobile browser.",
  },
  {
    n: "03",
    title: "Verify the connection",
    body: "Both screens show a matching emoji sequence. Confirm they match to verify the direct connection.",
  },
  {
    n: "04",
    title: "Select your photos and tap Send",
    body: "Tap the file picker on your phone. Your full camera roll appears. Select one photo or a whole batch. Multiple selections work in a single send.",
  },
  {
    n: "05",
    title: "Photos arrive in your browser's Downloads",
    body: "Each photo downloads as a standard browser file. On Windows they go to your Downloads folder. On Mac they land in Downloads. Enable auto-save to skip the per-file prompt and receive them automatically.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why not just use Google Photos or iCloud?",
    a: "Google Photos and iCloud upload your photos to a server, then let you download them on the other side. That means your photos leave your phone, sit on a company's infrastructure, and you wait for the round trip. QuickBridge streams directly from your phone to your computer, skipping the server entirely. The photo never leaves your local network.",
  },
  {
    q: "Will my photos arrive in their original resolution?",
    a: "Yes. QuickBridge sends exactly the file your phone provides. There is no compression or resizing. HEIC files from iPhone arrive as HEIC. JPEGs arrive as JPEGs. RAW files from cameras are also supported.",
  },
  {
    q: "Can I send an entire batch of photos at once?",
    a: "Yes. The phone file picker supports multi-select. On iOS, tap Select in the Photos picker and choose as many as you want. On Android, long-press a photo then tap the rest. They queue and transfer in sequence over the same connection.",
  },
  {
    q: "My iPhone photos are in HEIC format. Can Windows open them?",
    a: "Windows 11 and recent Windows 10 builds can open HEIC files if the HEIC Image Extensions are installed from the Microsoft Store (free). Alternatively, set your iPhone camera to 'Most Compatible' in Settings > Camera > Formats before shooting, and photos will be saved as JPEG instead.",
  },
  {
    q: "How many photos can I send in one session?",
    a: "There is no hard limit on the number of files. A session stays open until you close it. You can send a second batch immediately after the first finishes without re-scanning the QR.",
  },
  {
    q: "Does this work for screenshots as well as camera photos?",
    a: "Yes. Screenshots appear in the same photo picker. You can also share a screenshot directly from the iOS or Android share sheet to the QuickBridge browser tab if it is open.",
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

export const Route = createFileRoute("/how-to/send-photos-phone-to-pc")({
  component: HowToPhotosPhoneToPcPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send photos phone to pc, transfer photos without email, phone to computer photos no cloud, send pictures from phone to laptop",
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

function HowToPhotosPhoneToPcPage() {
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
          <span className="text-foreground">Photos phone to PC</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Photos from phone to PC{" "}
            <span className="text-muted-foreground">without email or cloud upload.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Emailing photos to yourself compresses them. Uploading to iCloud or
            Google Photos takes time, requires storage space, and routes your
            pictures through a server. This guide transfers photos directly from
            your phone to your PC browser, original quality, in under a minute.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-photos-phone-pc" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No sign-up · Original quality
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why the usual methods fall short for photos
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Email",
                catch: "Gmail, Outlook, and most services compress photos before sending. The image your PC receives is smaller and lower quality than what your camera captured. Not acceptable for work or print.",
              },
              {
                label: "iCloud / Google Photos",
                catch: "Requires an account and sufficient storage. Uploads to a server before the PC can download. If your iCloud is full (common at 5 GB), you cannot sync at all without paying.",
              },
              {
                label: "USB cable",
                catch: "Works, but requires the right cable, a driver on the PC, and navigating DCIM folders. On iPhone, Windows only sees the camera roll, not the Files app.",
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
            Five steps to transfer photos directly
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
            What arrives on your PC
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Original file size and resolution, no compression applied",
              "HEIC, JPEG, PNG, RAW: whatever format your phone captured",
              "Videos from the camera roll in their original codec",
              "Screenshots and edited photos alongside camera photos",
              "EXIF metadata intact (date, GPS if enabled, camera model)",
              "Files named as your phone named them, no renaming",
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
                alt="QuickBridge file picker on a phone showing photos ready to send"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Tap the file picker on your phone to select photos from your camera roll.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge showing a completed photo transfer on the PC"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Photos arrive on your PC in their original resolution. Nothing was uploaded to a server.
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
                Original-quality photos on your PC in under a minute
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan with your phone, select
                your photos, done. No accounts, no compression.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-photos-phone-pc-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-photos-phone-to-pc" />
        <SiteFooter />
      </main>
    </div>
  );
}
