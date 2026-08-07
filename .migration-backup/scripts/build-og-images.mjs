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

function pinKeypadMotif(x, y) {
  // Six PIN digit boxes echoing the actual /join input UI: three filled
  // (cyan tinted), the next box highlighted (the cursor), and a "listening"
  // status pip below. The partial PIN "739..." is illustrative, not real.
  const boxW = 62;
  const boxH = 78;
  const gap = 12;
  const values = ["7", "3", "9", "", "", ""];
  const cells = values
    .map((v, i) => {
      const bx = i * (boxW + gap);
      const filled = !!v;
      const isCursor = !filled && (i === 0 || values[i - 1] !== "");
      const stroke = isCursor ? CYAN : RULE;
      const strokeWidth = isCursor ? 2.5 : 1.5;
      const fillOp = filled ? 0.18 : 0;
      const cellRect = `<rect x="${bx}" y="0" width="${boxW}" height="${boxH}" rx="14" fill="${CYAN}" fill-opacity="${fillOp}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
      const digit = filled
        ? `<text x="${bx + boxW / 2}" y="${boxH / 2 + 16}" text-anchor="middle" font-family="${FONT_STACK}" font-size="44" font-weight="800" fill="${TEXT}">${v}</text>`
        : "";
      const caret = isCursor
        ? `<rect x="${bx + boxW / 2 - 2}" y="20" width="3" height="38" rx="1.5" fill="${CYAN}"/>`
        : "";
      return cellRect + digit + caret;
    })
    .join("");
  return `
  <g transform="translate(${x},${y})">
    <text x="0" y="-22" font-family="${FONT_STACK}" font-size="14" font-weight="700" fill="${MUTED}" letter-spacing="3">SESSION PIN</text>
    ${cells}
    <g transform="translate(0,${boxH + 36})" font-family="${FONT_STACK}">
      <circle cx="8" cy="8" r="5" fill="${GREEN}"/>
      <circle cx="8" cy="8" r="9" fill="${GREEN}" fill-opacity="0.25"/>
      <text x="24" y="13" font-size="16" font-weight="600" fill="${MUTED}">Listening for PIN match…</text>
    </g>
  </g>`;
}

function privacyDirectMotif(x, y) {
  // Two device glyphs connected by a direct cyan→green encrypted path,
  // with a server icon in the middle visibly crossed out. Encodes the
  // page's core promise: "no server in the file path".
  return `
  <g transform="translate(${x},${y})">
    <!-- left phone -->
    <rect x="0" y="60" width="96" height="160" rx="18" fill="none" stroke="${CYAN}" stroke-width="3.5"/>
    <rect x="12" y="76" width="72" height="118" rx="6" fill="${CYAN}" fill-opacity="0.10"/>
    <circle cx="48" cy="208" r="3.5" fill="${CYAN}"/>
    <!-- right monitor -->
    <rect x="360" y="40" width="120" height="80" rx="8" fill="none" stroke="${CYAN}" stroke-width="3.5"/>
    <rect x="370" y="50" width="100" height="60" rx="3" fill="${CYAN}" fill-opacity="0.10"/>
    <rect x="400" y="126" width="40" height="4" rx="2" fill="${CYAN}"/>
    <!-- direct encrypted path (curve from phone to monitor) -->
    <path d="M 96 140 C 180 140, 260 80, 360 80" stroke="url(#cyanGreen)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="0"/>
    <!-- middle: server crossed out -->
    <g transform="translate(196,160)">
      <rect x="0" y="0" width="68" height="20" rx="3" fill="none" stroke="${MUTED}" stroke-width="1.5" opacity="0.45"/>
      <rect x="0" y="26" width="68" height="20" rx="3" fill="none" stroke="${MUTED}" stroke-width="1.5" opacity="0.45"/>
      <circle cx="10" cy="10" r="2" fill="${MUTED}" opacity="0.45"/>
      <circle cx="10" cy="36" r="2" fill="${MUTED}" opacity="0.45"/>
      <line x1="-10" y1="-10" x2="78" y2="56" stroke="${CYAN}" stroke-width="3" stroke-linecap="round"/>
      <text x="34" y="76" text-anchor="middle" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">NO SERVER</text>
    </g>
    <!-- end-to-end lock badge near right device -->
    <g transform="translate(420,140)">
      <rect x="-22" y="-2" width="44" height="34" rx="7" fill="${GREEN}" fill-opacity="0.12" stroke="${GREEN}" stroke-width="1.5"/>
      <path d="M-8 8 v-4 a8 8 0 0 1 16 0 v4" fill="none" stroke="${GREEN}" stroke-width="2" stroke-linecap="round"/>
      <rect x="-7" y="8" width="14" height="13" rx="2.5" fill="${GREEN}"/>
    </g>
  </g>`;
}

function ecosystemMotif(x, y) {
  // QuickBridge node in the center with arrows reaching out to four OS
  // chips around it (vs AirDrop's single-ecosystem walled garden). Uses
  // abstract OS glyphs (no real brand marks) consistent with osChipGrid().
  const node = (cx, cy, label, glyph) => `
    <g transform="translate(${cx},${cy})">
      <rect x="-58" y="-26" width="116" height="52" rx="14" fill="${CYAN}" fill-opacity="0.06" stroke="${CYAN}" stroke-opacity="0.4" stroke-width="1.5"/>
      <g transform="translate(-46,-14)">${glyph}</g>
      <text x="6" y="6" font-family="${FONT_STACK}" font-size="16" font-weight="700" fill="${TEXT}">${label}</text>
    </g>`;
  const win = `<g fill="${CYAN}"><rect x="0" y="0" width="11" height="11" rx="1.5"/><rect x="14" y="0" width="11" height="11" rx="1.5"/><rect x="0" y="14" width="11" height="11" rx="1.5"/><rect x="14" y="14" width="11" height="11" rx="1.5"/></g>`;
  const droid = `<g fill="${CYAN}"><rect x="2" y="8" width="22" height="16" rx="3"/><circle cx="8" cy="6" r="2"/><circle cx="18" cy="6" r="2"/></g>`;
  const ios = `<g fill="${CYAN}"><rect x="8" y="0" width="12" height="26" rx="3"/></g>`;
  const linux = `<g fill="${GREEN}"><circle cx="14" cy="14" r="11"/><circle cx="10" cy="10" r="2" fill="${BG}"/><circle cx="18" cy="10" r="2" fill="${BG}"/></g>`;

  return `
  <g transform="translate(${x},${y})">
    <!-- spokes -->
    <g stroke="${CYAN}" stroke-width="1.5" stroke-opacity="0.5" stroke-dasharray="3 5">
      <line x1="225" y1="135" x2="80" y2="40"/>
      <line x1="225" y1="135" x2="370" y2="40"/>
      <line x1="225" y1="135" x2="80" y2="230"/>
      <line x1="225" y1="135" x2="370" y2="230"/>
    </g>
    <!-- center QB node -->
    <g transform="translate(225,135)">
      <circle r="46" fill="${CYAN}" fill-opacity="0.10" stroke="${CYAN}" stroke-width="2"/>
      <circle r="32" fill="${BG}"/>
      <text y="6" text-anchor="middle" font-family="${FONT_STACK}" font-size="14" font-weight="800" fill="${TEXT}" letter-spacing="1">QB</text>
    </g>
    ${node(80, 40, "Windows", win)}
    ${node(370, 40, "Android", droid)}
    ${node(80, 230, "iPhone", ios)}
    ${node(370, 230, "Linux", linux)}
  </g>`;
}

function networkReachMotif(x, y) {
  // Two phones at opposite corners of a stylized globe arc - illustrating
  // "anywhere on the web" reach (vs Snapdrop's same-LAN limit).
  return `
  <g transform="translate(${x},${y})">
    <!-- globe arcs -->
    <g fill="none" stroke="${CYAN}" stroke-opacity="0.45" stroke-width="1.6">
      <ellipse cx="225" cy="135" rx="160" ry="160"/>
      <ellipse cx="225" cy="135" rx="160" ry="60"/>
      <ellipse cx="225" cy="135" rx="60" ry="160"/>
      <line x1="65" y1="135" x2="385" y2="135"/>
      <line x1="225" y1="-25" x2="225" y2="295"/>
    </g>
    <!-- transfer arc -->
    <path d="M 80 200 Q 225 -30 370 200" stroke="url(#cyanGreen)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- left device -->
    <g transform="translate(40,170)">
      <rect width="72" height="100" rx="12" fill="${BG}" stroke="${CYAN}" stroke-width="2.5"/>
      <rect x="8" y="10" width="56" height="74" rx="3" fill="${CYAN}" fill-opacity="0.15"/>
    </g>
    <!-- right device -->
    <g transform="translate(338,170)">
      <rect width="72" height="100" rx="12" fill="${BG}" stroke="${GREEN}" stroke-width="2.5"/>
      <rect x="8" y="10" width="56" height="74" rx="3" fill="${GREEN}" fill-opacity="0.15"/>
    </g>
    <!-- "any network" label -->
    <text x="225" y="295" text-anchor="middle" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${MUTED}" letter-spacing="3">ANY NETWORK</text>
  </g>`;
}

function noCloudHopMotif(x, y) {
  // Top row: file → cloud → file (greyed out, with X). Bottom row: file →
  // direct arrow → file (cyan/green, alive). Wormhole stages files in the
  // cloud for 24h; QuickBridge does not stage at all.
  const fileGlyph = (color, op = 1) => `
    <g fill="none" stroke="${color}" stroke-width="2.2" stroke-opacity="${op}">
      <path d="M0 0 h28 l8 8 v40 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 v-44 a4 4 0 0 1 4 -4 z"/>
      <path d="M28 0 v8 h8"/>
    </g>`;
  return `
  <g transform="translate(${x},${y})">
    <!-- TOP: cloud-staged path (greyed) -->
    <g transform="translate(0,8)" opacity="0.55">
      ${fileGlyph(MUTED)}
      <line x1="44" y1="26" x2="156" y2="26" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(160,0)" stroke="${MUTED}" stroke-width="2.2" fill="none">
        <path d="M10 32 a14 14 0 0 1 14 -14 a16 16 0 0 1 30 4 a12 12 0 0 1 4 22 h-44 a10 10 0 0 1 -4 -12 z"/>
      </g>
      <line x1="220" y1="26" x2="332" y2="26" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(336,0)">${fileGlyph(MUTED)}</g>
      <!-- ✕ across the cloud -->
      <line x1="170" y1="8" x2="222" y2="48" stroke="${CYAN}" stroke-width="3" stroke-linecap="round"/>
      <text x="190" y="80" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${MUTED}" letter-spacing="2">CLOUD HOP</text>
    </g>
    <!-- BOTTOM: direct path (alive) -->
    <g transform="translate(0,180)">
      ${fileGlyph(CYAN)}
      <path d="M44 26 L332 26" stroke="url(#cyanGreen)" stroke-width="4" stroke-linecap="round"/>
      <polygon points="332,18 348,26 332,34" fill="${GREEN}"/>
      <g transform="translate(336,0)">${fileGlyph(GREEN)}</g>
      <text x="160" y="80" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">DIRECT PEER PATH</text>
    </g>
  </g>`;
}

function noUploadMotif(x, y) {
  // Vertical stack: greyed "upload → wait → download" pipeline (WeTransfer
  // model), then below it a single bright cyan/green arrow labeled "stream"
  // (QuickBridge model). Conveys the page's central pitch: no upload step.
  return `
  <g transform="translate(${x},${y})">
    <!-- WeTransfer-style pipeline (greyed) -->
    <g opacity="0.55" font-family="${FONT_STACK}">
      <g transform="translate(0,0)">
        <rect width="120" height="42" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="60" y="26" text-anchor="middle" font-size="14" font-weight="700" fill="${MUTED}">UPLOAD</text>
      </g>
      <line x1="120" y1="21" x2="160" y2="21" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(160,0)">
        <rect width="120" height="42" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="60" y="26" text-anchor="middle" font-size="14" font-weight="700" fill="${MUTED}">WAIT</text>
      </g>
      <line x1="280" y1="21" x2="320" y2="21" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(320,0)">
        <rect width="120" height="42" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="60" y="26" text-anchor="middle" font-size="14" font-weight="700" fill="${MUTED}">DOWNLOAD</text>
      </g>
      <line x1="20" y1="60" x2="420" y2="60" stroke="${CYAN}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- QuickBridge stream (alive) -->
    <g transform="translate(0,140)" font-family="${FONT_STACK}">
      <rect width="440" height="60" rx="14" fill="${CYAN}" fill-opacity="0.08" stroke="url(#cyanGreen)" stroke-width="2"/>
      <text x="22" y="38" font-size="18" font-weight="800" fill="${TEXT}" letter-spacing="-0.3">STREAM</text>
      <!-- streaming dots -->
      <g fill="${CYAN}">
        <circle cx="120" cy="30" r="3"/>
        <circle cx="140" cy="30" r="3" fill-opacity="0.85"/>
        <circle cx="160" cy="30" r="3" fill-opacity="0.7"/>
        <circle cx="180" cy="30" r="3" fill-opacity="0.55"/>
        <circle cx="200" cy="30" r="3" fill-opacity="0.4"/>
      </g>
      <path d="M 230 30 L 408 30" stroke="url(#cyanGreen)" stroke-width="3" stroke-linecap="round"/>
      <polygon points="408,22 422,30 408,38" fill="${GREEN}"/>
    </g>
    <text x="0" y="232" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${GREEN}" letter-spacing="2">NO UPLOAD STEP</text>
  </g>`;
}

function scanSendMotif(x, y) {
  // QR-style symbol on the left, motion lines into a phone on the right.
  // "Scan and send" — the PairDrop point of comparison: zero-setup pairing.
  const qrCell = (cx, cy, w) =>
    `<rect x="${cx}" y="${cy}" width="${w}" height="${w}" fill="${CYAN}"/>`;
  // Hand-laid QR-like glyph (decorative, not a real code).
  const qrCells = [
    [0, 0, 36],
    [120, 0, 36],
    [0, 120, 36],
    [60, 60, 18],
    [90, 70, 12],
    [70, 100, 14],
    [100, 110, 16],
    [44, 30, 10],
    [44, 50, 8],
    [60, 0, 8],
    [80, 0, 12],
    [102, 60, 10],
    [120, 100, 14],
    [140, 60, 14],
    [120, 130, 18],
    [148, 130, 8],
  ]
    .map(([cx, cy, w]) => qrCell(cx, cy, w))
    .join("");
  return `
  <g transform="translate(${x},${y})">
    <!-- QR card -->
    <g transform="translate(0,30)">
      <rect x="-18" y="-18" width="192" height="192" rx="20" fill="${CYAN}" fill-opacity="0.06" stroke="${CYAN}" stroke-opacity="0.45" stroke-width="1.5"/>
      ${qrCells}
      <!-- corner brackets -->
      <g stroke="${CYAN}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M-6 0 v-6 h6"/>
        <path d="M162 0 h6 v-6"/>
        <path d="M-6 156 v6 h6"/>
        <path d="M162 162 h6 v-6"/>
      </g>
    </g>
    <!-- motion lines -->
    <g stroke="url(#cyanGreen)" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M210 90 L 290 90"/>
      <path d="M210 130 L 270 130" stroke-opacity="0.75"/>
      <path d="M210 170 L 285 170" stroke-opacity="0.9"/>
    </g>
    <!-- receiving phone -->
    <g transform="translate(310,30)">
      <rect width="96" height="180" rx="16" fill="${BG}" stroke="${GREEN}" stroke-width="2.5"/>
      <rect x="10" y="14" width="76" height="138" rx="4" fill="${GREEN}" fill-opacity="0.12"/>
      <circle cx="48" cy="166" r="4" fill="${GREEN}"/>
      <!-- file icon inside phone -->
      <g transform="translate(24,40)" fill="none" stroke="${GREEN}" stroke-width="2">
        <path d="M0 0 h36 l12 12 v60 a4 4 0 0 1 -4 4 h-44 a4 4 0 0 1 -4 -4 v-68 a4 4 0 0 1 4 -4 z"/>
        <path d="M36 0 v12 h12"/>
      </g>
    </g>
    <text x="0" y="240" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${MUTED}" letter-spacing="3">SCAN · SEND · DONE</text>
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

function crossNetworkMotif(x, y) {
  // Two devices connected over a globe arc - any network, any distance.
  // vs Nearby Share which requires proximity / same platform.
  return `
  <g transform="translate(${x},${y})">
    <g fill="none" stroke="${CYAN}" stroke-opacity="0.38" stroke-width="1.5">
      <ellipse cx="220" cy="130" rx="145" ry="145"/>
      <ellipse cx="220" cy="130" rx="145" ry="54"/>
      <ellipse cx="220" cy="130" rx="54" ry="145"/>
    </g>
    <path d="M 70 195 Q 220 -20 370 195" stroke="url(#cyanGreen)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g transform="translate(30,158)">
      <rect width="70" height="110" rx="12" fill="${BG}" stroke="${CYAN}" stroke-width="2.5"/>
      <rect x="8" y="12" width="54" height="78" rx="3" fill="${CYAN}" fill-opacity="0.14"/>
      <circle cx="35" cy="100" r="4" fill="${CYAN}"/>
    </g>
    <g transform="translate(334,152)">
      <rect width="112" height="74" rx="8" fill="${BG}" stroke="${GREEN}" stroke-width="2.5"/>
      <rect x="8" y="8" width="96" height="56" rx="3" fill="${GREEN}" fill-opacity="0.12"/>
      <rect x="0" y="76" width="112" height="8" rx="2" fill="${GREEN}" fill-opacity="0.35"/>
    </g>
    <g transform="translate(172,22)" opacity="0.72">
      <circle cx="24" cy="24" r="20" fill="none" stroke="${MUTED}" stroke-width="1.8"/>
      <line x1="7" y1="7" x2="41" y2="41" stroke="${CYAN}" stroke-width="2.5" stroke-linecap="round"/>
      <text x="24" y="60" text-anchor="middle" font-family="${FONT_STACK}" font-size="11" font-weight="600" fill="${MUTED}" letter-spacing="2">PROXIMITY</text>
    </g>
    <text x="220" y="295" text-anchor="middle" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${MUTED}" letter-spacing="3">ANY NETWORK</text>
  </g>`;
}

function qrSessionMotif(x, y) {
  // QR code pairing + two-way arrows. QuickBridge opens a live two-way
  // session. FilePizza generates a one-time download link.
  const qrCell = (cx, cy, w) =>
    `<rect x="${cx}" y="${cy}" width="${w}" height="${w}" fill="${CYAN}"/>`;
  const qrCells = [
    [0, 0, 34], [100, 0, 34], [0, 100, 34],
    [48, 48, 16], [78, 58, 12], [58, 78, 14], [94, 88, 16],
    [36, 24, 10], [36, 42, 8], [52, 0, 10], [74, 0, 12],
  ].map(([cx, cy, w]) => qrCell(cx, cy, w)).join("");
  return `
  <g transform="translate(${x},${y})">
    <g transform="translate(0,40)">
      <rect x="-16" y="-16" width="168" height="168" rx="18" fill="${CYAN}" fill-opacity="0.06" stroke="${CYAN}" stroke-opacity="0.4" stroke-width="1.5"/>
      ${qrCells}
    </g>
    <g stroke-linecap="round" fill="none">
      <path d="M200 90 L288 90" stroke="url(#cyanGreen)" stroke-width="4"/>
      <polygon points="286,82 302,90 286,98" fill="${GREEN}"/>
      <path d="M288 145 L200 145" stroke="url(#cyanGreen)" stroke-width="4"/>
      <polygon points="202,137 186,145 202,153" fill="${CYAN}"/>
    </g>
    <text x="140" y="210" text-anchor="middle" font-family="${FONT_STACK}" font-size="12" font-weight="700" fill="${MUTED}" letter-spacing="2">LIVE 2-WAY SESSION</text>
    <g transform="translate(308,50)">
      <rect width="96" height="170" rx="16" fill="${BG}" stroke="${GREEN}" stroke-width="2.5"/>
      <rect x="10" y="12" width="76" height="128" rx="4" fill="${GREEN}" fill-opacity="0.12"/>
      <circle cx="48" cy="158" r="4" fill="${GREEN}"/>
    </g>
  </g>`;
}

function noInstallMotif(x, y) {
  // Greyed "download-install-open" flow crossed out on top; clean browser
  // tab opening below. LocalSend requires an app install; QuickBridge does not.
  return `
  <g transform="translate(${x},${y})">
    <g opacity="0.48" font-family="${FONT_STACK}">
      <g transform="translate(0,10)">
        <rect width="106" height="44" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="53" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="${MUTED}">DOWNLOAD</text>
      </g>
      <line x1="106" y1="32" x2="146" y2="32" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(148,10)">
        <rect width="80" height="44" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="40" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="${MUTED}">INSTALL</text>
      </g>
      <line x1="228" y1="32" x2="268" y2="32" stroke="${MUTED}" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(270,10)">
        <rect width="80" height="44" rx="10" fill="none" stroke="${MUTED}" stroke-width="1.5"/>
        <text x="40" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="${MUTED}">OPEN</text>
      </g>
      <line x1="0" y1="66" x2="350" y2="66" stroke="${CYAN}" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <g transform="translate(0,130)" font-family="${FONT_STACK}">
      <rect width="380" height="198" rx="16" fill="${CYAN}" fill-opacity="0.06" stroke="url(#cyanGreen)" stroke-width="2"/>
      <rect x="0" y="0" width="380" height="36" rx="16" fill="${CYAN}" fill-opacity="0.10"/>
      <rect x="12" y="8" width="100" height="20" rx="6" fill="${CYAN}" fill-opacity="0.22"/>
      <rect x="12" y="46" width="356" height="26" rx="7" fill="${CYAN}" fill-opacity="0.09" stroke="${CYAN}" stroke-opacity="0.28" stroke-width="1"/>
      <text x="24" y="64" font-size="13" font-weight="600" fill="${CYAN}">quickbridge.app</text>
      <rect x="20" y="84" width="200" height="10" rx="3" fill="${TEXT}" fill-opacity="0.12"/>
      <rect x="20" y="102" width="140" height="8" rx="3" fill="${TEXT}" fill-opacity="0.08"/>
      <rect x="20" y="118" width="280" height="8" rx="3" fill="${TEXT}" fill-opacity="0.06"/>
    </g>
    <text x="0" y="356" font-family="${FONT_STACK}" font-size="13" font-weight="700" fill="${GREEN}" letter-spacing="2">NO INSTALL. OPEN AND GO.</text>
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

  await compose({
    outName: "og-join.png",
    headline: {
      eyebrow: "Join with PIN",
      line1: "Enter the 6-digit PIN",
      line2: "to start a transfer.",
      sub: "End-to-end encrypted. No install, no account.",
    },
    motifSvg: pinKeypadMotif(720, 270),
  });

  await compose({
    outName: "og-privacy.png",
    headline: {
      eyebrow: "Privacy",
      line1: "Your data stays",
      line2: "on your devices.",
      sub: "No upload. No storage. No tracking.",
    },
    motifSvg: privacyDirectMotif(700, 220),
  });

  await compose({
    outName: "og-compare-airdrop.png",
    headline: {
      eyebrow: "QuickBridge vs AirDrop",
      line1: "Beyond the Apple",
      line2: "ecosystem.",
      sub: "Windows, Android, iPhone, Linux — in any browser.",
    },
    motifSvg: ecosystemMotif(720, 220),
  });

  await compose({
    outName: "og-compare-snapdrop.png",
    headline: {
      eyebrow: "QuickBridge vs Snapdrop",
      line1: "Cross-network",
      line2: "file transfer.",
      sub: "Not just same-Wi-Fi. Anywhere on the web.",
    },
    motifSvg: networkReachMotif(720, 220),
  });

  await compose({
    outName: "og-compare-wormhole.png",
    headline: {
      eyebrow: "QuickBridge vs Wormhole",
      line1: "Browser P2P,",
      line2: "no cloud hop.",
      sub: "No upload wait. No 24-hour expiry.",
    },
    motifSvg: noCloudHopMotif(720, 230),
  });

  await compose({
    outName: "og-compare-wetransfer.png",
    headline: {
      eyebrow: "QuickBridge vs WeTransfer",
      line1: "No upload step.",
      line2: "No account needed.",
      sub: "Files stream device to device — instantly.",
    },
    motifSvg: noUploadMotif(720, 220),
  });

  await compose({
    outName: "og-compare-pairdrop.png",
    headline: {
      eyebrow: "QuickBridge vs PairDrop",
      line1: "No setup.",
      line2: "Just scan & send.",
      sub: "Same room or across the internet — works the same.",
    },
    motifSvg: scanSendMotif(720, 220),
  });

  await compose({
    outName: "og-compare-nearby-share.png",
    headline: {
      eyebrow: "QuickBridge vs Nearby Share",
      line1: "Works across",
      line2: "any network.",
      sub: "No proximity needed. Phone to PC from anywhere.",
    },
    motifSvg: crossNetworkMotif(720, 220),
  });

  await compose({
    outName: "og-compare-filepizza.png",
    headline: {
      eyebrow: "QuickBridge vs FilePizza",
      line1: "Scan once.",
      line2: "Transfer both ways.",
      sub: "A live 2-way session, not a one-shot download link.",
    },
    motifSvg: qrSessionMotif(720, 220),
  });

  await compose({
    outName: "og-compare-localsend.png",
    headline: {
      eyebrow: "QuickBridge vs LocalSend",
      line1: "No install.",
      line2: "Just open the tab.",
      sub: "Works cross-network. No app, no LAN requirement.",
    },
    motifSvg: noInstallMotif(720, 150),
  });

  // How-to hub
  await compose({
    outName: "og-how-to.png",
    headline: {
      eyebrow: "QuickBridge How-to Guides",
      line1: "Every device pair,",
      line2: "one browser tab.",
      sub: "Step-by-step guides. No install, no account.",
    },
    motifSvg: scanSendMotif(720, 220),
  });

  // iPhone to Windows
  await compose({
    outName: "og-howto-iphone-to-windows.png",
    headline: {
      eyebrow: "iPhone to Windows",
      line1: "Send files iPhone",
      line2: "to Windows PC.",
      sub: "No iTunes. No cable. Scan the QR and go.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // Android to Windows
  await compose({
    outName: "og-howto-android-to-windows.png",
    headline: {
      eyebrow: "Android to Windows",
      line1: "Send files Android",
      line2: "to Windows PC.",
      sub: "No USB. No app. Just open a tab on both devices.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // iPhone to Mac
  await compose({
    outName: "og-howto-iphone-to-mac.png",
    headline: {
      eyebrow: "iPhone to Mac",
      line1: "Scan the QR",
      line2: "and send.",
      sub: "Works when AirDrop won't. Any file, any size.",
    },
    motifSvg: scanSendMotif(720, 220),
  });

  // Android to Mac
  await compose({
    outName: "og-howto-android-to-mac.png",
    headline: {
      eyebrow: "Android to Mac",
      line1: "Android and Mac,",
      line2: "in one browser tab.",
      sub: "Cross-platform transfer. No cable required.",
    },
    motifSvg: osChipGrid(720, 230),
  });

  // Windows to Android
  await compose({
    outName: "og-howto-windows-to-android.png",
    headline: {
      eyebrow: "Windows to Android",
      line1: "Push files from",
      line2: "Windows to Android.",
      sub: "Drag, drop, scan. Done in under five seconds.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // Windows to iPhone
  await compose({
    outName: "og-howto-windows-to-iphone.png",
    headline: {
      eyebrow: "Windows to iPhone",
      line1: "Send files from",
      line2: "Windows to iPhone.",
      sub: "No iTunes. No iCloud. Just scan the QR.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // Send photos
  await compose({
    outName: "og-howto-send-photos.png",
    headline: {
      eyebrow: "Send Photos Phone to PC",
      line1: "Photos from phone",
      line2: "to PC. Instantly.",
      sub: "Full quality. No compression. No cloud upload.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // Send large files
  await compose({
    outName: "og-howto-send-large-files.png",
    headline: {
      eyebrow: "Send Large Files",
      line1: "Up to 10 GB.",
      line2: "No cloud needed.",
      sub: "Streams directly device to device at full speed.",
    },
    motifSvg: speedBarsMotif(720, 250),
  });

  // Send without USB
  await compose({
    outName: "og-howto-no-usb.png",
    headline: {
      eyebrow: "Send Files Without USB",
      line1: "No cable.",
      line2: "No app. Just a tab.",
      sub: "Wireless file transfer that works on any network.",
    },
    motifSvg: crossNetworkMotif(720, 220),
  });

  // Send without WhatsApp
  await compose({
    outName: "og-howto-no-whatsapp.png",
    headline: {
      eyebrow: "Send Files Without WhatsApp",
      line1: "Direct transfer.",
      line2: "No middleman app.",
      sub: "Files go device to device. Nothing stored anywhere.",
    },
    motifSvg: privacyDirectMotif(700, 220),
  });

  // Send files free
  await compose({
    outName: "og-howto-send-free.png",
    headline: {
      eyebrow: "Free File Transfer",
      line2: "No upload, no limit.",
      sub: "No account. No subscription. No ads.",
    },
    motifSvg: noUploadMotif(720, 220),
  });

  // Send videos
  await compose({
    outName: "og-howto-send-videos.png",
    headline: {
      eyebrow: "Send Videos Phone to PC",
      line1: "Full-res video,",
      line2: "phone to PC.",
      sub: "No compression. No cloud. Streams at full speed.",
    },
    motifSvg: speedBarsMotif(720, 250),
  });

  // Send PDF
  await compose({
    outName: "og-howto-send-pdf.png",
    headline: {
      eyebrow: "Send PDF Phone to PC",
      line1: "Send PDFs phone",
      line2: "to PC or Mac.",
      sub: "Any file type, any size. Browser to browser.",
    },
    motifSvg: devicePairMotif(720, 220),
  });

  // Share clipboard
  await compose({
    outName: "og-howto-clipboard.png",
    headline: {
      eyebrow: "Share Clipboard Between Devices",
      line1: "Copy on phone,",
      line2: "paste on PC.",
      sub: "Live two-way session. No cloud sync required.",
    },
    motifSvg: qrSessionMotif(720, 220),
  });

  // Share same Wi-Fi
  await compose({
    outName: "og-howto-same-wifi.png",
    headline: {
      eyebrow: "Share Files Same Wi-Fi",
      line1: "Same network",
      line2: "or different.",
      sub: "Scan the QR and files go direct. Works anywhere.",
    },
    motifSvg: networkReachMotif(720, 220),
  });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
