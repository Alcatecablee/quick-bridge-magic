import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, X as XIcon } from "@/components/quickbridge/icons";
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
  PhoneIllustration,
  ScanIllustration,
  DesktopIllustration,
  CrossPlatformIllustration,
  EncryptionIllustration,
  P2PIllustration,
  NetworkIllustration,
  NoServerIllustration,
  InstantIllustration,
  PWAIllustration,
} from "@/components/quickbridge/FlowIllustrations";

const PAGE_TITLE =
  "AirDrop Alternative for Android & Windows - In-Browser, Free";
const PAGE_DESCRIPTION =
  "AirDrop for Android and Windows. Send files between phone and PC in seconds - no app, no account, no cables. Works in any modern browser, fully encrypted.";
const PAGE_URL = "https://quickbridge.app/airdrop-alternative";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-airdrop.png";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Is QuickBridge a real AirDrop alternative for Android and Windows?",
    a: "Yes. AirDrop is an Apple-only protocol that works between iPhone, iPad, and Mac. Google's Quick Share added a one-way AirDrop bridge for Pixel 9 and Pixel 10 devices (February 2026), but that only covers Android-to-Apple transfers on specific Pixel hardware. If you have a Windows PC, an Android phone that isn't a Pixel 9/10, or need transfers in the other direction (Apple to Android), AirDrop still cannot help. QuickBridge works between any two devices with a modern browser (Android, Windows, Linux, ChromeOS, iOS, macOS) on any network.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. QuickBridge runs entirely in your browser. Open the site on your computer, scan the QR code with your phone, and start sending. You can optionally install it as a PWA for one-tap access, but it is never required.",
  },
  {
    q: "Does it work between Android and Windows specifically?",
    a: "Yes. Android-to-Windows is the most common use case. Open QuickBridge on Windows in any modern browser, scan the QR with your Android phone's camera, and the transfer page opens automatically.",
  },
  {
    q: "Do both devices need to be on the same Wi-Fi network?",
    a: "No. QuickBridge works on the same Wi-Fi for maximum speed, but it also works across different networks using STUN and TURN servers. AirDrop requires both devices to be near each other on the same Apple network - QuickBridge does not.",
  },
  {
    q: "Is it secure? Can anyone intercept my files?",
    a: "Files travel directly between your two browsers over a WebRTC data channel encrypted with DTLS (the same standard used by browser video calls). No copy is ever stored on a QuickBridge server. The signaling server only sees the connection handshake - never file contents.",
  },
  {
    q: "What is the file size limit?",
    a: "Up to 10 GB per file when the receiver turns on auto-save (saves directly to disk - works on Chromium-based browsers). On other browsers the cap is 2 GB so the receiver's tab doesn't run out of memory. Transfers use 16 KB chunks with backpressure-aware streaming.",
  },
  {
    q: "How is this different from Snapdrop or SHAREit?",
    a: "Snapdrop only works when both devices are on the same local network. SHAREit requires installing a mobile app and shows ads. QuickBridge works across networks, requires no install, has no ads, and is fully end-to-end encrypted.",
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
  headline: "AirDrop Alternative for Android and Windows",
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

export const Route = createFileRoute("/airdrop-alternative")({
  component: AirdropAlternativePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "airdrop alternative, airdrop for android, airdrop for windows, send files phone to pc, transfer files without usb, android to windows transfer, cross-platform file sharing",
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

function AirdropAlternativePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      {/* Inline JSON-LD for SEO. Crawlers parse these regardless of position. */}
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
          <span className="text-foreground">AirDrop alternative</span>
        </nav>

        {/* Hero */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            AirDrop, but for everyone
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            The AirDrop alternative for{" "}
            <span className="text-muted-foreground">Android &amp; Windows</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Send files between your phone and PC in seconds - no app to install,
            no account to create, no cable to dig out. Works on Android, Windows,
            Linux, iPhone, and Mac, in any modern browser.
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
            Why "just AirDrop it" doesn't work for most people
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            AirDrop is great - if every device in your life happens to be made by
            Apple. The moment you mix an Android phone with a Windows laptop, or
            try to send a file from your iPhone to your PC at work, you're back to
            the bad options:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Emailing files to yourself and waiting for sync",
              "Plugging in a USB cable and hunting for the right driver",
              "Uploading to the cloud, then downloading on the other side",
              "Installing a heavy mobile app full of ads and permissions",
            ].map((pain) => (
              <li
                key={pain}
                className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-[13.5px] text-foreground/90"
              >
                <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                {pain}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Solution */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            QuickBridge: AirDrop for any phone, any computer
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            QuickBridge is a browser-based, peer-to-peer file transfer tool. Open
            the site on both devices, scan a QR code, and start sending. Files
            stream directly from one browser to the other - no upload step, no
            server-side copy, no waiting.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                Art: PhoneIllustration,
                title: "Open on your phone",
                body: "Visit QuickBridge in your phone's browser. Chrome, Safari, Firefox - they all work.",
              },
              {
                Art: ScanIllustration,
                title: "Scan the QR code",
                body: "Point your camera at the QR shown on your computer. The transfer page opens automatically.",
              },
              {
                Art: DesktopIllustration,
                title: "Send anything",
                body: "Drag a file, paste text, or share your clipboard. Everything streams device-to-device, instantly.",
              },
            ].map(({ Art, title, body }, i) => (
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <img
                src="/screenshots/qr-code-mobile.png"
                alt="QuickBridge on Android — the QR code screen ready to pair with any computer"
                className="w-full object-cover object-top"
                loading="lazy"
              />
              <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-[12px] text-muted-foreground">
                Android phone — open the site and point the camera at your computer's QR
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <img
                src="/screenshots/sending.png"
                alt="QuickBridge desktop session — file transfer streaming from phone to Windows PC"
                className="w-full object-cover object-top"
                loading="lazy"
              />
              <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-[12px] text-muted-foreground">
                Windows PC — paired with the phone, files streaming directly
              </p>
            </div>
          </div>
        </Reveal>

        {/* Comparison */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How QuickBridge compares to other AirDrop alternatives
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            There are plenty of cross-platform sharing tools. Most of them ask
            you to install something, sign up for something, or stay on the same
            Wi-Fi. Here is the honest comparison:
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium"> </th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">AirDrop</th>
                    <th className="px-5 py-3 font-medium">Snapdrop</th>
                    <th className="px-5 py-3 font-medium">SHAREit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Works on Android &amp; Windows", true, false, true, true],
                    ["No app install required", true, true, true, false],
                    ["Works across different networks", true, false, false, true],
                    ["End-to-end encrypted", true, true, true, false],
                    ["No sign-up, no ads", true, true, true, false],
                    ["Send up to 10 GB per file (with receiver auto-save)", true, true, false, false],
                    ["Open-source signaling, no tracking", true, false, true, false],
                  ].map(([label, qb, ad, sd, sh]) => (
                    <tr key={label as string} className="hover:bg-muted/10">
                      <td
                        className="px-5 py-3.5 font-medium text-foreground"
                        dangerouslySetInnerHTML={{ __html: label as string }}
                      />
                      <CmpCell value={qb as boolean} highlight />
                      <CmpCell value={ad as boolean} />
                      <CmpCell value={sd as boolean} />
                      <CmpCell value={sh as boolean} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Benefits */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why people pick QuickBridge over AirDrop
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Art: CrossPlatformIllustration,
                title: "Truly cross-platform",
                body: "Android to Windows, iPhone to Linux, Mac to Chromebook - any combination works.",
              },
              {
                Art: NetworkIllustration,
                title: "Works across networks",
                body: "Same Wi-Fi for maximum speed, or different networks via STUN/TURN. No 'devices not nearby' errors.",
              },
              {
                Art: EncryptionIllustration,
                title: "End-to-end encrypted",
                body: "Every byte travels over a WebRTC data channel secured with DTLS. No middleman reads your files.",
              },
              {
                Art: NoServerIllustration,
                title: "No server-side copy",
                body: "Files never touch a QuickBridge server. The signaling layer only helps the two browsers find each other.",
              },
              {
                Art: InstantIllustration,
                title: "Instant - no upload step",
                body: "Streaming starts the moment you drop a file. No 'preparing your transfer' screen.",
              },
              {
                Art: PWAIllustration,
                title: "Installable as a PWA",
                body: "Add QuickBridge to your home screen for one-tap access. Optional, never required.",
              },
            ].map(({ Art, title, body }) => (
              <Card key={title} className="border-border bg-card p-5">
                <Art className="mb-3 h-12 w-12 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
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
                Ready to ditch USB cables and email-to-self?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your computer, scan the QR with your phone,
                and you're transferring in under five seconds.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/">
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
        <RelatedPages currentHref="/airdrop-alternative" />
        <SiteFooter />
      </main>
    </div>
  );
}

function CmpCell({ value, highlight = false }: { value: boolean; highlight?: boolean }) {
  return (
    <td className={"px-5 py-3.5 " + (highlight ? "bg-primary/5" : "")}>
      {value ? (
        <span className="inline-flex items-center gap-1 text-success">
          <Check className="h-4 w-4" />
          <span className="sr-only">Yes</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">No</span>
        </span>
      )}
    </td>
  );
}
