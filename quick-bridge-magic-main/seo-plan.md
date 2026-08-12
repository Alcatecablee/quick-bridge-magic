# QuickBridge SEO Action Plan

Generated from full codebase audit + Google Search Console data (last 3 months, ending May 2026).

---

## How to keep this file current

This is the single source of truth for SEO work. To update it, just tell the agent any of the following:

| What you can provide | What it unlocks |
|---|---|
| **GSC Coverage report** — paste or upload a new CSV (same format as the originals) | Updates P1.1 with the exact 3 redirect URLs; lets me fix or dismiss them precisely |
| **GSC Performance CSV** — new export after a title change ships | Lets me compare before/after CTR and position for P2.1 pages; marks items done if improvement is confirmed |
| **"Rich Results Test passed/failed"** — for any URL | Confirms P2.2 BreadcrumbList is parsed correctly; I update the status |
| **"URL Inspection says noindexed"** — for `/join` or `/video` | Confirms P2.4 is working in production; I mark it verified |
| **Vercel dashboard** — the 3 exact URLs from Coverage > "Page with redirect" | Closes P1.1 definitively |
| **"Page X is now ranking Y / getting clicks"** — anything you notice in GSC | I update the baseline metrics table and reprioritise open items |
| **"I've deployed"** or **"deployed on [date]"** | I update the `lastmod` dates in `sitemap.xml` (P3.3) to match the deploy date |
| **"Done", "skip this", or "not needed"** for any item | I mark it accordingly and move on |

You do not need to edit this file yourself. Just tell the agent what you observed and it will update the statuses.

---

## Baseline Metrics (GSC snapshot)

| Metric | Value |
|---|---|
| Total clicks | 11 |
| Total impressions | ~400 |
| Avg CTR | ~2.8% |
| Avg position | ~28 |
| Only converting page | `/` (homepage) |
| Biggest impression earner | `/airdrop-alternative` (95 imp, pos 32.78) |
| Nearest page 1 | `/compare/quickbridge-vs-airdrop` (53 imp, pos 5.66) |
| Mobile clicks | 0 |
| Desktop clicks | 11 |
| US impressions | 160 — 0 clicks (avg pos 20.92) |

---

## Priority 1 — Blocking or Actively Misleading Google

### P1.1 Fix the 3 "Page with redirect" (GSC Coverage FAILED)
- **Status:** [x] Resolved
- **Root cause 1 (Domain Consolidation):** URLs like `http://quickbridge.app/` and `https://www.quickbridge.app/` correctly 308 to `https://quickbridge.app/`. This is standard canonical domain hygiene.
- **Root cause 2 (Vercel Index Redirects):** The recent "Validation Failed" report (since 7/1/26) includes multiple `/how-to` pages like `https://quickbridge.app/how-to/send-videos-phone-to-pc`. These returned a 308 redirect because `gen-static-routes.mjs` was generating `.../index.html` files. Vercel's standard web behavior redirects requests for `/folder` to `/folder/` when it contains an `index.html`. Since we also have `"trailingSlash": false`, Vercel immediately redirects `/folder/` back to `/folder`. This directory index + cleanUrls conflict causes continuous 308s. The URLs with query params (`/?utm_content=...`, `/?q=...`) are also 308ing, either due to being crawled on HTTP initially or stripped by the client-side router.
- **Fix applied:** Modified `scripts/gen-static-routes.mjs` to generate flat `.html` files (e.g. `how-to.html` instead of `how-to/index.html`). When `cleanUrls: true` is on, Vercel natively serves `foo.html` cleanly at `/foo` without triggering the directory index 308 redirect. `seo-lint.mjs` was verified to already support flat `.html` paths.
- **Action:** In GSC Coverage, click "Validate Fix" on this group. It will reset the FAILED badge and gradually process the corrected routing for the `how-to` URLs.

### P1.2 Remove fake `SearchAction` from site-wide JSON-LD
- **Status:** [x] Done
- **Root cause:** `WEBSITE_JSONLD` in `__root.tsx` had a `potentialAction: SearchAction` pointing to `/?q={search_term_string}`. QuickBridge has no search feature. Structured data that misrepresents functionality is a manipulation risk.
- **Fix applied:** Removed `potentialAction` block. `WEBSITE_JSONLD` now only declares `@type: WebSite`, `name`, and `url`.
- **File:** `src/routes/__root.tsx`

### P1.3 Add `og:image` to `/about`
- **Status:** [x] Done
- **Root cause:** `about.tsx` had zero `og:image` or `twitter:image` tags. Social shares and link preview crawlers fell back to the root's generic fallback with no explicit declaration.
- **Fix applied:** Added `og:image`, `og:image:alt`, `og:image:width`, `og:image:height`, and `twitter:image` to the route `head()`.
- **File:** `src/routes/about.tsx`

### P1.4 Dismiss "Alternate page with proper canonical tag" (www URLs)
- **Status:** [x] Resolved — no code change needed, dismissed
- **Root cause confirmed (from GSC CSV):** A validation failure was reported for `Alternate page with proper canonical tag` on several `https://www.quickbridge.app/...` URLs. This is standard domain consolidation. Google correctly crawls the `www` versions, sees they canonicalize (and 308 redirect) to the root `https://quickbridge.app/` domain, and correctly marks them as alternates so they aren't indexed twice.
- **Action taken:** None required. Validation "fails" in GSC because the status (being an alternate) remains permanently true. This is exactly what we want. You can safely ignore this warning.

### P1.5 Fix "Redirect error" (Infinite loops on ?ref=)
- **Status:** [x] Done
- **Root cause:** `vercel.json` contained a `redirects` block attempting to strip `?ref=` query parameters by redirecting `/` to `/`. However, Vercel preserves query parameters by default during redirects. This created an infinite 308 redirect loop (`/?ref=calmpc` -> `/?ref=calmpc` -> ...), which Google correctly flagged as a "Redirect error". The `http://www.quickbridge.app/` URL in the same report was likely caught in a transient 2-hop domain consolidation chain, but is not structurally broken.
- **Fix applied:** Removed the broken `redirects` block from `vercel.json`. The client-side router (TanStack Router) already naturally strips unknown search parameters via `replaceState`, so the server-side redirect was unnecessary.
- **Action:** In GSC, click "Validate Fix" for the "Redirect error" report.

---

## Priority 2 — High-Leverage CTR and Ranking

### P2.1 Rewrite titles for near-page-1 compare pages
- **Status:** [x] Done
- **Pages:** `/compare/quickbridge-vs-airdrop`, `/compare/quickbridge-vs-pairdrop`, `/compare/quickbridge-vs-snapdrop`, `/why-quickbridge`
- **New titles applied:**
  - vs-airdrop: `AirDrop for Windows: Why It Doesn't Exist and What Works Instead | QuickBridge`
  - vs-pairdrop: `QuickBridge vs PairDrop: Cross-Network vs Same-Wi-Fi Only | QuickBridge`
  - vs-snapdrop: `QuickBridge vs Snapdrop: Send Files Across Networks, Not Just Same Wi-Fi | QuickBridge`
  - why-quickbridge: `Why QuickBridge: Send Files Phone to PC Without an App or Upload | QuickBridge`
- **To verify:** After next deploy, use Google Search Console > URL Inspection on each URL to confirm Google has picked up the new titles. Allow 1-2 weeks for GSC position data to reflect CTR changes.

### P2.2 Add BreadcrumbList to 4 missing marketing pages
- **Status:** [x] Done
- **Pages:** `/airdrop-alternative`, `/why-quickbridge`, `/help`, `/privacy`
- **Fix applied:** Added `BREADCRUMB_JSONLD` constant and `<script type="application/ld+json">` injection to all four files.
- **To verify:** Use Google's Rich Results Test on each URL after deploy. BreadcrumbList should appear as a detected item.

### P2.3 Fix Article author: Organization → Person on 2 pages
- **Status:** [x] Done
- **Pages:** `airdrop-alternative.tsx`, `why-quickbridge.tsx`
- **Fix applied:** Changed `author` from `{ "@type": "Organization", name: "QuickBridge" }` to `{ "@type": "Person", name: "Clive", url: "https://quickbridge.app/about" }` on both.

### P2.4 Noindex `/join`
- **Status:** [x] Done
- **Fix applied:** Added `{ name: "robots", content: "noindex, follow" }` to `join.tsx` head().
- **To verify:** After deploy, use GSC > URL Inspection on `https://quickbridge.app/join` — it should show "URL is not on Google" within a few weeks.

### P2.5 Sharpen file-size FAQ for featured snippet
- **Status:** [x] Done
- **Target:** Query `"there is no limit on the size of files..." airdrop` at position 3.88, 17 impressions.
- **Fix applied:** Rewrote the "What is the file size limit?" answer in `airdrop-alternative.tsx` to open with a direct comparison sentence: "QuickBridge imposes no AirDrop-style proximity or platform restriction on what you can send..." — structured for featured snippet extraction.
- **To verify:** In 2-4 weeks, check if the `/airdrop-alternative` page earns a featured snippet for file-size-related AirDrop queries in GSC.

---

## Priority 3 — Structural (This Month)

### P3.1 Create `/compare` hub page
- **Status:** [x] Done
- **Fix applied:** Created `src/routes/compare.index.tsx` with `createFileRoute('/compare/')`. Hub lists all 8 comparisons using `COMPARE_ROUTES` from `site-routes.ts`. Includes `BreadcrumbList` + `CollectionPage` JSON-LD. Added to `vite.config.ts` prerender list at priority 0.8 and to `sitemap.xml` with `lastmod 2026-05-31`.
- **Bonus:** Visual breadcrumb "Compare" spans in all 8 child pages updated to `<Link to="/compare">` now that the hub exists.
- **To verify:** After deploy, use Google Rich Results Test on any compare page — the BreadcrumbList should now show all three levels (Home / Compare / vs X) with working links.

### P3.2 Create `/how-to` hub page
- **Status:** [x] Done
- **Fix applied:** Created `src/routes/how-to.index.tsx` with `createFileRoute('/how-to/')`. Hub groups all 15 guides into 4 device-pair sections using `HOW_TO_ROUTES` from `site-routes.ts`. Includes `BreadcrumbList` + `CollectionPage` JSON-LD. Added to `vite.config.ts` prerender list at priority 0.8 and to `sitemap.xml` with `lastmod 2026-05-31`.
- **Bonus:** Visual breadcrumb "How-to" spans in all 15 child pages updated to `<Link to="/how-to">` now that the hub exists.

### P3.3 Update sitemap `lastmod` dates
- **Status:** [x] Done (deployed 2026-05-31)
- **Updated to 2026-05-31:** `/airdrop-alternative`, `/why-quickbridge`, `/compare/quickbridge-vs-snapdrop`, `/compare/quickbridge-vs-airdrop`, `/compare/quickbridge-vs-pairdrop`, `/help`, `/privacy`, `/compare` (new), `/how-to` (new).
- **Also:** Removed `/join` from sitemap (page is now noindexed; noindexed pages should not appear in sitemap).

### P3.4 Add dedicated OG images for top how-to pages
- **Status:** [x] Done (all 16 pages)
- **Issue:** All 15 how-to pages and the how-to hub used the generic `/og-image.png`. Compare pages have dedicated OG images. Social shares of how-to pages were visually generic.
- **Fix applied:** Added 16 new `compose()` entries to `scripts/build-og-images.mjs` using semantically matched existing motifs. Generated 16 new 1200x630 PNG files in `public/`. Added `PAGE_OG_IMAGE` constant to all 16 how-to routes and wired it into `og:image` and `twitter:image` in each `head()`.
- **Files generated:**
  - `og-how-to.png` (hub) — scanSendMotif
  - `og-howto-iphone-to-windows.png` — devicePairMotif
  - `og-howto-android-to-windows.png` — devicePairMotif
  - `og-howto-iphone-to-mac.png` — scanSendMotif
  - `og-howto-android-to-mac.png` — osChipGrid
  - `og-howto-windows-to-android.png` — devicePairMotif
  - `og-howto-windows-to-iphone.png` — devicePairMotif
  - `og-howto-send-photos.png` — devicePairMotif
  - `og-howto-send-large-files.png` — speedBarsMotif
  - `og-howto-no-usb.png` — crossNetworkMotif
  - `og-howto-no-whatsapp.png` — privacyDirectMotif
  - `og-howto-send-free.png` — noUploadMotif
  - `og-howto-send-videos.png` — speedBarsMotif
  - `og-howto-send-pdf.png` — devicePairMotif
  - `og-howto-clipboard.png` — qrSessionMotif
  - `og-howto-same-wifi.png` — networkReachMotif
- **To verify:** After deploy, use Twitter Card Validator or LinkedIn Post Inspector on any how-to URL to confirm the dedicated image appears.

---

## Priority 4 — Content Depth (Ongoing)

### P4.0 Voice and content distinctiveness (Done)
- **Status:** [x] Done (all three editorial pages including homepage)
- **Issue:** Two editorial pages (`airdrop-alternative`, `why-quickbridge`) had structural AI tells: identical pain lists, same triple-negative hero pattern on every page, generic FAQ opener ("What is QuickBridge?") as item 1, and feature card titles with no specificity ("Built for speed", "No middleman"). The homepage (`index.tsx`) had the same patterns and was missed in the original pass.
- **Changes made:**
  - `airdrop-alternative.tsx`: Replaced generic hero description with copy specific to the Apple lock-in problem. Replaced 4 generic pain items (duplicated from why-quickbridge) with cross-platform-specific items. Reordered FAQ so the page-specific question ("Is QuickBridge a real AirDrop alternative?") leads, and the generic "What is QuickBridge?" moves to the end.
  - `why-quickbridge.tsx`: Reordered FAQ so "Why is QuickBridge faster than email or cloud upload?" leads. Replaced generic section heading "There is a simpler way" with "QuickBridge cuts out the upload step entirely". Replaced WHY_BLOCKS card titles ("Built for speed / Files move directly / No middleman") with specific equivalents ("No upload, so no waiting / Browser to browser, nothing in between / Nothing stored on any server").
  - `index.tsx` (homepage): Replaced triple-negative hero lead ("No apps. No cables. No upload step...") with experience-first copy ("Open the site on any device, scan the QR on the other, and you are connected..."). Replaced "No middleman" Why card title with "Nothing stored on any server" (consistent with why-quickbridge fix). Reordered FAQ so "Where do my files go?" leads and "What is QuickBridge?" moves to the end. Replaced "How it works" h2 "Three steps. No setup. No accounts." with "Open. Scan. Send. Under five seconds." (experience-first). Replaced "There is a simpler way." lead ending with "QuickBridge cuts out the upload step entirely." (same fix applied to why-quickbridge). Replaced three generic Features card titles: "Direct peer-to-peer" to "Streams browser to browser", "Cross-platform" to "Android, iPhone, Windows, Mac, Linux", "More than files" to "Text, links, and clipboard too".
- **What was kept:** The compare pages were assessed as the strongest content on the site and left untouched. The great individual sentences in why-quickbridge ("We all do it.", "Somehow, in 2026", "All of them work, eventually. None of them feel fast.") were preserved exactly.

### P4.1 Investigate mobile: 0 clicks
- **Status:** [x] Done
- **Issue:** QuickBridge's core use case is phone-to-PC, but mobile users generate 0 clicks vs desktop's 11. Check Mobile Usability in GSC. Examine whether compare/how-to pages rank differently on mobile SERPs. Review title/description copy for mobile-specific intent signals.
- **Findings:**
  - Mobile meta tags: correct (viewport, theme-color, apple-mobile-web-app-capable, manifest all present). No technical mobile issue.
  - PWA manifest: correct (orientation: "any", display: "standalone", all icon sizes present).
  - JSON-LD: all HowTo schemas use `description: PAGE_DESCRIPTION` directly, so fixing PAGE_DESCRIPTION also fixes the JSON-LD in one edit.
  - Root cause: every phone-to-PC how-to description described the transfer in third person but never signalled to the mobile searcher that they are already on the right device and can start right now. Someone on their Android phone seeing "Opens in your browser on both devices" gets no confirmation that they are the phone side.
  - Pages already correct (not changed): `windows-to-android` ("scan the QR on your phone, done") and `windows-to-iphone` ("scan the QR, and the file is there") already had phone-action language because the phone is receiving.
  - Compare page descriptions were left untouched - these are desktop research-intent queries.
- **Changes made:** Updated PAGE_DESCRIPTION on 13 pages to open with "Open this on your [Android phone / iPhone / phone]..." confirming mobile searcher is already on the right device:
  - `how-to.send-files-android-to-windows.tsx`
  - `how-to.send-files-iphone-to-windows.tsx`
  - `how-to.send-files-android-to-mac.tsx`
  - `how-to.send-files-iphone-to-mac.tsx`
  - `how-to.send-photos-phone-to-pc.tsx`
  - `how-to.send-large-files-phone-to-pc.tsx`
  - `how-to.send-files-phone-to-pc-free.tsx`
  - `how-to.send-files-without-usb.tsx`
  - `how-to.send-videos-phone-to-pc.tsx`
  - `how-to.send-pdf-phone-to-pc.tsx`
  - `how-to.send-files-without-whatsapp.tsx`
  - `how-to.share-files-same-wifi.tsx`
  - `how-to.share-clipboard-between-devices.tsx`
  - `airdrop-alternative.tsx` (strengthened from "Works in any modern browser" to "Open this on your Android phone or Windows PC - scan the QR and files transfer in seconds")

### P4.1b Internal linking — RelatedPages curated map
- **Status:** [x] Done
- **Issue:** All 25 content pages had `<RelatedPages>` wired in but the component auto-picked the same first 4 compare pages from the registry for every page regardless of relevance. No curated cross-linking existed between related how-to pages, compare pages, or editorial pages.
- **Findings:** The `RelatedPages` component existed in `src/components/quickbridge/RelatedPages.tsx` and was already imported and called on all 25 pages. The component used an auto-pool (`visible(COMPARE_ROUTES) + visible(USE_CASE_ROUTES) + visible(HOW_TO_ROUTES)`) sliced to the first 4 — producing identical output on every page. Card style used bare `<a>` tags instead of the hub card grid style.
- **Changes made:** Rewrote `RelatedPages.tsx` (single file change, zero route file changes needed):
  - Added `RELATED` map with 4 curated hrefs for every one of the 25 content pages — ordered by relevance (reciprocal pairs, contextually related compare pages, same device family)
  - Updated render to use hub card style: `Card` + `Link to={r.href as never}`, `h3` title, `p` teaser, "Read guide →" affordance — matches hub page grid exactly
  - Removed auto-pool fallback; component now renders nothing if a page has no entry in the map
- **Pages covered:** 15 how-to pages, 8 compare pages, 2 editorial pages (airdrop-alternative, why-quickbridge)

### P4.2 Remove dead `/use/*` registry entries
- **Status:** [x] Done
- **Issue:** 7 routes were registered in `site-routes.ts` with `inNav: false` but no route files existed — 404s for any visitor who navigated to them.
- **Findings:**
  - Not in sitemap — Google was never told about them, so no deindexing needed.
  - All `inNav: false` — `visible()` returned an empty array, so nothing appeared in nav or footer.
  - 5 of 7 directly overlap live how-to pages that already rank (iphone-to-windows, android-to-mac, windows-to-android/iphone, large-files, clipboard). Building them would create cannibalisation.
  - 2 unique angles (Windows-Mac, laptop-to-laptop offline) have no keyword research data in seo-plan, so rules.md prohibits building without that foundation.
  - `USE_CASE_ROUTES` was imported but produced no output in `SiteNav` (no "Use cases" dropdown ever appeared) and `SiteFooter` (conditional `useCases.length === 0` always true).
  - `RelatedPages` had already removed the `USE_CASE_ROUTES` auto-pool reference in P4.1b.
- **Changes made:**
  - Removed `USE_CASE_ROUTES` array from `site-routes.ts`
  - Removed it from `ALL_MARKETING_ROUTES`
  - Removed import + `useCases` variable + "Use cases" dropdown from `SiteNav.tsx` (desktop nav and mobile sheet)
  - Removed import + `useCases` variable + conditional footer column from `SiteFooter.tsx`
- **What did not change:** Nav, footer, and sitemap all look identical to before — nothing was ever visible.

### P4.3 Nav + footer restructure for internal linking
- **Status:** [x] Done
- **Issue:** Header had two dropdowns with 10+ items each. Footer listed only Compare (8 pages) with no How-to links. How-to pages (the main US-ranking content) received no footer internal links at all — reducing their crawl authority.
- **Findings:**
  - Dropdowns with 15 items are bad UX on mobile and waste high-authority header link slots on long-tail pages that belong in the footer.
  - Google weights nav links more than footer links — hub pages (`/how-to`, `/compare`) deserve the header slot; individual articles belong in the footer.
  - `/how-to` hub and all 15 how-to pages had zero footer presence — the biggest gap.
  - Build was also blocked by `seo-lint` (postbuild script exits code 1 on Vercel): 9 pre-existing issues found and fixed — 4 over-length titles, 2 missing canonical `<link>` tags in hub pages (used wrong meta format), 2 descriptions 1-2 chars under 140-char floor, 1 description 6 chars over 160-char ceiling.
- **Changes made:**
  - `SiteNav.tsx`: Replaced "How-to" and "Compare" dropdowns with flat `<a>` links to the hub pages. Removed all dropdown UI (DropdownMenu imports, NavDropdown function, ChevronDown icon, COMPARE_ROUTES/HOW_TO_ROUTES imports). MobileNav simplified to a single Pages group with Home, primary routes, and flat hub links.
  - `SiteFooter.tsx`: Grid widened from `lg:grid-cols-4` to `lg:grid-cols-5`. Added "How-to" column listing all 15 how-to routes. Kept "Compare" column with all 8 compare routes. Removed unused `FooterColumn` helper.
  - Title shortened (all were over 60 chars, seo-lint failure): `compare.quickbridge-vs-airdrop`, `compare.quickbridge-vs-pairdrop`, `compare.quickbridge-vs-snapdrop`, `why-quickbridge`.
  - Canonical fixed (used `meta name="canonical"` instead of `link rel="canonical"`): `compare.index.tsx`, `how-to.index.tsx`.
  - Description length fixed (outside 140-160 window): `how-to.index.tsx` (trimmed 6 chars), `how-to.send-files-iphone-to-windows.tsx` (added "Free." +6), `how-to.share-clipboard-between-devices.tsx` (added "Free." +6).
- **Build result:** `[seo-lint] ✓ all 32 page(s) passed` — clean Vercel deploy.

### P4.4 US market: 160 impressions, 0 clicks
- **Status:** [ ] Open — awaiting GSC data post-deploy
- **Issue:** US is the largest impression market at avg position 20.92. Positions are too low to convert. 0 clicks from 160 impressions means pages sit at the bottom of page 2 on US SERPs.
- **What was done:** P4.3 nav/footer restructure adds internal link weight to all 15 how-to pages for the first time. P2.1 titles for near-page-1 compare pages were already improved. P4.1 fixed descriptions for mobile US searchers.
- **What would unlock more action:** GSC query-level breakdown for US specifically — which queries drive those 160 impressions and which pages rank at what positions. Without that, we risk optimising for the wrong queries.
- **Hypothesis:** iPhone-to-Windows and Android-to-Windows how-to pages are the primary US drivers (both device combinations are common in the US). If those two pages move from position ~20 to ~10 after the footer linking takes effect (4-8 weeks), that alone should generate clicks.
- **Trigger:** Re-check GSC in 4-6 weeks after deploy. If positions have not moved, deeper content on those two pages is the next lever.

---

## What is Already Good (Do Not Change)

- Robots.txt: correctly structured, AI bots explicitly allowed, sitemap declared
- Sitemap: 30 URLs, image sitemaps included, correct `<priority>` hierarchy
- `__root.tsx`: full OG + Twitter card stack, HSTS header, per-page canonical override, async font loading (non-render-blocking)
- All compare pages: Article + FAQPage + BreadcrumbList JSON-LD, sourced claims, inline source table
- All how-to pages: HowTo + FAQPage + BreadcrumbList JSON-LD, HowToStep array, Person author
- Security headers: HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy all present in `vercel.json`
- Rendering: TanStack Start SSG prerendering — crawlers receive real HTML, no JS execution required
