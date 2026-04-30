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
    inNav: false,
  },
  {
    href: "/compare/quickbridge-vs-filepizza",
    label: "vs FilePizza",
    teaser: "Two pure-WebRTC browser tools: pairing UX and connection model.",
    inNav: false,
  },
  {
    href: "/compare/quickbridge-vs-localsend",
    label: "vs LocalSend",
    teaser: "Installable LAN app vs install-free browser transfer.",
    inNav: false,
  },
];

/**
 * /use/* pages - long-tail use-case landings (roadmap §3.2).
 * Each maps to a specific search intent verified against keyword research.
 */
export const USE_CASE_ROUTES: SiteRoute[] = [
  {
    href: "/use/transfer-photos-from-iphone-to-pc-without-itunes",
    label: "iPhone photos to PC (no iTunes)",
    teaser: "Move photos and videos from iPhone to a Windows PC over Wi-Fi, no cable.",
    inNav: false,
  },
  {
    href: "/use/send-files-from-android-to-mac",
    label: "Android to Mac",
    teaser: "Push files from any Android phone to a Mac without USB or extra apps.",
    inNav: false,
  },
  {
    href: "/use/transfer-files-between-windows-and-mac",
    label: "Windows ↔ Mac",
    teaser: "Move files between Windows and Mac without iCloud, OneDrive, or AirDrop.",
    inNav: false,
  },
  {
    href: "/use/share-files-between-two-laptops-without-internet",
    label: "Laptop ↔ laptop offline",
    teaser: "Move files between two laptops on the same Wi-Fi without going through the cloud.",
    inNav: false,
  },
  {
    href: "/use/transfer-files-from-pc-to-phone-via-qr-code",
    label: "PC to phone via QR",
    teaser: "Scan a QR code on your phone to receive files directly from your PC's browser.",
    inNav: false,
  },
  {
    href: "/use/send-large-files-without-uploading",
    label: "Large files, no upload",
    teaser: "Transfer multi-gigabyte files browser-to-browser without uploading anywhere.",
    inNav: false,
  },
  {
    href: "/use/share-clipboard-between-phone-and-pc",
    label: "Clipboard sync",
    teaser: "Send text, links, and codes between your phone and PC in one click.",
    inNav: false,
  },
];

/** All routes flattened - useful for sitemap or audit scripts. */
export const ALL_MARKETING_ROUTES: SiteRoute[] = [
  ...PRIMARY_ROUTES,
  ...COMPARE_ROUTES,
  ...USE_CASE_ROUTES,
];

/** Convenience: filter only routes that should appear in nav/footer/related. */
export const visible = (routes: SiteRoute[]): SiteRoute[] =>
  routes.filter((r) => r.inNav);
