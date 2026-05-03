import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Inbox,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Wifi,
} from "@/components/quickbridge/icons";
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
import { Reveal } from "@/components/quickbridge/Reveal";
import { ContactModal } from "@/components/quickbridge/ContactModal";
import {
  EncryptionScopeInfographic,
  TransferFlowInfographic,
} from "@/components/quickbridge/HelpInfographics";

const PAGE_TITLE =
  "QuickBridge Help Center: Setup, Transfers & Troubleshooting";
const PAGE_DESCRIPTION =
  "Step-by-step help for QuickBridge: how to connect two devices, send and receive files up to 10 GB, save straight to disk, verify the security code, and fix common transfer issues.";
const PAGE_URL = "https://quickbridge.app/help";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-home.png";

type FaqItem = { q: string; a: string };

const FAQS_CONNECTING: FaqItem[] = [
  {
    q: "My two devices won't connect - what should I check?",
    a: "Make sure both devices have the QuickBridge tab open and active in the foreground. On the computer, the QR code on the home page is the host - it has to be the page that's open, not a screenshot. On the phone, point the camera at the QR (or open the link directly) and accept any browser prompt. If your network blocks direct browser-to-browser traffic, QuickBridge will fall back to an encrypted relay automatically.",
  },
  {
    q: "Do both devices need to be on the same Wi-Fi?",
    a: "No. QuickBridge tries a direct browser-to-browser connection first, but it works across networks too. When a direct path isn't possible (some company or hotel networks block it), traffic falls back to an encrypted relay. The relay forwards already-encrypted bytes - it can't read them.",
  },
  {
    q: "Can I pair with a 6-digit PIN instead of a QR code?",
    a: "Yes. On the host device, the PIN is shown right under the QR code. On the second device, open quickbridge.app/join, type the PIN, and you're connected. Useful when you can't physically scan - for example pairing two laptops, or a phone with a broken camera.",
  },
  {
    q: "Why does the QR code change if I refresh the page?",
    a: "Each session uses a new short-lived ID, so refreshing the host page generates a fresh QR. Once the two devices are paired, the ID is no longer needed and isn't reusable - this keeps old session links from being shared accidentally.",
  },
];

const FAQS_SENDING: FaqItem[] = [
  {
    q: "Is there a file size limit?",
    a: "Up to 2 GB per file by default, and up to 10 GB per file when the receiver enables \"Save received files to a folder\" so the file can stream straight to disk instead of being held in memory. There's no daily quota and no monthly cap - send as many transfers as you want.",
  },
  {
    q: "Can I send a folder, or do I have to send files one at a time?",
    a: "You can drop or select many files at once - QuickBridge sends them one after another with a progress bar for each. Whole-folder selection depends on the browser: most desktop browsers let you drag a folder onto the drop zone, and the file picker on mobile lets you select multiple files in a row.",
  },
  {
    q: "Can I send the same file to more than one device at once?",
    a: "A QuickBridge session is one-to-one by design - one host paired with one receiver. To send the same file to several people, either start a new session for each, or send it once to one receiver and have them forward it. This keeps the security model simple: the emoji code only has to verify two devices.",
  },
  {
    q: "Why is my transfer slower than I expected?",
    a: "Speed is capped by the slower of the two devices and the network between them. A few common causes: the receiver is on a slow mobile connection, your network forced a relay fallback, or another upload is hogging your uplink. The status badge shows whether the connection is direct or relayed - direct is almost always faster.",
  },
];

const FAQS_RECEIVING: FaqItem[] = [
  {
    q: "Where do received files go?",
    a: "By default, finished files appear in the session as download links - clicking one saves the file via your browser's normal downloads folder. If you turn on \"Save received files to a folder\", QuickBridge writes each file straight to a folder you pick on disk, with no separate save step.",
  },
  {
    q: "How do I save received files straight to disk on my computer?",
    a: "On the receiving computer, open the in-session menu and turn on \"Save received files to a folder\". The browser will ask which folder to use - pick one, and QuickBridge will stream future incoming files into it directly. This also unlocks the 10 GB per-file ceiling, because the file never has to fit in memory.",
  },
  {
    q: "Can I save received files to a folder on my phone?",
    a: "On phones, browsers don't yet support direct stream-to-folder, so files arrive as normal downloads (or open in the in-session viewer for photos and short text). You can then move them to any app or folder using your phone's standard share sheet.",
  },
];

const FAQS_SECURITY: FaqItem[] = [
  {
    q: "What is the emoji code I see when connecting?",
    a: "It's a Short Authentication String (SAS) derived from the encryption fingerprints of both devices. Both ends compute it independently from their own keys - if they match, you've connected to the right device with no impersonator in between. Always glance at it on both devices before sending anything sensitive. If the strings don't match, end the session and try again.",
  },
  {
    q: "Is QuickBridge actually encrypted, or is that marketing?",
    a: "Real encryption. Files, messages, and clipboard data move over a WebRTC data channel secured with DTLS - the same encryption used for browser video calls. QuickBridge has no server in the file path and cannot read what you transfer, even when traffic falls back to a relay.",
  },
];

const FAQS_TROUBLESHOOTING: FaqItem[] = [
  {
    q: "The transfer dropped halfway - did I lose progress?",
    a: "No. QuickBridge holds your partial download for up to 2 minutes after the connection drops. The receiver row shows \"Paused - waiting for sender to resume\". When the connection comes back and the sender retries, the file picks up from where it left off instead of starting from zero. If 2 minutes pass with no resume, the partial is removed automatically so nothing is silently left behind.",
  },
  {
    q: "The other device disappeared from my session - what happened?",
    a: "Usually a sleeping phone or a closed tab. Modern phones suspend background tabs aggressively to save battery, which kills the connection. The session shows \"Reconnecting\" and tries to restore the link automatically; if the other device comes back within a minute or so, in-flight files resume on their own.",
  },
  {
    q: "The status badge says \"Reconnecting\" forever - what now?",
    a: "First, make sure the other device's tab is open and in the foreground - that's the most common cause. If both tabs are alive and the badge still won't recover, click \"End bridge\" and start a fresh session. You won't lose anything that already finished transferring; only the active connection is reset.",
  },
  {
    q: "The site refuses my file with an \"over the limit\" message - why?",
    a: "Without \"Save to folder\" enabled, files have to fit into memory, so the per-file cap is 2 GB. To send a larger file (up to 10 GB), have the receiver turn on \"Save received files to a folder\" first - then the same file will stream straight to disk and be accepted.",
  },
];

const TOPIC_GROUPS: { id: string; heading: string; items: FaqItem[] }[] = [
  { id: "connecting", heading: "Connecting two devices", items: FAQS_CONNECTING },
  { id: "sending", heading: "Sending files", items: FAQS_SENDING },
  { id: "receiving", heading: "Receiving files", items: FAQS_RECEIVING },
  { id: "security", heading: "Security & verification", items: FAQS_SECURITY },
  { id: "troubleshooting", heading: "Troubleshooting", items: FAQS_TROUBLESHOOTING },
];

const ALL_FAQS: FaqItem[] = TOPIC_GROUPS.flatMap((g) => g.items);

const TOPIC_CARDS: {
  Icon: typeof KeyRound;
  href: string;
  label: string;
  blurb: string;
}[] = [
  {
    Icon: KeyRound,
    href: "#connecting",
    label: "Connecting",
    blurb: "QR pairing, the 6-digit PIN, and what to try when devices won't see each other.",
  },
  {
    Icon: Send,
    href: "#sending",
    label: "Sending",
    blurb: "File size limits, multi-file drops, and why a transfer might feel slow.",
  },
  {
    Icon: Inbox,
    href: "#receiving",
    label: "Receiving",
    blurb: "Where files land, and how to save straight to a folder of your choice.",
  },
  {
    Icon: ShieldCheck,
    href: "#security",
    label: "Security",
    blurb: "What the emoji code means, what's encrypted, and what isn't.",
  },
  {
    Icon: Wifi,
    href: "#troubleshooting",
    label: "Troubleshooting",
    blurb: "Reconnects, paused transfers, and recovering from a dropped connection.",
  },
  {
    Icon: Lock,
    href: "/privacy",
    label: "Privacy",
    blurb: "What QuickBridge does (and never does) with the things you transfer.",
  },
];

const HELP_PAGE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

const HELP_FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

function HelpPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HELP_PAGE_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HELP_FAQ_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-[12px] text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Help center</span>
        </nav>

        {/* Hero */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Help center
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            Find an answer{" "}
            <span className="text-muted-foreground">in 30 seconds.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Setup, sending, receiving, security, and the few things that can
            go wrong - all in one place. Most QuickBridge questions have a
            one-paragraph answer.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <a href="#topics">
                Browse topics <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6"
              onClick={() => setContactOpen(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact support
            </Button>
          </div>
        </header>

        {/* How a transfer works - the headline infographic */}
        <Reveal as="section" className="mt-14 sm:mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How a QuickBridge transfer works
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Four small steps. The first three set up the encrypted bridge,
            the fourth is everything you'll actually do once it's running.
          </p>
          <div className="mt-6">
            <TransferFlowInfographic />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { src: "/screenshots/qr-code.png", step: "Step 1", label: "Open QuickBridge — QR is ready" },
              { src: "/screenshots/connecting.png", step: "Step 2", label: "Other device scans and connects" },
              { src: "/screenshots/paired.png", step: "Step 3", label: "Paired — verify the emoji code" },
              { src: "/screenshots/sending.png", step: "Step 4", label: "Drop files to start streaming" },
            ] as { src: string; step: string; label: string }[]).map(({ src, step, label }) => (
              <div key={step} className="overflow-hidden rounded-xl border border-border shadow-sm">
                <img src={src} alt={`${step}: ${label}`} className="w-full object-cover object-top" loading="lazy" />
                <div className="border-t border-border bg-muted/20 px-3 py-2">
                  <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-primary">{step}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Topic jump grid */}
        <Reveal as="section" id="topics" className="mt-16 scroll-mt-24">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Browse by topic
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Six short sections. Tap one to jump to its questions, or scroll
            for the full list.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOPIC_CARDS.map(({ Icon, href, label, blurb }) => {
              const isExternal = href.startsWith("/");
              const className =
                "group flex h-full items-start gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card/70";
              const inner = (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {blurb}
                    </p>
                  </div>
                </>
              );
              return isExternal ? (
                <Link key={href} to={href} className={className}>
                  {inner}
                </Link>
              ) : (
                <a key={href} href={href} className={className}>
                  {inner}
                </a>
              );
            })}
          </div>
        </Reveal>

        {/* FAQ groups */}
        {TOPIC_GROUPS.map((group, gi) => (
          <Reveal
            key={group.id}
            as="section"
            id={group.id}
            className="mt-16 scroll-mt-24"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {group.heading}
              </h2>
            </div>
            <Accordion
              type="single"
              collapsible
              className="mt-5 w-full"
              defaultValue={gi === 0 ? `${group.id}-0` : undefined}
            >
              {group.items.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`${group.id}-${i}`}
                  className="border-border"
                >
                  <AccordionTrigger className="text-left text-[14.5px] font-medium text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Drop the encryption-scope infographic right after Security
                so the visual lives next to the question it explains. */}
            {group.id === "security" && (
              <div className="mt-6">
                <EncryptionScopeInfographic />
              </div>
            )}

            {/* Show the connection-lost screenshot in context of troubleshooting. */}
            {group.id === "troubleshooting" && (
              <div className="mt-6 overflow-hidden rounded-xl border border-border shadow-sm">
                <img
                  src="/screenshots/connection-lost.png"
                  alt="QuickBridge connection lost screen — the session shows a reconnecting prompt and holds partial transfers"
                  className="w-full object-cover object-top"
                  loading="lazy"
                />
                <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-[12.5px] text-muted-foreground">
                  What the connection lost screen looks like — QuickBridge holds partial transfers and reconnects automatically.
                </div>
              </div>
            )}
          </Reveal>
        ))}

        {/* Quick checklist - what good looks like once you're set up */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            A healthy QuickBridge session, at a glance
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            If all four of these are true, you're in good shape - everything
            you send is going device-to-device and nothing is being copied
            anywhere else.
          </p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground/90">
            {[
              "The status badge says \"Connected\" (and ideally \"Direct\", not \"Relay\").",
              "Both devices show the same emoji verification code.",
              "Each transfer in the history list ends with a checkmark and a final size.",
              "If something dropped, the row says \"Paused\" - not \"Failed\" - and resumes when the connection comes back.",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Still need help */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Still stuck?
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            We read every message. If something here didn't fix it, drop us
            a note - include what you tried and what the status badge said
            when it failed, and we'll get back to you.
          </p>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => setContactOpen(true)} className="h-11 px-6">
              <Mail className="mr-2 h-4 w-4" />
              Contact support
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/privacy">
                Read the privacy page <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 px-4">
              <Link to="/why-quickbridge">
                <RefreshCw className="mr-2 h-4 w-4" />
                Why QuickBridge
              </Link>
            </Button>
          </div>
        </Reveal>
      </main>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SiteFooter />
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "quickbridge help, quickbridge support, how to use quickbridge, quickbridge troubleshooting, p2p file transfer help, webrtc file transfer issues, send large file browser, quickbridge faq",
      },
      { property: "og:type", content: "website" },
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
