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
  "How to Share Clipboard Between Phone and PC";
const PAGE_DESCRIPTION =
  "Open this on your phone, open the same site on your PC, scan the QR. Copy on your phone - it appears on your PC. No account, no cloud sync. Free.";
const PAGE_URL =
  "https://quickbridge.app/how-to/share-clipboard-between-devices";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-howto-clipboard.png";
const PAGE_OG_ALT =
  "How to share clipboard between phone and PC. Copy on phone, paste on PC. QuickBridge.";

const PUBLISHED = "2026-05-16";
const MODIFIED = "2026-05-16";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your computer",
    body: "Go to quickbridge.app in any browser on your PC or Mac. A QR code and 6-digit PIN appear on the screen.",
  },
  {
    n: "02",
    title: "Scan the QR with your phone",
    body: "Hold your phone's camera over the QR code on the screen. The QuickBridge transfer page opens in your mobile browser. Alternatively, open quickbridge.app on your phone and enter the PIN.",
  },
  {
    n: "03",
    title: "Confirm the emoji codes match",
    body: "Both devices display the same emoji sequence. Confirm they match to verify the direct encrypted connection. This takes about two seconds.",
  },
  {
    n: "04",
    title: "Send text from your phone",
    body: "Tap the text field in the QuickBridge tab on your phone and type or paste what you want to send: a link, a 2FA code, a password, an address. Tap Send. It appears on your PC immediately.",
  },
  {
    n: "05",
    title: "Enable auto-clipboard for continuous sync (optional)",
    body: "Toggle the auto-clipboard switch in the session. QuickBridge checks your phone clipboard every 1.5 seconds while the tab is in the foreground. Anything you copy shows up on the PC side with a one-tap confirmation before it sends.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How is this different from iCloud Handoff or Microsoft Phone Link?",
    a: "iCloud Handoff only works between Apple devices. Microsoft Phone Link requires an Android phone paired to a Windows PC and a Microsoft account. QuickBridge works between any combination: iPhone to Windows, Android to Mac, any browser to any browser. No account and no pairing with the operating system required.",
  },
  {
    q: "Does the auto-clipboard send everything I copy automatically?",
    a: "No. Auto-clipboard detects when your clipboard changes and shows a one-tap 'Send to PC' prompt. It never sends anything without a deliberate tap. Passwords, credit card numbers, and anything else you copy stays private unless you actively choose to send it.",
  },
  {
    q: "Can I also send text from my PC to my phone?",
    a: "Yes. The session is bidirectional. You can type or paste text in the QuickBridge tab on your PC and send it to your phone, or drag a file in the other direction. Both sides can send and receive in the same session.",
  },
  {
    q: "What kinds of content can I send?",
    a: "Plain text, URLs, 2FA codes, addresses, notes, anything that fits in a text field. You can also send files (up to 2 GB) and images in the same session. The text field and the file drop zone are both always available.",
  },
  {
    q: "Is the text I send stored anywhere?",
    a: "No. Text travels directly from your phone browser to your computer browser over the WebRTC data channel. Nothing passes through QuickBridge's servers except the initial signaling handshake that helps the two browsers find each other. The text itself never touches a server.",
  },
  {
    q: "Will it keep working if I switch apps on my phone?",
    a: "Auto-clipboard requires the QuickBridge tab to be active and in the foreground on your phone, because the Clipboard API requires user focus. If you switch apps, monitoring pauses and resumes when you return to the tab. Manual text sending works any time the tab is open.",
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
    { "@type": "ListItem", position: 3, name: "Clipboard between devices", item: PAGE_URL },
  ],
};

export const Route = createFileRoute(
  "/how-to/share-clipboard-between-devices"
)({
  component: HowToClipboardPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "share clipboard between phone and pc, copy paste between devices, sync clipboard phone computer, send text from phone to pc, clipboard sync cross platform",
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

function HowToClipboardPage() {
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
          <span className="text-foreground">Clipboard between devices</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Copy on your phone.{" "}
            <span className="text-muted-foreground">Paste on your PC.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            A 2FA code on your phone, a long URL, an address you just got in a
            message: typing these out on your computer is a genuine pain. This
            guide shows you how to get text from your phone clipboard to your PC
            in one tap, no account, no cloud sync, no typing.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-clipboard" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No sign-up · Works across iOS, Android, Windows, Mac
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why existing clipboard sync options fall short
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "iCloud Handoff",
                catch: "Apple devices only. An iPhone clipboard syncs to a Mac, but not to a Windows PC. Zero cross-platform support.",
              },
              {
                label: "Microsoft Phone Link",
                catch: "Requires Android, a Microsoft account, and the Phone Link app installed on Windows. No support for iPhone or Mac.",
              },
              {
                label: "KDE Connect / Pushbullet",
                catch: "KDE Connect requires installation on both devices. Pushbullet requires an account and its free tier is throttled. Both send clipboard through a cloud server.",
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
            Five steps to share your clipboard
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
            What you can send in a session
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Plain text: notes, addresses, passwords you need to type on PC",
              "URLs: tap a link on your phone, paste it in your PC browser",
              "2FA codes: copy the code from your authenticator, send it over",
              "Files and photos alongside text in the same session",
              "Messages and paragraphs up to any length",
              "Bidirectional: PC to phone works the same way",
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
                src="/screenshots/paired.png"
                alt="QuickBridge session active with text input ready on both devices"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Once paired, the text field is ready. Type, paste, or use auto-clipboard.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/live-full.png"
                alt="QuickBridge live session showing a text message sent from phone to PC"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Text sent from your phone appears instantly in the session history on your PC.
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
                Your phone clipboard on your PC in one tap
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Scan the QR on your PC with your phone, paste the text, done.
                Works between any combination of iOS, Android, Windows, and Mac.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-clipboard-cta" } as never}>
                  Start a session <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/share-clipboard-between-devices" />
        <SiteFooter />
      </main>
    </div>
  );
}
