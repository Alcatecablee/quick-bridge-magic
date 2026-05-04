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
  "How to Share Files Between Phone and PC Without WhatsApp";
const PAGE_DESCRIPTION =
  "Send files, photos, links, and text from your phone to your PC or laptop without WhatsApp, Telegram, or any messaging app. Browser-only, no account needed.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-files-without-whatsapp";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your PC or Mac",
    body: "Go to quickbridge.app in any browser. A QR code and 6-digit PIN appear. No account, no login.",
  },
  {
    n: "02",
    title: "Open QuickBridge on your phone and connect",
    body: "Scan the QR code with your phone camera, or visit quickbridge.app on your phone and enter the PIN. Both devices are now paired.",
  },
  {
    n: "03",
    title: "Verify the connection",
    body: "Both screens show a matching emoji sequence. Confirm they match to verify the direct connection.",
  },
  {
    n: "04",
    title: "Send a file, link, or text",
    body: "Use the file picker on your phone to send a photo, document, or video to your PC. Or type a link, paste a URL, or push clipboard text directly to the other device.",
  },
  {
    n: "05",
    title: "Receive on your PC",
    body: "Files arrive as browser downloads. Text and links appear in the message area instantly. No message thread, no notification clutter.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why do people use WhatsApp just to transfer files to themselves?",
    a: "WhatsApp Web is a clever hack: open WhatsApp on your phone, open web.whatsapp.com on your PC, and you have a channel to send files between the two devices. It works, but it requires a WhatsApp account, routes files through Meta's servers, compresses photos and videos, and caps file transfers at 2 GB. QuickBridge transfers directly between the two browsers, skips compression, and has no messaging app requirement.",
  },
  {
    q: "Does QuickBridge compress photos or videos?",
    a: "No. Files transfer as-is at their original size and quality. WhatsApp compresses photos to around 60-70% of their original size before sending. If you need the original quality on your PC, WhatsApp is not suitable. QuickBridge sends the exact file.",
  },
  {
    q: "Can I send links from my phone to my PC without WhatsApp?",
    a: "Yes. The text input in QuickBridge lets you type or paste any text, including URLs. Type the link on your phone and it appears on your PC instantly. You can also enable clipboard sync so anything you copy on your phone is offered to your PC automatically.",
  },
  {
    q: "What if I want to send from my PC to my phone instead?",
    a: "The session is bidirectional. Drag a file from Windows Explorer into the QuickBridge browser tab and it transfers to your phone. Type a message on your PC and it appears on your phone. Both directions work in the same session without re-pairing.",
  },
  {
    q: "Is my data private, or does it go through a server?",
    a: "File content goes directly from one browser to the other over a WebRTC channel encrypted with DTLS. QuickBridge's servers only exchange the initial connection metadata so the two browsers can find each other. Your files and messages never pass through any server.",
  },
  {
    q: "Does this work between different operating systems?",
    a: "Yes. Android to Windows, iPhone to Mac, iPhone to Windows, Android to Mac: any combination works as long as both devices have a modern browser. There is no OS restriction.",
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

export const Route = createFileRoute("/how-to/send-files-without-whatsapp")({
  component: HowToWithoutWhatsappPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "share files without whatsapp, send files phone to pc no messaging app, transfer files no account, file sharing without telegram",
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

function HowToWithoutWhatsappPage() {
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
          <span className="text-foreground">Without WhatsApp</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Phone to PC transfers{" "}
            <span className="text-muted-foreground">without WhatsApp or any messaging app.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Messaging yourself on WhatsApp or Telegram to move a file from your
            phone to your PC is a workaround, not a solution. It requires an
            account, routes your files through a messaging server, compresses
            photos, and caps transfer sizes. This guide shows a direct method
            that uses nothing but your browser on both sides.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-no-whatsapp" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No account · Original quality
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why WhatsApp is a bad file transfer tool
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Compression",
                catch: "WhatsApp compresses photos before sending. The image you receive on your PC is noticeably smaller and lower quality than what your camera captured. It is built for sharing, not archiving.",
              },
              {
                label: "File size cap",
                catch: "WhatsApp caps file transfers at 2 GB. That works for most documents but rules out long videos, large archives, and anything close to a feature-length recording.",
              },
              {
                label: "Requires an account",
                catch: "WhatsApp requires a phone number to create an account. On a shared work computer, logging into WhatsApp Web also logs you out of your phone session if not done carefully.",
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
            Five steps to transfer without WhatsApp
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
            What you can send
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Photos at full original resolution, no compression",
              "Videos up to 2 GB (or 10 GB with auto-save on the PC)",
              "Documents: PDFs, Word files, spreadsheets",
              "Links and URLs that open in the other device's browser",
              "Plain text, passwords, OTP codes, notes",
              "Clipboard contents synced automatically with the optional clipboard sync toggle",
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
                alt="QuickBridge open on a PC, no account or messaging app required"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Open QuickBridge on your PC. No WhatsApp, no login, no messaging thread.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge showing a completed file transfer, no messaging app used"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                The file arrives on your PC at full quality. No compression, no server in the middle.
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
                Skip the messaging app
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge on your PC and phone. Scan the QR. Send files,
                links, and text directly without compression or an account.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-no-whatsapp-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-files-without-whatsapp" />
        <SiteFooter />
      </main>
    </div>
  );
}
