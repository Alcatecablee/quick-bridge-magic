import { motion, useReducedMotion } from "framer-motion";
import { HeroDeviceViz } from "./HeroDeviceViz";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface HeroSectionProps {
  onScrollToQR?: () => void;
}

/**
 * Landing page hero with clip-mask reveal animation.
 */
export function HeroSection({ onScrollToQR }: HeroSectionProps) {
  const prefersReduced = useReducedMotion();

  // Clip-reveal variant factory.
  const mkLine = (delay: number) => ({
    hidden: prefersReduced
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: "110%" },
    visible: {
      opacity: 1,
      y: "0%",
      transition: { duration: 0.9, delay, ease: EASE },
    },
  });

  const mkFade = (delay: number) => ({
    hidden: prefersReduced
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.75, delay, ease: EASE },
    },
  });

  const line1Variants = mkLine(0.1);
  const line2Variants = mkLine(0.85);
  const line3Variants = mkLine(1.55);
  const subtitleVariants = mkFade(2.15);
  const vizVariants = mkFade(2.45);
  const ctaVariants = mkFade(2.7);

  const init = prefersReduced ? "visible" : "hidden";

  return (
    <section className="mb-10 pt-4 text-center sm:mb-12 sm:pt-8">
      <motion.h1 className="font-black tracking-tight text-[44px] leading-[1.1] sm:text-[58px] md:text-[72px]">
        <span className="block overflow-hidden pb-[0.1em]">
          <motion.span
            variants={line1Variants}
            initial={init}
            animate="visible"
            className="block text-foreground"
          >
            Move files instantly.
          </motion.span>
        </span>

        <span className="mt-1 block overflow-hidden pb-[0.1em] sm:mt-2">
          <motion.span
            variants={line2Variants}
            initial={init}
            animate="visible"
            className="block text-foreground"
          >
            Make every device
          </motion.span>
        </span>

        <span className="mt-1 block overflow-hidden pb-[0.1em] sm:mt-2">
          <motion.span
            variants={line3Variants}
            initial={init}
            animate="visible"
            className="block text-foreground"
          >
            feel like the same computer.
          </motion.span>
        </span>
      </motion.h1>

      <motion.p
        variants={subtitleVariants}
        initial={init}
        animate="visible"
        className="mx-auto mt-8 max-w-2xl text-[18px] font-medium leading-relaxed text-muted-foreground sm:text-[22px]"
      >
        Files. Tabs. Clipboard. Photos. One click.
      </motion.p>

      {onScrollToQR && (
        <motion.button
          type="button"
          variants={ctaVariants}
          initial={init}
          animate="visible"
          onClick={onScrollToQR}
          className="mt-5 inline-flex min-h-11 items-center rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Start a bridge <span aria-hidden="true" className="ml-1">↓</span>
        </motion.button>
      )}

      <motion.div
        variants={vizVariants}
        initial={init}
        animate="visible"
        className="mt-12"
      >
        <HeroDeviceViz />
      </motion.div>
    </section>
  );
}
