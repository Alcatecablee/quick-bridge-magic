import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useReducedMotion,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Interaction {
  label: string;
  heading: string;
  description: string;
  fromLabel: string;
  toLabel: string;
}

const INTERACTIONS: Interaction[] = [
  {
    label: "Send tab",
    heading: "Send this tab.",
    description:
      "Reading something on your laptop? One click and it is open on your phone, at the same scroll position.",
    fromLabel: "Laptop",
    toLabel: "Phone",
  },
  {
    label: "Continue reading",
    heading: "Continue reading.",
    description:
      "Started an article on your phone? Pick it up on your desktop without sending yourself a link.",
    fromLabel: "Phone",
    toLabel: "Desktop",
  },
  {
    label: "Paste anywhere",
    heading: "Paste anything.",
    description:
      "Copy text on one device and paste it on another. No email, no notes app, no cloud clipboard.",
    fromLabel: "Any device",
    toLabel: "Any device",
  },
  {
    label: "Move a photo",
    heading: "Move that photo.",
    description:
      "Took a shot on your phone and need it on your computer right now? Tap once. It is there.",
    fromLabel: "Phone",
    toLabel: "Computer",
  },
  {
    label: "Open a file",
    heading: "Open on any screen.",
    description:
      "Send a document, spreadsheet, or PDF to another device and keep working where the screen is bigger.",
    fromLabel: "Computer",
    toLabel: "Tablet or Phone",
  },
];

/**
 * Sticky scroll storytelling section. Five interactions scroll into view
 * while the inner panel stays pinned. Content transitions when each
 * 100-viewport segment becomes active.
 *
 * On reduced-motion: renders a simple vertical list instead of sticky.
 */
export function StickyScrollSection() {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <ReducedMotionFallback />;
  }

  return <StickyImpl />;
}

function ReducedMotionFallback() {
  return (
    <div className="mx-auto max-w-3xl">
      <SectionLabel />
      <div className="mt-8 flex flex-col gap-6">
        {INTERACTIONS.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-card/30 px-6 py-6"
          >
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {item.label}
            </p>
            <h3 className="text-xl font-black tracking-tight text-foreground">
              {item.heading}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <DeviceRow fromLabel={item.fromLabel} toLabel={item.toLabel} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StickyImpl() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(INTERACTIONS.length - 1, Math.floor(v * INTERACTIONS.length));
    setActiveIndex((prev) => (prev !== idx ? idx : prev));
  });

  return (
    <div ref={containerRef} style={{ minHeight: "500vh" }} className="relative">
      {/* Sticky inner panel.
          overflow:clip clips exit animations without creating a scroll
          container. overflow:hidden creates a scroll container, which is
          the CSS mechanism that kills position:sticky on any descendant
          that relies on viewport scrolling. */}
      <div
        className="sticky top-0 h-screen"
        style={{ height: "100svh", overflow: "clip" }}
      >
        <div className="flex h-full flex-col justify-center px-4 py-12 sm:px-8">
          {/* Section label at top */}
          <div className="mb-8 sm:mb-10">
            <SectionLabel />
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16">
            {/* LEFT: rotating text content */}
            <div className="flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.62, ease: EASE }}
                  className="flex flex-col gap-5"
                >
                  {/* Step indicator */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {INTERACTIONS[activeIndex].label}
                    </p>
                    <div
                      className="flex items-center gap-1.5"
                      role="progressbar"
                      aria-label={`Chapter 2, step ${activeIndex + 1} of ${INTERACTIONS.length}`}
                      aria-valuemin={1}
                      aria-valuemax={INTERACTIONS.length}
                      aria-valuenow={activeIndex + 1}
                    >
                      {INTERACTIONS.map((_, i) => (
                        <div
                          key={i}
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: i === activeIndex ? 24 : 7,
                            background:
                              i === activeIndex
                                ? "oklch(0.7 0.13 245)"
                                : "oklch(0.7 0.13 245 / 0.2)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
                      {String(activeIndex + 1).padStart(2, "0")} / {String(INTERACTIONS.length).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="max-w-lg text-[36px] font-black leading-[1.02] tracking-tight text-foreground sm:text-[48px]">
                    {INTERACTIONS[activeIndex].heading}
                  </h2>

                  <p className="max-w-md text-[15px] leading-[1.7] text-muted-foreground">
                    {INTERACTIONS[activeIndex].description}
                  </p>

                  <DeviceRow
                    fromLabel={INTERACTIONS[activeIndex].fromLabel}
                    toLabel={INTERACTIONS[activeIndex].toLabel}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

                    {/* RIGHT: device interaction scene */}
            <div className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.62, ease: EASE }}
                  className="qb-chapter2-scene flex h-64 w-full max-w-sm items-center justify-center rounded-[26px] sm:h-[18rem]"
                >
                  <InteractionScene index={activeIndex} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll hint (fades out once user starts scrolling) */}
          <AnimatePresence initial={false}>
            {activeIndex === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
              >
                <div className="flex h-8 w-5 items-start justify-center rounded-full border border-border/50 p-1">
                  <motion.div
                    className="h-1.5 w-1 rounded-full bg-muted-foreground"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground/40">scroll</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SectionLabel() {
  return (
    <div className="qb-chapter2-header max-w-2xl border-b border-border/50 pb-4">
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Chapter 2
        </p>
        <span className="h-px w-8 bg-primary/35" aria-hidden="true" />
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          After the first connection
        </p>
      </div>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground/65">
        Trust your devices once. Every action after that takes one click.
      </p>
    </div>
  );
}

function DeviceRow({
  fromLabel,
  toLabel,
}: {
  fromLabel: string;
  toLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-1.5">
      <span className="rounded-md border border-border/70 bg-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/65">
        {fromLabel}
      </span>
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
        <path
          d="M1 4 H18 M15 1 L21 4 L15 7"
          stroke="oklch(0.7 0.13 245 / 0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="rounded-md border border-border/70 bg-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/65">
        {toLabel}
      </span>
    </div>
  );
}

/**
 * SVG-based scene for each interaction. Kept intentionally simple and flat.
 * Each scene auto-animates on mount via Framer Motion variants.
 */
function InteractionScene({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <SendTabScene />;
    case 1:
      return <ContinueReadingScene />;
    case 2:
      return <PasteScene />;
    case 3:
      return <MovePhotoScene />;
    case 4:
      return <OpenFileScene />;
    default:
      return null;
  }
}

/* ---- Individual scenes ---- */

function SendTabScene() {
  return (
    <svg viewBox="0 0 320 200" width="280" height="175" fill="none">
      {/* Laptop (left) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <rect x="20" y="50" width="100" height="75" rx="4" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <rect x="26" y="56" width="88" height="63" rx="2" fill="none" stroke="oklch(0.7 0.13 245 / 0.18)" strokeWidth="0.75" />
        {/* Tab bar */}
        <rect x="26" y="56" width="88" height="10" rx="2" fill="oklch(0.7 0.13 245 / 0.1)" />
        <rect x="29" y="58" width="30" height="6" rx="1.5" fill="oklch(0.7 0.13 245 / 0.25)" />
        {/* Content lines */}
        <rect x="30" y="72" width="78" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.2)" />
        <rect x="30" y="79" width="60" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
        <rect x="30" y="85" width="68" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
        {/* Base */}
        <path d="M 5 125 L 15 138 L 105 138 L 115 125" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" strokeLinejoin="round" fill="oklch(0.7 0.13 245 / 0.03)" />
        <line x1="0" y1="138" x2="120" y2="138" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>

      {/* Arrow */}
      <motion.path
        d="M 125 87 C 155 87, 175 87, 195 87"
        stroke="oklch(0.7 0.13 245 / 0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M 192 84 L 198 87 L 192 90"
        stroke="oklch(0.7 0.13 245 / 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.85 }}
      />

      {/* Tab label flying */}
      <motion.rect
        x="135"
        y="81"
        width="28"
        height="12"
        rx="3"
        fill="oklch(0.7 0.13 245)"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: [0, 1, 1, 0], x: [140, 160, 190, 210] }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
      />

      {/* Phone (right) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <rect x="205" y="38" width="56" height="100" rx="8" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <line x1="223" y1="44" x2="243" y2="44" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Phone tab (lights up after arrow) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <rect x="211" y="50" width="44" height="8" rx="1.5" fill="oklch(0.7 0.13 245 / 0.12)" />
          <rect x="213" y="52" width="20" height="4" rx="1" fill="oklch(0.7 0.13 245 / 0.3)" />
          <rect x="213" y="63" width="38" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
          <rect x="213" y="70" width="30" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
          <rect x="213" y="77" width="34" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
        </motion.g>
        <rect x="224" y="128" width="18" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.25)" />
      </motion.g>
    </svg>
  );
}

function ContinueReadingScene() {
  return (
    <svg viewBox="0 0 320 200" width="280" height="175" fill="none">
      {/* Phone (left) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <rect x="30" y="30" width="56" height="100" rx="8" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <line x1="48" y1="36" x2="68" y2="36" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Scrolled-down text lines */}
        <rect x="36" y="44" width="44" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
        <rect x="36" y="51" width="44" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
        <rect x="36" y="58" width="36" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
        <rect x="36" y="65" width="44" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
        {/* Scroll indicator */}
        <rect x="82" y="44" width="2" height="80" rx="1" fill="oklch(0.7 0.13 245 / 0.1)" />
        <motion.rect
          x="82" y="62" width="2" height="20" rx="1"
          fill="oklch(0.7 0.13 245 / 0.55)"
          animate={{ y: [62, 78, 62] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
        <rect x="44" y="118" width="28" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.25)" />
      </motion.g>

      {/* Arrow */}
      <motion.path
        d="M 92 80 C 130 80, 165 80, 200 80"
        stroke="oklch(0.7 0.13 245 / 0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M 197 77 L 203 80 L 197 83"
        stroke="oklch(0.7 0.13 245 / 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.85 }}
      />

      {/* Desktop (right) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <rect x="205" y="40" width="95" height="72" rx="4" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
          <rect x="212" y="48" width="80" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.2)" />
          <rect x="212" y="55" width="60" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
          <rect x="212" y="62" width="70" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.18)" />
          <rect x="212" y="69" width="55" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
          <rect x="212" y="76" width="65" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
          {/* Scroll position badge */}
          <rect x="290" y="48" width="3" height="58" rx="1.5" fill="oklch(0.7 0.13 245 / 0.1)" />
          <rect x="290" y="66" width="3" height="16" rx="1.5" fill="oklch(0.7 0.13 245 / 0.5)" />
        </motion.g>
        <path d="M 222 112 L 216 126 L 294 126 L 288 112" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" fill="none" />
        <line x1="208" y1="126" x2="300" y2="126" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

function PasteScene() {
  return (
    <svg viewBox="0 0 320 200" width="280" height="175" fill="none">
      {/* Clipboard (left) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <rect x="30" y="30" width="80" height="100" rx="6" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        {/* Clip top */}
        <rect x="50" y="24" width="40" height="16" rx="3" stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1.2" fill="oklch(0.135 0.006 265)" />
        <rect x="57" y="27" width="26" height="8" rx="2" fill="oklch(0.7 0.13 245 / 0.12)" />
        {/* Lines on clipboard */}
        <rect x="40" y="52" width="60" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.25)" />
        <rect x="40" y="60" width="46" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
        <rect x="40" y="67" width="52" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
        <rect x="40" y="74" width="40" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
      </motion.g>

      {/* Moving text block */}
      <motion.g
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: [0, 1, 1, 0], x: [40, 80, 150, 195] }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
      >
        <rect width="50" height="14" rx="3" fill="oklch(0.7 0.13 245 / 0.8)" y="73" />
        <rect x="4" y="77" width="42" height="2.5" rx="1.25" fill="oklch(0.135 0.006 265 / 0.5)" />
      </motion.g>

      {/* Arrow */}
      <motion.path
        d="M 115 80 C 145 80, 175 80, 205 80"
        stroke="oklch(0.7 0.13 245 / 0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M 202 77 L 208 80 L 202 83"
        stroke="oklch(0.7 0.13 245 / 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.82 }}
      />

      {/* Desktop cursor + paste */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <rect x="210" y="40" width="90" height="72" rx="4" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
          <rect x="218" y="50" width="74" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.15)" />
          <rect x="218" y="58" width="56" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.1)" />
          {/* Pasted text highlight */}
          <rect x="218" y="66" width="74" height="14" rx="2" fill="oklch(0.7 0.13 245 / 0.12)" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="0.75" />
          <rect x="222" y="70" width="60" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.35)" />
          {/* Cursor blink */}
          <motion.line
            x1="294"
            y1="70"
            x2="294"
            y2="76"
            stroke="oklch(0.7 0.13 245)"
            strokeWidth="1.2"
            strokeLinecap="round"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </motion.g>
        <path d="M 228 112 L 222 126 L 282 126 L 276 112" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" fill="none" />
        <line x1="214" y1="126" x2="294" y2="126" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

function MovePhotoScene() {
  return (
    <svg viewBox="0 0 320 200" width="280" height="175" fill="none">
      {/* Phone (left) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <rect x="30" y="30" width="56" height="100" rx="8" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <line x1="48" y1="36" x2="68" y2="36" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Photo thumbnail */}
        <rect x="36" y="44" width="44" height="36" rx="3" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1" fill="oklch(0.7 0.13 245 / 0.08)" />
        {/* Mountain/landscape icon inside photo */}
        <path d="M 36 74 L 47 58 L 56 68 L 62 62 L 80 74 Z" fill="oklch(0.7 0.13 245 / 0.18)" />
        <circle cx="72" cy="52" r="4" fill="oklch(0.7 0.13 245 / 0.15)" />
        {/* More content below photo */}
        <rect x="36" y="85" width="44" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
        <rect x="36" y="92" width="32" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.08)" />
        <rect x="44" y="120" width="28" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.25)" />
      </motion.g>

      {/* Flying photo */}
      <motion.g
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{ opacity: [0, 1, 1, 0], x: [36, 90, 160, 220], y: [44, 30, 40, 48] }}
        transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
      >
        <rect width="40" height="32" rx="3" stroke="oklch(0.7 0.13 245 / 0.55)" strokeWidth="1" fill="oklch(0.7 0.13 245 / 0.15)" />
        <path d="M 0 25 L 9 14 L 18 20 L 25 12 L 40 25 Z" fill="oklch(0.7 0.13 245 / 0.3)" />
        <circle cx="32" cy="8" r="3.5" fill="oklch(0.7 0.13 245 / 0.25)" />
      </motion.g>

      {/* Arrow */}
      <motion.path
        d="M 92 80 C 130 80, 165 80, 200 80"
        stroke="oklch(0.7 0.13 245 / 0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M 197 77 L 203 80 L 197 83"
        stroke="oklch(0.7 0.13 245 / 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.82 }}
      />

      {/* Desktop (right) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <rect x="205" y="38" width="95" height="76" rx="4" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        {/* Photo appears on desktop */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}>
          <rect x="213" y="46" width="46" height="38" rx="3" stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1" fill="oklch(0.7 0.13 245 / 0.1)" />
          <path d="M 213 76 L 224 62 L 233 70 L 240 64 L 259 76 Z" fill="oklch(0.7 0.13 245 / 0.2)" />
          <circle cx="250" cy="53" r="5" fill="oklch(0.7 0.13 245 / 0.18)" />
        </motion.g>
        <path d="M 222 114 L 216 128 L 294 128 L 288 114" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" fill="none" />
        <line x1="208" y1="128" x2="300" y2="128" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

function OpenFileScene() {
  return (
    <svg viewBox="0 0 320 200" width="280" height="175" fill="none">
      {/* Desktop (left) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <rect x="10" y="38" width="90" height="72" rx="4" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <rect x="17" y="46" width="76" height="58" rx="2" fill="none" stroke="oklch(0.7 0.13 245 / 0.12)" strokeWidth="0.75" />
        {/* File icon */}
        <rect x="35" y="55" width="40" height="50" rx="3" stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1" fill="oklch(0.7 0.13 245 / 0.06)" />
        <path d="M 65 55 L 75 65 L 65 65 Z" fill="oklch(0.135 0.006 265)" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="0.75" />
        <rect x="41" y="70" width="28" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.25)" />
        <rect x="41" y="77" width="22" height="2" rx="1" fill="oklch(0.7 0.13 245 / 0.15)" />
        <rect x="41" y="83" width="25" height="2" rx="1" fill="oklch(0.7 0.13 245 / 0.15)" />
        {/* Base */}
        <path d="M 22 110 L 16 124 L 94 124 L 88 110" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" fill="none" />
        <line x1="8" y1="124" x2="100" y2="124" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>

      {/* Arrow */}
      <motion.path
        d="M 105 74 C 135 74, 165 74, 195 74"
        stroke="oklch(0.7 0.13 245 / 0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M 192 71 L 198 74 L 192 77"
        stroke="oklch(0.7 0.13 245 / 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.82 }}
      />

      {/* Tablet (right) */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <rect x="200" y="24" width="96" height="130" rx="8" stroke="oklch(0.7 0.13 245 / 0.5)" strokeWidth="1.5" fill="oklch(0.7 0.13 245 / 0.04)" />
        <rect x="206" y="30" width="84" height="118" rx="4" fill="none" stroke="oklch(0.7 0.13 245 / 0.18)" strokeWidth="0.75" />
        {/* Home button (tablet) */}
        <circle cx="248" cy="160" r="4" stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1" fill="none" />
        {/* File opens on tablet */}
        <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.5, ease: EASE }} style={{ transformOrigin: "248px 84px" }}>
          <rect x="215" y="36" width="66" height="90" rx="3" stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1" fill="oklch(0.7 0.13 245 / 0.07)" />
          <rect x="222" y="44" width="52" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.3)" />
          <rect x="222" y="51" width="40" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
          <rect x="222" y="57" width="46" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.15)" />
          <rect x="222" y="63" width="36" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
          <rect x="222" y="69" width="42" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.12)" />
          <rect x="222" y="75" width="52" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.1)" />
          <rect x="222" y="81" width="38" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.1)" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
