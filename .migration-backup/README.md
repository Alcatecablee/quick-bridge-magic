# QuickBridge

Peer-to-peer transfer web app for files, clipboard, and messages.
QR-code pairing over WebRTC. No accounts, no installs, nothing stored
on a server.

## Stack

- React 19 + TanStack Router / TanStack Start
- Vite 7
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- TypeScript 5.8
- Bun runtime
- `@supabase/supabase-js` - used **only** for realtime signaling channels
- WebRTC `RTCDataChannel` for the actual transfers
- `qrcode` (display) + `jsqr` (in-browser camera scanner)

## How it works

- **Signaling**: Supabase realtime channels keyed `qb:${sessionId}`.
  Presence keys are `host` / `guest`, carrying `{ device, name }`.
- **Pairing flow**: The host landing page (`/`) is a passive observer on
  the channel - it never claims the `host` presence key and never starts
  WebRTC. As soon as the guest joins (detected via either a `hello`
  broadcast or a presence sync showing the `guest` key), the host is
  auto-redirected to `/session/$id` where the real WebRTC negotiation
  begins. This avoids tearing down a connection mid-pair.
- **Transport**: WebRTC data channel. STUN + TURN fallback
  (defaults to the public Open Relay project).
- **File protocol**: JSON `file-start` / `file-end` / `file-cancel` plus
  binary frames `[16-byte UUID header][payload]`. 16 KB chunks, 8 MB
  backpressure threshold via `bufferedamountlow`.
- **Reconnect**: Full peer-connection teardown + renegotiation with
  exponential backoff (600 ms → 8 s, max 6 attempts). Active outgoing
  transfers are flagged `retryable` so the user can resume after recovery.
- **Quality**: Polled every 4 s via `pc.getStats()` - Direct vs Relay
  shown next to the status badge.
- **Device naming**: Custom name persisted in `localStorage`
  (`qb:deviceName`), broadcast via Supabase presence; falls back to
  detected kind (phone / tablet / computer).
- **Auto-clipboard**: Opt-in per-session toggle that polls
  `navigator.clipboard` every 1.5 s while the tab is visible + focused
  and sends diffs.
- **Persistent host session**: Host session id is stored in
  `localStorage` (`qb:hostSessionId`) so reloads keep the same QR.
  A "Reset" button mints a new id.
- **History**: Per-session, last 30 items (`qb:history:<id>`). Files can
  be quick-resent while the source `File` is still in memory; texts and
  clipboards always re-send.
- **PWA**: `public/manifest.webmanifest` + `public/sw.js`. Service
  worker uses network-first for navigations and stale-while-revalidate
  for static assets so the shell loads offline. Install prompt is
  captured via `beforeinstallprompt` and surfaced as an "Install" button
  on the home page (`src/lib/pwa.ts`).
- **PIN pairing**: Alongside the QR, the host page derives a deterministic
  6-digit PIN from `SHA-256(sessionId)` (`src/lib/pin.ts`). The host
  subscribes to a side-channel (`qb:pin:<code>`) and answers `lookup`
  broadcasts with its real session id. The `/join` route lets a guest
  type the PIN and is auto-redirected to `/s/$id` when the host responds.
- **SAS verification**: After ICE settles, both peers derive a 4-emoji /
  4-word safety code from the sorted DTLS fingerprints in their
  local/remote SDP (`src/lib/sas.ts`). If the badges match on both
  screens, no signaling intermediary tampered with the channel.
- **Stream-to-disk**: On Chromium browsers (File System Access API),
  the receiver can pick a folder and incoming files are written
  directly to `FileSystemWritableFileStream` instead of buffered in
  memory. Falls back silently to the in-memory Blob path elsewhere
  (`src/lib/streaming.ts`).
- **Multi-file & folder drop**: The dropzone uses
  `webkitGetAsEntry()` to expand dropped folders recursively
  (`src/lib/dropzone.ts`); each file is queued as a separate transfer.
- **Paste-to-send**: `Ctrl/Cmd+V` anywhere outside a text input pastes
  files (e.g. an image from the OS clipboard) into the send queue, or
  the clipboard text as a clipboard message.
- **Background notifications**: When the tab is hidden, completed
  transfers and incoming messages fire system notifications (permission
  is requested on the next user gesture - `src/lib/notifications.ts`).
- **Throughput sparkline**: A small SVG line beside the status badge
  shows the last ~20 s of combined send + receive bytes/sec
  (`src/components/quickbridge/Sparkline.tsx`).
- **OG/social**: `__root.tsx` ships `og:title/description/image` plus
  `twitter:card=summary_large_image`; favicon and OG art live in
  `public/` as SVGs derived from the wordmark.

## Project layout

```
quickbridge/
  src/
    routes/
      __root.tsx
      index.tsx            # Host landing page (QR + scanner only; observes channel, auto-redirects on pair)
      session.$id.tsx      # Host session page (isInitiator=true)
      s.$id.tsx            # Guest session page (isInitiator=false)
    components/
      quickbridge/
        Session.tsx        # Main session UI (drop, send, history)
        StatusBadge.tsx    # Connection status + quality (Direct/Relay)
        QrDisplay.tsx      # QR with pulse glow
        QrScanner.tsx      # In-browser camera QR scanner
        Wordmark.tsx       # Geometric SVG logo + shared AppHeader
      ui/                  # shadcn components
    hooks/
      use-webrtc.ts        # WebRTC + Supabase signaling + reconnect + quality
      use-mobile.tsx
    lib/
      session.ts           # session id generator + formatBytes
      device.ts            # phone/tablet/computer detection
      sound.ts             # WebAudio tones (connect/message/receive)
      storage.ts           # Typed localStorage helpers
      history.ts           # Per-session history hook
      utils.ts             # cn()
    integrations/
      supabase/
        client.ts          # Supabase client (signaling channels)
        client.server.ts
        auth-middleware.ts
    router.tsx
    routeTree.gen.ts
    styles.css
  vite.config.ts
  tsconfig.json
  components.json
  eslint.config.js
  wrangler.jsonc
  supabase/config.toml
  package.json
  bunfig.toml
```

## Scripts

Defined in `package.json`:

| Script              | Command                          |
| ------------------- | -------------------------------- |
| `bun run dev`       | `vite dev`                       |
| `bun run build`     | `vite build`                     |
| `bun run build:dev` | `vite build --mode development`  |
| `bun run preview`   | `vite preview`                   |
| `bun run lint`      | `eslint .`                       |
| `bun run format`    | `prettier --write .`             |

## Running locally

```bash
cd quickbridge
bun install
bun run dev
```

On Replit, the configured workflow runs:

```
cd quickbridge && PORT=5000 bun run dev --port 5000
```

and exposes port 5000 (mapped to external port 80).

## Environment variables

Read from the code:

| Name                          | Read in                                 | Purpose                                                       |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `VITE_SUPABASE_URL`           | `src/integrations/supabase/client.ts`   | Supabase URL (client-side; falls back to `SUPABASE_URL`)      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/client.ts` | Supabase anon/publishable key (falls back to `SUPABASE_PUBLISHABLE_KEY`) |
| `SUPABASE_URL`                | `client.server.ts`, `auth-middleware.ts`| Supabase URL (server-side)                                    |
| `SUPABASE_PUBLISHABLE_KEY`    | `auth-middleware.ts`                    | Supabase publishable key (server-side)                        |
| `SUPABASE_SERVICE_ROLE_KEY`   | `client.server.ts`                      | Supabase service-role key (server-side)                       |
| `VITE_TURN_URLS`              | `src/hooks/use-webrtc.ts`               | Comma-separated TURN URLs (overrides default)                 |
| `VITE_TURN_USERNAME`          | `src/hooks/use-webrtc.ts`               | TURN username (default `openrelayproject`)                    |
| `VITE_TURN_CREDENTIAL`        | `src/hooks/use-webrtc.ts`               | TURN credential (default `openrelayproject`)                  |

## Deploying to Vercel

The app builds as a fully-static SPA (TanStack Start `spa` mode) - no
serverless functions required. All logic (Supabase signaling, WebRTC,
file transfer) runs in the browser.

1. **Push to GitHub** (already at
   [`Alcatecablee/quick-bridge-magic`](https://github.com/Alcatecablee/quick-bridge-magic)).
2. **Import the repo on Vercel** → New Project → pick the repo.
3. **Set Root Directory** to `quickbridge` (the app lives in a subfolder).
   Framework Preset: leave as **Other** - `vercel.json` already pins
   `buildCommand`, `outputDirectory`, and SPA rewrites.
4. **Add Environment Variables** (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - Leave `VITE_DEV_DOMAIN` blank in production.
5. **Deploy.** First build takes ~1 minute.
6. **Custom domain**: Vercel → Project → Settings → Domains → add
   `quickbridge.app` and `www.quickbridge.app`. Point your DNS at the
   provided Vercel records.

What `vercel.json` does:

- Runs `npm run build` and serves `dist/client/`.
- Rewrites every unmatched path to `/_shell.html` so deep links like
  `/s/abc123`, `/session/xyz`, `/join`, `/why-quickbridge`, and
  `/airdrop-alternative` all hydrate the SPA correctly.
- Caches `assets/`, `brand/`, `logos/`, and `steps/` for one year
  (immutable hashed filenames).
- Serves `sw.js` with `must-revalidate` so the service worker can
  update on each visit.

The `wrangler.jsonc` and `@cloudflare/vite-plugin` dependency are still
in the repo for backwards compat but are not used by the Vercel build
(`cloudflare: false` is set in `vite.config.ts`).

## Roadmap status

- Phase 1 - MVP pairing/transfer: **done**
- Phase 2 - preview, sounds, ETA, drag-send, device labels: **done**
- Phase 3 - TURN, auto-reconnect, quality, retry: **done**
- Phase 4 - device names, auto-clipboard, persistent session, history: **done**
- Phase 5 - monetization tiers: **intentionally skipped** to keep the
  app account-free and free forever.
- Phase 6 - perception polish & enterprise dark theme: **done**
  (instant QR paint, sharper tagline, connect burst, predictive
  clipboard toast, 2 GB soft cap, single dark palette, geometric
  wordmark, dedicated session route with auto-redirect).
- Phase 7 - launch readiness: **done**
  - Installable PWA (manifest + offline shell SW + install prompt).
  - OG / Twitter card meta + SVG favicon.
  - PIN pairing (`/join`) as a no-camera alternative to QR.
  - SAS verification badge - DTLS-fingerprint-derived 4-emoji /
    4-word safety code shown on both peers.
  - Stream-to-disk on Chromium via File System Access API.
  - Folder drag (recursive) + multi-file queueing.
  - Paste-to-send (`⌘/Ctrl+V`) for files and text.
  - Throughput sparkline next to the status badge.
  - System notifications when the tab is hidden.
