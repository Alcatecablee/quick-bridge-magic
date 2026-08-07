/**
 * Site-wide route registry - single source of truth for the marketing IA.
 *
 * Used by:
 *   - SiteNav (header dropdowns)
 *   - SiteFooter (Resources / Compare / Use cases columns)
 *   - RelatedPages (per-page cross-link strip)
 *   - sitemap.xml generation (later)
 *
 * To launch a new page:
 *   1. Create the route file under src/routes/
 *   2. Flip `inNav: true` here
 *   3. Add a sitemap entry (Phase 3 ongoing)
 *
 * Routes start with `inNav: false` so the nav stays clean while pages are
 * scaffolded but not yet content-complete. Flipping the flag is a one-line
 * change once the page passes seo:lint with real copy.
 */
export type SiteRoute = {
  /** Path on the site, leading slash, no trailing slash. */
  href: string;
  /** Short label for nav and footer columns. */
  label: string;
  /** One-sentence teaser for dropdowns and related strips. */
  teaser: string;
  /** Whether to show in nav/footer/related links yet. */
  inNav: boolean;
};

/** Top-level pages that always show in nav. */
export const PRIMARY_ROUTES: SiteRoute[] = [
  {
    href: "/why-quickbridge",
    label: "Why QuickBridge",
    teaser: "What makes QuickBridge different from cloud and LAN-only tools.",
    inNav: true,
  },
  {
    href: "/airdrop-alternative",
    label: "AirDrop alternative",
    teaser: "AirDrop-style transfer for Windows, Android, and Linux.",
    inNav: true,
  },
];

/**
 * /compare/quickbridge-vs-* pages - Hybrid 8 (decided 2026-04-26).
 * Only flip inNav after the page has real, source-cited content and passes seo:lint.
 */
export const COMPARE_ROUTES: SiteRoute[] = [
  {
    href: "/compare/quickbridge-vs-snapdrop",
    label: "vs Snapdrop",
    teaser: "Browser-based P2P, head-to-head: cross-network reach vs LAN-only.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-wormhole",
    label: "vs Wormhole",
    teaser: "Wormhole's encrypted links vs QuickBridge's direct P2P pairing.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-airdrop",
    label: "vs AirDrop (Windows)",
    teaser: "When AirDrop won't help: phone-to-PC across operating systems.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-wetransfer",
    label: "vs WeTransfer",
    teaser: "Cloud-relay sharing vs no-upload, browser-to-browser transfer.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-pairdrop",
    label: "vs PairDrop",
    teaser: "Two open-source AirDrop-style tools - what's actually different.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-nearby-share",
    label: "vs Nearby Share",
    teaser: "Google's Nearby Share for cross-platform vs a no-install browser tool.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-filepizza",
    label: "vs FilePizza",
    teaser: "Two pure-WebRTC browser tools: pairing UX and connection model.",
    inNav: true,
  },
  {
    href: "/compare/quickbridge-vs-localsend",
    label: "vs LocalSend",
    teaser: "Installable LAN app vs install-free browser transfer.",
    inNav: true,
  },
];

/**
 * /how-to/* pages - device-pair how-to guides targeting long-tail keyword queries.
 * Each page covers a specific device combination or constraint that has verified
 * search demand from keyword research (May 2026).
 */
export const HOW_TO_ROUTES: SiteRoute[] = [
  {
    href: "/how-to/send-files-iphone-to-windows",
    label: "iPhone to Windows",
    teaser: "Transfer photos and files from iPhone to a Windows PC without iTunes or iCloud.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-android-to-windows",
    label: "Android to Windows",
    teaser: "Send files from any Android phone to a Windows PC without a USB cable.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-android-to-mac",
    label: "Android to Mac",
    teaser: "Transfer files from Android to Mac without Android File Transfer.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-iphone-to-mac",
    label: "iPhone to Mac",
    teaser: "Send files from iPhone to Mac when AirDrop won't cooperate.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-windows-to-android",
    label: "Windows to Android",
    teaser: "Push files from a Windows PC to your Android phone wirelessly.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-windows-to-iphone",
    label: "Windows to iPhone",
    teaser: "Send files from a Windows PC to an iPhone without iTunes.",
    inNav: true,
  },
  {
    href: "/how-to/send-photos-phone-to-pc",
    label: "Photos phone to PC",
    teaser: "Transfer photos from any phone to a PC without email or cloud upload.",
    inNav: true,
  },
  {
    href: "/how-to/send-pdf-phone-to-pc",
    label: "PDF phone to laptop",
    teaser: "Send a PDF from your phone to your laptop without email or WhatsApp.",
    inNav: true,
  },
  {
    href: "/how-to/send-large-files-phone-to-pc",
    label: "Large files phone to PC",
    teaser: "Transfer videos and large archives from phone to PC without uploading.",
    inNav: true,
  },
  {
    href: "/how-to/share-files-same-wifi",
    label: "Same Wi-Fi transfer",
    teaser: "Share files between phone and PC at local network speed, no cloud involved.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-without-whatsapp",
    label: "Without WhatsApp",
    teaser: "Transfer files and links from phone to PC without a messaging app.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-phone-to-pc-free",
    label: "Free file transfer",
    teaser: "Send files from phone to PC for free, no subscription, no account.",
    inNav: true,
  },
  {
    href: "/how-to/send-videos-phone-to-pc",
    label: "Videos phone to PC",
    teaser: "Transfer videos from phone to PC at original quality, no compression.",
    inNav: true,
  },
  {
    href: "/how-to/send-files-without-usb",
    label: "Without USB cable",
    teaser: "Transfer files wirelessly between any two devices without a cable or drivers.",
    inNav: true,
  },
  {
    href: "/how-to/share-clipboard-between-devices",
    label: "Clipboard between devices",
    teaser: "Copy on your phone, paste on your PC. No account, no cloud sync.",
    inNav: true,
  },
];

/** About page - author identity, Person schema anchor. inNav: false keeps it out of nav dropdowns; footer links to it directly. */
export const ABOUT_ROUTE: SiteRoute = {
  href: "/about",
  label: "About",
  teaser: "The developer behind QuickBridge and why it was built.",
  inNav: false,
};

/** All routes flattened - useful for sitemap or audit scripts. */
export const ALL_MARKETING_ROUTES: SiteRoute[] = [
  ...PRIMARY_ROUTES,
  ...COMPARE_ROUTES,
  ...HOW_TO_ROUTES,
  ABOUT_ROUTE,
];

/** Convenience: filter only routes that should appear in nav/footer/related. */
export const visible = (routes: SiteRoute[]): SiteRoute[] =>
  routes.filter((r) => r.inNav);
