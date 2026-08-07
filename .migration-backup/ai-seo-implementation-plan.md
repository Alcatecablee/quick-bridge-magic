# QuickBridge: AI Search Optimization Implementation Plan — ALL 4 TASKS COMPLETE (2026-05-16)

**Source:** Google "Optimizing your website for generative AI features on Google Search" (published 2026-05-15)
**Audit date:** 2026-05-16
**Rules:** Follow rules.md at all times. No em dashes. No rewrites. No assumptions. Minimal changes only.

---

## Background

Google's AI Overviews and AI Mode pull from the same Search index using the same ranking signals as classic organic search. No special AI markup exists. The gaps below are pure foundational SEO and structured data deficiencies that affect both AI citation and traditional ranking.

Research sources used for this audit:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (published 2026-05-15)
- https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing
- https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search
- Multiple third-party studies: iPullRank, Ahrefs, Quattr, SE Ranking (cited in audit document)

---

## TASK 1: Add datePublished and dateModified to all 8 compare page Article schemas

**Priority:** High
**Why:** All 8 compare pages have Article JSON-LD but no datePublished or dateModified. Pages updated within 30 days are cited at 3.2x the rate of undated pages. The how-to pages already use PUBLISHED/MODIFIED constants correctly. The compare pages do not.
**Risk:** Zero. Additive JSON-LD change only. No JSX or logic touched.

### Files and exact dates (derived from each page's SOURCES fetched field):

| File | PUBLISHED | MODIFIED |
|---|---|---|
| compare.quickbridge-vs-airdrop.tsx | 2026-04-28 | 2026-05-16 |
| compare.quickbridge-vs-filepizza.tsx | 2026-05-16 | 2026-05-16 |
| compare.quickbridge-vs-localsend.tsx | 2026-05-16 | 2026-05-16 |
| compare.quickbridge-vs-nearby-share.tsx | 2026-05-16 | 2026-05-16 |
| compare.quickbridge-vs-pairdrop.tsx | 2026-04-28 | 2026-05-16 |
| compare.quickbridge-vs-snapdrop.tsx | 2026-04-26 | 2026-05-16 |
| compare.quickbridge-vs-wetransfer.tsx | 2026-04-28 | 2026-05-16 |
| compare.quickbridge-vs-wormhole.tsx | 2026-04-28 | 2026-05-16 |

### Change per file (identical pattern):

Add two constants at the top of each file (after the existing PAGE_* constants):

```ts
const PUBLISHED = "YYYY-MM-DD";
const MODIFIED  = "YYYY-MM-DD";
```

Add two fields to each file's ARTICLE_JSONLD object:

```ts
datePublished: PUBLISHED,
dateModified:  MODIFIED,
```

### Acceptance criteria:

- All 8 compare pages render valid Article JSON-LD that includes datePublished and dateModified.
- Dates match the SOURCES fetched field for PUBLISHED; MODIFIED is 2026-05-16.
- No other lines in any file are touched.

---

## TASK 2: Add BreadcrumbList JSON-LD to all how-to and compare pages

**Priority:** Medium-High
**Why:** Every how-to and compare page has a visual breadcrumb rendered in JSX. None emit a BreadcrumbList JSON-LD block. Google uses this to understand site hierarchy and to generate sitelinks in classic search results. The visual breadcrumb is invisible to crawlers.
**Risk:** Zero. Additive JSON-LD only. One new script tag per page.

### Breadcrumb structure by page type:

**How-to pages** (15 pages):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickbridge.app/" },
    { "@type": "ListItem", "position": 2, "name": "How-to Guides", "item": "https://quickbridge.app/how-to" },
    { "@type": "ListItem", "position": 3, "name": "<page title short>", "item": "<PAGE_URL>" }
  ]
}
```

**Compare pages** (8 pages):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickbridge.app/" },
    { "@type": "ListItem", "position": 2, "name": "Comparisons", "item": "https://quickbridge.app/compare" },
    { "@type": "ListItem", "position": 3, "name": "<page title short>", "item": "<PAGE_URL>" }
  ]
}
```

### Implementation:

Add a `BREADCRUMB_JSONLD` constant to each page and render it as a second `<script type="application/ld+json">` tag in the component's head section, alongside the existing FAQ/HowTo/Article tags.

The position-3 `name` should be the short comparison label (e.g., "QuickBridge vs PairDrop") not the full PAGE_TITLE. The `item` field uses PAGE_URL which is already a constant in every file.

### Files to change:

How-to (15):
- how-to.send-files-android-to-mac.tsx
- how-to.send-files-android-to-windows.tsx
- how-to.send-files-iphone-to-mac.tsx
- how-to.send-files-iphone-to-windows.tsx
- how-to.send-files-phone-to-pc-free.tsx
- how-to.send-files-windows-to-android.tsx
- how-to.send-files-windows-to-iphone.tsx
- how-to.send-files-without-usb.tsx
- how-to.send-files-without-whatsapp.tsx
- how-to.send-large-files-phone-to-pc.tsx
- how-to.send-pdf-phone-to-pc.tsx
- how-to.send-photos-phone-to-pc.tsx
- how-to.send-videos-phone-to-pc.tsx
- how-to.share-clipboard-between-devices.tsx
- how-to.share-files-same-wifi.tsx

Compare (8):
- compare.quickbridge-vs-airdrop.tsx
- compare.quickbridge-vs-filepizza.tsx
- compare.quickbridge-vs-localsend.tsx
- compare.quickbridge-vs-nearby-share.tsx
- compare.quickbridge-vs-pairdrop.tsx
- compare.quickbridge-vs-snapdrop.tsx
- compare.quickbridge-vs-wetransfer.tsx
- compare.quickbridge-vs-wormhole.tsx

### Acceptance criteria:

- Each page emits a valid BreadcrumbList JSON-LD block with correct positions and URLs.
- The list matches the visual breadcrumb already rendered in JSX.
- No existing JSON-LD blocks are modified.
- No JSX outside the script tag is touched.

---

## TASK 3: Create /about page with Person schema

**Priority:** Medium
**Why:** No About or author page exists. Google added an Authors section to Search Central docs on 2026-02-01. The March 2026 core update amplified the first E in E-E-A-T (Experience). Pages authored by a verifiable human entity with external profile links now outrank pages attributed only to an Organization. The compare pages make factual third-party claims and need a citable human author behind them.
**Risk:** Low. New page only. No existing files touched except site-routes.ts, vite.config.ts, and sitemap.xml for wiring.

### Author entity (from user-provided links):

| Field | Value |
|---|---|
| Name | Clive |
| Twitter/X | https://x.com/just_clive_sa |
| GitHub | https://github.com/Alcatecablee |
| Personal site | https://justc.live/ |
| Product Hunt | https://www.producthunt.com/@alcatec |

### Person JSON-LD block:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Clive",
  "url": "https://quickbridge.app/about",
  "sameAs": [
    "https://x.com/just_clive_sa",
    "https://github.com/Alcatecablee",
    "https://justc.live/",
    "https://www.producthunt.com/@alcatec"
  ]
}
```

### Page content requirements:

- Short first-person bio explaining why QuickBridge was built and what the author knows about WebRTC file transfer. No fluff. Specific details only.
- Link to each external profile (X, GitHub, personal site, Product Hunt).
- No placeholder text. Production-ready on first implementation.
- Matches existing dark minimal design (same layout as how-to pages: AppHeader, SiteNav, content, SiteFooter).
- No em dashes anywhere on the page.

### Files to create or modify:

New:
- `src/routes/about.tsx` -- the About page with Person schema

Modify:
- `src/lib/site-routes.ts` -- add /about entry (inNav: false, appears in footer)
- `vite.config.ts` -- add "/about" to prerender pages array
- `public/sitemap.xml` -- add /about with lastmod 2026-05-16, priority 0.5, changefreq monthly

### Acceptance criteria:

- /about renders at https://quickbridge.app/about with its own canonical.
- Valid Person JSON-LD with all four sameAs URLs.
- Page includes a real, specific bio written in first person.
- Page is prerendered as static HTML by Vite.
- Sitemap and site-routes.ts updated.

---

## TASK 4: Update Article author markup to reference the Person entity

**Priority:** Medium (depends on Task 3 completing first)
**Why:** After the About page exists as a URL for the Person entity, the compare and how-to pages can reference it in their Article/HowTo author fields. Currently all pages use `"author": { "@type": "Organization", "name": "QuickBridge" }`. Swapping to a Person type with a URL allows Google to resolve the author to the verified entity page.
**Risk:** Low. Additive change to existing JSON-LD only.

### Change pattern (compare pages, ARTICLE_JSONLD):

Replace:
```json
"publisher": { "@type": "Organization", "name": "QuickBridge", ... }
```

Add alongside publisher (do not remove publisher):
```json
"author": {
  "@type": "Person",
  "name": "Clive",
  "url": "https://quickbridge.app/about"
}
```

### Change pattern (how-to pages, HOWTO_JSONLD):

Add to each HOWTO_JSONLD object:
```json
"author": {
  "@type": "Person",
  "name": "Clive",
  "url": "https://quickbridge.app/about"
}
```

### Files to change:

All 8 compare pages (same files as Task 1).
All 15 how-to pages.

### Acceptance criteria:

- All Article and HowTo schemas include an author field of type Person.
- The url in author points to https://quickbridge.app/about.
- publisher fields are unchanged.
- No other lines are modified.

---

## Implementation order

1. Task 1 -- compare page dates (8 files, zero risk, high impact)
2. Task 2 -- BreadcrumbList JSON-LD (23 files, zero risk, medium impact)
3. Task 3 -- /about page creation (3 file edits, 1 new file)
4. Task 4 -- author field on all Article/HowTo schemas (23 files, depends on Task 3)

---

## What is explicitly NOT changing

- No how-to or compare page prose is being rewritten.
- No component files are being modified.
- No WebRTC or Supabase signaling code is being touched.
- No design changes are being made.
- No new dependencies are being installed.
- The homepage structured data is not being modified (it already has Organization + WebSite + WebApplication + HowTo + FAQPage which is correct).

---

## Self-check (from rules.md)

- [x] Research completed before writing any code
- [x] Dates derived from existing SOURCES fetched fields in each file, not assumed
- [x] Author identity from user-provided links, not invented
- [x] Minimal changes only: additive JSON-LD, one new page, no rewrites
- [x] No em dashes anywhere in this document
- [x] No TODO comments or placeholder values
- [x] No WebRTC or signaling code touched
