# QuickBridge

Peer-to-peer file, clipboard, and message transfer app. QR-code pairing over WebRTC. No accounts, no installs, nothing stored on a server.

## How to run

The workflow **Start application** runs `cd quick-bridge-magic-main && npm run dev` on port 5000.

## Stack

- React 19 + TanStack Router (SPA mode)
- Vite 7 — port 5000, `allowedHosts: true` (Replit proxy compatible)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- TypeScript 5.8
- Supabase Realtime — WebRTC signaling only, no data stored
- WebRTC RTCDataChannel — actual file transfer

## Required environment variables

Set in Replit as shared env vars (already configured):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID (subdomain) |
| `VITE_DEV_DOMAIN` | Replit dev domain — makes QR pair links scannable from other devices |

## Optional TURN overrides

| Variable | Purpose |
|---|---|
| `VITE_TURN_URLS` | Comma-separated TURN server URLs (defaults to Open Relay free TURN) |
| `VITE_TURN_USERNAME` | TURN username |
| `VITE_TURN_CREDENTIAL` | TURN credential |

## Deployment

Designed to deploy to Vercel. See `quick-bridge-magic-main/README.md` for full Vercel deployment steps.

## Project layout

```
quick-bridge-magic-main/
  src/
    routes/          # TanStack Router file-based routes
    components/      # UI components (quickbridge/ + shadcn ui/)
    hooks/           # use-webrtc.ts — WebRTC + signaling + reconnect
    lib/             # session, device, sound, storage, history utils
    integrations/    # supabase/client.ts
  public/            # Static assets, OG images, PWA manifest
  api/               # Vercel serverless functions (contact, TURN credentials)
  scripts/           # Build scripts (static route gen, SEO lint, OG images)
```

## User preferences

(none yet)
