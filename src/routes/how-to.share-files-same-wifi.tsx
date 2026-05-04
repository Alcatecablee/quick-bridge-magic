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
  "How to Share Files Between Phone and PC on the Same Wi-Fi";
const PAGE_DESCRIPTION =
  "Transfer files between your phone and PC when both are on the same Wi-Fi network. Faster than cloud upload, no accounts, no setup. Browser-to-browser.";
const PAGE_URL = "https://quickbridge.app/how-to/share-files-same-wifi";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your PC or Mac",
    body: "Go to quickbridge.app in your browser. A QR code and 6-digit PIN appear. Both devices need to be on the same Wi-Fi for the fastest direct connection, but the method works across different networks too.",
  },
  {
    n: "02",
    title: "Connect from your phone",
    body: "Scan the QR code with your phone's camera, or go to quickbridge.app on your phone and enter the 6-digit PIN. The transfer page opens on your phone.",
  },
  {
    n: "03",
    title: "Verify the connection",
    body: "Both screens show a matching emoji code. On the same Wi-Fi, QuickBridge creates a direct local connection between the two browsers. Verify the codes match before sending.",
  },
  {
    n: "04",
    title: "Send files in either direction",
    body: "Either device can send. Drag files from your PC into the browser tab, or use the file picker on your phone. The session is bidirectional: send from phone to PC, then PC to phone, all in one session.",
  },
  {
    n: "05",
    title: "Receive and save",
    body: "Files arrive as browser downloads on the receiving side. Enable auto-save on the PC to skip the per-file prompt and receive files directly to a folder you choose.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why not just use Windows network sharing or SMB?",
    a: "Windows network sharing requires enabling file sharing in settings, setting up shared folders, and navigating network paths. On mixed-OS setups (Windows and Mac, or Windows and Android) the setup is more complex. QuickBridge takes less than a minute with no configuration and works regardless of OS combination.",
  },
  {
    q: "How fast is the transfer on the same Wi-Fi?",
    a: "On a 5 GHz Wi-Fi network, QuickBridge creates a direct WebRTC connection between the two browsers on your local network. Typical speeds range from 50 to 200 Mbps depending on your router and device. A 1 GB video finishes in roughly 1 to 3 minutes. Your internet connection speed is not involved.",
  },
  {
    q: "What makes QuickBridge faster than Snapdrop on the same Wi-Fi?",
    a: "Both QuickBridge and Snapdrop use WebRTC on the local network, so speeds are comparable. The practical difference is that QuickBridge uses intentional QR pairing rather than auto-discovery, which means you connect specifically to the device you intend to, not the first device that appears on the network.",
  },
  {
    q: "Can I use this on a hotel or office Wi-Fi?",
    a: "Possibly, with a caveat. Some shared Wi-Fi networks use client isolation, which prevents devices from communicating directly. If that is the case, QuickBridge falls back to a TURN relay that routes traffic through an internet server instead. The transfer still works, but speed is limited by the internet connection rather than the local network. On home Wi-Fi, client isolation is not typically enabled.",
  },
  {
    q: "Do both devices have to be on the same Wi-Fi for it to work?",
    a: "No. Same Wi-Fi is optimal for speed, but not required. QuickBridge works when the devices are on entirely different networks (phone on cellular, PC on Wi-Fi) by routing through a TURN relay. The connection always works; speed varies.",
  },
  {
    q: "Can I send text and links, not just files?",
    a: "Yes. The text input box in QuickBridge lets you type a message, paste a URL, or push clipboard contents to the other device. Anything you can copy, you can push. This is useful for sending a link from your phone to your PC or a password from your PC to your phone.",
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

export const Route = createFileRoute("/how-to/share-files-same-wifi")({
  component: HowToShareFilesSameWifiPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "share files same wifi phone pc, file transfer local network, phone to laptop same wifi, wifi file sharing no app",
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

function HowToShareFilesSameWifiPage() {
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
          <span className="text-foreground">Same Wi-Fi transfer</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Phone and PC on the same Wi-Fi.{" "}
            <span className="text-muted-foreground">The fastest transfer possible.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            When both devices are on the same Wi-Fi network, QuickBridge
            creates a direct local connection between the two browsers. No
            internet bandwidth involved, no upload step, no server. Files move
            at whatever speed your router allows.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-same-wifi" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · Local network speed · No account
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What you can transfer in one session
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Files in either direction: phone to PC and PC to phone",
              "Photos, videos, documents, archives, executables",
              "Plain text, links, OTP codes, clipboard contents",
              "Multiple files without re-scanning the QR",
              "Files up to 10 GB with auto-save enabled on the PC",
              "Bidirectional: both sides can send and receive in the same session",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Five steps to connect and transfer
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
            How the connection type affects speed
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Scenario</th>
                  <th className="px-5 py-3 font-medium">Connection type</th>
                  <th className="px-5 py-3 font-medium">Typical speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { scenario: "Both on same 5 GHz Wi-Fi", type: "Direct P2P (local)", speed: "50-200 Mbps" },
                  { scenario: "Both on same 2.4 GHz Wi-Fi", type: "Direct P2P (local)", speed: "20-80 Mbps" },
                  { scenario: "Different networks (TURN relay)", type: "Relay via server", speed: "Limited by internet upload" },
                ].map((row) => (
                  <tr key={row.scenario} className="hover:bg-muted/10">
                    <td className="px-5 py-3.5 text-foreground font-medium">{row.scenario}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.type}</td>
                    <td className="px-5 py-3.5 text-primary font-semibold">{row.speed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                alt="QuickBridge QR code screen on a PC on the home Wi-Fi network"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Open QuickBridge on your PC. Scan the QR from your phone to connect at local network speed.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/paired.png"
                alt="QuickBridge showing both phone and PC connected on the same network"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Both sides show the connected state. On the same Wi-Fi, the channel is a direct local link.
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
                Local speed. Zero setup.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Both devices on the same Wi-Fi. Open QuickBridge on your PC,
                scan on your phone, and transfer at local network speed.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-same-wifi-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/share-files-same-wifi" />
        <SiteFooter />
      </main>
    </div>
  );
}
