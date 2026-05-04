// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable the Cloudflare Workers build plugin so the project produces a
  // standard Vite/TanStack Start build that can be deployed to Vercel.
  cloudflare: false,
  tanstackStart: {
    client: {
      entry: "./entry-client.tsx",
    },
    // SPA mode disabled - every route is now per-page prerendered. Dynamic
    // routes (/session/$id, /s/$id) are not prerendered; Vercel rewrites them
    // to "/" via vercel.json so the prerendered homepage HTML is served, then
    // the React router takes over on the client and renders Session. The
    // destination is "/" rather than "/index.html" because cleanUrls: true
    // 308-redirects any .html URL to its clean form, which collides with
    // internal rewrite resolution and produces a hard 404 at the edge.
    // The brief flash of "home" content before the router swaps to Session is
    // acceptable because those routes are reached via internal navigation
    // 99% of the time (QR scan opens the session page in a fresh tab).
    // Per-route prerendering for marketing pages so each one ships its own
    // static HTML with route-specific <title>, meta, OG tags, and JSON-LD in
    // the initial document - readable by every crawler (not just Googlebot).
    // Dynamic routes are intentionally omitted; they fall back to the SPA shell.
    pages: [
      {
        path: "/",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 1.0, changefreq: "weekly" },
      },
      {
        path: "/why-quickbridge",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.9, changefreq: "monthly" },
      },
      {
        path: "/airdrop-alternative",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.9, changefreq: "monthly" },
      },
      {
        path: "/join",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.5, changefreq: "monthly" },
      },
      {
        path: "/compare/quickbridge-vs-snapdrop",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.8, changefreq: "monthly" },
      },
      {
        path: "/compare/quickbridge-vs-wormhole",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.8, changefreq: "monthly" },
      },
      {
        path: "/compare/quickbridge-vs-airdrop",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.8, changefreq: "monthly" },
      },
      {
        path: "/compare/quickbridge-vs-wetransfer",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.8, changefreq: "monthly" },
      },
      {
        path: "/compare/quickbridge-vs-pairdrop",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.8, changefreq: "monthly" },
      },
      {
        path: "/privacy",
        prerender: { enabled: true, crawlLinks: false },
        sitemap: { priority: 0.4, changefreq: "yearly" },
      },
    ],
  },
  vite: {
    server: {
      host: true,
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/__mockup": {
          target: "http://localhost:23636",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
});
