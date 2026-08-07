import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE_SETTLE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const PACKET_DURATION_MS = 1_250;
const PACKET_DELAYS_MS = [1_900, 2_500, 2_050, 3_100] as const;

const ACTIVITY_MESSAGES = [
  "✓ Connected",
  "Pasted on Laptop",
  "Tab opened",
  "Photo received",
  "Clipboard synced",
] as const;

type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * A presentation layer for the homepage system diagram.
 *
 * The image is only a visual reference. This component does not create a
 * session, inspect a peer, or send data. Pairing and transfer behavior remains
 * in the session route and WebRTC hook.
 */
export function HeroDeviceViz() {
  const prefersReduced = useReducedMotion();
  const [activityIndex, setActivityIndex] = useState(0);
  const [packetId, setPacketId] = useState(0);
  const [packetActive, setPacketActive] = useState(false);
  const timersRef = useRef<Set<TimerHandle>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    setPacketActive(false);

    if (prefersReduced) return;

    let alive = true;
    let delayIndex = 0;

    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (alive) callback();
      }, delay);
      timers.add(timer);
    };

    const launchPacket = () => {
      if (!alive) return;

      setPacketId((current) => current + 1);
      setPacketActive(true);

      schedule(() => {
        if (!alive) return;

        setPacketActive(false);
        setActivityIndex((current) => (current + 1) % ACTIVITY_MESSAGES.length);

        const nextDelay = PACKET_DELAYS_MS[delayIndex % PACKET_DELAYS_MS.length];
        delayIndex += 1;
        schedule(launchPacket, nextDelay);
      }, PACKET_DURATION_MS);
    };

    schedule(launchPacket, 1_250);

    return () => {
      alive = false;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [prefersReduced]);

  const currentActivity = ACTIVITY_MESSAGES[activityIndex];
  const imageLabel = `Phone and computer connected through a QuickBridge hub. ${currentActivity}.`;

  return (
    <figure className="mx-auto mt-1 w-full max-w-[680px]">
      <div
        className="qb-hero-system relative mx-auto aspect-[1024/1024] w-full max-w-[440px]"
        role="img"
        aria-label={imageLabel}
      >
        <img
          src="/images/quickbridge-living-system-transparent.png"
          alt="A phone and computer connected through a QuickBridge QR hub"
          className="absolute inset-0 h-full w-full object-contain"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />

        <svg
          viewBox="0 0 1024 1024"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <filter id="qb-system-packet-glow" x="-250%" y="-250%" width="600%" height="600%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="qb-system-ring-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 250 506 C 330 484 410 492 465 506 M 559 506 C 630 490 700 498 770 510"
            stroke="oklch(0.82 0.13 195 / 0.28)"
            strokeWidth="2"
            strokeLinecap="round"
            className="qb-hero-system-route-glow"
          />
          <path
            d="M 250 506 C 330 484 410 492 465 506 M 559 506 C 630 490 700 498 770 510"
            stroke="oklch(0.82 0.13 195 / 0.58)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="3 15"
            className="qb-hero-system-route"
          />

          {!prefersReduced && packetActive && (
            <>
              <motion.circle
                key={`packet-${packetId}`}
                r="4"
                fill="oklch(0.9 0.1 190)"
                filter="url(#qb-system-packet-glow)"
                initial={{ cx: 250, cy: 506, opacity: 0 }}
                animate={{
                  cx: [250, 330, 410, 465, 512, 559, 630, 700, 770],
                  cy: [506, 484, 492, 506, 506, 506, 490, 498, 510],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 0.9, 0],
                }}
                transition={{
                  duration: PACKET_DURATION_MS / 1000,
                  times: [0, 0.16, 0.29, 0.39, 0.5, 0.61, 0.74, 0.88, 1],
                  ease: EASE_SETTLE,
                }}
              />
              <motion.circle
                key={`packet-echo-${packetId}`}
                r="2"
                fill="oklch(0.84 0.13 190 / 0.7)"
                initial={{ cx: 250, cy: 506, opacity: 0 }}
                animate={{
                  cx: [250, 330, 410, 465, 512, 559, 630, 700, 770],
                  cy: [506, 484, 492, 506, 506, 506, 490, 498, 510],
                  opacity: [0, 0.65, 0.65, 0.65, 0.65, 0.65, 0.45, 0.2, 0],
                }}
                transition={{
                  duration: PACKET_DURATION_MS / 1000,
                  delay: 0.12,
                  times: [0, 0.16, 0.29, 0.39, 0.5, 0.61, 0.74, 0.88, 1],
                  ease: EASE_SETTLE,
                }}
              />
            </>
          )}

          <motion.circle
            cx="512"
            cy="506"
            r="51"
            fill="none"
            stroke="oklch(0.84 0.13 190 / 0.55)"
            strokeWidth="1.5"
            className="qb-hero-system-hub-ring"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{
              opacity: packetActive ? [0.3, 0.9, 0.3] : 0.3,
              scale: packetActive ? [0.92, 1.08, 0.92] : 1,
            }}
            transition={{ duration: packetActive ? 0.7 : 0.2, ease: EASE_SETTLE }}
            style={{ transformOrigin: "512px 506px" }}
          />
        </svg>
      </div>
      <figcaption className="sr-only" aria-live="polite">
        {currentActivity}
      </figcaption>
    </figure>
  );
}
