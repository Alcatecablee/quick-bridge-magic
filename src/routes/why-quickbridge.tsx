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
  "Why QuickBridge: Fastest Way to Send Files Between Devices";
const PAGE_DESCRIPTION =
  "The fastest way to send files between phone and PC. No upload step, no cloud middleman, no install - files stream directly browser-to-browser in seconds.";
const PAGE_URL = "https://quickbridge.app/why-quickbridge";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-why.png";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why is QuickBridge faster than email or cloud upload?",
    a: "Email and cloud tools upload your file to a server first, then download it on the other side. That doubles the transfer time and depends on the server's bandwidth. QuickBridge skips the server entirely - the file streams directly from one browser to the other, so it's limited only by your local network speed.",
  },
  {
    q: "Do I really not need to install anything?",
    a: "Correct. QuickBridge runs entirely in the browser using WebRTC, the same technology that powers browser video calls. Open the site on both devices, scan a QR code, and you're connected. You can optionally install it as a PWA for one-tap access, but it's never required.",
  },
  {
    q: "How is this different from Google Drive, Dropbox, or WeTransfer?",
    a: "Those tools store your file on their servers, then give the recipient a link to download it. That means waiting for the upload to finish, then waiting for the download. QuickBridge has no upload and no download - your two devices talk directly, so the transfer is instant and the file never sits on anyone else's hardware.",
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
    "@type": "Organization",
    name: "QuickBridge",
    url: "https://quickbridge.app",
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
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: PAGE_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

const PAINS = [
  "Emailing files to yourself and waiting for them to sync",
  "Uploading to cloud storage, then downloading on the other side",
  "Plugging in a USB cable and hunting for the right driver",
  "Installing a heavy mobile app full of ads and permissions",
];

const WHY_BLOCKS = [
  {
    Art: InstantIllustration,
    title: "Built for speed",
    body: "Most tools make you upload first, then share. QuickBridge skips that entire step. Your file starts streaming the moment you drop it, so a 200 MB transfer that would take a minute through the cloud finishes in seconds on your local network.",
  },
  {
    Art: P2PIllustration,
    title: "Files move directly",
    body: "Your phone and your computer talk to each other browser-to-browser. No detour through a server in another country. The connection is as fast as the slower of your two devices.",
  },
  {
    Art: NoServerIllustration,
    title: "No middleman",
    body: "Your data is not stored. Nothing is uploaded. It goes straight from one device to the other, then it is gone. There is no link that can leak, no expiry to remember, no account that can be breached.",
  },
];

const STEPS = [
  {
    Art: PhoneIllustration,
    title: "Open on your phone",
    body: "Visit QuickBridge in any modern mobile browser. Chrome, Safari, Firefox - they all work the same.",
  },
  {
    Art: ScanIllustration,
    title: "Scan the QR",
    body: "Point your camera at the QR code shown on your computer. The transfer page opens automatically.",
  },
  {
    Art: DesktopIllustration,
    title: "Send anything",
    body: "Drag a file, paste a screenshot, push a link. It streams device-to-device, instantly.",
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
            Free forever · No sign-up · Encrypted end-to-end
          </p>
        </header>

        {/* Problem */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why does sending files still feel slow?
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            We all do it. You snap a photo on your phone and need it on your
            laptop. You finish a doc on your laptop and need it on your phone.
            Somehow, in 2026, the options are still:
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
            All of them work. None of them feel fast. Every one of them adds a
            step that does not need to exist.
          </p>
        </Reveal>

        {/* Solution narrative */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            There is a simpler way
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            QuickBridge connects your phone and computer directly. No accounts.
            No downloads. No waiting. The file moves in one hop, browser to
            browser, on the connection your devices already share.
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
              { src: "/screenshots/qr-code-mobile.png", alt: "QuickBridge QR code on Android — open the site and a live QR is ready instantly", step: "Step 01" },
              { src: "/screenshots/paired.png", alt: "QuickBridge paired — devices connected and emoji verification code visible", step: "Step 02" },
              { src: "/screenshots/sending.png", alt: "QuickBridge file transfer in progress — streaming directly between devices", step: "Step 03" },
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
                is no ecosystem you have to be inside. If both devices have a
                modern browser, you can use QuickBridge.
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
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
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
          </div>
        </Reveal>
        <RelatedPages currentHref="/why-quickbridge" />
        <SiteFooter />
      </main>
    </div>
  );
}
