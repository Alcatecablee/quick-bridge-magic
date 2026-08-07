import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";

const PAGE_TITLE = "About the developer - QuickBridge";
const PAGE_DESCRIPTION =
  "QuickBridge was built by Clive, a developer focused on browser-native tools that work without accounts or installs. Background on the project and its goals.";
const PAGE_URL = "https://quickbridge.app/about";

const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Clive",
  url: PAGE_URL,
  sameAs: [
    "https://x.com/just_clive_sa",
    "https://github.com/Alcatecablee",
    "https://justc.live/",
    "https://www.producthunt.com/@alcatec",
  ],
};

const WEBPAGE_JSONLD = {
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
  author: {
    "@type": "Person",
    name: "Clive",
    url: PAGE_URL,
  },
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "About", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: "https://quickbridge.app/og-image.png" },
      { property: "og:image:alt", content: "QuickBridge - browser-based peer-to-peer file transfer" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:site", content: "@just_clive_sa" },
      { name: "twitter:creator", content: "@just_clive_sa" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBPAGE_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
      />

      <main className="relative mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">About</span>
        </nav>

        <Reveal>
          <header className="mb-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              The developer
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              About QuickBridge
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Built by Clive, a developer working on browser-native tools that do not require accounts, installs, or cloud intermediaries.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="prose prose-invert prose-sm max-w-none space-y-6 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              I built QuickBridge because every existing option for cross-device file transfer either required an account, an app install, a shared Wi-Fi network, or a file upload to a server I did not control. None of those felt right for moving a file from my phone to my laptop in the same room.
            </p>
            <p>
              The browser has had WebRTC since 2012. By 2022, it was mature enough in Chrome, Firefox, and Safari to support reliable large-file transfers over RTCDataChannel with backpressure management and stream-to-disk via the File System Access API. The hard part was not the P2P channel itself but the signaling: getting two browsers that have never met to negotiate a direct connection across NAT, quickly, without the user needing to understand any of that.
            </p>
            <p>
              QuickBridge solves signaling with Supabase Realtime. The two browsers exchange SDP offers and ICE candidates over a shared Realtime channel for two to three seconds, then the signaling server drops out entirely. Everything after that is direct: encrypted, unchunked at the application layer, and never touching a QuickBridge server. Short Authentication Strings (SAS) derived from the DTLS fingerprints let both sides verify the connection is direct and not intercepted before any file data moves.
            </p>
            <p>
              The QR code pairing flow took four or five iterations to get right. Early versions required both devices to be on the same page at the same time, which caused confusion when the QR expired or the guest refreshed. The current model generates a persistent 6-digit PIN that lives for the session and also embeds in the QR code, so a phone can join a session that started five minutes ago without either device reloading.
            </p>
            <p>
              I am based in South Africa. QuickBridge is free and stays free. There are no ads and no plans for a paid tier. The source is on GitHub if you want to see how it works.
            </p>
          </section>
        </Reveal>

        <Reveal delay={0.16}>
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Find me elsewhere
            </h2>
            <ul className="space-y-4 text-[15px]">
              <li>
                <a
                  href="https://x.com/just_clive_sa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  X (Twitter) · @just_clive_sa
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Alcatecablee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  GitHub · Alcatecablee
                </a>
              </li>
              <li>
                <a
                  href="https://justc.live/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Personal site · justc.live
                </a>
              </li>
              <li>
                <a
                  href="https://www.producthunt.com/@alcatec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Product Hunt · @alcatec
                </a>
              </li>
            </ul>
          </section>
        </Reveal>

        <Reveal delay={0.22}>
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Questions about the app
            </h2>
            <p className="text-[15px] text-muted-foreground">
              For bug reports, feature requests, or anything else about QuickBridge, the best route is X or the contact link in the footer. The{" "}
              <Link to="/help" className="text-foreground/80 hover:text-foreground underline underline-offset-2">
                help page
              </Link>{" "}
              covers the most common questions about how the transfer works and what to do when a connection fails.
            </p>
          </section>
        </Reveal>
      </main>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
