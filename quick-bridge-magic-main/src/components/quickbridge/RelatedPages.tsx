import { Link } from "@tanstack/react-router";
import { ArrowRight } from "./icons";
import { Card } from "@/components/ui/card";
import {
  PRIMARY_ROUTES,
  COMPARE_ROUTES,
  HOW_TO_ROUTES,
  type SiteRoute,
} from "@/lib/site-routes";

const ALL_ROUTES: SiteRoute[] = [
  ...PRIMARY_ROUTES,
  ...COMPARE_ROUTES,
  ...HOW_TO_ROUTES,
];

const find = (href: string): SiteRoute | undefined =>
  ALL_ROUTES.find((r) => r.href === href);

/**
 * Curated related pages for every content page on the site.
 * Order matters: most relevant link goes first.
 */
const RELATED: Record<string, string[]> = {
  "/how-to/send-files-android-to-windows": [
    "/how-to/send-files-android-to-mac",
    "/how-to/send-files-windows-to-android",
    "/how-to/send-photos-phone-to-pc",
    "/compare/quickbridge-vs-nearby-share",
  ],
  "/how-to/send-files-iphone-to-windows": [
    "/how-to/send-files-iphone-to-mac",
    "/how-to/send-files-windows-to-iphone",
    "/how-to/send-photos-phone-to-pc",
    "/compare/quickbridge-vs-airdrop",
  ],
  "/how-to/send-files-android-to-mac": [
    "/how-to/send-files-android-to-windows",
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-files-without-usb",
    "/compare/quickbridge-vs-airdrop",
  ],
  "/how-to/send-files-iphone-to-mac": [
    "/compare/quickbridge-vs-airdrop",
    "/how-to/send-files-iphone-to-windows",
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-files-without-usb",
  ],
  "/how-to/send-photos-phone-to-pc": [
    "/how-to/send-videos-phone-to-pc",
    "/how-to/send-large-files-phone-to-pc",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
  ],
  "/how-to/send-large-files-phone-to-pc": [
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-videos-phone-to-pc",
    "/how-to/send-files-without-usb",
    "/compare/quickbridge-vs-wetransfer",
  ],
  "/how-to/send-files-phone-to-pc-free": [
    "/how-to/send-files-without-usb",
    "/how-to/send-photos-phone-to-pc",
    "/compare/quickbridge-vs-wetransfer",
    "/why-quickbridge",
  ],
  "/how-to/send-files-without-usb": [
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
    "/how-to/send-large-files-phone-to-pc",
    "/how-to/share-files-same-wifi",
  ],
  "/how-to/send-videos-phone-to-pc": [
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-large-files-phone-to-pc",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
  ],
  "/how-to/send-pdf-phone-to-pc": [
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
    "/how-to/send-files-without-whatsapp",
  ],
  "/how-to/send-files-windows-to-android": [
    "/how-to/send-files-android-to-windows",
    "/how-to/share-files-same-wifi",
    "/compare/quickbridge-vs-nearby-share",
    "/how-to/send-files-without-usb",
  ],
  "/how-to/send-files-windows-to-iphone": [
    "/how-to/send-files-iphone-to-windows",
    "/how-to/send-files-iphone-to-mac",
    "/compare/quickbridge-vs-airdrop",
    "/how-to/send-files-without-usb",
  ],
  "/how-to/send-files-without-whatsapp": [
    "/how-to/send-photos-phone-to-pc",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
    "/compare/quickbridge-vs-wetransfer",
  ],
  "/how-to/share-files-same-wifi": [
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
    "/compare/quickbridge-vs-snapdrop",
    "/compare/quickbridge-vs-pairdrop",
  ],
  "/how-to/share-clipboard-between-devices": [
    "/how-to/send-files-without-whatsapp",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
    "/how-to/share-files-same-wifi",
  ],
  "/compare/quickbridge-vs-airdrop": [
    "/airdrop-alternative",
    "/how-to/send-files-iphone-to-mac",
    "/how-to/send-files-iphone-to-windows",
    "/how-to/send-files-android-to-windows",
  ],
  "/compare/quickbridge-vs-pairdrop": [
    "/compare/quickbridge-vs-snapdrop",
    "/how-to/share-files-same-wifi",
    "/how-to/send-files-without-usb",
    "/compare/quickbridge-vs-localsend",
  ],
  "/compare/quickbridge-vs-snapdrop": [
    "/compare/quickbridge-vs-pairdrop",
    "/how-to/share-files-same-wifi",
    "/compare/quickbridge-vs-localsend",
    "/how-to/send-files-android-to-windows",
  ],
  "/compare/quickbridge-vs-filepizza": [
    "/compare/quickbridge-vs-wormhole",
    "/compare/quickbridge-vs-snapdrop",
    "/how-to/send-files-without-usb",
    "/how-to/send-large-files-phone-to-pc",
  ],
  "/compare/quickbridge-vs-localsend": [
    "/compare/quickbridge-vs-snapdrop",
    "/compare/quickbridge-vs-pairdrop",
    "/how-to/send-files-without-usb",
    "/how-to/share-files-same-wifi",
  ],
  "/compare/quickbridge-vs-nearby-share": [
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-windows-to-android",
    "/compare/quickbridge-vs-snapdrop",
    "/how-to/send-files-without-usb",
  ],
  "/compare/quickbridge-vs-wetransfer": [
    "/compare/quickbridge-vs-wormhole",
    "/how-to/send-large-files-phone-to-pc",
    "/how-to/send-files-phone-to-pc-free",
    "/how-to/send-files-without-whatsapp",
  ],
  "/compare/quickbridge-vs-wormhole": [
    "/compare/quickbridge-vs-wetransfer",
    "/how-to/send-large-files-phone-to-pc",
    "/how-to/send-files-without-usb",
    "/compare/quickbridge-vs-filepizza",
  ],
  "/airdrop-alternative": [
    "/compare/quickbridge-vs-airdrop",
    "/how-to/send-files-iphone-to-mac",
    "/how-to/send-files-android-to-windows",
    "/how-to/send-files-iphone-to-windows",
  ],
  "/why-quickbridge": [
    "/how-to/send-files-phone-to-pc-free",
    "/how-to/send-files-without-usb",
    "/compare/quickbridge-vs-wetransfer",
    "/compare/quickbridge-vs-snapdrop",
  ],
};

interface RelatedPagesProps {
  currentHref: string;
  heading?: string;
}

export function RelatedPages({
  currentHref,
  heading = "Related guides",
}: RelatedPagesProps) {
  const hrefs = RELATED[currentHref] ?? [];
  const items = hrefs.map(find).filter((r): r is SiteRoute => r !== undefined);

  const hubHref = currentHref.startsWith("/how-to/")
    ? "/how-to"
    : currentHref.startsWith("/compare/")
    ? "/compare"
    : null;
  const hubLabel = hubHref === "/how-to"
    ? "All how-to guides"
    : hubHref === "/compare"
    ? "All comparisons"
    : null;

  if (items.length === 0 && !hubHref) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-16 border-t border-border pt-10"
    >
      {hubHref && hubLabel && (
        <div className="mb-6">
          <Link
            to={hubHref as never}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
          >
            <ArrowRight className="h-3 w-3 rotate-180" />
            {hubLabel}
          </Link>
        </div>
      )}
      {items.length > 0 && (
      <h2
        id="related-heading"
        className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {heading}
      </h2>
      )}
      {items.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <Card
              key={r.href}
              className="border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <Link to={r.href as never} className="group block">
                <h3 className="text-[14.5px] font-semibold text-foreground transition-colors group-hover:text-primary">
                  {r.label}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {r.teaser}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
