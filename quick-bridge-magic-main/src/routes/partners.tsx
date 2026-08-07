import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";

const PAGE_TITLE = "QuickBridge Partners 2026: Recommended Tools";
const PAGE_DESCRIPTION =
  "Free tools and services that QuickBridge recommends in 2026. Useful resources for developers and teams building browser-native apps on the open web.";
const PAGE_URL = "https://quickbridge.app/partners";

const WEBPAGE_JSONLD = JSON.stringify({
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
    logo: { "@type": "ImageObject", url: "https://quickbridge.app/icon-512.png" },
  },
});

const BREADCRUMB_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Partners", item: PAGE_URL },
  ],
});

export const Route = createFileRoute("/partners")({
  component: PartnersPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: "https://quickbridge.app/og-image.png" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      { type: "application/ld+json", children: WEBPAGE_JSONLD },
      { type: "application/ld+json", children: BREADCRUMB_JSONLD },
    ],
  }),
});

function PartnersPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <main className="relative mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Partners</span>
        </nav>

        <Reveal>
          <header className="mb-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              Recommended
            </p>
            <h1 className="mt-3 text-balance font-black text-[46px] sm:text-[64px] md:text-[84px] tracking-tight text-foreground">
              Partners{" "}
              <span className="text-muted-foreground">2026</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              A few tools worth knowing about. Nothing here is paid placement.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-card/40 p-6">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Authority &amp; SEO
              </h2>
              <ul className="space-y-5">
                <li>
                  <a
                    href="https://authoriflow.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-medium hover:text-primary transition-colors"
                  >
                    Authoriflow
                  </a>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    Build domain authority and grow your site's search presence.
                  </p>
                </li>
              </ul>
            </div>
          </section>
        </Reveal>
      </main>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
