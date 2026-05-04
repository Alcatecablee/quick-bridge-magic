import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "@/components/quickbridge/icons";
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

const PAGE_TITLE =
  "How to Send Large Files from Phone to PC Without Uploading";
const PAGE_DESCRIPTION =
  "Transfer videos, archives, and large files from your phone to a PC without uploading to a cloud service. Files stream directly between browsers up to 10 GB.";
const PAGE_URL =
  "https://quickbridge.app/how-to/send-large-files-phone-to-pc";

const PUBLISHED = "2026-05-04";
const MODIFIED = "2026-05-04";

const STEPS = [
  {
    n: "01",
    title: "Open QuickBridge on your PC and enable auto-save",
    body: "Go to quickbridge.app in Chrome or Edge on your PC. Once the QR appears, look for the auto-save toggle in the receiver panel and enable it. Auto-save uses the File System Access API to stream large files directly to disk instead of holding them in RAM. This raises the per-file limit from 2 GB to 10 GB.",
  },
  {
    n: "02",
    title: "Choose a save location",
    body: "When you enable auto-save, your browser prompts you to pick a folder. Select your Downloads folder or wherever you want the files to land. This is a one-time setup per session.",
  },
  {
    n: "03",
    title: "Scan the QR on your phone",
    body: "Use your camera to scan the QR code on the PC screen. The transfer page opens in your mobile browser. On iPhone this is Safari. On Android this is Chrome.",
  },
  {
    n: "04",
    title: "Select your large file on the phone",
    body: "Tap the file picker. Navigate to your video, archive, or large document. Select it and tap Send. The transfer starts immediately and a progress bar appears on both screens.",
  },
  {
    n: "05",
    title: "Watch the progress and wait for completion",
    body: "Both sides show a progress bar with estimated time remaining. For a 1 GB video on a home Wi-Fi network this typically finishes in 1 to 3 minutes. The file writes directly to your chosen folder on the PC as it streams.",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why is direct transfer faster than uploading to a cloud service?",
    a: "Cloud services upload the file to their servers over your internet connection, then you download it again on the other side. That is two full passes over your internet bandwidth. QuickBridge uses your local Wi-Fi network for both devices, which is typically 10-100x faster than your internet upload speed. A 1 GB file that would take 10 minutes to upload to Google Drive and download again can finish in under 2 minutes on a 5 GHz home network.",
  },
  {
    q: "What is the actual file size limit?",
    a: "2 GB with the standard browser download prompt. 10 GB when auto-save is enabled on the receiving PC. Auto-save uses the File System Access API (available in Chrome and Edge) to write directly to disk, bypassing the browser's RAM buffer. For files over 2 GB, enable auto-save before the transfer starts.",
  },
  {
    q: "Does auto-save work in Safari on Mac?",
    a: "Safari does not support the File System Access API as of 2026, so auto-save (and the 10 GB limit) requires Chrome or Edge on the receiving side. Safari on the Mac can receive files normally up to 2 GB. If you need to receive files over 2 GB on a Mac, use Chrome for Mac as the receiver.",
  },
  {
    q: "What happens if the connection drops mid-transfer?",
    a: "QuickBridge has a transfer resume feature. If the connection drops, the receiving side holds the partial file in a 2-minute grace window. If the sender reconnects within that window, the transfer picks up from where it left off rather than starting over. The sender side shows a Resume button for interrupted transfers.",
  },
  {
    q: "Can I send large video files from an iPhone?",
    a: "Yes. The iOS Files app and the Photos picker both appear in the file picker. Videos from your camera roll and files in iCloud Drive are accessible. Note that very large ProRes videos (iPhone 15 Pro and later) can be several gigabytes per minute of footage. Make sure auto-save is enabled on the PC before sending.",
  },
  {
    q: "Does transfer speed depend on my internet connection?",
    a: "Only if both devices are on the same local network. In that case, QuickBridge creates a direct peer-to-peer connection using your router. Your internet speed is not involved and does not limit transfer speed. If the devices are on different networks (phone on cellular, PC on Wi-Fi), traffic routes through a TURN relay and is limited by the slower internet connection.",
  },
];

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  step: STEPS.map((s) => ({
    "@type": "HowToStep",
    name: s.title,
    text: s.body,
  })),
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export const Route = createFileRoute("/how-to/send-large-files-phone-to-pc")({
  component: HowToLargeFilesPhoneToPcPage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "send large files phone to pc, transfer big files without uploading, large file transfer no cloud, phone to laptop large video",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: "https://quickbridge.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: "https://quickbridge.app/og-image.png" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
});

function HowToLargeFilesPhoneToPcPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">How-to</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Large files phone to PC</span>
        </nav>

        <header className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            Step-by-step guide
          </p>
          <h1 className="mt-3 text-balance font-black tracking-tight text-foreground text-[32px] sm:text-[40px] md:text-[60px]">
            Large files, phone to PC.{" "}
            <span className="text-muted-foreground">No upload. Up to 10 GB.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
            Cloud services cap free storage, compress videos, and make you wait
            for the upload to finish before you can download on the other side.
            QuickBridge skips that entirely: files stream directly from your
            phone to your PC browser at local network speed, with no server in
            between and no upload step.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6">
              <Link to="/" search={{ utm_source: "how-to-large-files" } as never}>
                Open QuickBridge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Free forever · Up to 10 GB per file · No upload step
          </p>
        </header>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Why cloud uploads are slow for large files
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Cloud upload speed is limited by your ISP
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Home internet connections typically have an upload speed of
                10-50 Mbps. Uploading a 4 GB video to Google Drive at 20 Mbps
                takes about 27 minutes. Your local Wi-Fi network runs at
                100-600 Mbps, which means the same file transfers from phone
                to PC in 2-5 minutes without leaving your house.
              </p>
            </Card>
            <Card className="border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Cloud services have their own limits
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                WeTransfer caps free transfers at 2 GB. Google Drive's free
                storage is 15 GB shared across all your services. iCloud's free
                tier is 5 GB. These limits are per-account, not per-transfer.
                QuickBridge has no storage limit because it does not store
                anything.
              </p>
            </Card>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-16">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How to transfer large files: five steps
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Step 01 is the most important one for large files. Enable auto-save
            before the transfer begins.
          </p>
          <ol className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-black text-primary">
                  {step.n}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            File size limits by mode
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[12px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium">Limit per file</th>
                  <th className="px-5 py-3 font-medium">Best for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { mode: "Standard browser download", limit: "2 GB", use: "Documents, photos, short videos" },
                  { mode: "Auto-save (Chrome / Edge)", limit: "10 GB", use: "Long videos, archives, RAW photo bursts" },
                ].map((row) => (
                  <tr key={row.mode} className="hover:bg-muted/10">
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.mode}</td>
                    <td className="px-5 py-3.5 text-primary font-semibold">{row.limit}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-14">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What you'll see
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Real screenshots from the app, not mockups.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/send-files-mobile.png"
                alt="QuickBridge file picker on a phone with a large video selected"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                Select the large file from your phone. Videos and archives appear in the same picker.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src="/screenshots/sent.png"
                alt="QuickBridge showing a completed large file transfer on the PC"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-[12.5px] text-muted-foreground">
                With auto-save enabled, the file writes directly to your chosen folder as it streams.
              </figcaption>
            </figure>
          </div>
        </Reveal>

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

        <Reveal as="section" className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Transfer without the upload wait
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Enable auto-save on your PC, scan the QR on your phone, and
                send files up to 10 GB at local network speed.
              </p>
              <Button asChild className="mt-6 h-11 px-6">
                <Link to="/" search={{ utm_source: "how-to-large-files-cta" } as never}>
                  Start a transfer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <RelatedPages currentHref="/how-to/send-large-files-phone-to-pc" />
        <SiteFooter />
      </main>
    </div>
  );
}
