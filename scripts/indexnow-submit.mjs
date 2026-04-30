// Posts every <loc> URL from public/sitemap.xml to IndexNow on deploy.
// Bing, Yandex, Naver, Seznam ingest within minutes. Google ignores IndexNow.
//
// Runs automatically via the `postbuild` npm script on Vercel deploys.
// Skipped on local builds unless INDEXNOW_FORCE=1.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY = "4339c4ef28ce47ce8facfaf922ebffe4";
const HOST = "quickbridge.app";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const SITEMAP_PATH = resolve(__dirname, "../public/sitemap.xml");

function isLiveBuild() {
  if (process.env.INDEXNOW_FORCE === "1") return true;
  // Vercel sets VERCEL=1 and VERCEL_ENV=production for prod deploys.
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

async function extractUrls() {
  const xml = await readFile(SITEMAP_PATH, "utf8");
  const matches = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)];
  // Only top-level <url><loc>; skip <image:loc> entries.
  return [...new Set(matches.map((m) => m[1]).filter((u) => !/\.(png|jpe?g|webp|gif|svg)$/i.test(u)))];
}

async function main() {
  if (!isLiveBuild()) {
    console.log("[indexnow] skipped - not a Vercel production build (set INDEXNOW_FORCE=1 to override)");
    return;
  }

  let urlList;
  try {
    urlList = await extractUrls();
  } catch (err) {
    console.warn(`[indexnow] could not read sitemap: ${err.message}`);
    return;
  }

  if (urlList.length === 0) {
    console.log("[indexnow] no URLs found in sitemap, skipping");
    return;
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // 200 OK or 202 Accepted = success. Anything else = log and move on.
    if (res.ok) {
      console.log(`[indexnow] submitted ${urlList.length} URLs → HTTP ${res.status}`);
    } else {
      const txt = await res.text().catch(() => "");
      console.warn(`[indexnow] HTTP ${res.status} - ${txt.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[indexnow] request failed: ${err.message}`);
  }
}

// Never fail the build, regardless of what happens.
main().catch((err) => {
  console.warn(`[indexnow] unexpected error: ${err.message}`);
});
