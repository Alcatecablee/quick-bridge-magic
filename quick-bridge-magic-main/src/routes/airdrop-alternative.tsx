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
  "Best AirDrop Alternative for Android & Windows 2026 - Free";
const PAGE_DESCRIPTION =
  "2026 AirDrop alternative for Android and Windows. Open on your phone or PC, scan the QR, and files transfer in seconds. No app, no account, no cables.";
const PAGE_URL = "https://quickbridge.app/airdrop-alternative";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-airdrop.png";
const PAGE_OG_ALT =
  "QuickBridge: the AirDrop alternative that works on Windows and Android. No install, scan and send.";

const SOURCES: { id: string; title: string; url: string; fetched: string }[] = [
  {
    id: "apple-airdrop-iphone",
    title: 'Apple Support - "Use AirDrop on your iPhone or iPad"',
    url: "https://support.apple.com/en-us/119857",
    fetched: "2026-06-15",
  },
  {
    id: "apple-airdrop-mac",
    title: 'Apple Support - "Use AirDrop to send items to nearby Apple devices" (macOS)',
    url: "https://support.apple.com/guide/mac-help/use-airdrop-to-send-items-to-nearby-devices-mh35868/mac",
    fetched: "2026-06-15",
  },
  {
    id: "9to5google-quickshare-airdrop",
    title: "9to5Google - Android phones that support AirDrop sharing via Quick Share (April 11, 2026)",
    url: "https://9to5google.com/2026/04/11/android-airdrop-list-of-supported-devices/",
    fetched: "2026-06-15",
  },
  {
    id: "snapdrop-net",
    title: "snapdrop.net (live homepage - same local network pairing requirement)",
    url: "https://snapdrop.net/",
    fetched: "2026-06-15",
  },
  {
    id: "snapdrop-readme",
    title: "Snapdrop GitHub README (RobinLinus/snapdrop) - local network requirement",
    url: "https://github.com/RobinLinus/snapdrop",
    fetched: "2026-06-15",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Is QuickBridge a real AirDrop alternative for Android and Windows?",
    a: "Yes, and I mean that literally, not in the vague marketing sense. AirDrop is Apple-only. Google added a one-way AirDrop bridge to Quick Share for Pixel 9 and Pixel 10 in February 2026, but that only covers specific Pixel hardware and only in one direction. If you've got a Windows PC, an Android that isn't a Pixel 9 or 10, or you need to send the other way, AirDrop still can't help. QuickBridge works between any two devices with a modern browser on any network.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. Open the site on your computer, scan the QR with your phone, and start sending. You can add it to your home screen for faster access if you want, but you really don't have to.",
  },
  {
    q: "Does it work between Android and Windows specifically?",
    a: "Yes, and honestly that's probably the most common reason people find this page. Open QuickBridge in any browser on Windows, scan the QR with your Android phone, and the transfer page opens right up in Chrome.",
  },
  {
    q: "Do both devices need to be on the same Wi-Fi network?",
    a: "No. Same Wi-Fi will give you the fastest transfer, but QuickBridge also works across completely different networks. AirDrop needs both devices nearby on the same Apple network. QuickBridge has no such requirement.",
  },
  {
    q: "Is it secure? Can anyone intercept my files?",
    a: "Your files go directly between your two browsers over a WebRTC channel encrypted with DTLS, the same standard that powers browser video calls. Nothing is stored on a QuickBridge server. The signaling server only sees the connection handshake, never the actual files.",
  },
  {
    q: "What is the file size limit?",
    a: "No AirDrop-style proximity or platform restrictions here. The practical limit is 10 GB per file when the receiver enables auto-save, which streams it straight to disk in Chromium browsers. Without auto-save, the cap is 2 GB so the tab doesn't run out of memory. For what it's worth, AirDrop has no documented size limit either. The real constraints there are that both devices need to be Apple and physically nearby.",
  },
  {
    q: "How is this different from Snapdrop or SHAREit?",
    a: "Snapdrop only works when both devices are on the same local network. SHAREit needs an app install and shows ads. QuickBridge works across different networks, needs no install, has no ads, and is end-to-end encrypted.",
  },
  {
    q: "What is QuickBridge?",
    a: "QuickBridge works like AirDrop but runs in the browser. It pairs two devices with a QR code or a 6-digit PIN and connects them directly over an encrypted WebRTC channel, so no copy ever touches a server. It works across any network and on any platform, including Android, Windows, Linux, ChromeOS, iOS, and macOS. No app, no account.",
  },
  {
    q: "Is QuickBridge free?",
    a: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
  },
  {
    q: "Who is QuickBridge best for?",
    a: "QuickBridge is best for anyone who needs to move files between devices that aren't both Apple or aren't physically close together. Both devices need a browser open at the same time. Choose AirDrop when both devices are Apple and within 10 metres, or a cloud service like Google Drive when the recipient will not be online right away.",
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
  headline: "AirDrop Alternative for Android and Windows 2026",
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
    { "@type": "ListItem", position: 2, name: "AirDrop Alternative", item: PAGE_URL },
  ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
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
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[46px] sm:text-[64px] md:text-[84px]">
            The AirDrop alternative for{" "}
            <span className="text-muted-foreground">Android &amp; Windows in 2026</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">Updated June 2026</p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            AirDrop only works between Apple devices. It's always been that way, and if one side is Windows or Android, it just doesn't apply. QuickBridge fills that gap. Open the site on both devices, scan a QR, and your file moves in seconds. No server involved.
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
            Why "just AirDrop it" doesn't work for most people
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            AirDrop is genuinely great. But it only helps when both sides are Apple. Mix in a Windows laptop or an Android phone, and you're back to the usual frustrating options:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Your phone is Android or your computer is Windows, so AirDrop has never worked for this transfer",
              "Sending from iPhone to PC means a USB cable hunt or emailing the file to yourself first",
              "Uploading to iCloud or Google Drive on one side and downloading again on the other",
              "Installing a third-party transfer app that wants your contacts, location, and a subscription",
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            QuickBridge: AirDrop for any phone, any computer
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Well, the idea is pretty simple. Open the site on both devices, one scans the QR, and you're connected. Files stream directly between the two browsers over an encrypted channel. No upload step. No sync to wait for. No server copy anywhere.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                Art: PhoneIllustration,
                title: "Open on your phone",
                body: "Go to quickbridge.app on your phone. Chrome on Android, Safari on iPhone. Both work exactly the same.",
              },
              {
                Art: ScanIllustration,
                title: "Scan the QR code",
                body: "Point your camera at the QR on your computer screen. A little banner pops up, tap it, and you're in.",
              },
              {
                Art: DesktopIllustration,
                title: "Send anything",
                body: "Drag a file over, pick from your gallery, or paste some text. It starts moving right away.",
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
                alt="QuickBridge on Android: the QR code screen ready to pair with any computer"
                className="w-full object-cover object-top"
                loading="lazy"
              />
              <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-[12px] text-muted-foreground">
                Android phone: open the site and point the camera at your computer's QR
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <img
                src="/screenshots/sending.png"
                alt="QuickBridge desktop session: file transfer streaming from phone to Windows PC"
                className="w-full object-cover object-top"
                loading="lazy"
              />
              <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-[12px] text-muted-foreground">
                Windows PC: paired with the phone, files streaming directly
              </p>
            </div>
          </div>
        </Reveal>

        {/* Comparison */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How QuickBridge compares to other AirDrop alternatives
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            There are plenty of options out there. Most of them ask you to install something, create an account, or keep both devices on the same Wi-Fi. Here's how they actually stack up:
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Why people pick QuickBridge over AirDrop
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Art: CrossPlatformIllustration,
                title: "Truly cross-platform",
                body: "Android to Windows, iPhone to Linux, Mac to Chromebook. Any combination, any browser. No exceptions, no asterisks.",
              },
              {
                Art: NetworkIllustration,
                title: "Works across networks",
                body: "Same Wi-Fi gives you maximum speed, but it works across completely different networks too. No 'devices not found' errors. No Bluetooth required.",
              },
              {
                Art: EncryptionIllustration,
                title: "End-to-end encrypted",
                body: "Files go over a WebRTC channel secured with DTLS, the same standard that powers browser video calls. Nothing in the middle can read them.",
              },
              {
                Art: NoServerIllustration,
                title: "No server-side copy",
                body: "Your file never lands on a QuickBridge server. The signaling layer just introduces the two browsers to each other, then steps completely out of the way.",
              },
              {
                Art: InstantIllustration,
                title: "Instant - no upload step",
                body: "Streaming starts the moment you drop the file. No 'preparing your transfer' spinner, no upload progress bar sitting at 0% for thirty seconds first.",
              },
              {
                Art: PWAIllustration,
                title: "Installable as a PWA",
                body: "Add it to your home screen for one-tap access whenever you need it. Optional, and definitely not required.",
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
                Ready to ditch USB cables and email-to-self?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open it on your computer, scan the QR with your phone, and you'll be transferring in under five seconds.
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
              More privacy tools that run entirely in your browser.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="https://calmclip.video"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 text-3xl">🎬</div>
              <h3 className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">CalmClip</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Once your video's on your PC, edit it without uploading anything. CalmClip handles trimming, captions, silence removal, and multi-ratio export. Local AI transcription, all in the browser. Same zero-upload promise as QuickBridge.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                calmclip.video <ArrowRight className="h-3 w-3" />
              </span>
            </a>
            <a
              href="https://calmpc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-3 text-3xl">🖥️</div>
              <h3 className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">CalmPC</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                If QuickBridge feels slow, the culprit is often your PC. CalmPC runs a free health check in your browser and walks you through fixes for slow Wi-Fi, high CPU, and storage issues. No install required.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                calmpc.com <ArrowRight className="h-3 w-3" />
              </span>
            </a>
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
