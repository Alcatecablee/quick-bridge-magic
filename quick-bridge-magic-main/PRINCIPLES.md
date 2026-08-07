# QuickBridge: Principles

**Internal document. Living file. These rules apply to every decision.**

---

## The internal test

Every pull request, every feature proposal, every roadmap debate reduces to one question:

> Does this improve cooperation between computing resources?

If the answer is yes, it belongs. If not, question it hard before touching it.

---

## The core principle

**Pair once. Forget forever.**

Every roadmap decision filters through this. Ask: does this feature reduce future friction between trusted environments? If yes, build it. If not, question it hard before touching it.

Right now QuickBridge is session-based. Every interaction starts from zero. The future state is relationship-based. You scan once. Your environments remember each other cryptographically. Next time you need to send something to your phone, you click its name. The QR code becomes onboarding, not the workflow.

---

## The architectural rule

**Every new capability must reuse the Bridge Layer. If a feature requires bypassing it, the architecture is wrong.**

This single rule prevents dozens of shortcuts over the next five years. A feature that tunnels around the Bridge Layer is not a quick win. It is technical debt that makes the trust layer harder to reason about, test, and extend. If a proposal requires bypassing it, the right response is to extend the Bridge Layer, not go around it.

---

## What we will never do

* Require an account for personal use
* Store user files, even temporarily
* Build advertising
* Sell or analyse user data
* Optimise for engagement over usefulness
* Lock users into proprietary formats
* Require a native app when the browser can do it
* Make cloud the default when peer-to-peer is possible

These are not constraints. They are what makes QuickBridge trustworthy.

---

## The test for every decision

Before shipping anything, ask:

1. Does this make computing resources feel more like one system?
2. Does this reduce friction on the next interaction, not just this one?
3. Does this respect the connection lifecycle between environments?
4. Is it fully implemented, no placeholders, production quality?
5. Does the trusted device metric move in the right direction?

If all five are yes, ship it.

---

## Design standards

Dark, minimal, trust-building UI:

- Dark backgrounds, clean typography
- Smooth transitions, no jarring state jumps
- Mobile-first responsive (a phone is always one side of the transfer)
- Clear connection status feedback at every stage
- Security indicators must remain prominent and readable

Never:

- Remove or obscure the SAS verification UI
- Add loading states that block user action unnecessarily
- Introduce server-side storage of any data
- Break mobile layout for desktop polish

---

## Technical guardrails

Before touching any of the following, read the file and re-read rules.md:

- `src/hooks/use-webrtc.ts`: The core P2P engine. Most bugs live here. Do not rewrite it. Modify minimally and carefully.
- `src/routes/index.tsx`: The host landing page. Session generation, QR display, PIN discovery.
- `src/components/quickbridge/Session.tsx`: Active transfer UI.
- `src/lib/streaming.ts`: Large file handling. Do not break it.
- `src/lib/sas.ts`: DTLS fingerprint derived safety codes. SAS verification must remain prominent and working.
- `public/sw.js`: Service worker. Changes here affect offline behaviour. Be careful.

The connection lifecycle must be respected in every change. Signaling, ICE negotiation, reconnection, and channel cleanup are interleaved. Breaking one breaks all of them.

No server-side file storage. Ever. Not even temporarily. Files go environment to environment.

No em dashes or en dashes anywhere in UI text, copy, docs, or comments. Use a colon or plain phrasing instead.

---

*Last updated: August 2026*
*Owner: Clive Makazhu*
*See also: VISION.md, ROADMAP.md*
