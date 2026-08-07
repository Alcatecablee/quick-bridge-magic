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
  "Why QuickBridge: Phone to PC, No Upload | QuickBridge";
const PAGE_DESCRIPTION =
  "The fastest way to send files between phone and PC. No upload step, no cloud middleman, no install - files stream directly browser-to-browser in seconds.";
const PAGE_URL = "https://quickbridge.app/why-quickbridge";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-why.png";
const PAGE_OG_ALT =
  "Why QuickBridge: P2P file transfer with no upload, no account, and no size limit. Browser to browser.";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why is QuickBridge faster than email or cloud upload?",
    a: "Cloud and email tools upload your file to a server first, then the other side downloads it. You effectively pay for the trip twice. QuickBridge has no upload step. The file streams directly from one browser to the other, limited only by your local network speed, which is almost always faster than your internet connection.",
  },
  {
    q: "Do I really not need to install anything?",
    a: "Nothing to install on either side. QuickBridge runs in the browser using WebRTC, the same technology that powers video calls in Google Meet and FaceTime. Open the site on both devices, scan the QR code, and you are connected. You can add it to your home screen as a PWA for faster access, but you never have to.",
  },
  {
    q: "How is this different from Google Drive, Dropbox, or WeTransfer?",
    a: "Those tools upload your file to their servers and give the recipient a link. That makes sense when you are sending to someone who is not at their computer right now. When you are just moving something from your phone to your laptop, you are waiting for a round trip that does not need to happen. QuickBridge connects the two devices directly, so there is no upload and the file never touches anyone else's hardware.",
  },
  {
    q: "Is it actually secure if there's no cloud?",
    a: "More secure, not less. Files travel over a WebRTC data channel encrypted with DTLS (the standard used by browser video calls). Because there is no server-side copy, there is also nothing for an attacker to breach later, and nothing for any company - including us - to read.",
  },
  {
    q: "What kinds of things can I send?",
    a: "Files of any type - up to 10 GB each when the receiver enables auto-save, 2 GB otherwise. Photos and videos straight from your phone gallery, plain text and notes, links and OTP codes you want to push between devices, and clipboard contents. Everything moves through the same direct connection.",
  },
  {
    q: "Does it work between any two devices?",
    a: "Yes. Android to Windows, iPhone to Linux, Mac to Chromebook - any two devices with a modern browser can connect. There is no Apple-only restriction like AirDrop, no same-network restriction like Snapdrop, and no app install like SHAREit.",
  },
  {
    q: "Is it really free?",
    a: "Yes, free forever, with no sign-up, no ads, and no upsells. There is nothing to upgrade because there is no server-side storage cost to pass on - your devices do the actual work.",
  },
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a file transfer tool that runs entirely in your browser. Instead of uploading your file to a cloud server and waiting for the other side to download it, it connects two browsers directly and streams the file between them. Open the site on both devices, scan a QR code, and you are connected. No account, no app to install. Files up to 10 GB are supported when the receiver enables auto-save, and the connection automatically recovers if the network briefly drops.",
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
const ARTICLE_MODIFIED = "2026-04-30";

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why QuickBridge: the fastest way to move files between devices",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  datePublished: ARTICLE_PUBLISHED,
  dateModified: ARTICLE_MODIFIED,
  author: {
    "@type": "Person",
    name: "Clive",
    url: "https://quickbridge.app/about",
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
    body: "Every cloud tool makes you wait for the upload before anything moves. QuickBridge skips that step entirely. Drop a file and it starts streaming immediately. A 200 MB video that would take a minute to upload to the cloud gets to the other device in a few seconds on a local connection.",
  },
  {
    Art: P2PIllustration,
    title: "Browser to browser, nothing in between",
    body: "Your phone and your computer establish a direct browser-to-browser channel, with no server in between. No upload queue, no detour through a data center somewhere. The speed you get is just your two devices talking to each other.",
  },
  {
    Art: NoServerIllustration,
    title: "Nothing stored on any server",
    body: "Nothing sits on a server. The file goes from your phone's browser to your laptop's browser and that is the end of it. No link that expires at midnight, no shared folder someone else can access, no company that technically has a copy of your files.",
  },
];

const STEPS = [
  {
    Art: PhoneIllustration,
    title: "Open on your phone",
    body: "Open quickbridge.app in Chrome, Safari, or Firefox on your phone. On iPhone that is Safari. On Android, Chrome works fine.",
  },
  {
    Art: ScanIllustration,
    title: "Scan the QR",
    body: "Point your phone camera at the QR code on your screen. A banner appears at the top of the viewfinder, tap it, and the transfer page opens in your phone browser.",
  },
  {
    Art: DesktopIllustration,
    title: "Send anything",
    body: "Drag a file onto the browser window, pick from your gallery, or paste something from your clipboard. It streams to the other device in real time, no waiting for an upload to finish.",
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
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            Why QuickBridge is the fastest way{" "}
            <span className="text-muted-foreground">to send files between devices.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Open. Scan. Send. No app, no cable, no upload step, no cloud
            middleman. Your files stream straight from one browser to the
            other in seconds.
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
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
            All of them work, eventually. None of them feel fast. Every single
            one adds a step that does not need to exist.
          </p>
        </Reveal>

        {/* Solution narrative */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            QuickBridge cuts out the upload step entirely
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            QuickBridge connects your phone and computer directly through the
            browser. No accounts to create, nothing to install, no upload to
            wait for. Both devices open the same website, pair with a QR code,
            and files start moving browser to browser over the connection they
            already share.
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
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works in five seconds
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            No tutorial needed. The whole flow is three steps and the first
            transfer is usually done before you would have finished writing the
            email to yourself.
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
                Android to Windows, iPhone to Linux, Mac to Chromebook. There
                is no ecosystem fence you need to be inside. If both devices
                have a modern browser, they can connect through QuickBridge.
              </p>
            </Card>
            <Card className="border-border bg-card p-6">
              <PWAIllustration className="mb-3 h-12 w-12 text-primary" />
              <h3 className="text-[15px] font-semibold text-foreground">
                Installable, but never required
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Add QuickBridge to your home screen and it opens like a native
                app, with one-tap access for everyday transfers. Or use it
                straight from the browser. Same speed either way.
              </p>
            </Card>
          </div>
        </Reveal>

        {/* FAQ */}
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

        {/* CTA */}
        <Reveal as="section" className="mt-16">
          <div className="border-t border-border/40 pt-12 text-center sm:pt-14">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Open. Scan. Send.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                The fastest way to move files between your devices. Free
                forever, no sign-up, no app to install.
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
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
