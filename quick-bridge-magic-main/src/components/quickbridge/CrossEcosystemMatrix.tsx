import { useEffect, useRef, useState } from "react";
import { Check, X as XIcon } from "@/components/quickbridge/icons";

/**
 * Cross-ecosystem transfer infograph.
 *
 * Visualizes the pain that most users don't realize they have: native OS
 * sharing only covers same-ecosystem pairs (AirDrop = Apple+Apple,
 * Quick Share = Android+Android). Every cross-ecosystem pair is friction.
 * QuickBridge fills the entire 5x5 matrix.
 *
 * Design intent (data graphic, not a card UI):
 *   - No card chrome. No rounded pill cells. No ring(1, color/40) decoration.
 *   - Editorial typography for the counter: thin display weight, fraction
 *     style slash, padded two-digit count.
 *   - Hairline 5x5 grid, drawn via grid gap on a border-tinted background.
 *   - Tiny, restrained marks inside cells (a small filled square for
 *     supported pairs, a small X for the three commonly painful pairs in
 *     the "without" matrix).
 *   - Cross-hair highlight on hover or tap: the hovered cell, its row
 *     label, and its column label all light up in primary color so the
 *     sender to receiver direction is unambiguous. Works on desktop
 *     (hover) and on mobile (tap toggles).
 *
 * The "X / 25" counter counts up the first time it scrolls into view.
 * Respects prefers-reduced-motion (snaps to final value).
 */

/**
 * Counts up from 0 to `target` over `durationMs` the first time the
 * returned ref's element intersects the viewport. Respects
 * prefers-reduced-motion (snaps immediately) and degrades gracefully
 * when IntersectionObserver is unavailable (snaps immediately).
 */
function useCountUp(target: number, durationMs = 900) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || startedRef.current) return;

    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (reduced || target <= 0) {
        setValue(target);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            start();
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}

type PlatformKey = "android" | "ios" | "mac" | "win" | "linux";

type Platform = {
  key: PlatformKey;
  label: string;
  group: "apple" | "google" | "microsoft" | "linux";
};

const PLATFORMS: Platform[] = [
  { key: "android", label: "Android", group: "google" },
  { key: "ios", label: "iPhone", group: "apple" },
  { key: "mac", label: "Mac", group: "apple" },
  { key: "win", label: "Windows", group: "microsoft" },
  { key: "linux", label: "Linux", group: "linux" },
];

/**
 * True when two platforms have a friction-free, broadly-available, built-in
 * native sharing path (AirDrop for Apple+Apple, Quick Share for
 * Android+Android). Pairings like Phone Link (Win+Android) and Quick
 * Share to AirDrop (Pixel to Mac, 2026, limited devices) are excluded
 * because they are not broadly available.
 */
function nativeSupports(a: Platform, b: Platform): boolean {
  if (a.group === "apple" && b.group === "apple") return true;
  if (a.group === "google" && b.group === "google") return true;
  return false;
}

/** The three pain pairs called out by name. */
const HIGHLIGHTED_PAIRS = new Set([
  "android-mac",
  "mac-android",
  "linux-ios",
  "ios-linux",
  "win-ios",
  "ios-win",
]);

function pairKey(a: Platform, b: Platform) {
  return `${a.key}-${b.key}`;
}

type HoverState = { row: number; col: number } | null;

type MatrixProps = {
  variant: "without" | "with";
};

function Matrix({ variant }: MatrixProps) {
  const supportedCount = PLATFORMS.flatMap((a) =>
    PLATFORMS.map((b) =>
      variant === "with" ? true : nativeSupports(a, b),
    ),
  ).filter(Boolean).length;
  const totalCells = PLATFORMS.length * PLATFORMS.length;

  const isWith = variant === "with";
  const { ref: counterRef, value: animatedCount } = useCountUp(supportedCount);
  const [hovered, setHovered] = useState<HoverState>(null);

  const padded = String(animatedCount).padStart(2, "0");

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className="flex flex-col"
    >
      {/* Editorial header: small label + huge thin counter */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
              isWith ? "text-primary" : "text-muted-foreground/85"
            }`}
          >
            {isWith ? "With QuickBridge" : "Without QuickBridge"}
          </p>
          <p className="mt-2 max-w-[22ch] text-[12.5px] leading-snug text-muted-foreground">
            {isWith
              ? "Every pairing, every direction."
              : "Native sharing covers same-ecosystem only."}
          </p>
        </div>
        <div ref={counterRef} className="text-right">
          <span className="sr-only">{`${supportedCount} of ${totalCells} pairs covered`}</span>
          <div
            aria-hidden="true"
            className="flex items-baseline justify-end gap-1.5"
          >
            <span
              className={`font-mono font-extralight tabular-nums leading-none text-[52px] sm:text-[60px] ${
                isWith ? "text-primary" : "text-foreground"
              }`}
            >
              {padded}
            </span>
            <span className="font-mono text-[18px] font-extralight leading-none text-muted-foreground/55">
              /{totalCells}
            </span>
          </div>
          <p
            aria-hidden="true"
            className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65"
          >
            pairs covered
          </p>
        </div>
      </div>

      {/* Hairline 5x5 grid with row+col axis labels */}
      <div className="mt-7 grid grid-cols-[auto_1fr] gap-x-3">
        {/* Row label column */}
        <div className="flex flex-col">
          {/* Spacer matching the col-header row height */}
          <div className="h-7" aria-hidden="true" />
          {PLATFORMS.map((rowP, ri) => {
            const hot = hovered?.row === ri;
            return (
              <div
                key={`row-${rowP.key}`}
                role="rowheader"
                className={`flex flex-1 items-center justify-end pr-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ${
                  hot
                    ? "text-primary"
                    : "text-muted-foreground/75"
                }`}
              >
                {rowP.label}
              </div>
            );
          })}
        </div>

        {/* Right column: col labels + matrix */}
        <div>
          {/* Col labels */}
          <div className="grid h-7 grid-cols-5 items-end pb-1">
            {PLATFORMS.map((p, ci) => {
              const hot = hovered?.col === ci;
              return (
                <div
                  key={`col-${p.key}`}
                  role="columnheader"
                  className={`text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ${
                    hot
                      ? "text-primary"
                      : "text-muted-foreground/75"
                  }`}
                >
                  {p.label}
                </div>
              );
            })}
          </div>

          {/* Matrix proper. The trick: gap-px on a border-tinted background
              so the gaps read as hairlines between cells. Each cell paints
              its own bg-background to occlude the tint. */}
          <div
            role="grid"
            aria-label={
              isWith
                ? "QuickBridge pair compatibility matrix: 25 of 25 platform pairs supported"
                : "Native OS sharing pair matrix: 5 of 25 platform pairs supported"
            }
            className="grid grid-cols-5 gap-px overflow-hidden bg-border/50 ring-1 ring-border/50"
          >
            {PLATFORMS.flatMap((rowP, ri) =>
              PLATFORMS.map((colP, ci) => (
                <Cell
                  key={`${rowP.key}-${colP.key}`}
                  rowP={rowP}
                  colP={colP}
                  ri={ri}
                  ci={ci}
                  variant={variant}
                  hovered={hovered}
                  setHovered={setHovered}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {/* Footer caption */}
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
        {isWith
          ? "Connects every platform, on the same Wi-Fi or across the internet."
          : "Native sharing only flows between AirDrop (Apple) or Quick Share (Android)."}
      </p>
    </div>
  );
}

function Cell({
  rowP,
  colP,
  ri,
  ci,
  variant,
  hovered,
  setHovered,
}: {
  rowP: Platform;
  colP: Platform;
  ri: number;
  ci: number;
  variant: "without" | "with";
  hovered: HoverState;
  setHovered: (h: HoverState) => void;
}) {
  const supported = variant === "with" ? true : nativeSupports(rowP, colP);
  const highlighted =
    variant === "without" && HIGHLIGHTED_PAIRS.has(pairKey(rowP, colP));
  const isHovered = hovered?.row === ri && hovered?.col === ci;
  const isCrossed =
    !isHovered && (hovered?.row === ri || hovered?.col === ci);

  const aria = `${rowP.label} to ${colP.label}: ${
    supported ? "supported" : "no native path"
  }${highlighted ? " (commonly painful pair)" : ""}`;

  let bg = "bg-background";
  if (isHovered) bg = "bg-primary/15";
  else if (isCrossed) bg = "bg-primary/[0.04]";
  else if (highlighted) bg = "bg-destructive/[0.08]";

  return (
    <div
      role="gridcell"
      aria-label={aria}
      tabIndex={-1}
      onMouseEnter={() => setHovered({ row: ri, col: ci })}
      onClick={() =>
        setHovered(isHovered ? null : { row: ri, col: ci })
      }
      className={`relative flex aspect-square cursor-pointer items-center justify-center transition-colors duration-150 ${bg}`}
    >
      {supported ? (
        <span
          aria-hidden="true"
          className={`block rounded-[1px] transition-all duration-150 ${
            isHovered
              ? "h-3 w-3 bg-primary shadow-[0_0_10px_oklch(0.7_0.13_245_/_0.55)] sm:h-3.5 sm:w-3.5"
              : isCrossed
                ? "h-2.5 w-2.5 bg-primary/95 sm:h-2.5 sm:w-2.5"
                : "h-2 w-2 bg-primary/85 sm:h-2 sm:w-2"
          }`}
        />
      ) : highlighted ? (
        <XIcon
          aria-hidden="true"
          className={`transition-all duration-150 ${
            isHovered
              ? "h-3.5 w-3.5 text-destructive sm:h-4 sm:w-4"
              : "h-3 w-3 text-destructive/85 sm:h-3.5 sm:w-3.5"
          }`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`block rounded-full transition-all duration-150 ${
            isHovered
              ? "h-1.5 w-1.5 bg-muted-foreground/70"
              : "h-[3px] w-[3px] bg-muted-foreground/30"
          }`}
        />
      )}
    </div>
  );
}

export function CrossEcosystemMatrix() {
  return (
    <div>
      {/* Section headline */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
          Cross-ecosystem transfers
        </p>
        <h2 className="mt-3 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Most tools leave dead pairs.{" "}
          <span className="text-muted-foreground">QuickBridge connects all 25.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          AirDrop only works between Apple devices. Quick Share only works
          between Android devices. Everything else (Android to Mac, Linux to
          iPhone, Windows to iPhone) is a cable, an upload, or a workaround.
        </p>
      </div>

      {/* Two matrices, side-by-side on md+, stacked on mobile.
          Vertical hairline rule between halves on desktop. */}
      <div className="mt-12 grid gap-y-14 md:grid-cols-2 md:gap-x-12 md:gap-y-0">
        <div className="md:pr-2">
          <Matrix variant="without" />
        </div>
        <div className="md:border-l md:border-border/40 md:pl-12">
          <Matrix variant="with" />
        </div>
      </div>

      {/* Clarifier */}
      <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground/65 sm:text-[12px]">
        Each cell is one device sending to another. 5 platforms × 5 = 25 pairs.
        Hover or tap a cell to highlight the pair.
      </p>

      {/* Sub-takeaway: the three pain pairs called out by name */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] sm:text-[13px]">
        <span className="text-muted-foreground">QuickBridge unblocks:</span>
        {[
          "Android ↔ Mac",
          "Linux ↔ iPhone",
          "Windows ↔ iPhone",
        ].map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 font-medium text-foreground"
          >
            <Check className="h-3 w-3 text-primary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
