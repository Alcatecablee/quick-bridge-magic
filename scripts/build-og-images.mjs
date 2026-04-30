import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "../public");

const W = 1200;
const H = 630;

const BG = "#0a0d14";
const BG_2 = "#0f1623";
const CYAN = "#1de9ff";
const CYAN_SOFT = "#1de9ff";
const GREEN = "#22ff9e";
const TEXT = "#f3f6fa";
const MUTED = "#8b97a8";
const RULE = "#1b2435";

const FONT_STACK =
  "Inter, 'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function escape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function frame(innerSvg) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG}"/>
      <stop offset="1" stop-color="${BG_2}"/>
    </linearGradient>
    <linearGradient id="cyanGreen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${CYAN}"/>
      <stop offset="1" stop-color="${GREEN}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${CYAN}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ffffff" stroke-opacity="0.025" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <circle cx="${W - 120}" cy="${H - 80}" r="320" fill="url(#glow)"/>
  ${innerSvg}
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#cyanGreen)"/>
</svg>`;
}

function header() {
  // Logo + wordmark are composited as PNGs (see compose()).
  // This SVG block reserves the visual region but draws nothing.
  return ``;
}

function footer(domain = "quickbridge.app") {
  return `
  <g font-family="${FONT_STACK}" font-weight="500">
    <text x="64" y="${H - 44}" fill="${MUTED}" font-size="22" letter-spacing="0.5">${domain}</text>
  </g>`;
}

function headlineBlock({ eyebrow, line1, line2, sub }) {
  // Two-line headline kept inside the left column (x: 64 .. 660) so it never
  // collides with the right-column motif (x: 720+).
  return `
  <g font-family="${FONT_STACK}">
    <text x="64" y="280" fill="${CYAN}" font-size="20" font-weight="700" letter-spacing="6">${escape(eyebrow.toUpperCase())}</text>
    <text x="64" y="352" fill="${TEXT}" font-size="54" font-weight="800" letter-spacing="-1.2">${escape(line1)}</text>
    ${line2 ? `<text x="64" y="416" fill="${TEXT}" font-size="54" font-weight="800" letter-spacing="-1.2">${escape(line2)}</text>` : ""}
    ${sub ? `<text x="64" y="${line2 ? 470 : 396}" fill="${MUTED}" font-size="22" font-weight="500">${escape(sub)}</text>` : ""}
  </g>`;
}

function devicePairMotif(x, y) {
  // Phone (left) + monitor (right) connected by a cyan motion line.
  return `
  <g transform="translate(${x},${y})">
    <!-- phone -->
    <rect x="0" y="20" width="120" height="200" rx="20" fill="none" stroke="${CYAN}" stroke-width="4"/>
    <rect x="14" y="38" width="92" height="150" rx="6" fill="${CYAN}" fill-opacity="0.08"/>
    <circle cx="60" cy="206" r="4" fill="${CYAN}"/>
    <!-- monitor -->
    <rect x="220" y="0" width="240" height="160" rx="10" fill="none" stroke="${CYAN}" stroke-width="4"/>
    <rect x="234" y="14" width="212" height="132" rx="4" fill="${CYAN}" fill-opacity="0.08"/>
    <rect x="300" y="170" width="80" height="6" rx="3" fill="${CYAN}"/>
    <rect x="280" y="180" width="120" height="14" rx="3" fill="${CYAN}" fill-opacity="0.6"/>
    <!-- bridge / motion lines -->
    <g stroke="${CYAN}" stroke-width="6" stroke-linecap="round">
      <line x1="130" y1="80" x2="210" y2="80" stroke-opacity="0.95"/>
      <line x1="100" y1="118" x2="170" y2="118" stroke-opacity="0.7"/>
      <line x1="140" y1="156" x2="200" y2="156" stroke-opacity="0.85"/>
    </g>
  </g>`;
}

function speedBarsMotif(x, y) {
  // Long-then-short cyan/green motion bars echoing the logo's motion lines.
  const bars = [
    { y: 0, w: 320, op: 1.0, color: CYAN },
    { y: 36, w: 240, op: 0.9, color: CYAN },
    { y: 72, w: 380, op: 1.0, color: GREEN },
    { y: 108, w: 200, op: 0.8, color: CYAN },
    { y: 144, w: 300, op: 0.95, color: CYAN },
    { y: 180, w: 160, op: 0.7, color: GREEN },
    { y: 216, w: 260, op: 0.9, color: CYAN },
  ];
  return `
  <g transform="translate(${x},${y})">
    ${bars
      .map(
        (b) =>
          `<rect x="0" y="${b.y}" width="${b.w}" height="14" rx="7" fill="${b.color}" fill-opacity="${b.op}"/>`,
      )
      .join("\n    ")}
  </g>`;
}

function osChipGrid(x, y) {
  // 2x2 grid of OS chips (Android, Windows, iOS, macOS) drawn purely in SVG.
  const chip = (cx, cy, label, glyph) => `
    <g transform="translate(${cx},${cy})">
      <rect width="180" height="92" rx="18" fill="${CYAN}" fill-opacity="0.06" stroke="${CYAN}" stroke-opacity="0.35" stroke-width="1.5"/>
      <g transform="translate(20,22)">${glyph}</g>
      <text x="86" y="58" font-family="${FONT_STACK}" font-size="22" font-weight="700" fill="${TEXT}">${label}</text>
    </g>`;

  // Tiny vector glyphs (not real brand marks - abstract geometric stand-ins for OS pictograms).
  const android = `<g fill="${CYAN}"><rect x="6" y="14" width="36" height="26" rx="4"/><circle cx="14" cy="10" r="3"/><circle cx="34" cy="10" r="3"/><line x1="14" y1="6" x2="10" y2="0" stroke="${CYAN}" stroke-width="2"/><line x1="34" y1="6" x2="38" y2="0" stroke="${CYAN}" stroke-width="2"/></g>`;
  const windows = `<g fill="${CYAN}"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="26" y="2" width="20" height="20" rx="2"/><rect x="2" y="26" width="20" height="20" rx="2"/><rect x="26" y="26" width="20" height="20" rx="2"/></g>`;
  const ios = `<g fill="${CYAN}"><rect x="14" y="2" width="20" height="44" rx="4"/><circle cx="24" cy="40" r="2"/></g>`;
  const macos = `<g fill="${CYAN}"><rect x="2" y="6" width="44" height="30" rx="3"/><rect x="18" y="38" width="12" height="6"/><rect x="12" y="42" width="24" height="3" rx="1"/></g>`;

  return `
  <g transform="translate(${x},${y})">
    ${chip(0, 0, "Android", android)}
    ${chip(200, 0, "Windows", windows)}
    ${chip(0, 112, "iOS", ios)}
    ${chip(200, 112, "macOS", macos)}
  </g>`;
}

async function compose({ outName, headline, motifSvg }) {
  const inner = `${header()}${headlineBlock(headline)}${motifSvg}${footer()}`;
  const svg = frame(inner);

  // Rasterize base SVG.
  let img = sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 90 });

  // Composite the real logo + wordmark into the header area.
  const logo = await sharp(resolve(PUBLIC_DIR, "brand/quickbridge-logo.png"))
    .resize({ height: 64, fit: "inside" })
    .png()
    .toBuffer();
  const wordmark = await sharp(resolve(PUBLIC_DIR, "brand/quickbridge-wordmark.png"))
    .resize({ height: 30, fit: "inside" })
    .png()
    .toBuffer();

  img = img.composite([
    { input: logo, top: 60, left: 60 },
    { input: wordmark, top: 80, left: 132 },
  ]);

  const outPath = resolve(PUBLIC_DIR, outName);
  await img.toFile(outPath);

  // Re-encode through sharp PNG to keep size down.
  const buf = await sharp(outPath)
    .png({ compressionLevel: 9, palette: true, quality: 85, effort: 10 })
    .toBuffer();
  await writeFile(outPath, buf);

  const { size } = await sharp(buf).metadata();
  console.log(`  -> ${outName}  ${(buf.length / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log("Building OG images (1200x630)...");

  await compose({
    outName: "og-home.png",
    headline: {
      eyebrow: "QuickBridge",
      line1: "Send anything between",
      line2: "your phone & PC.",
      sub: "No apps. No cables. No upload step.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  await compose({
    outName: "og-airdrop.png",
    headline: {
      eyebrow: "AirDrop alternative",
      line1: "AirDrop for Android",
      line2: "& Windows. In a tab.",
      sub: "Cross-platform peer-to-peer transfer - no install.",
    },
    motifSvg: osChipGrid(720, 230),
  });

  await compose({
    outName: "og-why.png",
    headline: {
      eyebrow: "Why QuickBridge",
      line1: "The fastest way to move",
      line2: "files between devices.",
      sub: "Direct WebRTC. No upload, no cloud, no waiting.",
    },
    motifSvg: speedBarsMotif(720, 250),
  });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
