---
name: Static HTML meta injection for SPA routes
description: QuickBridge uses gen-static-routes.mjs to pre-render per-route meta tags into static HTML files at build time, since TanStack Router head() only runs after JS loads.
---

# Static HTML meta injection

**Rule:** `gen-static-routes.mjs` must extract PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL, and PAGE_OG_IMAGE from each route's TSX source and inject them into the generated static HTML file before deploy.

**Why:** TanStack Router's `head()` API injects `<title>` and `<meta>` tags via JavaScript at runtime. Crawlers and AI search engines that read raw HTML (including ChatGPT browsing, Googlebot, and Bing) see only the SPA shell's default title — not the route-specific title. Before this fix, every route's static HTML had the same generic homepage title regardless of what the route-specific `PAGE_TITLE` constant said.

**How to apply:**
- Any time a new route is added to `src/routes/`, give it `PAGE_TITLE`, `PAGE_DESCRIPTION`, `PAGE_URL`, and (if applicable) `PAGE_OG_IMAGE` constants at the top of the file
- The gen-static-routes script extracts these with a regex: `const\s+PAGE_TITLE\s*=\s*(?:\n\s*)?["'`]([^"'`\n]+)["'`]`
- The script also strips any existing OG/canonical tags from the shell before injecting route-specific ones (to prevent duplicates from homepage defaults)
- Also update source `index.html` with the homepage title/description/OG tags (gen-static-routes skips `index.tsx`)
- Run `bun run build` to regenerate all static files; IndexNow submission happens automatically in postbuild
