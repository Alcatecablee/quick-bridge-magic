import {
  Wifi,
  Link2,
  Share2,
  Smartphone,
  FileText,
  MessageSquare,
  ArrowLeftRight,
  Download,
  Upload,
} from "./icons";

const ICONS = [
  Wifi,
  Link2,
  Share2,
  Smartphone,
  FileText,
  MessageSquare,
  ArrowLeftRight,
  Download,
  Upload,
];

interface IconCell {
  Icon: (typeof ICONS)[number];
  x: number;
  y: number;
  rotation: number;
  size: number;
  opacity: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildGrid(): IconCell[] {
  const rand = seededRandom(42);
  const cells: IconCell[] = [];

  const iconCount = 100;
  const minDistance = 7;

  for (let i = 0; i < iconCount; i++) {
    let x = 0;
    let y = 0;
    let attempts = 0;

    do {
      x = 3 + rand() * 94;
      y = 3 + rand() * 94;
      attempts++;
    } while (
      attempts < 80 &&
      cells.some(
        (cell) =>
          Math.hypot((cell.x - x) * 0.75, cell.y - y) < minDistance,
      )
    );

    const iconIndex = i % ICONS.length;
    const Icon = ICONS[(iconIndex + Math.floor(rand() * 5)) % ICONS.length];

    const rotation = Math.floor(rand() * 8) * 22.5 * (rand() > 0.5 ? 1 : -1);

    const sizeBase = 30 + rand() * 14;
    const opacity = 0.015 + rand() * 0.03;

    cells.push({ Icon, x, y, rotation, size: sizeBase, opacity });
  }

  return cells;
}

const GRID = buildGrid();

export function QbBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Subtle grain texture overlay using an SVG turbulence filter.
          Adds film-grain depth without GPU cost. Opacity kept at ~3%. */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.03 }}
      >
        <filter id="qb-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#qb-grain)" />
      </svg>
      {GRID.map((cell, i) => {
        const { Icon, x, y, rotation, size, opacity } = cell;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              opacity,
              color: "oklch(0.75 0.12 265)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: size, height: size, strokeWidth: 1.4 }} />
          </span>
        );
      })}
    </div>
  );
}
