import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, X as XIcon } from "@/components/quickbridge/icons";
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
import {
  InstantIllustration,
  P2PIllustration,
  NoServerIllustration,
  PhoneIllustration,
  ScanIllustration,
  DesktopIllustration,
  CrossPlatformIllustration,
  PWAIllustration,
} from "@/components/quickbridge/FlowIllustrations";

const PAGE_TITLE =
  "Why QuickBridge in 2026: Phone to PC, No Upload, No Account";
const PAGE_DESCRIPTION =
  "2026 fastest way to send files between phone and PC. No upload step, no cloud middleman, no install. Files stream directly browser-to-browser in seconds.";
const PAGE_URL = "https://quickbridge.app/why-quickbridge";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-why.png";
const PAGE_OG_ALT =
  "Why QuickBridge: P2P file transfer with no upload, no account, and no size limit. Browser to browser.";

const SOURCES: { id: string; title: string; url: string; fetched: string }[] = [
  {
    id: "apple-airdrop-iphone",
    title: 'Apple Support - "Use AirDrop on your iPhone or iPad" (Apple-only requirement)',
    url: "https://support.apple.com/en-us/119857",
    fetched: "2026-06-15",
  },
  {
    id: "snapdrop-faq",
    title: "Snapdrop FAQ (docs/faq.md) - same local network requirement",
    url: "https://github.com/RobinLinus/snapdrop/blob/master/docs/faq.md",
    fetched: "2026-06-15",
  },
  {
    id: "shakeit-play",
    title: "SHAREit on Google Play - app install and in-app advertising model",
    url: "https://play.google.com/store/apps/details?id=com.lenovo.anyshare.gps",
    fetched: "2026-06-15",
  },
  {
    id: "webrtc-spec",
    title: "W3C WebRTC specification - browser-native P2P data channels (used by Google Meet, FaceTime)",
    url: "https://www.w3.org/TR/webrtc/",
    fetched: "2026-06-15",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why is QuickBridge faster than email or cloud upload?",
    a: "With cloud tools and email, your file goes up to a server and then back down again on the other side. You're making the trip twice. QuickBridge skips that entirely. The file goes straight from one browser to the other, so you're only limited by how fast your two devices can talk to each other, which is usually way faster than your internet connection.",
  },
  {
    q: "Do I really not need to install anything?",
    a: "Nope, nothing at all. QuickBridge runs right in the browser using WebRTC, the same tech that powers Google Meet and FaceTime video calls. Just open the site on both devices, scan the QR, and you're in. You can add it to your home screen if you like, but you really don't have to.",
  },
  {
    q: "How is this different from Google Drive, Dropbox, or WeTransfer?",
    a: "Those tools make sense when you're sending something to someone who isn't at their computer yet. You're basically leaving a package for them to pick up later. But when you're just moving something from your phone to the laptop sitting right next to you, that round trip through a cloud server is unnecessary. QuickBridge skips it. Your two devices connect directly.",
  },
  {
    q: "Is it actually secure if there's no cloud?",
    a: "Honestly, more secure than most cloud options. Your files travel over a WebRTC channel encrypted with DTLS, which is the same standard used by browser video calls. And since nothing is stored on a server, there's nothing to breach later. Not by an attacker, and not by us either.",
  },
  {
    q: "What kinds of things can I send?",
    a: "Pretty much anything. Files up to 10 GB when the receiver enables auto-save, 2 GB otherwise. Photos and videos from your gallery, plain text, links, OTP codes, whatever's on your clipboard. It all goes through the same direct connection.",
  },
  {
    q: "Does it work between any two devices?",
    a: "Yes. Android to Windows, iPhone to Linux, Mac to Chromebook, whatever you've got. Any two devices with a modern browser will work. No Apple-only fence like AirDrop, no same-network requirement like Snapdrop, no app install like SHAREit.",
  },
  {
    q: "Is it really free?",
    a: "Yeah, fully free. No sign-up, no ads, no paid tier. There's nothing to upgrade because your devices are doing all the actual work. There's no storage bill for us to pass on.",
  },
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a file transfer tool that runs entirely in your browser. Instead of uploading to a cloud server and waiting for the other side to download it, it connects two browsers directly and streams the file between them. Open the site on both devices, scan a QR, and you're done. No account, no install needed. Files up to 10 GB work when the receiver enables auto-save, and if the connection briefly drops, it picks back up on its own.",
  },
  {
    q: "Who is QuickBridge best for?",
    a: "QuickBridge is best for anyone who needs to move files between two devices in real time without a USB cable, account, or app install. Both devices need to have a browser open at the same time. Choose a cloud service like Google Drive when the recipient will not be online right away or when the same file needs to reach several people at different times.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_PUBLISHED = "2026-04-28";
const ARTICLE_MODIFIED = "2026-06-15";

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why QuickBridge 2026: the fastest way to move files between devices",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  datePublished: ARTICLE_PUBLISHED,
  dateModified: ARTICLE_MODIFIED,
  author: {
    "@type": "Person",
    name: "Clive Makazhu",
    url: "https://justc.live/",
    sameAs: ["https://quickbridge.app/about", "https://x.com/just_clive_sa"],
  },
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Why QuickBridge", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/why-quickbridge")({
  component: WhyQuickBridgePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send files phone to pc, transfer files without usb, fastest file transfer, browser file transfer, peer to peer file sharing, no upload file transfer, instant file sharing",
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

const PAINS = [
  "Emailing a file to yourself, then waiting for it to actually appear on the other device",
  "Uploading to cloud storage, then waiting for the sync before you can download on the other side",
  "Plugging in a USB cable and hoping your PC recognizes the device this time",
  "Installing a mobile app that wants access to your contacts and location just to move a PDF",
];

const WHY_BLOCKS = [
  {
    Art: InstantIllustration,
    title: "No upload, so no waiting",
    body: "Cloud tools make you wait for the upload to finish before the other side can even start. QuickBridge doesn't have an upload step. Drop the file and it starts moving right away. That 200 MB video that would take a minute to upload? It's there in a few seconds on a local connection.",
  },
  {
    Art: P2PIllustration,
    title: "Browser to browser, nothing in between",
    body: "Your phone and your computer talk directly to each other. No server in the middle, no detour through a data center on the other side of the world. The speed you get is just your two devices, talking to each other.",
  },
  {
    Art: NoServerIllustration,
    title: "Nothing stored on any server",
    body: "Your file goes from your phone's browser to your laptop's browser, and that's it. No copy sitting on a server somewhere. No link that expires in 24 hours. No shared folder that someone with the right login could browse through.",
  },
];

const STEPS = [
  {
    Art: PhoneIllustration,
    title: "Open on your phone",
    body: "Go to quickbridge.app on your phone. Safari on iPhone, Chrome on Android. That's really all there is to it.",
  },
  {
    Art: ScanIllustration,
    title: "Scan the QR",
    body: "Point your camera at the QR code on your computer screen. A little banner pops up, tap it, and you're in the transfer page.",
  },
  {
    Art: DesktopIllustration,
    title: "Send anything",
    body: "Drag a file over, pick from your gallery, or paste from your clipboard. It starts streaming immediately. No upload bar to watch.",
  },
];

function WhyQuickBridgePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }}
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
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Why QuickBridge</span>
        </nav>

        {/* Hero */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Why QuickBridge
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[46px] sm:text-[64px] md:text-[84px]">
            Why QuickBridge is the fastest way{" "}
            <span className="text-muted-foreground">to send files between devices in 2026.</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">Updated June 2026</p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            Open the site. Scan the QR. Done. No cable hunt, no waiting for a cloud upload, no app to install first. Your file just moves. Browser to browser, in seconds.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/">
                Try it now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/join">Join with a PIN</Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · Encrypted end-to-end
          </p>
        </header>

        {/* Problem */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Why does sending files still feel slow?
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            We all do it. You snap a photo on your phone and need it on your
            laptop five minutes later. You finish editing a document on your
            laptop and need it on your phone before you leave. Somehow, in
            2026, the standard options still look like this:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {PAINS.map((pain) => (
              <li
                key={pain}
                className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-[13.5px] text-foreground/90"
              >
                <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                {pain}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            They all get there eventually. None of them feel good. And every single one adds at least one step that has no reason to be there.
          </p>
        </Reveal>

        {/* Solution narrative */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            QuickBridge cuts out the upload step entirely
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Look, the idea is simple. Both devices open the same website, one scans the QR, and they're connected. No account to sign up for, nothing to install, no upload step. Files just go straight across, browser to browser.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {WHY_BLOCKS.map(({ Art, title, body }) => (
              <Card key={title} className="border-border bg-card p-5">
                <Art className="mb-3 h-12 w-12 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* Steps */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How it works in five seconds
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Honestly, you probably don't need instructions. But just in case: three steps, and your first file is across before you'd have even typed the subject line on that email-to-self.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ Art, title, body }, i) => (
              <Card key={title} className="border-border bg-card p-5">
                <Art className="mb-3 h-12 w-12 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 0{i + 1}
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {([
              { src: "/screenshots/qr-code-mobile.png", alt: "QuickBridge QR code on Android: open the site and a live QR is ready instantly", step: "Step 01" },
              { src: "/screenshots/paired.png", alt: "QuickBridge paired: devices connected and emoji verification code visible", step: "Step 02" },
              { src: "/screenshots/sending.png", alt: "QuickBridge file transfer in progress: streaming directly between devices", step: "Step 03" },
            ] as { src: string; alt: string; step: string }[]).map(({ src, alt, step }) => (
              <div key={step} className="overflow-hidden rounded-xl border border-border shadow-sm">
                <img src={src} alt={alt} className="w-full object-cover object-top" loading="lazy" />
                <div className="border-t border-border bg-muted/20 px-3 py-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">{step}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Reinforcement */}
        <Reveal as="section" className="mt-16">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border bg-card p-6">
              <CrossPlatformIllustration className="mb-3 h-12 w-12 text-primary" />
              <h3 className="text-[15px] font-semibold text-foreground">
                Works between any two devices
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Android to Windows, iPhone to Linux, Mac to Chromebook. It really doesn't matter. If both devices have a modern browser, they'll connect. No ecosystem fence to worry about.
              </p>
            </Card>
            <Card className="border-border bg-card p-6">
              <PWAIllustration className="mb-3 h-12 w-12 text-primary" />
              <h3 className="text-[15px] font-semibold text-foreground">
                Installable, but never required
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                You can add it to your home screen and it'll feel like a proper app, one tap and you're in. Or just open the browser each time. Honestly, either way works just as well.
              </p>
            </Card>
          </div>
        </Reveal>

        {/* FAQ */}
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

        {/* Sources */}
        <Reveal as="section" className="mt-14" id="sources">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Sources
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {SOURCES.map((src) => (
              <li key={src.id}>
                <a
                  href={src.url}
                  rel="noopener"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {src.title}
                </a>{" "}
                <span className="text-muted-foreground/70">- verified {src.fetched}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* CTA */}
        <Reveal as="section" className="mt-16">
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Open. Scan. Send.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                No sign-up. No app. No waiting for a sync. Just open the site and scan.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/">
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>
        {/* Ecosystem cross-promo */}
        <Reveal as="section" className="mt-20 sm:mt-28">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">From the same maker</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              More tools with the same zero-upload philosophy.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="https://calmpc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 text-3xl">🖥️</div>
              <h3 className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">CalmPC</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Free computer health check. Diagnoses slow PCs, broken Wi-Fi, and USB issues. Step-by-step fixes in plain English. No download, runs entirely in your browser.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                calmpc.com <ArrowRight className="h-3 w-3" />
              </span>
            </a>
            <a
              href="https://calmclip.video"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 text-3xl">🎬</div>
              <h3 className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">CalmClip</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Local AI video editor. Transcription, silence removal, captions, multi-ratio export. Everything runs in your browser tab with WebAssembly. Nothing is ever uploaded.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                calmclip.video <ArrowRight className="h-3 w-3" />
              </span>
            </a>
          </div>
        </Reveal>

        <RelatedPages currentHref="/why-quickbridge" />
        <SiteFooter />
      </main>
    </div>
  );
}
