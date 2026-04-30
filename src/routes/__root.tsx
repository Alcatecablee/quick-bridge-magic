import { useEffect } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { initPwa } from "@/lib/pwa";
import { QbBackground } from "@/components/quickbridge/QbBackground";
import { NotFound, RouteError } from "@/components/quickbridge/NotFound";

import appCss from "../styles.css?url";

const SITE_URL = "https://quickbridge.app";
const SITE_NAME = "QuickBridge";
const DEFAULT_TITLE =
  "QuickBridge - Send Files Between Phone and PC Instantly";
const DEFAULT_DESCRIPTION =
  "Send files, photos, links, and text between phone and PC in seconds. No app, no account, no cable. End-to-end encrypted browser-based transfer.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  sameAs: [],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "format-detection", content: "telephone=no" },
      { name: "color-scheme", content: "dark light" },
      { title: DEFAULT_TITLE },
      { name: "description", content: DEFAULT_DESCRIPTION },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
      { name: "googlebot", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
      { name: "author", content: SITE_NAME },
      { name: "publisher", content: SITE_NAME },
      // Search Console / Bing Webmaster ownership verification
      { name: "google-site-verification", content: "jWM60Mhj2OuG58Ju9UVp4ID8JlKUH2zqG_8aKdkiqDc" },
      { name: "msvalidate.01", content: "A479A9A08D689D0C4EFFC5F200AE1F72" },
      // Open Graph
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:image:secure_url", content: DEFAULT_OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "QuickBridge - Send anything between phone and PC instantly" },
      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESCRIPTION },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:image:alt", content: "QuickBridge - Send anything between phone and PC instantly" },
      // PWA / mobile
      { name: "theme-color", content: "#0a0e1a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: SITE_NAME },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: SITE_NAME },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    initPwa();
  }, []);
  return (
    <>
      {/* Site-wide structured data: Organization + WebSite. Crawlers parse
          JSON-LD anywhere in the document, including <body>. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
      />
      {/*
        Site-wide background: subtle icon grid + top hairline gradient.
        Lives at the root so every route inherits the same canvas.

        IMPORTANT: This is the ONLY page-level background on the site.
        Route components must NOT add their own `bg-background`,
        `bg-grid`, or full-bleed background overlay - doing so will
        cover QbBackground and break the consistent feel. Decorative
        textures inside individual cards (e.g. the CTA banners) are
        fine; full-page overlays are not.
      */}
      <div className="relative min-h-screen overflow-hidden bg-background">
        <QbBackground />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.12), transparent)",
          }}
          aria-hidden
        />
        <Outlet />
      </div>
      <Toaster position="top-center" />
      {import.meta.env.PROD && <Analytics />}
    </>
  );
}
