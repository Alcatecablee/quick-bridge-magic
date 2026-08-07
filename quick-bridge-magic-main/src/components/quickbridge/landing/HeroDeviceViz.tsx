import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE_SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ACTIVITY_MESSAGES = [
  "Pasted on Laptop",
  "Sent tab to Desktop",
  "Moved photo to Phone",
  "Continued reading on Desktop",
] as const;

/**
 * Animated hero visualization: phone and computer connected via a live
 * channel, with a cycling status badge showing Continuity actions.
 *
 * Memory-safe cleanup: all timers (startDelay, interval, flipTimer) are
 * tracked in refs and cancelled in the single useEffect cleanup.
 * The offsetPath CSS motion-path dot is replaced with a simpler keyframe
 * animation to avoid cross-browser quirks with CSS offset-path.
 */
export function HeroDeviceViz() {
  const prefersReduced = useReducedMotion();
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);

  // Refs track every timer so we can clean them all up on unmount.
  const startDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prefersReduced) return;

    // alive guards against state updates after unmount. Without it, if the
    // component unmounts while the 2400ms start delay is still pending the
    // clearTimeout in cleanup cancels correctly, but in React StrictMode the
    // effect runs twice: the first cleanup fires, then the second effect's
    // setTimeout fires and assigns intervalRef.current after the second
    // cleanup has already run, leaving a dangling interval.
    let alive = true;

    startDelayRef.current = setTimeout(() => {
      if (!alive) return;
      intervalRef.current = setInterval(() => {
        if (!alive) return;
        setActivityVisible(false);

        flipTimerRef.current = setTimeout(() => {
          if (!alive) return;
          setActivityIndex((i) => (i + 1) % ACTIVITY_MESSAGES.length);
          setActivityVisible(true);
        }, 320);
      }, 2600);
    }, 2400);

    return () => {
      alive = false;
      if (startDelayRef.current !== null) {
        clearTimeout(startDelayRef.current);
        startDelayRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (flipTimerRef.current !== null) {
        clearTimeout(flipTimerRef.current);
        flipTimerRef.current = null;
      }
    };
  }, [prefersReduced]);

  return (
    <div
      className="mx-auto mt-2"
      style={{ maxWidth: 480, height: 160 }}
      aria-label="Phone and computer connected via QuickBridge"
      role="img"
    >
      <svg
        viewBox="0 0 480 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* ── PHONE (left) ─────────────────────────────────────────────── */}
        <motion.g
          initial={prefersReduced ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE_SPRING }}
        >
          <rect
            x="56" y="24" width="60" height="106" rx="9"
            stroke="oklch(0.7 0.13 245 / 0.55)" strokeWidth="1.5"
            fill="oklch(0.7 0.13 245 / 0.05)"
          />
          <line x1="76" y1="30" x2="96" y2="30"
            stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="78" y="120" width="16" height="3" rx="1.5"
            fill="oklch(0.7 0.13 245 / 0.3)" />
          <motion.g
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <rect x="66" y="42" width="40" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.3)" />
            <rect x="66" y="50" width="32" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
            <rect x="66" y="58" width="36" height="2.5" rx="1.25" fill="oklch(0.7 0.13 245 / 0.2)" />
            <rect x="66" y="70" width="40" height="24" rx="3"
              fill="oklch(0.7 0.13 245 / 0.08)" stroke="oklch(0.7 0.13 245 / 0.15)" strokeWidth="1" />
          </motion.g>
          <text x="86" y="143" textAnchor="middle" fontSize="9"
            fontFamily="Inter, sans-serif" fontWeight="600"
            fill="oklch(0.66 0.012 255)" letterSpacing="0.1em"
            style={{ textTransform: "uppercase" }}>
            PHONE
          </text>
        </motion.g>

        {/* ── CONNECTION LINE ───────────────────────────────────────────── */}
        <motion.path
          d="M 118 77 C 160 77, 320 77, 362 77"
          stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray="4 5"
          initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE_SPRING }}
        />

        {/* Travelling pulse dot — simple left-to-right x animation;
            no CSS offset-path to avoid cross-browser quirks.           */}
        {!prefersReduced && (
          <motion.circle
            r="3.5"
            fill="oklch(0.7 0.13 245 / 0.7)"
            cy="77"
            initial={{ opacity: 0, cx: 118 }}
            animate={{ opacity: [0, 1, 1, 0], cx: [118, 240, 362, 362] }}
            transition={{
              duration: 1.6,
              delay: 1.8,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: "easeInOut",
            }}
          />
        )}

        {/* ── QR NODE (midpoint) ────────────────────────────────────────── */}
        <motion.g
          initial={prefersReduced ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0, ease: EASE_SPRING }}
          style={{ transformOrigin: "240px 77px" }}
        >
          <rect x="224" y="61" width="32" height="32" rx="5"
            fill="oklch(0.135 0.006 265)" stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1" />
          <rect x="230" y="67" width="7" height="7" rx="1"
            fill="none" stroke="oklch(0.7 0.13 245 / 0.6)" strokeWidth="1" />
          <rect x="243" y="67" width="7" height="7" rx="1"
            fill="none" stroke="oklch(0.7 0.13 245 / 0.6)" strokeWidth="1" />
          <rect x="230" y="80" width="7" height="7" rx="1"
            fill="none" stroke="oklch(0.7 0.13 245 / 0.6)" strokeWidth="1" />
          <rect x="244" y="80" width="3" height="3" rx="0.5" fill="oklch(0.7 0.13 245 / 0.5)" />
          <rect x="244" y="75" width="3" height="3" rx="0.5" fill="oklch(0.7 0.13 245 / 0.35)" />
          <rect x="249" y="80" width="3" height="3" rx="0.5" fill="oklch(0.7 0.13 245 / 0.35)" />
        </motion.g>

        {/* ── COMPUTER (right) ─────────────────────────────────────────── */}
        <motion.g
          initial={prefersReduced ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE_SPRING }}
        >
          <rect x="364" y="20" width="86" height="72" rx="5"
            stroke="oklch(0.7 0.13 245 / 0.55)" strokeWidth="1.5"
            fill="oklch(0.7 0.13 245 / 0.05)" />
          <rect x="370" y="26" width="74" height="60" rx="2"
            stroke="oklch(0.7 0.13 245 / 0.2)" strokeWidth="0.75" fill="none" />
          <path d="M 396 92 L 388 108 L 426 108 L 418 92"
            stroke="oklch(0.7 0.13 245 / 0.4)" strokeWidth="1.2"
            strokeLinejoin="round" fill="oklch(0.7 0.13 245 / 0.04)" />
          <line x1="382" y1="108" x2="432" y2="108"
            stroke="oklch(0.7 0.13 245 / 0.35)" strokeWidth="1.2" strokeLinecap="round" />
          <motion.g
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <rect x="376" y="32" width="62" height="4" rx="2" fill="oklch(0.7 0.13 245 / 0.25)" />
            <rect x="376" y="40" width="48" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.15)" />
            <rect x="376" y="47" width="54" height="3" rx="1.5" fill="oklch(0.7 0.13 245 / 0.15)" />
            <rect x="376" y="56" width="62" height="22" rx="3"
              fill="oklch(0.7 0.13 245 / 0.07)" stroke="oklch(0.7 0.13 245 / 0.18)" strokeWidth="1" />
          </motion.g>
          <text x="407" y="122" textAnchor="middle" fontSize="9"
            fontFamily="Inter, sans-serif" fontWeight="600"
            fill="oklch(0.66 0.012 255)" letterSpacing="0.1em"
            style={{ textTransform: "uppercase" }}>
            COMPUTER
          </text>
        </motion.g>

        {/* ── CONNECTED BADGE ──────────────────────────────────────────── */}
        <motion.g
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease: EASE_SPRING }}
        >
          <rect x="193" y="107" width="94" height="20" rx="10"
            fill="oklch(0.175 0.006 265)" stroke="oklch(0.7 0.13 245 / 0.3)" strokeWidth="1" />
          <circle cx="208" cy="117" r="3" fill="oklch(0.74 0.14 158)" />
          <text x="246" y="121" textAnchor="middle" fontSize="9.5"
            fontFamily="Inter, sans-serif" fontWeight="600"
            fill="oklch(0.965 0.004 250)">
            Connected
          </text>
        </motion.g>
      </svg>

      {!prefersReduced && (
        <div className="mt-1 flex h-5 items-center justify-center">
          <span
            className="text-[11px] italic transition-opacity duration-300"
            style={{
              opacity: activityVisible ? 0.4 : 0,
              color: "oklch(0.66 0.012 255)",
            }}
          >
            {ACTIVITY_MESSAGES[activityIndex]}
          </span>
        </div>
      )}
    </div>
  );
}
