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
  "How to Transfer Files Without USB (Any Device, Any OS)";
const PAGE_DESCRIPTION =
  "Open this on your phone. Open the same site on your PC and scan the QR. No USB cable, no drivers, no apps. Works across any OS and any network.";
const PAGE_URL = "https://quickbridge.app/how-to/send-files-without-usb";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-howto-no-usb.png";
const PAGE_OG_ALT =
  "How to send files without a USB cable. Wireless transfer that works on any network. QuickBridge.";

const PUBLISHED = "2026-05-16";
const MODIFIED = "2026-05-16";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on the receiving device",
    body: "Go to quickbridge.app in any browser on the device that will receive. A QR code and 6-digit PIN appear. No account, no installation needed.",
  },
  {
    n: "02",
    title: "Open QuickBridge on the sending device",
    body: "On the other device, scan the QR code with your camera, or open quickbridge.app and enter the PIN. Both devices can be on the same Wi-Fi or completely different networks.",
  },
  {
    n: "03",
    title: "Verify the emoji security codes",
    body: "Both screens display the same short emoji sequence. Confirm they match to verify the direct encrypted connection between the two browsers.",
  },
  {
    n: "04",
    title: "Send the file",
    body: "On the sending device, drag a file into the browser tab, use the file picker, or paste from your clipboard. The transfer starts the moment you drop it.",
  },
  {
    n: "05",
    title: "Receive on the other device",
    body: "The file arrives as a standard browser download. On Chromium-based browsers with auto-save enabled, it streams directly to disk without a prompt.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Do both devices need to be on the same Wi-Fi?",
    a: "No. QuickBridge attempts a direct browser-to-browser connection first. If both devices are on the same network, the file travels locally at full network speed. If they are on different networks, QuickBridge routes through an encrypted relay. Either way, no USB cable is needed.",
  },
  {
    q: "What operating systems does this work with?",
    a: "Any combination: Windows, macOS, iOS, Android, Linux, ChromeOS. The only requirement is a modern browser on each device. Chrome, Firefox, Safari, Edge, and Brave are all supported.",
  },
  {
    q: "How is this different from Bluetooth file transfer?",
    a: "Bluetooth transfers are slow (roughly 2 to 3 MB/s) and require pairing, which involves confirmation codes on both devices. QuickBridge pairs via QR scan and transfers at Wi-Fi speed. A 100 MB file takes a few seconds over Wi-Fi versus several minutes over Bluetooth.",
  },
  {
    q: "Is there a file size limit?",
    a: "2 GB per file by default. On Chromium-based browsers (Chrome, Edge, Brave), enabling auto-save allows files up to 10 GB by streaming them to disk rather than buffering in memory.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. QuickBridge runs entirely in the browser. No app, no extension, no driver. Open the site on both devices and you are ready to transfer.",
  },
  {
    q: "What happens if the connection drops mid-transfer?",
    a: "QuickBridge detects the disconnection and attempts to reconnect automatically. If the reconnection succeeds, you can restart the file transfer. Outgoing transfers are flagged as retryable so you do not have to re-select the file.",
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
    { "@type": "ListItem", position: 3, name: "Without USB", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/how-to/send-files-without-usb")({
  component: HowToWithoutUsbPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "transfer files without USB cable, wireless file transfer phone to pc, send files without cable, how to send files wirelessly, no USB file transfer",
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

function HowToWithoutUsbPage() {
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
          <span className="text-foreground">Without USB</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            No cable needed.{" "}
            <span className="text-muted-foreground">Any device, any network, seconds.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            USB cables require the right connector, the right driver, and sometimes
            a manual trust prompt on the phone. Bluetooth is slow and fiddly to
            pair. This guide shows you how to send any file from any device to any
            other device using nothing but a browser and a QR scan.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-no-usb" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No app install · No USB cable or drivers
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why cables and Bluetooth fall short
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "USB cable",
                catch: "Requires the right connector type (USB-C, Lightning, Micro-USB). On Windows, iPhones need iTunes drivers installed. Android requires manually unlocking file transfer mode on the phone.",
              },
              {
                label: "Bluetooth",
                catch: "Transfers at 2 to 3 MB/s, so a 500 MB file takes several minutes. Requires a pairing ceremony on both devices first. Not all OS combinations pair cleanly.",
              },
              {
                label: "Nearby Share / AirDrop",
                catch: "AirDrop only works between Apple devices. Nearby Share (Quick Share) only works Android-to-Android or Android-to-Windows. Neither handles cross-ecosystem transfers.",
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
            Five steps to transfer without a cable
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
            Works across any device combination
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "iPhone to Windows PC",
              "Android to Mac",
              "Windows laptop to Windows desktop",
              "Android to iPhone",
              "Linux to any phone",
              "ChromeOS to any device",
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
                alt="QuickBridge QR code on a computer ready for the second device to scan"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                The receiving device shows a QR code. The sending device scans it to connect.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/paired.png"
                alt="QuickBridge showing both devices connected and ready to transfer"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Once paired, drag any file into the browser to send it instantly. No cable required.
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
                Any file, any device, no cable required
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on both devices, scan the QR, and send. Works
                across iOS, Android, Windows, Mac, and Linux without installing
                anything.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-no-usb-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        {/* Cross-promo: no-USB workflow pairs naturally with no-install editing */}
        <Reveal as="section" className="mt-16">
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:gap-6 sm:p-6">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">No-install toolkit</p>
              <h3 className="mt-1 text-[16px] font-semibold text-foreground">
                Two more browser tools that work with zero installs.
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="https://calmclip.video"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3 transition-colors hover:border-primary/40"
                >
                  <span className="text-xl" aria-hidden>🎬</span>
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground group-hover:text-primary">CalmClip</span>
                    <span className="block text-[12px] leading-relaxed text-muted-foreground">Browser video editor. Trim, captions, silence removal, no upload.</span>
                  </span>
                </a>
                <a
                  href="https://calmpc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3 transition-colors hover:border-primary/40"
                >
                  <span className="text-xl" aria-hidden>🖥️</span>
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground group-hover:text-primary">CalmPC</span>
                    <span className="block text-[12px] leading-relaxed text-muted-foreground">Free PC health check and fix guides. Runs in your browser.</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-without-usb" />
        <SiteFooter />
      </main>
    </div>
  );
}
