---
name: WebRTC hook logging convention
description: Three-tier logging aliases in use-webrtc.ts and when to use each one.
---

# WebRTC hook logging convention

Three aliases are defined at the top of `src/hooks/use-webrtc.ts`:

```ts
const qbLog  = import.meta.env.DEV ? console.log.bind(console)  : () => {};
const qbWarn = import.meta.env.DEV ? console.warn.bind(console) : () => {};
const qbError = console.error.bind(console);  // always on
```

## Rules

| Alias | Active in prod | Use for |
|---|---|---|
| `qbLog` | No | Verbose state traces (presence sync, ICE candidates, offer/answer, lifecycle steps) |
| `qbWarn` | No | Dev-only diagnostics for handled edge cases (malformed peer message, orphan IDB cleanup, stream-to-disk fallback) |
| `qbError` | Yes | Real failures that need visibility in production: connection failures, IDB write errors, crypto errors, trust handshake failures |

**Why:** `qbLog`/`qbWarn` were silently no-ops in production, making every connection failure invisible. `qbError` was added (build that added it: Phase 2 audit fixes) to restore observability for paths that actually matter.

## How to apply

Any new `catch` block that represents a real user-visible failure (startOffer failing, IDB write failing, crypto throwing) should use `qbError`. Diagnostic traces and gracefully-handled edge cases use `qbLog`/`qbWarn`.
