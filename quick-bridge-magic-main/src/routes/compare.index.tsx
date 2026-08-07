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
  "Best File Transfer Tools 2026: QuickBridge vs Alternatives";
const PAGE_DESCRIPTION =
  "2026 side-by-side comparisons: QuickBridge vs AirDrop, Snapdrop, PairDrop, WeTransfer, LocalSend, and more. Every comparison is sourced and up to date.";
const PAGE_URL = "https://quickbridge.app/compare";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "Compare", item: PAGE_URL },
  ],
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best free file transfer tool in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is the best free file transfer tool in 2026 for cross-device transfers. It works browser-to-browser with no account, no install, and no file size paywall. Files travel directly between the two browsers over WebRTC, so nothing is uploaded to a server. For same-room Apple-to-Apple transfers, AirDrop is also excellent.",
      },
    },
    {
      "@type": "Question",
      name: "Is QuickBridge free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. QuickBridge has no paid tier, no subscription, and no advertising. Files travel directly between two browsers over an encrypted WebRTC channel, so there is no storage cost to cover and no reason to charge.",
      },
    },
    {
      "@type": "Question",
      name: "Which file transfer tools work without an account in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge, Snapdrop, PairDrop, FilePizza, and Wormhole all work without an account. QuickBridge and FilePizza use WebRTC for browser-to-browser transfers. Snapdrop and PairDrop require both devices on the same local network. Wormhole uploads files to encrypted cloud storage for 24 hours. QuickBridge is the only option that works across different networks, requires no install, and keeps files off any server entirely.",
      },
    },
,
    {
      "@type": "Question",
      name: "Who is QuickBridge best for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is best for anyone who needs to move files between two devices in real time without an account or install. Both devices need to have a browser open at the same time. Choose a cloud service when the recipient will not be online right away, or use AirDrop when both devices are Apple and in the same room.",
      },
    }
    ],
};

const COLLECTION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  dateModified: "2026-06-15",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
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
          <h1 className="mt-3 font-black text-balance tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            How does QuickBridge{" "}
            <span className="text-muted-foreground">stack up in 2026?</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            All sourced from official docs and checked ourselves. And yeah, where the other tool is honestly the better pick, we say that too.
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
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            All comparisons
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Eight tools. All compared on the stuff that actually matters when you're trying to move a file between two devices.
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
              If one side is Windows or Android and the other is pretty much anything, QuickBridge will probably work. If both are Apple and in the same room, honestly just use AirDrop. It's better for that.
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
