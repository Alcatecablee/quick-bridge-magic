import {
  QrCode,
  Wifi,
  Link2,
  Share2,
  Smartphone,
  FileText,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Infinity as InfinityIcon,
  MessageSquare,
  ArrowLeftRight,
  Download,
  Upload,
  Radio,
  Layers,
  Binary,
  Cpu,
  Antenna,
} from "lucide-react";

const ICONS = [
  QrCode,
  Wifi,
  Link2,
  Share2,
  Smartphone,
  FileText,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  InfinityIcon,
  MessageSquare,
  ArrowLeftRight,
  Download,
  Upload,
  Radio,
  Layers,
  Binary,
  Cpu,
  Antenna,
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

  const cols = 18;
  const rows = 28;
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const iconIndex = (row * cols + col) % ICONS.length;
      const Icon = ICONS[(iconIndex + Math.floor(rand() * 5)) % ICONS.length];

      const jitterX = (rand() - 0.5) * cellW * 0.3;
      const jitterY = (rand() - 0.5) * cellH * 0.3;

      const x = col * cellW + cellW / 2 + jitterX;
      const y = row * cellH + cellH / 2 + jitterY;

      const rotation = Math.floor(rand() * 8) * 22.5 * (rand() > 0.5 ? 1 : -1);

      const sizeBase = 13 + rand() * 8;
      const opacity = 0.03 + rand() * 0.045;

      cells.push({ Icon, x, y, rotation, size: sizeBase, opacity });
    }
  }

  return cells;
}

const GRID = buildGrid();

export function QbBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
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
