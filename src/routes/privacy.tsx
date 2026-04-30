import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  HardDrive,
  Lock,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";
import { ContactModal } from "@/components/quickbridge/ContactModal";

const PAGE_TITLE = "Privacy at QuickBridge — Your data stays on your devices";
const PAGE_DESCRIPTION =
  "QuickBridge never stores your files, never uploads your data, and never tracks what you send. Everything happens directly between your devices via WebRTC.";
const PAGE_URL = "https://quickbridge.app/privacy";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-home.png";

const PRIVACY_PAGE_JSONLD = {
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

const PRINCIPLES: { Icon: typeof Lock; title: string; body: string }[] = [
  {
    Icon: Server,
    title: "We don't store your files",
    body: "Files travel directly between your devices over an encrypted WebRTC channel. There is no copy on a QuickBridge server because there is no QuickBridge server in the file path.",
  },
  {
    Icon: ShieldCheck,
    title: "We don't upload your data",
    body: "Photos, documents, clipboard text, and messages stay on the two devices you connected. Nothing is staged, mirrored, or backed up on our infrastructure.",
  },
  {
    Icon: Eye,
    title: "We don't track what you send",
    body: "We have no log of what you transferred, no thumbnails, no filenames, no message contents. We literally cannot see them.",
  },
];

const NEVER_LIST = [
  "No file storage on our servers",
  "No cloud uploads or backups",
  "No user accounts or passwords",
  "No selling or sharing of data",
  "No tracking of what you transfer",
  "No third-party advertising trackers",
];

function PrivacyPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRIVACY_PAGE_JSONLD) }}
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
          <span className="text-foreground">Privacy</span>
        </nav>

        {/* Hero - canonical recipe */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Privacy
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            Your data stays{" "}
            <span className="text-muted-foreground">on your devices.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            QuickBridge is designed so that we never have access to your files
            — even if we wanted to. Everything moves directly between the two
            devices you connect.
          </p>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Last updated: April 2026 · Plain English, not legal boilerplate
          </p>
        </header>

        {/* Three principles */}
        <Reveal as="section" className="mt-14 sm:mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Three things QuickBridge will never do
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map(({ Icon, title, body }) => (
              <Card
                key={title}
                className="border-border bg-card p-5"
              >
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* How it works */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How QuickBridge works
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            When you connect two devices using QuickBridge, a secure
            peer-to-peer connection is created using WebRTC — the same
            technology that powers browser video calls. Files, messages, and
            clipboard data are sent directly between your devices over an
            encrypted channel.
          </p>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Our servers are only used briefly to help your devices find each
            other. This is called <em>signaling</em>: an exchange of small
            connection hints, no file content. Once the two devices are
            connected, all transfers are direct, and the signaling channel is
            no longer in the path.
          </p>
        </Reveal>

        {/* Files & transfers */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Files and transfers
          </h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground/90">
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Files are never uploaded to or stored on any QuickBridge server.
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Transfers happen in real time, browser-to-browser, between the
              two connected devices.
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              If you enable "Save incoming files to folder", files are written
              directly to the folder you chose on your device — through your
              browser's File System Access API, which we never see.
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Cancelled transfers are discarded immediately on both devices and
              are not retained anywhere.
            </li>
          </ul>
        </Reveal>

        {/* Clipboard & messages */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Clipboard and messages
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Clipboard sharing is opt-in and only active when you turn it on.
            Text snippets, links, and short messages travel through the same
            direct, encrypted channel as files. Nothing is logged or persisted
            by QuickBridge.
          </p>
        </Reveal>

        {/* Local storage */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What's stored on your device
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            QuickBridge keeps a small amount of data in your browser to make
            the experience smoother. This data never leaves your device and we
            cannot read it.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Device name",
                body: "So you don't have to rename it every session.",
              },
              {
                title: "Recent session history",
                body: "A short list of what you sent or received recently, for convenience.",
              },
              {
                title: "Auto-save folder handle",
                body: "Stored securely by your browser so the same folder can be reused next time.",
              },
              {
                title: "Preferences",
                body: "Things like clipboard sync on/off and PWA install hints.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4"
              >
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[14px] font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted-foreground">
            You can clear all of this at any time by clearing your browser's
            site data for QuickBridge.
          </p>
        </Reveal>

        {/* Security */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Security
          </h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground/90">
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              All connections use encrypted WebRTC data channels (DTLS) — the
              same encryption used for browser video calls.
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              A short verification code (SAS) is shown on both devices, so you
              can confirm you're connected to the right device and not to an
              imposter.
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              No accounts, passwords, or personal data are required to use
              QuickBridge.
            </li>
          </ul>
        </Reveal>

        {/* Analytics */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Analytics
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            We use privacy-respecting page analytics to understand which pages
            people land on, so we can improve the marketing site. We do not
            track files, messages, clipboard contents, or anything you transfer
            inside a session. We do not use advertising cookies and we do not
            build profiles of individual visitors.
          </p>
        </Reveal>

        {/* What we don't do */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What we don't do
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {NEVER_LIST.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-[13.5px] text-foreground/90"
              >
                <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Third-party services */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Third-party services
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            QuickBridge uses a small set of services to function. None of them
            have access to the contents of what you transfer.
          </p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground/90">
            <li className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-[14px] font-medium text-foreground">
                Signaling
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Used briefly to help two devices discover each other. Carries
                only short connection hints, never file or message content.
              </p>
            </li>
            <li className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-[14px] font-medium text-foreground">
                TURN relay (fallback only)
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                If two devices can't reach each other directly because of a
                strict network, traffic falls back to a TURN relay. The relay
                forwards already-encrypted bytes; it cannot read them.
              </p>
            </li>
            <li className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-[14px] font-medium text-foreground">
                Hosting
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                The QuickBridge website itself is served from a standard web
                host. The host serves static pages — it never sees the contents
                of your transfers.
              </p>
            </li>
          </ul>
        </Reveal>

        {/* Changes */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Changes to this policy
          </h2>
          <p className="mt-3 flex max-w-2xl items-start gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
            <RefreshCw className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>
              If we ever update this page, we'll keep the language plain and
              the changes obvious. No hidden edits, no surprises.
            </span>
          </p>
        </Reveal>

        {/* Contact */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Questions?
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            If you have any questions about how QuickBridge handles your data,
            we'd genuinely like to hear them.
          </p>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={() => setContactOpen(true)}
              className="h-11 px-6"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact us
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/help">
                Browse the help center <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 px-4">
              <Link to="/">
                Try QuickBridge
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

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "quickbridge privacy, is quickbridge safe, peer to peer file transfer privacy, webrtc privacy, no upload file transfer, browser file transfer privacy",
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
