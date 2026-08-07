import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useReducedMotion,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import { HeroDeviceViz } from "./HeroDeviceViz";

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
 * while the inner panel stays pinned. Text transitions when each
 * 100-viewport segment becomes active, while the shared device visual
 * remains in place.
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
    const idx = Math.min(
      INTERACTIONS.length - 1,
      Math.floor(v * INTERACTIONS.length),
    );
    setActiveIndex((prev) => (prev !== idx ? idx : prev));
  });

  return (
    <div ref={containerRef} style={{ minHeight: "500vh" }} className="relative">
      <div
        className="sticky top-[57px] h-[calc(100svh-57px)] overflow-clip sm:top-[69px] sm:h-[calc(100svh-69px)]"
      >
        <div className="flex h-full flex-col justify-center px-4 py-4 sm:px-8 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <SectionLabel />
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-16">
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
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {INTERACTIONS[activeIndex].label}
                    </p>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
                      {String(activeIndex + 1).padStart(2, "0")} /{" "}
                      {String(INTERACTIONS.length).padStart(2, "0")}
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

            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.62, ease: EASE }}
                className="qb-chapter2-visual flex aspect-square w-full items-center justify-center"
              >
                <HeroDeviceViz compact />
              </motion.div>
            </div>
          </div>

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
                    transition={{
                      repeat: Infinity,
                      duration: 1.4,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground/40">
                  scroll
                </span>
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
        <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-primary">
          Chapter 2
        </p>
        <span className="h-px w-8 bg-primary/35" aria-hidden="true" />
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          After the first connection
        </p>
      </div>
      <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted-foreground/75">
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
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-foreground/65">
        {fromLabel}
      </span>
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
        <path
          d="M1 4 H18 M15 1 L21 4 L15 7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-foreground/65">
        {toLabel}
      </span>
    </div>
  );
}