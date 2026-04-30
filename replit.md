# QuickBridge

Production-quality peer-to-peer transfer web app for files, clipboard, and messages.
QR-code pairing + WebRTC. No accounts, no installs, nothing stored on a server.

## Stack

- React 19 + TanStack Router/Start (SPA mode for production)
- Vite 7 (port 5000, `allowedHosts: true`)
- Tailwind v4 + shadcn/ui
- Bun runtime (`bun run dev --port 5000`)
- Supabase Realtime (signaling only - no data stored)
- WebRTC data channel (16 KB chunks, 8 MB backpressure)
- Deploys to Vercel as a static SPA - `vercel.json` + `cloudflare: false`
  in `vite.config.ts`. Build outputs `quickbridge/dist/client/`; prerendered
  static pages are served directly, dynamic routes (`/s/$id`, `/session/$id`)
  rewrite to `/index.html` as the SPA shell. Set Vercel Root Directory to
  `quickbridge`. See README "Deploying to Vercel".

## Project layout

```
quickbridge/
  src/
    routes/
      __root.tsx
      index.tsx           # Host landing page
      s.$id.tsx           # Guest session page
    components/
      quickbridge/
        Session.tsx       # Main session UI (drop, send, history)
        StatusBadge.tsx   # Connection status + quality (Direct/Relay)
        QrDisplay.tsx     # QR with pulse glow
        QrScanner.tsx     # In-browser camera QR scanner
      ui/                 # shadcn components
    hooks/
      use-webrtc.ts       # WebRTC + Supabase signaling + reconnect + quality
    lib/
      session.ts          # session id generator + formatBytes
      device.ts           # phone/tablet/computer detection
      sound.ts            # WebAudio tones (connect/message/receive)
      storage.ts          # Typed localStorage helpers
      history.ts          # Per-session history hook
      utils.ts            # cn()
    integrations/
      supabase/client.ts  # Supabase client (signaling channels)
```

## Key design decisions

- **Signaling**: Supabase realtime channels keyed `qb:${sessionId}`.
  Presence keys are `host` / `guest`, carrying `{ device, name }`.
- **WebRTC**: STUN + TURN fallback (Open Relay free; override via env vars
  `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`).
- **File protocol**: JSON `file-start` / `file-end` / `file-cancel` + binary
  frames `[16-byte UUID header][payload]`. 16 KB chunks, 8 MB backpressure
  threshold via `bufferedamountlow`.
- **Reconnect**: Full PC teardown + renegotiation. Exponential backoff
  (600 ms → 8 s, max 6 attempts). Active outgoing transfers are flagged
  `retryable` so the user can resume after recovery.
- **Quality**: Polled every 4 s via `pc.getStats()` - Direct vs Relay shown
  next to the status badge.
- **Device naming**: Custom name persisted in `localStorage` (`qb:deviceName`),
  broadcast via Supabase presence; falls back to detected kind.
- **Auto-clipboard**: Opt-in toggle (per-session) that polls `navigator.clipboard`
  every 1.5 s while the tab is visible + focused, sending diffs.
- **Persistent host session**: Host session id is stored in
  `localStorage` (`qb:hostSessionId`) so a reload keeps the same QR.
  "Reset" button mints a new id.
- **History**: Per-session, last 30 items (`qb:history:<id>`). Files can be
  quick-resent while the source `File` is still in memory; texts/clipboards
  always re-send.

## Workflow

- `Start application` → `cd quickbridge && npx vite dev --port 5000 --host 0.0.0.0`

## Environment variables (optional)

| Name                    | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `VITE_TURN_URLS`        | Comma-separated TURN URLs (overrides default) |
| `VITE_TURN_USERNAME`    | TURN username                                 |
| `VITE_TURN_CREDENTIAL`  | TURN credential                               |
| `VITE_DEV_DOMAIN`       | Replit proxy domain for correct pair link URL |
| `RESEND_API_KEY`        | Resend API key for contact form email delivery (resend.com, free tier) |
| `CF_TURN_TOKEN_ID`      | Cloudflare Calls TURN Token ID (server-side only, never exposed to browser) |
| `CF_TURN_API_TOKEN`     | Cloudflare Calls TURN API Token (server-side only, never exposed to browser) |

Supabase URL/key live in `quickbridge/.env`.

## Contact form

- "Contact" link in footer bottom bar opens a modal dialog (name, email, message).
- Server function in `src/lib/contact.ts` sends via **Resend** - the destination email (`clivemakazhu@gmail.com`) lives server-side only, never exposed to the browser.
- Requires `RESEND_API_KEY` env var. Get one free at resend.com (3,000 emails/month free).

## Unified hero & heading recipe

The **homepage hero is the canonical reference** for the whole site. Every other page (why, airdrop, compare) mirrors its type treatment. Do NOT change the homepage hero in isolation - update it deliberately and propagate the change everywhere.

**Hero block (copy from `src/routes/index.tsx`):**
```tsx
<section className="text-center">
  {/* Optional eyebrow - homepage skips it because the visual flow card sits below */}
  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
  <h1 className="mt-3 text-balance tracking-tight text-foreground font-black text-[32px] sm:text-[40px] md:text-[60px]">
    {title} <span className="text-muted-foreground">{highlight}</span>
  </h1>
  <p className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]">
    {lead}
  </p>
  {/* Buttons + trust trailer are kept on interior pages because they need a CTA
      where the homepage has its QR card instead. */}
</section>
```

- **H1** is always `font-black` at `text-[32px] sm:text-[40px] md:text-[60px]` with `tracking-tight` - never `font-semibold`, never `leading-[1.1]`.
- **Highlight span** is always `text-muted-foreground` (subdued grey) - never `text-primary`.
- **Lead paragraph** is always `text-[13.5px] sm:text-[15px]` at `max-w-3xl` - never `14/16px`, never narrower.

**Card / sub-section headings:** `text-[15px] font-semibold text-foreground` (never 14.5, never 16).

**Section h2:** `text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl`.

## AppHeader brand mark

- `AppHeader` accepts `showWordmark?: boolean` (default `false`). Only the homepage (`src/routes/index.tsx`) passes `showWordmark` so the icon + text wordmark anchor the brand there. Every other route shows the icon only - calmer, more consistent header on interior pages, and the new default for any future route.
- The link is still labelled via `aria-label="QuickBridge home"` regardless of whether the text mark is rendered, so accessibility is unchanged.

## Site-wide background

- **`QbBackground`** in `__root.tsx` is the **only** page-level background. It draws a faint, seeded icon grid (~500 transfer-themed Lucide marks) over `--background` plus a top hairline gradient.
- **Rule for new routes:** do NOT add `bg-background`, `bg-grid`, or any full-bleed background overlay on a route's top-level wrapper. Doing so covers `QbBackground` and breaks the consistent feel. Decorative textures *inside* a single card or section (e.g. the CTA banner `bg-grid opacity-30` overlays) are fine because they're contained.
- Route wrappers should be just `relative min-h-screen overflow-hidden` (or whatever layout they need) - no page-level background classes.

## Bridge-active signal

- **`src/lib/bridge-signal.ts`** - `useBridgeSignal(active)` hook toggles `data-bridge="active"` on `document.documentElement` while a peer is connected. `Session.tsx` calls it with `status === "connected"`.
- **CSS hook**: `:root[data-bridge="active"] .qb-logo-shimmy` activates the bee-wing buzz + `--primary` drop-shadow pulse on the AppHeader logo. Default state (no attribute) leaves the logo completely calm - first-time guests, the host pre-pair, the 404 page, and any non-session route never animate.
- **Why a DOM attribute, not React context**: `AppHeader` is rendered at the route level, above the Session subtree. A context owned by Session can't reach it without lifting state into `__root`. The data-attribute is a 4-line, dependency-free way to plumb a single boolean outward without touching the WebRTC lifecycle.

## Error & 404 surfaces

- **`src/components/quickbridge/NotFound.tsx`** - exports `NotFound` (route `notFoundComponent`) and `RouteError` (route `errorComponent`). Both wrap content in the shared marketing shell (`AppHeader` + `SiteNav` + `SiteFooter`) so an error/404 never strands the user on an unstyled screen. The 404 also renders the visible `PRIMARY_ROUTES` from `site-routes.ts` as an "Or explore" grid for recovery.
- **Toast theming**: `src/components/ui/sonner.tsx` uses `theme="dark"` and per-type `classNames` mapped to project tokens (`--surface`, `--success`, `--destructive`, `--warning`, `--primary`, `--border`). `<Toaster>` in `__root.tsx` no longer uses `richColors` (it was injecting sonner's light palette and overriding the design tokens).

## Bug fixes applied

- **Pair link localhost**: When running on localhost, the pair URL now uses `VITE_DEV_DOMAIN` (the Replit proxy domain) so QR codes are scannable from other devices.
- **Hydration mismatch / Invalid hook call**: A custom client entry (`src/entry-client.tsx`) removes any browser extension `<script>` tags injected into `<head>` before React hydrates, preventing the React 19 node-type mismatch error. An `onRecoverableError` handler in `hydrateRoot` suppresses any remaining extension-caused recoverable errors. `suppressHydrationWarning` added to `<html>`, `<head>`, `<body>` in `__root.tsx`.
- **Mobile nav**: Added hamburger menu on landing page for mobile (was hidden `md:flex` only). Closes on link tap.
- **Mobile drop zone**: Show platform-appropriate copy ("Send files" + tap-to-pick on mobile; drag/paste on desktop). "Choose files" button is full-width and taller (44px) on mobile.
- **Mobile tip text**: Desktop keyboard shortcut hints hidden on mobile; mobile-specific copy shown instead.
- **Touch targets**: Session header buttons (End bridge, Retry now) bumped to `h-9` on mobile (≥44px), `h-7` on desktop.
- **Comparison table scroll hint**: Added "← Swipe to see full comparison →" hint on mobile.
- **SPA logo navigation**: `Wordmark.tsx` now uses TanStack Router `<Link>` instead of `<a href="/">` to prevent full-page reloads on logo click.
- **TypeScript fix**: `React.ReactNode` type in `Wordmark.tsx` replaced with explicit `import type { ReactNode }`.

## Roadmap

- Phase 1 (MVP pairing/transfer) - done
- Phase 2 (preview, sounds, ETA, drag-send, device labels) - done
- Phase 3 (TURN, auto-reconnect, quality, retry) - done
- Phase 4 (device names, auto-clipboard, persistent session, history) - done
- Phase 5 (monetization tiers) - **intentionally skipped**. App stays
  account-free and free forever to preserve the "no accounts, nothing
  stored" identity.
- Phase 6 (perception polish) - done:
  - Instant QR paint via isomorphic layout effect on the host route.
  - Sharper tagline ("Send anything between your phone and PC in
    seconds. No apps.") + matching `<title>` / meta description.
  - One-shot ring burst on the status card the moment the peer connects.
  - Predictive clipboard: a `copy` event while connected (and auto-share
    OFF) surfaces a one-tap "Send to <peer>" toast - never auto-sends.
  - Soft per-file size cap raised to 2 GB (`MAX_FILE_BYTES` in
    `Session.tsx`); over-cap files are refused gracefully.

## SEO Phase 3 - shared marketing IA (2026-04-26)

The site's marketing surface (homepage + `/why-quickbridge`, `/airdrop-alternative`, and the forthcoming `/compare/*` and `/use/*` pages) now shares one IA layer instead of duplicating nav/footer per route.

- **Source of truth:** `quickbridge/src/lib/site-routes.ts`. Each route entry has `href / label / teaser / inNav`. Adding a page = one entry; surfacing it across nav, footer, and related strips = flip `inNav: true`.
- **`SiteNav.tsx`** - desktop primary links + Compare/Use-cases dropdowns; mobile hamburger sheet. Mounted as `AppHeader` rightSlot. Replaces the bespoke per-page anchor nav and the homepage's `mobileNavOpen` drawer.
- **`SiteFooter.tsx`** - shared 4-column footer (brand / Product / Trust / Resources). Resources column auto-renders from the registry.
- **`RelatedPages.tsx`** - per-page contextual link strip; renders nothing when no siblings ship, so freshly scaffolded pages don't show an empty section.

**Build-time SEO gate:** `quickbridge/scripts/seo-lint.mjs` parses every prerendered HTML file in `dist/client/` and fails the build on title/description length, h1 uniqueness, heading-hierarchy skips, canonical mismatch, missing/invalid JSON-LD, or cross-page title/description duplication. Wired into `postbuild` (runs before `indexnow-submit.mjs`). Standalone: `npm run seo:lint`.

**Source-citation policy:** No competitor fact ships on a compare or use-case page without a real, recently-fetched URL. Each page stores its sources inline. The Wormhole deep-research summary failed verification on day one ("10 GB free, WebTorrent" vs the actual "5 GB cloud, P2P above that") - exactly the failure mode the policy prevents.
