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
  "How to Send Files from iPhone to Windows PC (No Cable)";
const PAGE_DESCRIPTION =
  "Open this on your iPhone. On your Windows PC, open the same site and scan the QR. Files transfer wirelessly. No iTunes, no iCloud, no app. Free.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-iphone-to-windows";
const PAGE_OG_IMAGE =
  "https://quickbridge.app/og-howto-iphone-to-windows.png";
const PAGE_OG_ALT =
  "How to send files from iPhone to Windows PC wirelessly. Scan the QR and go. QuickBridge.";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-16";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your Windows PC",
    body: "Go to quickbridge.app in Chrome, Edge, or Firefox on your Windows machine. The QR code is the first thing you see. No login screen, no 'install our app' prompt, no extension required.",
  },
  {
    n: "02",
    title: "Scan the QR with your iPhone",
    body: "Open the iPhone Camera app and hold it over the QR code on your screen. A banner pops up at the top, tap it, and Safari opens the transfer page. The whole thing takes about three seconds.",
  },
  {
    n: "03",
    title: "Verify the connection (two seconds)",
    body: "Both screens show the same short emoji sequence. Glance at both devices, confirm they match, and tap to confirm. It takes two seconds and it is the only security step in the whole process.",
  },
  {
    n: "04",
    title: "Send from your iPhone",
    body: "On the iPhone, tap the file picker. Safari surfaces the standard iOS sheet, so your Photos library, Files app, and iCloud Drive are all right there. Pick what you want to send and tap Send.",
  },
  {
    n: "05",
    title: "Save on Windows",
    body: "Chrome or Edge shows the usual download prompt as each file arrives. First time it asks where to save, after that files go straight to your Downloads folder. The entire transfer happened device to device, encrypted end to end.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why can't I just use AirDrop to send to Windows?",
    a: "AirDrop is the obvious first instinct, and then you remember it only talks to other Apple devices. Windows gets nothing. QuickBridge runs in Safari on the iPhone and Chrome or Edge on Windows, connecting the two directly. Same Wi-Fi or different networks, it does not matter.",
  },
  {
    q: "Do I need to install iTunes or any app on my Windows PC?",
    a: "No. QuickBridge runs in the browser on both sides. Open the site, scan the QR, and you are connected. iTunes never comes up.",
  },
  {
    q: "My iPhone photo is a HEIC file. Will Windows receive it correctly?",
    a: "Yes. QuickBridge sends exactly the file your iPhone provides. If your iPhone is set to capture in HEIC format, the Windows machine receives a .heic file. If you want a JPEG instead, change your iPhone camera settings to 'Most Compatible' in Settings > Camera > Formats before sharing, and the file will arrive as a standard JPEG.",
  },
  {
    q: "How large a file can I send?",
    a: "2 GB per file by default. Enable the auto-save option on the Windows side and that rises to 10 GB, which covers most videos and large archives.",
  },
  {
    q: "Does it work if my iPhone and PC are on different Wi-Fi networks?",
    a: "Yes. QuickBridge uses STUN and TURN to bridge across different networks. Your iPhone on cellular and your PC on a work network will still find each other and transfer. Speed is limited by whichever connection is slower, but it works reliably.",
  },
  {
    q: "What happens to my files after the transfer?",
    a: "Nothing. Files travel directly from your iPhone's browser to your Windows browser over an encrypted WebRTC channel. QuickBridge never stores them on a server. Once the connection closes, there is no copy anywhere other than your two devices.",
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
    { "@type": "ListItem", position: 3, name: "iPhone to Windows", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/how-to/send-files-iphone-to-windows")({
  component: HowToIphoneToWindowsPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send files iphone to windows, iphone to pc wireless transfer, transfer photos iphone to windows no itunes, iphone to windows without cable",
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

function HowToIphoneToWindowsPage() {
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
          <span className="text-foreground">iPhone to Windows</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <img src="/logos/ios.png" alt="iPhone iOS" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-muted-foreground/50 text-lg">→</span>
            <img src="/logos/windows.png" alt="Windows" className="h-10 w-10 rounded-xl object-contain" />
          </div>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            iPhone to Windows{" "}
            <span className="text-muted-foreground">without a cable or iTunes.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            The moment an iPhone has to talk to a Windows PC, things get
            complicated. There is no AirDrop for Windows, and iTunes adds more
            friction than it removes. This guide shows you a five-step browser
            method that works whether both devices are on the same network or
            completely separate ones.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-iphone-windows" } as never}>
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
            Why this is harder than it should be
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            iPhones lock down their file system pretty aggressively. Even when
            both devices are on the same Wi-Fi, Windows has no built-in way to
            see an iPhone's storage the way it can browse an Android phone over
            USB. Every standard option has a catch.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "iCloud",
                catch: "Requires an Apple ID and enough free iCloud storage, which many people have already filled up. It uploads to Apple's servers first, then your PC downloads from there. You are waiting for two trips instead of zero.",
              },
              {
                label: "iTunes / Finder",
                catch: "Needs a USB cable and the iTunes desktop app. Syncs entire libraries rather than individual files. Feels like 2010.",
              },
              {
                label: "Email to yourself",
                catch: "Works for small files. Most email providers reject attachments over 25 MB. Video? Forget it.",
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
          <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            The method below skips all of that. Both devices open the same
            website in their browser, pair with a QR scan, and the file
            streams directly between them. Nothing uploaded, nothing stored.
          </p>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How to do it: five steps
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Total time from opening your browser to having the file on your PC
            is under a minute for most photos. Large videos take longer, but
            they stream at your actual network speed, not held back by a cloud
            upload queue. No account needed on either side.
          </p>
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
            What the transfer actually looks like
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">On the iPhone</h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "Safari shows the connection status and the other device's name, with a file picker button below.",
                  "A live progress bar shows the file streaming out.",
                  "You can send multiple files without re-scanning, the session stays open.",
                  "You can also type a note or paste a link directly to the PC in the same session.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">On the Windows PC</h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "The browser shows the incoming file name and size as soon as the transfer starts.",
                  "Chrome or Edge shows a download prompt for each file, same as any file you download from the web.",
                  "Enable auto-save to skip the prompt and receive files up to 10 GB directly to disk.",
                  "The session is two-way. Drag a file from your desktop onto the browser tab to send it back to the iPhone.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
                The QR code appears the moment you open QuickBridge on your Windows PC. No login, no setup.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker open on an iPhone"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                After scanning, tap the file picker on your iPhone to choose what to send.
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
                Ready to try it?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your Windows PC, scan the QR with your
                iPhone, and send your first file in under a minute.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-iphone-windows-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-iphone-to-windows" />
        <SiteFooter />
      </main>
    </div>
  );
}
