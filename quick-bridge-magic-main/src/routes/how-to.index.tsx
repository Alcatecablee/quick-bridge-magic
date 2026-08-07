import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "@/components/quickbridge/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Reveal } from "@/components/quickbridge/Reveal";
import { HOW_TO_ROUTES } from "@/lib/site-routes";

const PAGE_TITLE =
  "How to Send Files Between Devices 2026 | QuickBridge";
const PAGE_DESCRIPTION =
  "2026 guides for every device combination: iPhone to Windows, Android to Mac, phone to PC without USB. No install, no account, browser-only file transfer.";
const PAGE_URL = "https://quickbridge.app/how-to";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-how-to.png";
const PAGE_OG_ALT =
  "QuickBridge how-to guides: step-by-step file transfer for every device pair. No install, no account.";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://quickbridge.app/" },
    { "@type": "ListItem", position: 2, name: "How-to guides", item: PAGE_URL },
  ],
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I send files between devices without an account in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open quickbridge.app on both devices, scan the QR code on one device with the camera on the other, and your files transfer directly browser-to-browser. No account, no app install, and no file size paywall. Works between any combination of Android, iPhone, Windows, Mac, and Linux.",
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
      name: "What is the fastest way to send a file from phone to PC in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is the fastest method in 2026 for phone-to-PC transfers. Open the site on your PC, scan the QR with your phone camera, and the file streams directly browser-to-browser. On the same Wi-Fi, transfers run at your router's full local speed. The whole process from opening a browser to having the file on your PC takes under a minute.",
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
  ,
    {
      "@type": "Question",
      name: "What is QuickBridge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBridge is a browser-based peer-to-peer file transfer tool. Open the site on both devices, scan the QR code or enter the 6-digit PIN, and files stream directly between the two browsers over an encrypted WebRTC channel. No account, no app install, and no server storage.",
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
  hasPart: HOW_TO_ROUTES.map((r) => ({
    "@type": "HowTo",
    name: r.label,
    url: `https://quickbridge.app${r.href}`,
    description: r.teaser,
  })),
};

export const Route = createFileRoute("/how-to/")({
  component: HowToIndexPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: PAGE_OG_IMAGE },
      { property: "og:image:alt", content: PAGE_OG_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

const DEVICE_GROUPS: { heading: string; routes: typeof HOW_TO_ROUTES }[] = [
  {
    heading: "Phone to PC",
    routes: HOW_TO_ROUTES.filter((r) =>
      [
        "/how-to/send-files-iphone-to-windows",
        "/how-to/send-files-android-to-windows",
        "/how-to/send-photos-phone-to-pc",
        "/how-to/send-pdf-phone-to-pc",
        "/how-to/send-large-files-phone-to-pc",
        "/how-to/send-videos-phone-to-pc",
        "/how-to/send-files-phone-to-pc-free",
      ].includes(r.href)
    ),
  },
  {
    heading: "PC to phone",
    routes: HOW_TO_ROUTES.filter((r) =>
      [
        "/how-to/send-files-windows-to-android",
        "/how-to/send-files-windows-to-iphone",
      ].includes(r.href)
    ),
  },
  {
    heading: "Mac transfers",
    routes: HOW_TO_ROUTES.filter((r) =>
      [
        "/how-to/send-files-android-to-mac",
        "/how-to/send-files-iphone-to-mac",
      ].includes(r.href)
    ),
  },
  {
    heading: "Specific scenarios",
    routes: HOW_TO_ROUTES.filter((r) =>
      [
        "/how-to/share-files-same-wifi",
        "/how-to/send-files-without-whatsapp",
        "/how-to/send-files-without-usb",
        "/how-to/share-clipboard-between-devices",
      ].includes(r.href)
    ),
  },
];

function HowToIndexPage() {
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
          <span className="text-foreground">How-to guides</span>
        </nav>

        <Reveal as="header" className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guides
          </p>
          <h1 className="mt-3 font-black text-balance tracking-tight text-foreground text-[46px] sm:text-[64px] md:text-[84px]">
            How to send files{" "}
            <span className="text-muted-foreground">between any two devices in 2026</span>
          </h1>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Updated June 2026
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[18px]">
            Pick your device pair below. Each guide is just the steps, no fluff, and nothing needs installing on either side.
          </p>
          <div className="mt-7">
            <Button asChild className="h-11 px-6">
              <Link to="/">
                Try it now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {DEVICE_GROUPS.map((group) => (
          <Reveal as="section" key={group.heading} className="mt-14">
            <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {group.heading}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.routes.map((route) => (
                <Card
                  key={route.href}
                  className="border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <Link to={route.href as never} className="group block">
                    <h3 className="text-[14.5px] font-semibold text-foreground transition-colors group-hover:text-primary">
                      {route.label}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {route.teaser}
                    </p>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                      Read guide <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </Card>
              ))}
            </div>
          </Reveal>
        ))}

        <Reveal as="section" className="mt-16">
          <Card className="border-border bg-card p-6 text-center">
            <h2 className="text-[18px] font-semibold text-foreground">
              Ready to transfer?
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              Open the site on both devices, scan the QR, and you're in. Most people get their first file across in under a minute.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="h-10 px-5">
                <Link to="/">
                  Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 px-5">
                <Link to="/help">Troubleshooting help</Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
