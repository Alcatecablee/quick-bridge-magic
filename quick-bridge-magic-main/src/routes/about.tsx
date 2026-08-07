import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";

const PAGE_TITLE = "About QuickBridge 2026: The Developer and Project";
const PAGE_DESCRIPTION =
  "2026: QuickBridge built by Clive, a South African developer making privacy-first browser tools that need no accounts or installs. Project background and goals.";
const PAGE_URL = "https://quickbridge.app/about";

const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Clive Makazhu",
  alternateName: "Just Clive",
  url: "https://justc.live/",
  image: "https://justc.live/clive-profile.jpg",
  jobTitle: "Developer & Entrepreneur",
  description: "Self-taught South African developer with 15 years of experience building privacy-first browser tools. Creator of QuickBridge, CalmPC, CalmClip, and SuperK53.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Johannesburg",
    addressRegion: "GP",
    addressCountry: "ZA",
  },
  sameAs: [
    "https://quickbridge.app/about",
    "https://x.com/just_clive_sa",
    "https://github.com/Alcatecablee",
    "https://www.producthunt.com/@alcatec",
    "https://justc.live",
    "https://calmpc.com",
    "https://calmclip.video",
    "https://superk53.co.za",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      name: "CompTIA A+ Certification",
      credentialCategory: "certification",
      recognizedBy: {
        "@type": "Organization",
        name: "CompTIA",
        url: "https://www.comptia.org/",
      },
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "CompTIA Network+ Certification",
      credentialCategory: "certification",
      recognizedBy: {
        "@type": "Organization",
        name: "CompTIA",
        url: "https://www.comptia.org/",
      },
    },
  ],
  knowsAbout: [
    "Web Application Development",
    "WebRTC",
    "FFmpeg WebAssembly",
    "Privacy-First Software",
    "TypeScript",
    "React",
    "Node.js",
    "CompTIA A+",
    "CompTIA Network+",
    "IT Support",
  ],
};

const WEBPAGE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  inLanguage: "en",
  dateModified: "2026-06-15",
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
    name: "Clive Makazhu",
    url: "https://justc.live/",
    sameAs: ["https://quickbridge.app/about", "https://x.com/just_clive_sa"],
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
            <h1 className="mt-3 text-balance font-black text-[46px] sm:text-[64px] md:text-[84px] tracking-tight text-foreground">
              About QuickBridge 2026
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              I'm Clive Makazhu, a self-taught developer based in Johannesburg, South Africa. CompTIA A+ and Network+ certified, 15 years in IT and software, and still genuinely annoyed by tools that make simple things complicated.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="prose prose-invert prose-sm max-w-none space-y-6 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              I built QuickBridge because every option I tried for moving files between my phone and laptop felt like overkill. You'd need an account, or an app, or both devices on the same Wi-Fi, or you'd end up uploading to some server you don't control. None of that should be necessary for something that simple.
            </p>
            <p>
              The technology that makes it work has actually been in browsers since 2012. For years it was finicky enough that nobody really shipped anything solid with it. By the time Chrome, Firefox and Safari had all properly matured, you could reliably move big files directly between two browser tabs without either of them running out of memory. The tricky part was never the actual file transfer, anyway. It was getting two browsers that have never met before to find each other across the internet, fast, without the person using it needing to know what any of that means.
            </p>
            <p>
              Well, QuickBridge uses Supabase to handle that introduction. The two browsers swap a few small handshake messages for a couple of seconds, then Supabase gets out of the way entirely. From there everything is direct, browser to browser, nothing touching a QuickBridge server. There is also a short emoji code shown on both screens before anything transfers. It comes from the encryption fingerprints, so if both sides match, you know the connection is genuinely direct and nothing is sitting in the middle.
            </p>
            <p>
              The QR pairing took four or five tries to get right, honestly. Early versions needed both devices on the page at exactly the same time, which got confusing whenever the QR expired or someone refreshed. Now it generates a persistent 6-digit PIN that stays alive for the whole session and is embedded in the QR code, so your phone can join a session that started five minutes ago without anything needing to reload.
            </p>
            <p>
              I'm based in South Africa. QuickBridge is free, and there's no paid tier coming. Files travel directly between browsers, so there's no storage cost on our end and nothing to charge for.
            </p>
            <p>
              QuickBridge is one of a few tools I build and maintain. CalmPC checks your PC's health in the browser and walks you through fixes in plain English. CalmClip is a video editor that runs entirely in the browser, no upload, using FFmpeg compiled to WebAssembly. SuperK53 is a K53 learner licence practice platform for South Africa. Same principle across all of them: your stuff stays on your device.
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
            </ul>
          </section>
        </Reveal>

        <Reveal delay={0.22}>
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Questions about the app
            </h2>
            <p className="text-[15px] text-muted-foreground">
              For bug reports, feature requests, or anything else, the best way to reach me is X or the contact link in the footer. The{" "}
              <Link to="/help" className="text-foreground/80 hover:text-foreground underline underline-offset-2">
                help page
              </Link>{" "}
              covers the most common questions about how transfers work and what to do when a connection doesn't want to cooperate.
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
