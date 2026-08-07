import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "@/components/quickbridge/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";
import { COMPARE_ROUTES } from "@/lib/site-routes";

const PAGE_TITLE =
  "File Transfer Tool Comparisons | QuickBridge";
const PAGE_DESCRIPTION =
  "Side-by-side comparisons of QuickBridge against AirDrop, Snapdrop, PairDrop, WeTransfer, LocalSend, and more. Every comparison is sourced and balanced.";
const PAGE_URL = "https://quickbridge.app/compare";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Compare", item: PAGE_URL },
  ],
};

const COLLECTION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  hasPart: COMPARE_ROUTES.map((r) => ({
    "@type": "WebPage",
    name: `QuickBridge ${r.label}`,
    url: `https://quickbridge.app${r.href}`,
    description: r.teaser,
  })),
};

export const Route = createFileRoute("/compare/")({
  component: CompareIndexPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://quickbridge.app/og-image.png" },
      { property: "og:image:alt", content: "QuickBridge vs AirDrop, Snapdrop, WeTransfer, and more. No install, no account, no size limit." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

function CompareIndexPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Compare</span>
        </nav>

        <Reveal as="header" className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparisons
          </p>
          <h1 className="mt-3 font-black text-balance tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            How does QuickBridge{" "}
            <span className="text-muted-foreground">stack up?</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Every comparison below is sourced from official documentation and
            tested first-hand. Where another tool is genuinely the better
            choice, we say so.
          </p>
          <div className="mt-7">
            <Button asChild className="h-11 px-6">
              <Link to="/">
                Try QuickBridge free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            All comparisons
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Eight tools compared to QuickBridge on platform support, network
            requirements, file size limits, privacy, and ease of setup.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {COMPARE_ROUTES.map((route) => (
              <Card
                key={route.href}
                className="border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <Link to={route.href as never} className="group block">
                  <h3 className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
                    QuickBridge {route.label}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {route.teaser}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
                    Read comparison <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <Card className="border-border bg-card p-6 text-center">
            <h2 className="text-[18px] font-semibold text-foreground">
              Not sure which to pick?
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              If one device is Windows or Android and the other is anything
              else, QuickBridge is almost certainly the right tool. If both
              are Apple and physically nearby, AirDrop is better.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="h-10 px-5">
                <Link to="/">
                  Try it now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 px-5">
                <Link to="/airdrop-alternative">Why an AirDrop alternative</Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
