import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";

const PAGE_TITLE = "Contact QuickBridge 2026: Get in Touch";
const PAGE_DESCRIPTION =
  "Reach the QuickBridge team via WhatsApp or our contact form. Questions, bug reports, and feedback welcome.";
const PAGE_URL = "https://quickbridge.app/contact";

const WA_NUMBER = "27650821001";
const WA_MESSAGE = "Hi, I have a question about QuickBridge.";
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

/**
 * To activate the Tally form embed:
 * 1. Sign in at tally.so and create a contact form.
 * 2. Copy the embed URL (Share tab > Embed > iframe src).
 * 3. Replace the value of TALLY_EMBED_SRC below with your form URL.
 * 4. Set TALLY_READY to true.
 *
 * Example: "https://tally.so/embed/wgdXYZ?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
 */
const TALLY_EMBED_SRC =
  "https://tally.so/embed/Bz51eY?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
const TALLY_READY = true;

const WEBPAGE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
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
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Contact", item: PAGE_URL },
  ],
};

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "website" },
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

function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

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
          <span className="text-foreground">Contact</span>
        </nav>

        <Reveal>
          <header className="mb-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              Get in touch
            </p>
            <h1 className="mt-3 text-balance font-black text-[46px] sm:text-[64px] md:text-[84px] tracking-tight text-foreground">
              Contact <span className="text-muted-foreground">QuickBridge</span>
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
              Bug report, feature idea, or just a question? Reach out via WhatsApp or the form below.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="mb-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              WhatsApp
            </h2>
            <p className="text-[15px] text-muted-foreground mb-5">
              The fastest way to reach me. Most South African users prefer this over email.
            </p>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-lg bg-[#25D366] px-5 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
          </section>
        </Reveal>

        <Reveal delay={0.14}>
          <section className="border-t border-border pt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Contact form
            </h2>

            {TALLY_READY ? (
              <TallyForm src={TALLY_EMBED_SRC} />
            ) : (
              <div className="rounded-lg border border-border bg-card/40 px-6 py-8 text-center">
                <p className="text-[14px] text-muted-foreground mb-3">
                  Form coming soon. In the meantime, WhatsApp above is the quickest way to reach us.
                </p>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13.5px] text-primary hover:underline underline-offset-2"
                >
                  Open WhatsApp chat
                </a>
              </div>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.20}>
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Other ways to reach me
            </h2>
            <ul className="space-y-3 text-[15px]">
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
            </ul>
            <p className="mt-6 text-[13.5px] text-muted-foreground">
              For app questions, the{" "}
              <Link to="/help" className="text-foreground/80 hover:text-foreground underline underline-offset-2">
                help page
              </Link>{" "}
              covers the most common transfer and connection issues.
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

/**
 * Tally embed with a skeleton loading state so users see a placeholder
 * instead of blank space while the iframe initialises.
 */
function TallyForm({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative min-h-[420px]">
      {!loaded && (
        <div
          className="absolute inset-0 flex flex-col gap-4 rounded-lg border border-border bg-card/40 p-6"
          aria-hidden="true"
        >
          <div className="h-4 w-2/5 animate-pulse rounded bg-muted/60" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/40" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
          <div className="h-24 w-full animate-pulse rounded-md bg-muted/40" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-primary/20" />
        </div>
      )}
      <iframe
        data-tally-src={src}
        src={src}
        loading="lazy"
        width="100%"
        height="500"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Contact QuickBridge"
        className="rounded-lg border border-border"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
