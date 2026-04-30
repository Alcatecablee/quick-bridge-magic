#!/usr/bin/env node
/**
 * SEO lint - Phase 3.5 of SEO_ROADMAP.md.
 *
 * Reads every prerendered HTML file in dist/client/ and checks:
 *   1. <title> exists, <= 60 chars, unique across pages
 *   2. <meta name="description"> exists, 140-160 chars, unique
 *   3. exactly one <h1>
 *   4. heading hierarchy never skips a level (h1 -> h3 is invalid)
 *   5. <link rel="canonical"> exists and matches the page's expected URL
 *   6. >= 1 valid JSON-LD <script type="application/ld+json"> with @context + @type
 *
 * Exits non-zero on any failure so it gates the build via `postbuild`.
 *
 * Run standalone:  node scripts/seo-lint.mjs
 * Build chain:     npm run build  (postbuild calls this before indexnow-submit)
 */
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "client");
const SITE_URL = "https://quickbridge.app";

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

/** Map a built HTML file path to its canonical URL. */
function urlForFile(filePath) {
  const rel = path.relative(DIST, filePath).replace(/\\/g, "/");
  // dist/client/index.html        -> /
  // dist/client/foo/index.html    -> /foo
  // dist/client/foo/bar.html      -> /foo/bar
  if (rel === "index.html") return SITE_URL + "/";
  if (rel.endsWith("/index.html")) return SITE_URL + "/" + rel.slice(0, -"/index.html".length);
  return SITE_URL + "/" + rel.replace(/\.html$/, "");
}

/** Pull the first capture group of a single-match regex; returns null if not found. */
function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

/** Pull all matches of /g regex, returning the first capture group of each. */
function pickAll(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/** Decode a tiny set of HTML entities that show up in <title>/<meta>. */
function decode(s) {
  if (s == null) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "–");
}

/** Run all per-file checks and return { errors, title, description }. */
function lintHtml(html, expectedUrl) {
  const errors = [];

  // --- title
  const titleRaw = pick(html, /<title[^>]*>([^<]*)<\/title>/i);
  const title = decode(titleRaw);
  if (!title) {
    errors.push("missing <title>");
  } else if (title.length > TITLE_MAX) {
    errors.push(`title is ${title.length} chars (max ${TITLE_MAX}): "${title}"`);
  }

  // --- meta description
  const descRaw = pick(
    html,
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
  );
  const description = decode(descRaw);
  if (!description) {
    errors.push('missing <meta name="description">');
  } else if (description.length < DESC_MIN || description.length > DESC_MAX) {
    errors.push(
      `meta description is ${description.length} chars (target ${DESC_MIN}-${DESC_MAX}): "${description}"`,
    );
  }

  // --- canonical
  const canonical = pick(
    html,
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );
  if (!canonical) {
    errors.push('missing <link rel="canonical">');
  } else if (canonical !== expectedUrl) {
    errors.push(`canonical "${canonical}" does not match expected "${expectedUrl}"`);
  }

  // --- exactly one h1
  const h1s = pickAll(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  if (h1s.length === 0) errors.push("missing <h1>");
  else if (h1s.length > 1) errors.push(`found ${h1s.length} <h1> tags (must be exactly 1)`);

  // --- heading hierarchy (no jumps like h1->h3 or h2->h4)
  const headings = [];
  const headingRe = /<h([1-6])\b[^>]*>/gi;
  let hm;
  while ((hm = headingRe.exec(html)) !== null) headings.push(parseInt(hm[1], 10));
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr > prev + 1) {
      errors.push(`heading jump h${prev}->h${curr} at heading #${i + 1}`);
    }
  }

  // --- >= 1 valid JSON-LD block with @context + @type
  const jsonLdBlocks = pickAll(
    html,
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (jsonLdBlocks.length === 0) {
    errors.push('missing JSON-LD <script type="application/ld+json">');
  } else {
    jsonLdBlocks.forEach((raw, idx) => {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        errors.push(`JSON-LD block #${idx + 1} is not valid JSON: ${e.message}`);
        return;
      }
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item, j) => {
        const tag = `JSON-LD block #${idx + 1}${items.length > 1 ? `[${j}]` : ""}`;
        if (!item || typeof item !== "object") {
          errors.push(`${tag} is not an object`);
          return;
        }
        if (item["@context"] !== "https://schema.org" && item["@context"] !== "http://schema.org") {
          errors.push(`${tag} missing or wrong @context (got ${JSON.stringify(item["@context"])})`);
        }
        if (typeof item["@type"] !== "string" && !Array.isArray(item["@type"])) {
          errors.push(`${tag} missing @type`);
        }
      });
    });
  }

  return { errors, title, description };
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    // Node 20+: parentPath is the absolute parent dir. Fall back to path on older runtimes.
    .map((e) => path.join(e.parentPath ?? e.path ?? dir, e.name))
    .sort();
}

async function main() {
  const files = await listHtmlFiles(DIST);
  if (files.length === 0) {
    console.error(`[seo-lint] no HTML files found in ${DIST} - did the build run first?`);
    process.exit(1);
  }

  // Skip the SPA fallback - it's a copy of /index.html, not a unique page.
  const SKIP = new Set(["spa-shell.html", "_shell.html"]);
  const lintable = files.filter((f) => !SKIP.has(path.relative(DIST, f).replace(/\\/g, "/")));

  console.log(`[seo-lint] linting ${lintable.length} prerendered page(s)...`);

  const titles = new Map(); // value -> [pages]
  const descriptions = new Map();
  const failures = [];

  for (const file of lintable) {
    const url = urlForFile(file);
    const html = await readFile(file, "utf8");
    const { errors, title, description } = lintHtml(html, url);

    if (title) {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title).push(url);
    }
    if (description) {
      if (!descriptions.has(description)) descriptions.set(description, []);
      descriptions.get(description).push(url);
    }

    if (errors.length > 0) failures.push({ url, errors });
  }

  // --- uniqueness across pages
  for (const [title, urls] of titles) {
    if (urls.length > 1) {
      failures.push({
        url: "(cross-page)",
        errors: [`duplicate <title> "${title}" used by: ${urls.join(", ")}`],
      });
    }
  }
  for (const [desc, urls] of descriptions) {
    if (urls.length > 1) {
      failures.push({
        url: "(cross-page)",
        errors: [
          `duplicate meta description (first 60 chars: "${desc.slice(0, 60)}...") used by: ${urls.join(", ")}`,
        ],
      });
    }
  }

  if (failures.length === 0) {
    console.log(`[seo-lint] ✓ all ${lintable.length} page(s) passed`);
    return;
  }

  // Group output by page for readable diagnostics.
  const totalErrors = failures.reduce((n, f) => n + f.errors.length, 0);
  console.error(`\n[seo-lint] ✗ found ${totalErrors} issue(s):\n`);
  const byUrl = new Map();
  for (const f of failures) {
    if (!byUrl.has(f.url)) byUrl.set(f.url, []);
    byUrl.get(f.url).push(...f.errors);
  }
  for (const [url, errs] of byUrl) {
    console.error(`  ${url}`);
    for (const e of errs) console.error(`    - ${e}`);
  }
  console.error("");
  process.exit(1);
}

main().catch((e) => {
  console.error("[seo-lint] crashed:", e);
  process.exit(1);
});
