import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus, X as XIcon } from "@/components/quickbridge/icons";
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

const PAGE_TITLE = "QuickBridge vs AirDrop - File Transfer Beyond Apple";
const PAGE_DESCRIPTION =
  "AirDrop is Apple-only and proximity-only. QuickBridge sends files browser-to-browser between Windows, Android, iPhone, and Mac, anywhere on the web.";
const PAGE_URL = "https://quickbridge.app/compare/quickbridge-vs-airdrop";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-compare-airdrop.png";

/**
 * Inline source list - every competitor claim on this page must trace to one
 * of these URLs. Surfaced in the visible Sources section at the bottom of the
 * page so any reader can audit the comparison.
 *
 * Note: a Tom's Guide article from 2026 claimed Microsoft was bringing
 * "AirDrop for Windows" via Phone Link, but that source could not be
 * independently verified at write time. It is deliberately excluded.
 * If/when Apple or Microsoft publishes a primary source, we will update.
 */
const SOURCES: { id: string; title: string; url: string; fetched: string }[] = [
  {
    id: "apple-airdrop-iphone",
    title: 'Apple Support - "Use AirDrop on your iPhone or iPad"',
    url: "https://support.apple.com/en-us/119857",
    fetched: "2026-04-28",
  },
  {
    id: "apple-airdrop-mac",
    title: 'Apple Support - "Use AirDrop to send items to nearby Apple devices" (macOS Tahoe 26)',
    url: "https://support.apple.com/guide/mac-help/use-airdrop-to-send-items-to-nearby-devices-mh35868/mac",
    fetched: "2026-04-28",
  },
  {
    id: "apple-airdrop-security",
    title: "Apple Platform Security - AirDrop security",
    url: "https://support.apple.com/guide/security/airdrop-security-sec2261183f4/web",
    fetched: "2026-04-28",
  },
  {
    id: "9to5google-quickshare-airdrop",
    title: "9to5Google - Android phones that support AirDrop sharing (April 11, 2026)",
    url: "https://9to5google.com/2026/04/11/android-airdrop-list-of-supported-devices/",
    fetched: "2026-04-28",
  },
  {
    id: "wikipedia-airdrop",
    title: "Wikipedia - AirDrop",
    url: "https://en.wikipedia.org/wiki/AirDrop",
    fetched: "2026-04-28",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is AirDrop and how does it work?",
    a: "AirDrop is Apple's built-in file-sharing feature for iPhone, iPad, Mac, and Vision Pro. Per Apple's Platform Security guide, it uses Bluetooth Low Energy to discover nearby Apple devices and Apple's own peer-to-peer Wi-Fi protocol (AWDL) to transfer the files directly - no internet connection or router needed. The data channel is encrypted with TLS, and identity is anchored to your iCloud account via a 2048-bit RSA key. Apple's macOS support page lists the working range as 30 feet (10 meters).",
  },
  {
    q: "Is there an AirDrop for Windows?",
    a: "Apple has not shipped AirDrop for Windows. Apple's AirDrop documentation only covers iPhone, iPad, Mac, and Vision Pro - the protocol is not available on Windows out of the box. As of November 2025, Google reverse-engineered AirDrop support into Quick Share for Pixel 10, then Pixel 9 in February 2026, and some Samsung Galaxy phones starting in March 2026 (per 9to5Google) - but that bridge is Android-side only and does not extend to Windows. If you need to move a file between an iPhone and a Windows PC today, you need either a third-party tool, a cable, a cloud service like iCloud for Windows, or a browser-based peer-to-peer tool like QuickBridge.",
  },
  {
    q: "Why would I use QuickBridge instead of AirDrop?",
    a: "AirDrop and QuickBridge solve different problems. Use AirDrop when both devices are Apple, in the same room, and you want zero-internet, gigabit-class transfer over Apple's peer-to-peer Wi-Fi. Use QuickBridge when at least one side is Windows or an Android phone outside Google's Quick Share AirDrop bridge (everything other than Pixel 10/9 and some Samsung Galaxy as of April 2026), when the two devices are in different places (across the internet, not in the same room), or when you don't want to require an Apple Account on the receiver.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "QuickBridge vs AirDrop",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  mainEntityOfPage: PAGE_URL,
  image: PAGE_OG_IMAGE,
  publisher: {
    "@type": "Organization",
    name: "QuickBridge",
    logo: {
      "@type": "ImageObject",
      url: "https://quickbridge.app/icon-512.png",
    },
  },
};

export const Route = createFileRoute("/compare/quickbridge-vs-airdrop")({
  component: CompareAirdropPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "airdrop for windows, airdrop alternative, airdrop for android, airdrop vs quickbridge, cross-platform file transfer, send files iphone to windows, browser file transfer",
      },
      { property: "og:type", content: "article" },
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

type Cell = true | false | "neutral";

const COMPARISON_ROWS: { label: string; qb: Cell; ad: Cell; note: string }[] = [
  {
    label: "Works on Windows PCs",
    qb: true,
    ad: false,
    note: "Apple has not shipped AirDrop for Windows. Apple's AirDrop documentation covers iPhone, iPad, Mac, and Vision Pro only. QuickBridge runs in any modern browser, including Edge and Chrome on Windows.",
  },
  {
    label: "Works across the internet (sender and receiver in different places)",
    qb: true,
    ad: false,
    note: "AirDrop is proximity-only. Apple's macOS support page lists the working range as 30 feet (10 meters); discovery uses Bluetooth Low Energy and the transfer uses Apple's local peer-to-peer Wi-Fi (AWDL). QuickBridge works anywhere both browsers can reach the internet.",
  },
  {
    label: "Works between Android and Apple devices",
    qb: true,
    ad: "neutral",
    note: "As of November 2025, Google reverse-engineered AirDrop support into Quick Share for Pixel 10, expanding to Pixel 9 (Feb 2026) and some Samsung Galaxy models (March-April 2026); both parties must set AirDrop to \"Everyone\" mode. Other Android phones cannot interoperate with AirDrop. QuickBridge works across all Android devices, no special model required.",
  },
  {
    label: "Recipient discoverable without an Apple Account",
    qb: true,
    ad: false,
    note: 'Per Apple\'s iPhone support page, AirDrop\'s "Everyone for 10 Minutes" mode reverts to "Receiving Off" if you\'re not signed in to your Apple Account. AirDrop\'s identity model relies on a 2048-bit RSA key tied to iCloud. QuickBridge requires no account.',
  },
  {
    label: "No app to install or set up",
    qb: true,
    ad: true,
    note: "Both. AirDrop is built into iOS, iPadOS, macOS, and visionOS. QuickBridge runs in any modern browser - installable as a PWA but not required.",
  },
  {
    label: "End-to-end encrypted",
    qb: true,
    ad: true,
    note: "Both. Apple's Platform Security guide states AirDrop uses TLS over peer-to-peer Wi-Fi between authenticated devices. QuickBridge uses WebRTC's mandatory DTLS layer (typically AES-256-GCM).",
  },
  {
    label: "Works without an internet connection",
    qb: false,
    ad: true,
    note: "AirDrop's home turf - no router, no internet, no signaling server. QuickBridge needs both browsers online so they can exchange WebRTC connection details and (when needed) traverse NAT via STUN/TURN.",
  },
  {
    label: "Maximum advertised file size",
    qb: true,
    ad: true,
    note: 'Wikipedia notes "There is no limit on the size of files that can be transferred" via AirDrop - effectively bounded only by storage on each device. QuickBridge supports up to 10 GB per file when the receiver enables auto-save (Chromium-based browsers), with a 2 GB default on other browsers to protect tab memory.',
  },
];

function CompareAirdropPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      {/* Inline JSON-LD for SEO. Crawlers parse these regardless of position. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">Compare</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">vs AirDrop</span>
        </nav>

        {/* Hero - matches template: keyword-led h1, verdict-first lead. */}
        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Side-by-side comparison
          </p>
          <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
            QuickBridge vs AirDrop
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            <strong className="font-semibold text-foreground">Short answer:</strong>{" "}
            AirDrop is the gold standard when both devices are Apple and in the
            same room - peer-to-peer Wi-Fi, no internet needed, no file size
            cap. QuickBridge is what you reach for when at least one device is
            Windows or Android, when the two devices are in different cities,
            or when you don&apos;t want to require an Apple Account. Different
            tools for different jobs.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "compare-airdrop" } as never}>
                Try QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link to="/airdrop-alternative">Why an AirDrop alternative</Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · No sign-up · Encrypted end-to-end
          </p>
        </header>

        {/* Comparison table */}
        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Feature-by-feature comparison
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Every AirDrop column entry below is sourced from Apple&apos;s own{" "}
            <a href="https://support.apple.com/en-us/119857" rel="noopener" className="text-primary underline-offset-4 hover:underline">iPhone/iPad support page</a>,{" "}
            <a href="https://support.apple.com/guide/mac-help/use-airdrop-to-send-items-to-nearby-devices-mh35868/mac" rel="noopener" className="text-primary underline-offset-4 hover:underline">macOS support page</a>, or{" "}
            <a href="https://support.apple.com/guide/security/airdrop-security-sec2261183f4/web" rel="noopener" className="text-primary underline-offset-4 hover:underline">Platform Security guide</a>{" "}
            (see Sources at the bottom of this page).
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Capability</th>
                    <th className="px-5 py-3 font-semibold text-foreground">QuickBridge</th>
                    <th className="px-5 py-3 font-medium">AirDrop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-muted/10">
                      <td className="px-5 py-3.5 align-top">
                        <span className="font-medium text-foreground">{row.label}</span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                          {row.note}
                        </span>
                      </td>
                      <CmpCell value={row.qb} highlight />
                      <CmpCell value={row.ad} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Honest verdict - balanced for both directions. */}
        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            The honest verdict
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5 p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose QuickBridge when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "At least one device is a Windows PC. There is no Apple-supported AirDrop for Windows.",
                  "You're sending across the internet, not across a room. AirDrop tops out at about 30 feet of Bluetooth range.",
                  "The other side is an Android phone that isn't a Pixel 10/9 or supported Samsung Galaxy. Quick Share's AirDrop bridge has limited coverage.",
                  "You don't want to require an Apple Account on the receiving end - QuickBridge has no accounts at all.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Choose AirDrop when…
              </h3>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {[
                  "Both devices are Apple (iPhone, iPad, Mac, Vision Pro) and physically near each other.",
                  "You're sending a very large file - AirDrop has no published size cap and is limited only by storage.",
                  "You're somewhere with no internet. AirDrop runs over peer-to-peer Wi-Fi and doesn't need a router or cellular data.",
                  "You want a feature that's already built into the OS, with zero setup beyond toggling it on.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>

        {/* Status disclosure - the AirDrop interop landscape changed
            substantially in late 2025/early 2026. Surface that nuance honestly
            so readers don't take a stale "AirDrop is Apple-only" claim at face
            value. */}
        <Reveal as="section" className="mt-12">
          <Card className="border-border bg-muted/20 p-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status note (April 2026)
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">
              The AirDrop interop landscape has been shifting fast. In November
              2025, Google reverse-engineered AirDrop support into Quick Share
              starting with Pixel 10, then{" "}
              <a href="https://9to5google.com/2026/04/11/android-airdrop-list-of-supported-devices/" rel="noopener" className="text-primary underline-offset-4 hover:underline">
                expanded to Pixel 9 in February 2026 and to some Samsung Galaxy
                phones in March-April 2026
              </a>
              ; both parties must have AirDrop set to &quot;Everyone&quot; mode
              for the bridge to work. Apple itself has not licensed or extended
              AirDrop to Windows, and Apple&apos;s own iPhone, iPad, Mac, and
              Vision Pro are still the only first-party AirDrop targets. iOS
              26.2 and macOS 26.2 also introduced a new{" "}
              <a href="https://support.apple.com/en-us/119857" rel="noopener" className="text-primary underline-offset-4 hover:underline">
                AirDrop code system
              </a>{" "}
              for sending to people not in your contacts. We will update this
              page when Apple, Microsoft, or Google publishes a meaningfully
              different first-party position.
            </p>
          </Card>
        </Reveal>

        {/* FAQ */}
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

        {/* Sources - visible audit trail for every competitor claim above. */}
        <Reveal as="section" className="mt-14" id="sources">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Sources
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {SOURCES.map((src) => (
              <li key={src.id}>
                <a
                  href={src.url}
                  rel="noopener"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {src.title}
                </a>{" "}
                <span className="text-muted-foreground/70">- verified {src.fetched}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* CTA */}
        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Send a file from a phone to a PC across operating systems
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Open QuickBridge in any modern browser on both devices, scan
                the QR or share the 6-digit PIN, and drop your file in. Works
                Windows-to-iPhone, Android-to-Mac, and every direction in
                between.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "compare-airdrop-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/compare/quickbridge-vs-airdrop" />
        <SiteFooter />
      </main>
    </div>
  );
}

function CmpCell({ value, highlight = false }: { value: Cell; highlight?: boolean }) {
  return (
    <td className={"px-5 py-3.5 align-top " + (highlight ? "bg-primary/5" : "")}>
      {value === true ? (
        <span className="inline-flex items-center gap-1 text-success">
          <Check className="h-4 w-4" />
          <span className="sr-only">Yes</span>
        </span>
      ) : value === false ? (
        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">No</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted-foreground/70" title="Different model - not a yes or no">
          <Minus className="h-4 w-4" />
          <span className="sr-only">Different model</span>
        </span>
      )}
    </td>
  );
}
