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
  "How to Send Files from iPhone to Mac (Beyond AirDrop)";
const PAGE_DESCRIPTION =
  "Transfer files from iPhone to Mac when AirDrop won't cooperate. Works on any Wi-Fi or across different networks. No cables, no iCloud sync required.";
const PAGE_URL = "https://quickbridge.app/how-to/send-files-iphone-to-mac";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Mac",
    body: "Go to quickbridge.app in Safari, Chrome, or Firefox on your Mac. A QR code appears immediately. Leave this tab open.",
  },
  {
    n: "02",
    title: "Scan the QR with your iPhone",
    body: "Open the Camera app and point it at the QR on your Mac screen. Tap the notification that appears. Safari opens the transfer page on your iPhone.",
  },
  {
    n: "03",
    title: "Verify the emoji codes",
    body: "Both screens show a short emoji sequence. Confirm they match. This verifies the direct WebRTC connection between your iPhone and Mac.",
  },
  {
    n: "04",
    title: "Send from your iPhone",
    body: "Tap the file picker on your iPhone. Photos from your camera roll, files from iCloud Drive, and anything in the Files app all appear. Select your files and tap Send.",
  },
  {
    n: "05",
    title: "Files appear on your Mac",
    body: "Each file downloads to your Mac's Downloads folder. HEIC photos can be opened in Preview on Mac. Videos open in QuickTime. Safari handles the download prompt automatically.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "AirDrop is right there. Why would I need this?",
    a: "AirDrop is excellent when it works. It frequently doesn't: devices need to be unlocked, Wi-Fi and Bluetooth both need to be on, discovery mode needs to be set correctly, and sometimes it just refuses to find the other device. QuickBridge has none of those variables. You scan a QR and it connects. It also works when the two devices are on different networks, which AirDrop never does.",
  },
  {
    q: "Does this work if my iPhone and Mac are on different Wi-Fi networks?",
    a: "Yes. QuickBridge uses STUN and TURN to connect across different networks. Your iPhone on cellular and your Mac on a home network will pair and transfer. Speed over TURN is limited by the slower internet connection, but the transfer works.",
  },
  {
    q: "Can I send Live Photos from iPhone to Mac?",
    a: "Yes. A Live Photo is a HEIC image plus a MOV video clip. The file picker treats them as separate files. You can select and send both. On the Mac, QuickTime plays the motion clip and Preview shows the still image.",
  },
  {
    q: "I have iCloud sync turned on. Why not just use that?",
    a: "iCloud sync is convenient for files you want permanently in your cloud library. For a one-off transfer, especially a large video, it uses your iCloud storage and requires enough quota. QuickBridge transfers without touching iCloud at all, which is faster for anything over a few megabytes and uses no storage.",
  },
  {
    q: "What is the file size limit?",
    a: "2 GB per file with the standard browser download prompt on Mac. To receive larger files, enable auto-save in Chrome for Mac before the transfer. Auto-save uses the File System Access API to stream directly to disk, raising the limit to 10 GB per file.",
  },
  {
    q: "Can I also send from Mac to iPhone in the same session?",
    a: "Yes. The session is bidirectional. Drag a file from Finder into the QuickBridge tab on your Mac and it transfers to your iPhone. Both sides can send and receive without re-scanning.",
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

export const Route = createFileRoute("/how-to/send-files-iphone-to-mac")({
  component: HowToIphoneToMacPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "iphone to mac file transfer, send files iphone to macbook, iphone mac without airdrop, iphone to mac wireless",
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

function HowToIphoneToMacPage() {
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
          <span className="text-foreground">iPhone to Mac</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/ios.png" alt="iPhone iOS" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/macos.png" alt="macOS" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            iPhone to Mac.{" "}
            <span className="text-muted-foreground">When AirDrop won't cooperate.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            AirDrop is the obvious answer for iPhone to Mac transfers, but it
            has a surprising number of failure modes: wrong discovery setting,
            Bluetooth off, devices asleep, or just inexplicably not appearing.
            This guide gives you a reliable fallback that works from a browser
            tab on both sides, no Bluetooth required.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-iphone-mac" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No Bluetooth · No iCloud required
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            When AirDrop fails between iPhone and Mac
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { situation: "AirDrop not finding the Mac", why: "Mac receiving mode may be set to 'Contacts Only' or 'No One'. Changing it to 'Everyone' in Finder > AirDrop fixes it, but requires navigating settings each time." },
              { situation: "AirDrop stuck on 'Waiting'", why: "Usually a Bluetooth handshake issue. Both devices need Bluetooth enabled even on Wi-Fi. Toggling Bluetooth off and on again sometimes resolves it." },
              { situation: "Devices on different networks", why: "AirDrop is a local network and Bluetooth protocol. The two devices must be physically near each other. It does not work across different Wi-Fi networks or over cellular." },
              { situation: "Large files timing out", why: "AirDrop has informal limits on very large files and can time out on long transfers. A 4 GB video may fail where smaller files succeed." },
            ].map(({ situation, why }) => (
              <Card key={situation} className="border-border bg-card p-4">
                <p className="text-[13px] font-semibold text-foreground">{situation}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{why}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Five steps from iPhone to Mac
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
            What you can send from iPhone
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Photos from the camera roll (HEIC, JPEG, PNG)",
              "Videos including ProRes on supported iPhone models",
              "Live Photos (the still image and motion clip both transfer)",
              "Files from the Files app, including iCloud Drive, On My iPhone, and third-party app folders",
              "Screenshots and screen recordings",
              "Documents saved by any iOS app that uses the Files system",
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
                alt="QuickBridge QR code pairing screen open in a Mac browser"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Open QuickBridge on your Mac. The QR code is on screen in under a second.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker open on iPhone showing files ready to send"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                After scanning with your iPhone camera, tap the file picker and choose what to send.
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
                iPhone to Mac without the AirDrop lottery
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your Mac, scan the QR with your iPhone, and
                your files arrive. No Bluetooth, no discovery mode.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-iphone-mac-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-iphone-to-mac" />
        <SiteFooter />
      </main>
    </div>
  );
}
