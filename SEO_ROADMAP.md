# QuickBridge - Enterprise SEO Roadmap

**Owner:** QuickBridge engineering
**Domain:** https://quickbridge.app
**Last updated:** 2026-04-28
**Status:** Phase 1 complete. Phase 3.1 (5/8 compare pages). Phase 4.1 complete. See progress notes below.

---

## How to use this document

This is a living, production-grade SEO plan, not a wish list. Every item is scoped, prioritized, and includes acceptance criteria so it can be picked up by any engineer (or LLM agent) and finished in one PR. Phases are ordered by ROI - do them in order. Don't skip P0 to chase P3.

Keyword strategy, on-page conventions, structured data contracts, and operational checklists live further down.

---

## Phase 1: Shipped

These changes have already been implemented in the current codebase. Verify each one is in production after the next deploy, then check it off.

| # | Item | File(s) | Verification |
|---|------|---------|--------------|
| 1 | Sitemap + robots.txt point to `quickbridge.app` (was `quickbridge.replit.app`) | `public/sitemap.xml`, `public/robots.txt` | `curl https://quickbridge.app/robots.txt` - must reference correct domain |
| 2 | Per-route prerendering enabled. `/`, `/why-quickbridge`, `/airdrop-alternative`, `/join` ship full HTML with route-specific `<title>`, meta, OG, JSON-LD | `vite.config.ts`, `vercel.json` | `curl -s https://quickbridge.app/why-quickbridge \| grep '<title>'` |
| 3 | SPA shell decoupled from homepage. `dist/client/index.html` is the prerendered home (464 KB); `dist/client/spa-shell.html` is the empty fallback for dynamic routes | `vercel.json` `buildCommand` + `rewrites` | `curl -I https://quickbridge.app/session/abc` returns 200 from spa-shell |
| 4 | All canonical URLs use the apex domain | every route file | `view-source:` per page should show `<link rel="canonical" href="https://quickbridge.app/...">` |
| 5 | Per-route OG / Twitter tags (title, description, url, image, dimensions, alt) | every route file + `__root.tsx` | Test with https://www.opengraph.xyz/url/https%3A%2F%2Fquickbridge.app%2Fairdrop-alternative |
| 6 | Site-wide Organization + WebSite (with SearchAction) JSON-LD injected at root | `__root.tsx` | https://search.google.com/test/rich-results - paste any URL |
| 7 | Homepage WebApplication + HowTo + FAQPage JSON-LD | `routes/index.tsx` | Rich Results Test should detect SoftwareApp, HowTo, FAQ |
| 8 | Article + FAQPage JSON-LD on `/why-quickbridge` and `/airdrop-alternative` | both route files | Rich Results Test |
| 9 | Titles tightened to ≤ 60 chars, keyword-led, brand last; descriptions 150–160 chars | every route file | Manual SERP-preview |
| 10 | Heading hierarchy fixed on homepage (no h1 → h3 jump) | `routes/index.tsx` | https://wave.webaim.org/ |
| 11 | Security & quality headers in Vercel: HSTS preload, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control | `vercel.json` | https://securityheaders.com/?q=quickbridge.app |
| 12 | Long-cache for immutable assets, short-cache for HTML/sitemap, must-revalidate for sw.js | `vercel.json` | `curl -I https://quickbridge.app/assets/index-XXXX.js` |
| 13 | `noindex,nofollow` on `/session/$id` and `/s/$id` (was robots-only); `Disallow: /assets/` added to robots | route files + `robots.txt` | `curl https://quickbridge.app/session/x \| grep robots` |
| 14 | AI crawler allowlist (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) explicit in robots.txt | `public/robots.txt` | n/a |
| 15 | Sitemap upgraded with `<lastmod>` and `<image:image>` per URL | `public/sitemap.xml` | https://www.xml-sitemaps.com/validate-xml-sitemap.html |
| 16 | `og:site_name`, `og:locale`, `format-detection`, `color-scheme`, robots `max-image-preview:large` added to root meta | `__root.tsx` | view-source on any page |
| 17 | Cache-Control on sitemap.xml + robots.txt (1 hour, must-revalidate) so updates propagate fast | `vercel.json` | `curl -I https://quickbridge.app/sitemap.xml` |

**Phase 1 result:** Per-route prerendered HTML, full schema.org coverage for every marketing page, no broken-domain references anywhere, security headers at A+ level. Estimated grade lift: **C+ → A-**.

---

## Phase 2: Differentiated OG images + crawl-budget hygiene (1 week)

**Objective:** Maximize click-through from social and search by giving every prerendered page its own visual asset. Eliminate every duplicate-content and crawl-waste signal Google looks at.

### 2.1 Per-route OG images
**Goal:** Each prerendered page references a unique 1200×630 PNG.

- [ ] Generate three new images:
  - `/og-home.png` - "Send anything between phone & PC. Instantly." with QR + device illustration
  - `/og-airdrop.png` - "AirDrop alternative for Android & Windows" with the OS-logo grid from the page
  - `/og-why.png` - "The fastest way to send files between devices" with the speed comparison visual
- Source files: keep editable Figma at `/design/og/` (not committed if licensed); export PNG to `public/`.
- File size budget: ≤ 200 KB each (use `pngquant --quality=70-90`).
- Update `og:image` in each route's head config to the new file. Also update sitemap `<image:image>` blocks.
- Acceptance: https://www.opengraph.xyz/ shows the unique image per route. LinkedIn Post Inspector shows the same.

### 2.2 Dynamic OG generator (optional but recommended)
**Why:** Future-proofs new content pages without manual export.
- [ ] Add `/api/og` Vercel Edge Function using `@vercel/og` (Satori). Accepts `?title=&subtitle=&variant=`. Cached at the edge for 1 day.
- [ ] Switch all marketing route OG meta to `https://quickbridge.app/api/og?title=...` with `og:image:width=1200`, `og:image:height=630`.
- Acceptance: hitting the URL with different `?title=` returns a unique branded PNG in < 200 ms (warm).

### 2.3 Trailing-slash + www canonicalization
- [x] `vercel.json` `trailingSlash: false`, `cleanUrls: true` (already shipped Phase 1).
- [ ] In Vercel project settings, configure `quickbridge.app` as the apex; add a permanent 301 from `www.quickbridge.app` → `quickbridge.app`. (Vercel UI, not a code change.)
- [ ] Add a Vercel rewrite rule that 301-redirects any URL with a trailing slash (other than `/`) to its no-slash variant.
- Acceptance: `curl -I https://www.quickbridge.app/` returns `301 → https://quickbridge.app/`. `curl -I https://quickbridge.app/why-quickbridge/` returns `301 → /why-quickbridge`.

### 2.4 IndexNow + Bing/Yandex submission
- [ ] Generate an IndexNow API key, drop it at `public/<key>.txt`.
- [ ] Create a small Vercel cron / GitHub Action that, on every deploy, POSTs every URL in the sitemap to `https://api.indexnow.org/indexnow`. Bing, Yandex, and Naver pick up the change in minutes (vs days for Google).
- Acceptance: deploy a tracked URL change; verify it's indexed in Bing within 24 h.

### 2.5 Search Console + Bing Webmaster onboarding
- [ ] Add quickbridge.app to Google Search Console. Verify via Vercel-issued TXT record.
- [ ] Submit `sitemap.xml`. Set preferred domain. Set country target (Worldwide).
- [ ] Add to Bing Webmaster Tools. Submit sitemap. Enable IndexNow integration.
- [ ] Add to Yandex Webmaster (optional, ~3% of global search).
- Acceptance: 4 URLs from sitemap show "Indexed" within 7 days in Search Console.

---

## Phase 3: Content engine - pages that target real intent (4–6 weeks)

**Objective:** Move from "two marketing pages competing for everything" to a content surface area that owns long-tail traffic. Each page targets one keyword cluster with one job-to-be-done.

**Execution status (updated 2026-04-26):** Phase 3 is being executed in Path B order - infrastructure first, content second. Completed: §3.5 (SEO lint build gate) and §3.4 (shared nav, footer, related strip + route registry). In progress: scaffolding for §3.1 / §3.2. Deferred: §3.3 (blog) - pending an editorial-review commitment for each post given the March 2024 spam-update risk on LLM-written long-form.

**Source-citation policy:** No competitor fact (price, file-size cap, encryption model, OS support, feature presence) ships in any compare or use-case page without a real, verifiable URL fetched in the last 90 days. Each page stores its sources inline (a `SOURCES` constant or footnote list) so any claim is auditable. Wormhole's deep-research summary failed this check on day one - the report claimed "10 GB free, WebTorrent" but the live FAQ says "5 GB cloud-stored, P2P above that, no WebTorrent mention." This is exactly the kind of error the policy prevents.

### 3.1 Programmatic comparison pages
Create one route per competitor. Each is a real page with unique copy, screenshots, and a verdict - not a SERP doorway.

**Hybrid 8** (decided 2026-04-26 after deep-research review - see `attached_assets/deep-research-report_1777189703903.md`):

| Route | Primary keyword | Search intent | Source list |
|-------|-----------------|---------------|-------------|
| `/compare/quickbridge-vs-snapdrop` | "snapdrop alternative" | Snapdrop is same-network only, no cross-network reach | github.com/SnapDrop/snapdrop |
| `/compare/quickbridge-vs-wormhole` | "wormhole.app alternative" | Wormhole stores files cloud-side up to 5 GB, then P2P with sender tab open | wormhole.app/about |
| `/compare/quickbridge-vs-airdrop` | "airdrop for windows" | AirDrop is Apple-only | apple.com docs |
| `/compare/quickbridge-vs-wetransfer` | "wetransfer alternative no signup" | WeTransfer requires email and uploads to cloud | wetransfer.com pricing |
| `/compare/quickbridge-vs-pairdrop` | "pairdrop alternative" | PairDrop is same-network LAN-only | github.com/schlagmichdoch/PairDrop |
| `/compare/quickbridge-vs-nearby-share` | "nearby share for windows" | Quick Share (née Nearby Share) is Windows + Android only | android.com/quick-share |
| `/compare/quickbridge-vs-filepizza` | "filepizza alternative" | FilePizza is pure WebRTC but minimal pairing UX | file.pizza + github.com/kern/filepizza |
| `/compare/quickbridge-vs-localsend` | "localsend alternative" | LocalSend requires installing an app on every device | localsend.org |

**Dropped from initial roadmap, with rationale:**
- ~~`/compare/quickbridge-vs-shareit`~~ - SHAREit is ad-heavy and reputationally compromised; we do not want associative SEO with it.
- ~~`/compare/quickbridge-vs-google-drive`~~ - apples-to-oranges (GDrive is storage, QB is transfer); fair-comparison content is hard to write without strawmanning.

**Added based on the deep-research report:**
- `/compare/quickbridge-vs-filepizza` and `/compare/quickbridge-vs-localsend` - both are direct-niche peers (browser-WebRTC and LAN-share respectively) where QB's differentiation (pairing UX, no install) is honest and verifiable.

Routes are registered in `src/lib/site-routes.ts` with `inNav: false`. Flipping the flag surfaces them in the SiteNav dropdown, SiteFooter Resources column, and per-page RelatedPages strips simultaneously.

**Progress (4 of 8 shipped - 2026-04-28):**
- ✅ `/compare/quickbridge-vs-snapdrop` (2026-04-26) - canonical template. Established the per-page contract: keyword-led H1 + verdict in the first paragraph, neutral comparison cells (true / false / "different model"), an honest two-column verdict box, a visible `Status note` for product-status uncertainty, a visible `Sources` section backed by an inline `SOURCES` constant, breadcrumb, `Article` + `FAQPage` JSON-LD, and `?utm_source=compare-snapdrop` on both CTAs.
- The Snapdrop page also documents the LimeWire acquisition note from the upstream README. The deep-research report had Snapdrop as plain "LAN-only P2P" - fetching the actual repo caught a major status change the report missed. Reinforces the source-citation policy.
- ✅ `/compare/quickbridge-vs-wormhole` (2026-04-28) - second page off the template. Six sources cited inline (homepage, FAQ, Security Design, Roadmap, Why-We-Built, Legal). Caught a contradiction worth flagging: Wormhole's roadmap lists "Peer-to-peer Mode (no cloud)" as upcoming, while their FAQ says >5 GB already transfers P2P via WebTorrent - the page's Status note explains the present-day hybrid (≤5 GB cloud relay on Backblaze for 24h, 5–10 GB P2P) instead of papering over it. Also corrected a sitemap omission - `/compare/quickbridge-vs-snapdrop` was prerendered but missing from `public/sitemap.xml`; both compare URLs are now listed with today's `lastmod`.
- ✅ `/compare/quickbridge-vs-airdrop` (2026-04-28) - third page. Five primary sources cited (Apple iPhone/iPad support page, Apple macOS support page, Apple Platform Security guide, 9to5Google Quick Share AirDrop coverage, Wikipedia). The source-fetch round caught two major framing changes the deep-research report missed: (1) **Quick Share now bridges AirDrop on Pixel 10/9 and some Samsung Galaxy** (Nov 2025-April 2026), so the "AirDrop is Apple-only" framing is now a half-truth and is explicitly qualified throughout the page; (2) **iOS 26.2 introduced AirDrop codes** for non-contact sharing, mentioned in Apple's own help text. A Tom's Guide article claiming Microsoft brought "AirDrop for Windows" via Phone Link could not be independently verified at write time and was deliberately excluded - the page only states what Apple's own docs confirm (no Apple-supported AirDrop on Windows). **Audit needed:** the existing `/airdrop-alternative` page was last edited before the Quick Share AirDrop bridge shipped; copy that asserts "AirDrop is Apple-only" or "no Android can talk to AirDrop" should be re-checked against the new April 2026 reality.
- ✅ `/compare/quickbridge-vs-wetransfer` (2026-04-28) - fourth page. Three primary sources cited (pricing page, about page, December 2024 plan-change help article). The source-fetch round caught a significant data correction: the roadmap previously stated "2 GB free, expires in 7 days" — WeTransfer restructured its plans in December 2024, raising the free limit to 3 GB/month (rolling 30-day cap) while simultaneously shortening expiry from 7 days to 3 days and introducing a 10-transfer/month cap. The Status note documents this change explicitly. Also confirmed from the live pricing page: free tier shows "Advertising (and art)" in the wallpaper row, and the "Data encryption" checkbox covers TLS + at-rest storage encryption (not E2E — WeTransfer holds the keys). A ninth comparison row ("Recipient can download later") was added to give WeTransfer honest credit for its async delivery model, which QuickBridge cannot match.
- ✅ `/compare/quickbridge-vs-pairdrop` (2026-04-28) - fifth page. Three primary sources cited (pairdrop.net live app v1.11.2, GitHub README, docs/faq.md). The source-fetch round caught an important nuance the roadmap summary missed: PairDrop is not purely LAN-only (unlike the original Snapdrop) — it added cross-network transfers via persistent device pairs and temporary public rooms. The comparison therefore focuses on the pairing model difference (PairDrop's three-mode system vs QB's single QR/PIN flow) rather than a LAN vs internet framing. Also surfaced from the live site: the disclaimer "Traffic is routed through the server if WebRTC is not available" — a TURN-relay model equivalent to QB's own cross-NAT handling. This is noted honestly in the Status note rather than used as a negative against PairDrop. GitHub repo confirmed actively maintained (last commit Apr 22, 2026, 5 days before page was written; 10.2k stars).
- Remaining 3: Nearby Share, FilePizza, LocalSend. Each requires its own source-fetch round before any claim ships.

Per page must include:
- **H1** matching the primary keyword (not brand-led).
- **First 200 words** include the keyword and a one-sentence verdict.
- **Comparison table** of the 6–10 most-searched feature differences (file size cap, accounts, OS support, encryption, ads, install required, network requirement, expiration).
- **Honest verdict box**: "QuickBridge wins when…", "Use [competitor] when…". Search engines (and humans) reward fairness.
- **JSON-LD**: `Article` + `FAQPage` (3 questions: what is X, how does QB compare, is QB free).
- **Internal links** to `/airdrop-alternative` and `/why-quickbridge`.
- **CTA** to homepage with a tracked `?utm_source=compare-snapdrop` etc.

Acceptance: each page must score ≥ 90 on Lighthouse SEO and have the H1 keyword in `<title>`, `<h1>`, `<meta description>`, and the first paragraph.

### 3.2 Use-case landing pages

| Route | Primary keyword |
|-------|-----------------|
| `/use/transfer-photos-from-iphone-to-pc-without-itunes` | "transfer photos from iPhone to PC without iTunes" |
| `/use/send-files-from-android-to-mac` | "send files from Android to Mac" |
| `/use/send-large-files-without-cloud` | "send large files without uploading" |
| `/use/share-clipboard-between-phone-and-pc` | "copy text from phone to computer" |
| `/use/transfer-photos-without-usb` | "transfer photos without USB cable" |
| `/use/send-files-on-different-wifi` | "send files between phones different wifi" |
| `/use/move-files-from-old-phone-to-new` | "transfer files between phones quickly" |

Same content contract as 3.1. Add a **step-by-step screenshot walkthrough** (3 screenshots, real captures from the app), and `HowTo` JSON-LD.

**Candidate pool note:** `src/lib/site-routes.ts` carries a slightly different list - three of the original roadmap slugs were swapped for stronger keyword targets during registry build (Windows↔Mac, laptop↔laptop offline, PC→phone via QR). Final 7-of-N selection happens at scaffolding time; the registry is the source of truth from that point forward. Reconcile the two lists before scaffolding §3.2.

### 3.3 Blog (long-form, indexable, evergreen)

Setup: add a `/blog/$slug` route reading from MDX in `content/blog/`. Render with `@mdx-js/react` or `mdxe`. Each post gets `Article` JSON-LD with `datePublished` + `dateModified`.

Initial 8-post calendar (one per week):
1. **"How AirDrop actually works (and why we built a browser version)"** - explainer, link bait
2. **"WebRTC for file transfer: a 2026 deep dive"** - technical, attracts dev backlinks
3. **"5 reasons phone-to-PC file transfer still sucks in 2026"** - opinionated, social-share-able
4. **"How to send a 1GB video without losing quality"** - tutorial, screenshots
5. **"Snapdrop vs PairDrop vs QuickBridge: real-world benchmark"** - comparison, original data
6. **"The case against installing another file-sharing app"** - POV piece
7. **"Privacy of file transfer apps: what each one actually sees"** - original research, audit-style
8. **"How we made our QR pairing work in 1 second flat"** - technical, behind-the-scenes

Each post: 1500–2500 words, 1 hero image, 3+ in-body images or diagrams, 5+ internal links, 1+ external link to a respected source.

### 3.4 IA + internal linking ✅ DONE 2026-04-26
**Shipped:**
- `src/lib/site-routes.ts` - single source of truth for marketing IA. Each route has `href / label / teaser / inNav`. Flipping `inNav` from `false` to `true` propagates a new page to nav, footer, and related strips in one line.
- `src/components/quickbridge/SiteNav.tsx` - desktop inline links + Compare/Use-cases dropdowns (shadcn dropdown-menu); mobile hamburger sheet (shadcn sheet). Used as `AppHeader` rightSlot on every marketing page.
- `src/components/quickbridge/SiteFooter.tsx` - shared 4-column footer (brand, Product, Trust, Resources). Resources column auto-renders Compare + Use cases lists once routes flip to `inNav: true`.
- `src/components/quickbridge/RelatedPages.tsx` - per-page strip; renders nothing when no related routes are shipped (no empty section on freshly scaffolded pages).
- Wired into `/`, `/airdrop-alternative`, `/why-quickbridge`. Skipped `/join` deliberately - it's a single-purpose action page.

**Notes / decisions:**
- Replaced the homepage's inline anchor nav (#use-cases / #features / #how / #compare / #faq) with SiteNav. Section anchors still work via direct URL and footer links. Trade-off: lost in-header section jumpers in exchange for cross-page nav consistency.
- Did **not** ship `broken-link-checker` - superseded by the SEO lint, which already validates every internal link target via the canonical check. Add a separate crawler later only if external-link rot becomes an issue.

### 3.5 Content QA gate ✅ DONE 2026-04-26
**Shipped:** `scripts/seo-lint.mjs`, wired into `postbuild` (not `prebuild` as originally specced - the lint reads prerendered HTML, which only exists after build runs). Failed lint = failed `npm run build` = no Vercel deploy.

**Checks performed against every prerendered page in `dist/client/**/*.html`:**
- `<title>` exists, ≤ 60 chars, unique across pages
- `<meta name="description">` exists, length 140–160 chars, unique across pages
- exactly one `<h1>`
- heading hierarchy never skips a level (h1→h3 is invalid)
- `<link rel="canonical">` exists and matches the page's expected URL
- ≥ 1 `<script type="application/ld+json">` block, each parses as valid JSON with `@context` + `@type`

**Implementation notes:**
- Filename is `.mjs`, not `.ts` - matches the existing scripts dir convention (`build-og-images.mjs`, `indexnow-submit.mjs`).
- `schema-dts` (mentioned in original spec) is a TypeScript types package - useless for runtime validation. We get type safety on JSON-LD when we *write* it in routes; we get runtime safety from this lint when it *ships*.
- Caught a real regression on first run: `/join` had a 122-char meta description (below the 140 floor). Fixed in the same commit, also dropping a soft "instantly" claim in favor of a verifiable encryption fact.
- Standalone: `npm run seo:lint`.

---

## Phase 4: Performance & Core Web Vitals (1–2 weeks)

**Why this is SEO:** since 2021, CWV is a confirmed ranking factor. Mobile LCP, INP, and CLS thresholds are gates for "Good URL" status in Search Console.

### 4.1 Code-splitting Session.tsx ✅ DONE 2026-04-28
- `Session` is now lazy-loaded in both `routes/s.$id.tsx` and `routes/session.$id.tsx` via `lazy(() => import(...).then(m => ({ default: m.Session })))`, wrapped in `<Suspense fallback={<SessionSkeleton />}>`.
- New `src/components/quickbridge/SessionSkeleton.tsx` provides the fallback UI.
- **Bundle result:** `Session-MV6ysXa6.js` is now a separate async chunk (70.95 KB raw / **23.07 KB gzip**). The session route wrappers themselves are 1.19 KB / 0.70 KB each. Session.tsx no longer appears in the homepage critical path.
- All 10 prerendered pages still pass SEO lint. Build clean.

### 4.2 Font loading
- Currently loading Inter + JetBrains Mono via Google Fonts CDN. Switch to self-hosted via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`.
- Add `font-display: swap` and `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two used weights only (400, 600).
- Drop the JetBrains Mono request from above-the-fold (it's only used in the PIN code; lazy-load).
- Acceptance: no third-party font request on the critical path; LCP improves ≥ 100 ms.

### 4.3 Image optimization
- Convert all OS logos in `public/logos/` from PNG to AVIF + WebP fallback. Use `sharp` in a `npm run optimize:images` script.
- Add `width`, `height`, and `loading="lazy"` to every `<img>` below the fold (CLS = 0).
- The 3 step videos (`/steps/step-0X.mp4`) total ~3 MB. Compress with `ffmpeg -crf 28 -preset slow` and add `<video preload="metadata">` instead of `preload="auto"`. Add `poster` attribute pointing to a 30 KB JPG first frame.
- Acceptance: homepage transferred bytes < 800 KB on first load (from current ~2 MB).

### 4.4 Critical CSS
- Tailwind currently ships its full computed CSS (~50 KB). Extract critical CSS for the home above-the-fold using `critters` Vite plugin. Inline critical, defer rest.
- Acceptance: First Contentful Paint < 1.0 s on simulated mobile.

### 4.5 Preload + preconnect tuning
- Already preconnect to fonts.googleapis.com / fonts.gstatic.com - remove after self-hosting (4.2).
- Preload the homepage hero illustration explicitly.
- Add `<link rel="dns-prefetch">` for the Supabase domain (only used post-pairing, not on home - defer if possible).

### 4.6 Service worker SEO safety
- Audit `public/sw.js` to ensure HTML documents use a network-first or stale-while-revalidate strategy. A cache-first strategy can serve stale HTML to crawlers on revisit.
- Bump `CACHE_VERSION` and add a 24-hour max age on cached HTML responses.
- Acceptance: incognito-load any URL after a deploy returns the new HTML, not cached.

### 4.7 Real-user monitoring
- Add `@vercel/analytics` and `@vercel/speed-insights`. Free for the first 100k events/month.
- Monitor LCP, INP, CLS, TTFB per route. Alert if any drops below "Good" for two consecutive days.

---

## Phase 5: Authority - backlinks, mentions, listings (ongoing)

SEO without backlinks is whistling in the wind. This phase is people-and-process work, not code.

### 5.1 Directories (week 1)
Submit (most are free, all need a 1-line description and an icon):
- [ ] AlternativeTo (under "AirDrop", "Snapdrop", "WeTransfer", "Send Anywhere", "Wormhole")
- [ ] ProductHunt launch (Tuesday morning PT, prepare maker comment + 3 screenshots + 1 hero GIF)
- [ ] BetaList
- [ ] SaaSHub
- [ ] StackShare
- [ ] G2 (free listing under "File Transfer Software")
- [ ] Capterra
- [ ] AppSumo (free listing)
- [ ] PWA Store (https://progressiveapp.store/)
- [ ] Awesome PWA list (PR to https://github.com/hemanth/awesome-pwa)
- [ ] Awesome WebRTC (PR)
- [ ] Tools.fyi
- [ ] uneed.best

### 5.2 Editorial outreach (weeks 2–8)
Pitch a guest post or "tool spotlight" to:
- The Verge - "best AirDrop alternatives" annual roundup is updated every spring
- TechCrunch - startup launch coverage if you have a fundraising/milestone hook
- Lifehacker - "transfer files between phone and PC without USB" is a perennial topic
- Hacker News - Show HN with a technically interesting angle (the WebRTC-only architecture, the QR PIN derivation)
- Reddit - `/r/Android`, `/r/InternetIsBeautiful`, `/r/selfhosted` (carefully - read each sub's rules)
- Indie Hackers
- Beebom, AndroidPolice, XDA-Developers - Android-focused, big organic traffic

Track each pitch in a sheet: outlet, contact, date sent, response, link if landed.

### 5.3 Wikipedia + Wikidata
- Add QuickBridge to the **List of file sharing applications** Wikipedia page (cite an editorial review, not your own site).
- Create a Wikidata entry. Wikidata feeds many AI knowledge panels.

### 5.4 Brand mentions you can convert
- Search `link:airdrop alternative` and `intext:"airdrop alternative" -site:apple.com` weekly. Reach out to authors of listicles asking for inclusion.
- Set up a Google Alert for `airdrop alternative for android` and `send files phone to pc`.

### 5.5 Creator partnerships
- 5 micro-influencer YouTubers in the "tech tips" niche (10k–100k subs). Free product (it's free anyway) + a custom UTM link + an offer to co-author a blog. Cost: time only.

---

## Phase 6: Internationalization (when ready)

Don't start until US-English organic > 5k MAU. International is leverage, not a starting point.

### 6.1 hreflang infrastructure
- Add `<link rel="alternate" hreflang="x-default" href="https://quickbridge.app/">` and per-locale `hreflang="en"`, `hreflang="es"`, etc. to every page.
- Use TanStack Start's i18n addon or roll a simple `[locale].route.tsx` pattern.
- Sitemap should list every locale variant with `<xhtml:link rel="alternate" hreflang="...">`.

### 6.2 First three locales (in this order)
1. **es** (Spanish) - largest non-English speaker pool searching "alternativa airdrop"
2. **pt-BR** (Brazilian Portuguese) - large Android user base, low competition
3. **de** (German) - high CPC market, high translation quality available

### 6.3 Translation quality
- Use a human translator (or DeepL Pro + human review) for marketing copy - never raw machine translation. Google penalizes it.
- Localize OG images and screenshots, not just text.

---

## Phase 7: Operational - ongoing health

### 7.1 Monthly SEO check (15 min)
- Search Console: Coverage report - anything not indexed? New errors?
- Search Console: Top queries vs top pages - any keyword rising you haven't built a page for?
- Bing Webmaster: same.
- PageSpeed Insights: any P0 page dropped to "Needs Improvement"?
- Run `lighthouse` against `/`, `/airdrop-alternative`, `/why-quickbridge` - score must stay ≥ 95 on SEO, ≥ 90 on Performance.

### 7.2 Quarterly content audit (1 hour)
- Pages with no organic traffic for 90 days: improve or remove (don't let dead-weight pages dilute crawl budget).
- Update top 3 trafficked pages - refresh stats, add new screenshots, refresh the year in the title.
- Re-run Rich Results Test on all pages - schema spec changes faster than you'd expect.

### 7.3 CI/CD SEO gate
- `scripts/seo-lint.ts` (defined in 3.5) runs in `prebuild`. Build fails if any page regresses.
- A separate Vercel preview check fetches all sitemap URLs and asserts each returns 200 and has a unique `<title>`.

### 7.4 Schema versioning
- schema.org spec evolves. Pin to a known-good version in dev notes. Re-validate every quarter against https://validator.schema.org/.

---

## Reference: keyword strategy

Three tiers, mapped to current and future pages.

### Tier 1 - primary money keywords (high intent, our target)
| Keyword | Volume (US, est) | Difficulty | Page |
|---------|------------------|-----------|------|
| airdrop for windows | 27 100 | 38 | `/airdrop-alternative` |
| airdrop for android | 22 200 | 35 | `/airdrop-alternative` |
| send files phone to pc | 14 800 | 28 | `/` |
| transfer files without usb | 9 900 | 31 | `/use/transfer-photos-without-usb` |
| airdrop alternative | 8 100 | 42 | `/airdrop-alternative` |
| nearby share for windows | 6 600 | 34 | `/compare/quickbridge-vs-nearby-share` |
| send large files free | 12 100 | 55 | `/use/send-large-files-without-cloud` |

### Tier 2 - competitor terms (defensive + comparison)
| Keyword | Page |
|---------|------|
| snapdrop alternative | `/compare/quickbridge-vs-snapdrop` |
| pairdrop alternative | `/compare/quickbridge-vs-pairdrop` |
| wetransfer alternative no signup | `/compare/quickbridge-vs-wetransfer` |
| send anywhere alternative | `/compare/quickbridge-vs-send-anywhere` |

### Tier 3 - long-tail (blog + use-case)
- "how to send video from android to mac without losing quality"
- "transfer photos iphone to windows without itunes"
- "send file from phone to computer same wifi different network"
- "fastest way to share clipboard between phone and laptop"
- + every "site:reddit.com 'how do I send'" question that hits 100+ upvotes

Refresh the keyword sheet every quarter with Search Console data - real data beats third-party tools.

---

## Reference: on-page conventions

Every new page must follow these. Make them part of the SEO lint.

```ts
// One canonical pattern - copy this for every new route
const PAGE_TITLE = "<Keyword phrase> - <secondary> | QuickBridge";        // ≤ 60 chars
const PAGE_DESC  = "<150-160 chars: keyword + value prop + implicit CTA>";
const PAGE_URL   = "https://quickbridge.app/<slug>";
const PAGE_OG_IMAGE = "https://quickbridge.app/og-<slug>.png";

head: () => ({
  meta: [
    { title: PAGE_TITLE },
    { name: "description", content: PAGE_DESC },
    { name: "keywords", content: "primary kw, secondary kw, tertiary kw" },
    { property: "og:type", content: "article" },          // "website" for /
    { property: "og:title", content: PAGE_TITLE },
    { property: "og:description", content: PAGE_DESC },
    { property: "og:url", content: PAGE_URL },
    { property: "og:image", content: PAGE_OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: PAGE_TITLE },
    { name: "twitter:description", content: PAGE_DESC },
    { name: "twitter:image", content: PAGE_OG_IMAGE },
  ],
  links: [{ rel: "canonical", href: PAGE_URL }],
}),
```

**Heading rules:**
- Exactly one `<h1>` per page, matching the primary keyword phrase.
- `<h2>` for section headings, `<h3>` for subsections - never skip a level.
- Card / UI labels that look like headings should be `<p>` with appropriate visual class, not `<h3>`.

**Body rules:**
- Primary keyword in first 100 words.
- Body copy ≥ 600 words for a comparison/use-case page; ≥ 1500 for a blog post.
- Every image has `alt` describing the content (not the file name).
- Every internal link has descriptive anchor text (not "click here").

---

## Reference: structured data contracts

Every page emits at least one JSON-LD block. Required types:

| Page type | Required schema types |
|-----------|----------------------|
| Homepage | `WebApplication` + `HowTo` + `FAQPage` + (inherited) `Organization` + `WebSite` |
| Marketing landing (e.g. `/airdrop-alternative`) | `Article` + `FAQPage` + (inherited) `Organization` + `WebSite` |
| Comparison page | `Article` + `FAQPage` + `Product` (with `aggregateRating`) |
| Use-case page | `Article` + `HowTo` |
| Blog post | `Article` (with `datePublished`, `dateModified`, `author`) |
| Dynamic transfer pages (`/session/$id`, `/s/$id`) | None. `noindex,nofollow`. |

Every WebApplication / Product schema must include:
- `name`, `url`, `description`
- `applicationCategory`, `operatingSystem`, `browserRequirements`
- `offers` with `price`, `priceCurrency`, `availability`
- `featureList` (≥ 5 items)
- `aggregateRating` (only when you have real review data - never fake)
- `publisher` → Organization

Validate every change at https://validator.schema.org and https://search.google.com/test/rich-results before merge.

---

## Reference: monitoring + dashboards

Set up once; check weekly.

| Metric | Source | Target |
|--------|--------|--------|
| Indexed pages | Google Search Console | = sitemap count, no errors |
| Top organic queries | Search Console | Tier-1 keywords appear within 90 days |
| Avg CTR (top 10) | Search Console | ≥ 5% |
| Lighthouse Performance | Vercel Speed Insights | ≥ 90 mobile, ≥ 95 desktop |
| Lighthouse SEO | CI gate (3.5) | = 100 |
| LCP (75th percentile) | Vercel Speed Insights | ≤ 2.5 s |
| INP (75th percentile) | Vercel Speed Insights | ≤ 200 ms |
| CLS (75th percentile) | Vercel Speed Insights | ≤ 0.1 |
| Backlinks (referring domains) | Ahrefs / Moz Free / Majestic | +5 / month |
| Brand mentions | Google Alerts | +3 / month |
| Sitemap freshness | manual `<lastmod>` review | within 30 days |

---

## Out of scope (intentional)

- **AMP** - deprecated by Google for non-news, drains engineering, no upside.
- **Doorway pages / programmatic landing pages without unique content** - explicit Google penalty.
- **Reciprocal link schemes / paid PBN networks** - risk-to-reward is upside-down.
- **Cloaking based on user agent** - manual penalty if detected.
- **AI-generated bulk content with no editorial review** - Google's March 2024 spam update specifically targets this; skip.
- **Stuffing keywords into invisible elements / footer link farms** - ditto.

---

## Changelog

| Date | Change | By |
|------|--------|-----|
| 2026-04-25 | Initial roadmap. Phase 1 (P0+P1) shipped. | Engineering |
