# SEO Playbook: AI Search + E-E-A-T
**Author: Clive Makazhu** | Applies to: quickbridge.app, calmpc.com, calmclip.video, superk53.co.za

This document captures every SEO pattern implemented on QuickBridge and explains how to apply each one uniformly across all sites. The goal is consistent AI search visibility and strong E-E-A-T signals everywhere.

---

## Part 1: AI Search Optimization (ChatGPT Query Rewrites)

### Why this matters

ChatGPT, Perplexity, and Google AI Overviews do not search your exact page title. They rewrite the user's query into related phrases before searching. A user typing "send files phone to pc" becomes several rewrites: "best free file transfer tool 2026", "quickbridge review 2026", "airdrop alternative without account 2026". Your titles and descriptions need to match those rewrites, not just the original query.

### The core signals ChatGPT adds to rewrites

| Signal | Examples | Why |
|---|---|---|
| Year | 2026 | Filters for current information |
| Review intent | review, reviewed, rating | Evaluative queries |
| Best/Top intent | best, top, #1 | Recommendation queries |
| Alternative intent | alternative, instead of, without | Comparison queries |
| Free | free, no cost, no subscription | Value queries |
| Action | how to, guide, tutorial | Instructional queries |
| Negative | without X, no X, X not working | Problem-solving queries |

---

### Title formula (60 characters max)

**Compare pages:**
```
[Tool A] vs [Tool B] 2026: [Key differentiator]
```
Examples from QuickBridge:
- `QuickBridge vs WeTransfer 2026: No Upload, No Account`
- `QuickBridge vs AirDrop 2026: Best AirDrop Alternative for Windows`
- `QuickBridge vs FilePizza 2026: QR Pairing vs Link Sharing`

**How-to pages:**
```
How to [Task] [Year] ([Qualifier, Free])
```
Examples:
- `How to Send Files from Android to Mac 2026 (No App, Free)`
- `How to Transfer Files Without a USB Cable 2026 - Any Device`
- `How to Send Large Files from Phone to PC 2026 - Up to 10 GB`

**Landing / category pages:**
```
Best [Category] 2026: [Value prop] | [Brand]
```
Examples:
- `Best File Transfer Tools 2026: QuickBridge vs Alternatives`
- `How to Send Files Between Devices 2026 | QuickBridge`

**Adapting for each site:**

| Site | Title patterns to target |
|---|---|
| calmpc.com | `Best PC Health Checker 2026`, `How to Fix [Issue] 2026 (No Download)`, `PC Running Slow 2026: Browser Fix Guide` |
| calmclip.video | `Best Browser Video Editor 2026 (No Upload)`, `How to [Edit Task] Without Installing Software 2026`, `CalmClip vs [Competitor] 2026` |
| superk53.co.za | `Best K53 Practice Test 2026: DoT Certified`, `How to Pass K53 Learner Licence 2026 (Free Tests)`, `SuperK53 Review 2026: Real Exam Questions` |

---

### Description formula (140-160 characters)

The meta description is read by AI search engines as the authoritative summary of your page. Put the year and action words in the first 80 characters.

**Pattern:**
```
[Year] + [what the tool/page does] + [key differentiator] + [no X, free, no account].
```

Examples from QuickBridge:
```
WeTransfer uploads your files to the cloud and expires them in 3 days.
QuickBridge sends files directly between browsers. No upload, no account, no expiry.
```
```
2026 guides for every device combination: iPhone to Windows, Android to Mac,
phone to PC without USB. No install, no account, browser-only file transfer.
```

**Check length:** Count characters including spaces. 140 is the minimum to avoid truncation in AI snippets. 160 is the hard cut-off for Google.

---

### H1 rules

- One H1 per page, always.
- The H1 must include the year on every page site-wide. No exceptions based on writing style or tone.
- For two-part H1s (bright first line + muted second line), add "in 2026" to the muted second line if the first line does not already carry the year.
- For single-line H1s, append "2026" or "in 2026" directly.
- The only page where the year may be omitted from the H1 is the homepage hero, where the H1 is a pure product statement with no year signal.
- The H1 does not have to be identical to the title tag. The title tag can be more keyword-dense; the H1 can be more readable.
- On QuickBridge the H1 style is `font-black text-[32px] sm:text-[40px] md:text-[60px] tracking-tight`. Keep that pattern consistent.
- When auditing: check the rendered JSX, not just the PAGE_TITLE constant. The two are edited in separate places and can drift.

---

### First sentence / opening paragraph

The first visible sentence is what AI systems quote when summarising your page. It should answer the query immediately.

**Pattern:** State what the page is about, for whom, and why it is the right answer -- all in one sentence.

```
QuickBridge is the fastest way to send files between a phone and a PC in 2026:
scan the QR code, and the file travels directly browser-to-browser with no upload,
no account, and no install.
```

Avoid: "Welcome to...", "In this guide we will...", "If you are looking for..."

---

## Part 2: JSON-LD Structured Data

Structured data is how search engines and AI models build a machine-readable model of your page. Every page needs the right schema type. Below are the exact patterns used across the QuickBridge site.

---

### Article schema (compare pages, editorial pages)

Use on any page that makes a factual comparison or editorial judgment.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "QuickBridge vs WeTransfer 2026",
  "description": "...",
  "url": "https://yoursite.com/compare/tool-a-vs-tool-b",
  "mainEntityOfPage": "https://yoursite.com/compare/tool-a-vs-tool-b",
  "image": "https://yoursite.com/og-compare-toolb.png",
  "datePublished": "2026-05-16",
  "dateModified": "2026-06-15",
  "author": {
    "@type": "Person",
    "name": "Clive Makazhu",
    "url": "https://justc.live/",
    "image": "https://justc.live/clive-profile.jpg",
    "sameAs": ["https://quickbridge.app/about", "https://x.com/just_clive_sa"]
  },
  "publisher": {
    "@type": "Organization",
    "name": "YourSite",
    "logo": { "@type": "ImageObject", "url": "https://yoursite.com/icon-512.png" }
  }
}
```

**Key rule:** `headline` must include the year. `dateModified` must be updated every time you touch the page content.

---

### FAQPage schema (compare pages, help pages, landing pages)

Every compare page and help page should have this. It is the single highest-impact schema for AI Overview inclusion.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is [Tool] free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. [Tool] has no paid tier, no accounts, and no sign-up. [One sentence explaining why it is free]."
      }
    },
    {
      "@type": "Question",
      "name": "What is [Tool]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Tool] is a [category]. [One sentence on the core mechanism]. [One sentence on what it does NOT do that competitors do]. No account, no install."
      }
    },
    {
      "@type": "Question",
      "name": "How is [Tool] different from [Competitor]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The core difference is [X]. [Competitor] does [Y]. [Tool] does [Z] instead."
      }
    },
    {
      "@type": "Question",
      "name": "Who is [Tool] best for?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Tool] is best for [use case]. Choose [Competitor] when [different use case]."
      }
    }
  ]
}
```

**Minimum 3 questions per page.** Include "Is it free?", "What is it?", "Who is it best for?" on every page. Add page-specific questions on top.

---

### HowTo schema (how-to pages)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to send files from Android to Mac in 2026",
  "description": "Transfer files from an Android phone to a Mac without a USB cable, app, or account. Open both devices in a browser and scan the QR code.",
  "totalTime": "PT30S",
  "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
  "author": {
    "@type": "Person",
    "name": "Clive Makazhu",
    "url": "https://justc.live/",
    "sameAs": ["https://quickbridge.app/about", "https://x.com/just_clive_sa"]
  },
  "dateModified": "2026-06-15",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Step title", "text": "Step detail." },
    { "@type": "HowToStep", "position": 2, "name": "Step title", "text": "Step detail." },
    { "@type": "HowToStep", "position": 3, "name": "Step title", "text": "Step detail." }
  ]
}
```

---

### WebApplication / SoftwareApplication schema (tool homepages)

Use `WebApplication` for browser-based tools, `SoftwareApplication` for downloadable tools.

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "CalmPC",
  "url": "https://calmpc.com",
  "description": "Browser-based PC health checker with 73 step-by-step fix guides. All checks run locally, nothing sent to a server.",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web Browser",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "dateModified": "2026-06-15",
  "author": {
    "@type": "Person",
    "name": "Clive Makazhu",
    "url": "https://justc.live/",
    "image": "https://justc.live/clive-profile.jpg",
    "sameAs": ["https://quickbridge.app/about", "https://x.com/just_clive_sa"]
  },
  "publisher": {
    "@type": "Organization",
    "name": "CalmPC",
    "logo": { "@type": "ImageObject", "url": "https://calmpc.com/icon-512.png" }
  }
}
```

---

### WebPage schema (help, privacy, about, utility pages)

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "QuickBridge Help 2026: Transfers & Troubleshooting Guide",
  "description": "...",
  "url": "https://yoursite.com/help",
  "inLanguage": "en",
  "dateModified": "2026-06-15",
  "publisher": {
    "@type": "Organization",
    "name": "YourSite",
    "logo": { "@type": "ImageObject", "url": "https://yoursite.com/icon-512.png" }
  }
}
```

---

### BreadcrumbList schema (every page except homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://yoursite.com/" },
    { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://yoursite.com/compare" },
    { "@type": "ListItem", "position": 3, "name": "vs WeTransfer", "item": "https://yoursite.com/compare/vs-wetransfer" }
  ]
}
```

---

### Person schema (about page on every site -- the author identity anchor)

This is the most important schema for E-E-A-T. It must be **identical across all four sites**. Every field listed below must be present. This is what Google uses to build the Knowledge Graph entity for Clive Makazhu.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Clive Makazhu",
  "alternateName": "Just Clive",
  "url": "https://justc.live/",
  "image": "https://justc.live/clive-profile.jpg",
  "jobTitle": "Developer & Entrepreneur",
  "description": "Self-taught South African developer with 15 years of experience building privacy-first browser tools. Creator of QuickBridge, CalmPC, CalmClip, and SuperK53.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Johannesburg",
    "addressRegion": "GP",
    "addressCountry": "ZA"
  },
  "sameAs": [
    "https://quickbridge.app/about",
    "https://x.com/just_clive_sa",
    "https://github.com/Alcatecablee",
    "https://www.producthunt.com/@alcatec",
    "https://justc.live",
    "https://calmpc.com",
    "https://calmclip.video",
    "https://superk53.co.za"
  ],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "name": "CompTIA A+ Certification",
      "credentialCategory": "certification",
      "recognizedBy": { "@type": "Organization", "name": "CompTIA", "url": "https://www.comptia.org/" }
    },
    {
      "@type": "EducationalOccupationalCredential",
      "name": "CompTIA Network+ Certification",
      "credentialCategory": "certification",
      "recognizedBy": { "@type": "Organization", "name": "CompTIA", "url": "https://www.comptia.org/" }
    }
  ],
  "knowsAbout": [
    "Web Application Development",
    "WebRTC",
    "FFmpeg WebAssembly",
    "Privacy-First Software",
    "TypeScript",
    "React",
    "Node.js",
    "CompTIA A+",
    "CompTIA Network+",
    "IT Support"
  ]
}
```

**Rule:** Every time you add a new `sameAs` URL (a new site, a new social profile), update the Person schema on ALL sites simultaneously.

---

## Part 3: E-E-A-T Implementation

E-E-A-T stands for Experience, Expertise, Authoritativeness, Trustworthiness. Google weights Trust highest. Each signal requires both machine-readable (JSON-LD) and human-readable (visible on page) evidence.

---

### Experience

Evidence that the author has personal, first-hand use of what they are writing about.

**What to include on every about/bio page:**
- A first-person account of WHY the tool was built (the personal problem it solved)
- Specific technical decisions and the iteration history ("The QR code flow took four or five iterations...")
- Dates and version history to show sustained involvement
- Personal location and context (Johannesburg, South Africa)

**Example from QuickBridge about page:**
> "I built QuickBridge because every existing option for cross-device file transfer either required an account, an app install, a shared Wi-Fi network, or a file upload to a server I did not control. None of those felt right for moving a file from my phone to my laptop in the same room."

**Template for each site:**
- CalmPC: why you built a browser-based checker instead of a downloadable one; what problem you saw with existing tools
- CalmClip: why FFmpeg WASM instead of server-side processing; the privacy motivation
- SuperK53: first-hand experience with the K53 test; why the existing study material was inadequate

---

### Expertise

Evidence of specific skills and knowledge.

**In JSON-LD:** `knowsAbout`, `hasCredential`, `jobTitle` on the Person schema.

**Visible on page (about page):**
- Full name + credentials listed plainly: "CompTIA A+ and Network+ certified"
- Portfolio of projects (establishes breadth): QuickBridge, CalmPC, CalmClip, SuperK53
- Technical depth in writing (WebRTC, DTLS, STUN/TURN -- showing knowledge, not just claiming it)
- Years of experience: "15 years of experience"

**For SuperK53 specifically:** add a note that the platform is Department of Transport certified, which establishes domain authority for the K53 content.

---

### Authoritativeness

Evidence that others in your field recognise you.

**Signals already active:**
- Consistent cross-linking: every site links to justc.live, every site has the same sameAs graph
- Product Hunt profile (@alcatec)
- GitHub profile (Alcatecablee) -- public commit history proves ongoing development
- Twitter/X (@just_clive_sa) -- public profile with history

**Signals to add (future):**
- Press mentions: if any site gets a mention from a tech publication, add a visible "As seen in" note and an `mentions` field in the Organisation schema
- User count / usage stats on landing pages: "Used by X people" establishes scale without needing a third-party endorsement

---

### Trustworthiness

Evidence that the site is legitimate, accurate, and transparent.

**Every site must have:**
- [ ] Privacy page at `/privacy` -- explicitly states what data is collected (and ideally: none)
- [ ] About page at `/about` -- real name, real photo, real location, real credentials
- [ ] Contact method -- X, email, or contact form
- [ ] Sourced claims -- any factual comparison must cite the source with a date (see Sources sections on compare pages)
- [ ] HTTPS -- always
- [ ] No misleading claims -- "DoT certified" only on SuperK53 where it is true; "No upload" only where verified

**For compare pages specifically:** every competitor claim must trace to a source URL with a fetch date. The format used on QuickBridge:

```
WeTransfer Pricing page · verified 2026-04-28
https://wetransfer.com/pricing
```

This is both a trust signal for readers and a freshness signal for crawlers.

---

### Author byline pattern (visible on every article/how-to page)

Add a small visible byline below the H1 on any page that has an Article or HowTo schema. This makes E-E-A-T signals visible to human quality raters, not just crawlers.

```jsx
<p className="mt-2 text-[12px] text-muted-foreground">
  Updated June 2026
</p>
```

Keep the byline to the freshness signal only. Do not include an author name in the visible byline. The author attribution is carried by the JSON-LD `author` field and the Person schema on the about page.

**Status on QuickBridge:** present on all compare and how-to pages.

---

## Part 4: IndexNow

IndexNow is a protocol that submits URLs directly to Bing, Yandex, Naver, and Seznam immediately after a deploy. Google ignores IndexNow but it accelerates the other engines.

### Setup (one-time per site)

1. Generate a key at `https://www.bing.com/indexnow/getstarted` or use any random 32-character hex string.
2. Create a verification file at `public/<your-key>.txt` containing only the key string.
3. Create `scripts/indexnow-submit.mjs` (see QuickBridge implementation for the full script -- it reads all URLs from `public/sitemap.xml` and POSTs them in a single batch request).
4. Add to `package.json` postbuild: `"postbuild": "node scripts/gen-static-routes.mjs && node scripts/indexnow-submit.mjs"`

### Triggering manually

```bash
INDEXNOW_FORCE=1 node scripts/indexnow-submit.mjs
```

Run this every time you make a significant content change (title, description, body text, new page). Do not run it more than once per day on the same URL set -- the API rate-limits aggressive submissions.

### Keys per site

| Site | Key file location |
|---|---|
| quickbridge.app | `public/4339c4ef28ce47ce8facfaf922ebffe4.txt` |
| calmpc.com | Generate a new key |
| calmclip.video | Generate a new key |
| superk53.co.za | Generate a new key |

---

## Part 5: Per-site Checklist

Use this checklist when implementing these improvements on a new site. Check each item off in order.

### Phase 1: Titles and descriptions (30 minutes per site)

- [ ] Add 2026 to every PAGE_TITLE that does not already have it
- [ ] Add 2026 to every PAGE_DESCRIPTION that does not already have it  
- [ ] Check all titles are 60 characters or under
- [ ] Check all descriptions are 140-160 characters
- [ ] Add "free", "no account", "best", or "review" to relevant titles
- [ ] Update H1 text to match or complement the title (not duplicate it exactly)
- [ ] Confirm year appears in the H1 on all compare, category, about, and landing pages
- [ ] Audit the rendered JSX for the H1 directly -- the PAGE_TITLE constant and the visible H1 are in different parts of the file and drift independently
- [ ] Rewrite first visible paragraph to front-load the primary keyword and year

### Phase 2: JSON-LD (1-2 hours per site)

- [ ] Homepage: `WebApplication` or `SoftwareApplication` schema with `author`, `dateModified`, `offers`
- [ ] Article/compare pages: `Article` schema with `author`, `datePublished`, `dateModified`, `headline` (with year)
- [ ] How-to pages: `HowTo` schema with `author`, `dateModified`, numbered steps
- [ ] FAQ pages and compare pages: `FAQPage` schema with minimum 3 questions (What is it, Is it free, Who is it best for)
- [ ] Every page: `BreadcrumbList` schema
- [ ] About page: `Person` schema (use the canonical template in Part 2 above)
- [ ] About page: `WebPage` schema with `dateModified` and `author`
- [ ] Help / utility pages: `WebPage` schema with `dateModified`

### Phase 3: E-E-A-T (1 hour per site)

- [ ] About page visible content: first-person "why I built this" narrative
- [ ] About page visible content: credentials mentioned explicitly (CompTIA A+, Network+, 15 years)
- [ ] About page visible content: portfolio of other projects (all four sites cross-referenced)
- [ ] About page visible content: GitHub link, X link, Product Hunt link
- [ ] About page visible content: location (Johannesburg, South Africa)
- [ ] Privacy page exists at /privacy
- [ ] Sources cited on any factual comparison page (URL + fetch date)
- [ ] Person schema matches the canonical template exactly (same fields, same sameAs list)

### Phase 4: IndexNow (15 minutes per site)

- [ ] Generate key and add verification file to public/
- [ ] Add indexnow-submit.mjs script
- [ ] Add to postbuild in package.json
- [ ] Run once manually with INDEXNOW_FORCE=1 after completing phases 1-3

---

## Part 6: calmpc.com Specific Notes

**Core value prop for AI queries:** browser-based PC health checker, no download, no install, runs locally, 73 step-by-step fix guides, free.

**High-value title patterns:**
- `PC Running Slow in 2026? Free Browser Fix - No Download`
- `How to Speed Up a Slow PC 2026 (Browser-Based, Free)`
- `CalmPC Review 2026: 73 Fix Guides, No Install`
- `Best Free PC Health Checker 2026: CalmPC vs [Competitor]`

**FAQ questions to add:**
- "Is CalmPC free?" -- Yes, no account, no download.
- "Does CalmPC send data to a server?" -- No, all checks run locally in the browser.
- "What does CalmPC check?" -- 73 categories including startup, RAM, disk, drivers.
- "Is CalmPC safe?" -- All diagnostics run in the browser tab. Nothing is uploaded.

**E-E-A-T note:** the privacy angle (nothing sent to a server) is a strong trust signal. Make it the first sentence everywhere.

---

## Part 7: calmclip.video Specific Notes

**Core value prop for AI queries:** browser video editor, no upload, FFmpeg WebAssembly, Whisper AI captions, free.

**High-value title patterns:**
- `Best Browser Video Editor 2026: No Upload, No Install`
- `How to Edit Videos Without Software in 2026 (Free, In Browser)`
- `CalmClip Review 2026: FFmpeg WASM Video Editor`
- `How to Add Captions to a Video 2026 (AI, No Upload)`
- `CalmClip vs Clipchamp 2026: No Cloud Processing`

**FAQ questions to add:**
- "Does CalmClip upload my video?" -- No, FFmpeg runs in your browser via WebAssembly.
- "Is CalmClip free?" -- Yes, no account, no subscription.
- "What can CalmClip do?" -- Trim, caption (Whisper AI), blur faces, cut silence, denoise.
- "Is my video private?" -- Yes, your video never leaves your device.

**E-E-A-T note:** "powered by FFmpeg WebAssembly" is a strong expertise signal. Use that exact phrase in the title, H1, and first paragraph.

---

## Part 8: superk53.co.za Specific Notes

**Core value prop for AI queries:** DoT certified, free K53 practice tests, 64-question assessments, real exam format, DLTC directory.

**High-value title patterns:**
- `Best Free K53 Learner's Licence Practice Test 2026 (DoT Certified)`
- `SuperK53 Review 2026: Free K53 Tests, Official Format`
- `How to Pass K53 Learner's Licence Test 2026 (Free Prep)`
- `K53 Questions and Answers 2026: 64-Question Practice`

**FAQ questions to add:**
- "Is SuperK53 free?" -- Yes, all 64-question assessments are free.
- "Is SuperK53 DoT certified?" -- Yes, the platform is Department of Transport certified.
- "How is SuperK53 different from other K53 apps?" -- Real-time scoring, DLTC directory, official 64-question format.
- "What is the K53 test?" -- The K53 is the South African learner's licence theory test.

**E-E-A-T note:** "Department of Transport certified" is a domain-authority signal equivalent to a medical site citing a medical board. It must be in the title, H1, first paragraph, and the FAQPage schema. Include the official DoT reference if you have one.

**Local SEO note:** Add `geo.region` and `geo.placename` meta tags (superk53.co.za is South Africa-specific). Already done on justc.live:
```html
<meta name="geo.region" content="ZA-GP" />
<meta name="geo.placename" content="Johannesburg" />
```

---

## Validation Tools

After implementing on any site, run these checks:

| Tool | URL | What it checks |
|---|---|---|
| Google Rich Results Test | search.google.com/test/rich-results | FAQPage, HowTo, Article, VideoObject rendering |
| Schema.org Validator | validator.schema.org | All JSON-LD validity |
| Bing Webmaster Tools | bing.com/webmasters | IndexNow submission status, crawl errors |
| Google Search Console | search.google.com/search-console | Index coverage, Core Web Vitals |
| Open Graph Debugger | developers.facebook.com/tools/debug | OG image and title preview |
| Twitter Card Validator | cards-dev.twitter.com/validator | Twitter card preview |

---

## Quick Reference: What Changed on QuickBridge

Completed June 2026:

1. Added "2026" to all 19 PAGE_TITLE values that were missing it
2. Added "2026" to all 19 PAGE_DESCRIPTION values that were missing it
3. Added "review", "best", "free", "alternative" terms to relevant titles
4. Updated `dateModified` to `2026-06-15` on all 21 how-to and compare pages
5. Added `dateModified: "2026-06-15"` to 7 pages that had WebPage/CollectionPage/WebApplication/VideoObject JSON-LD without it
6. Added "2026" to all 8 Article JSON-LD `headline` fields on compare pages
7. Updated `PERSON_JSONLD` with `image`, `jobTitle`, `description`, `address`, and 3 additional `sameAs` entries
8. Added `author` field to `HOME_JSONLD` on the homepage
9. Updated about page visible content: 15 years experience, Johannesburg, portfolio of other projects, GitHub link
10. Ran IndexNow: 32 URLs submitted, HTTP 200
