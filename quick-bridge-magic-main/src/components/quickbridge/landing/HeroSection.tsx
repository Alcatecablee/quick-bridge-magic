import { motion, useReducedMotion } from "framer-motion";

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
    hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: "110%" },
    visible: {
      opacity: 1,
      y: "0%",
      transition: { duration: 0.62, delay, ease: EASE },
    },
  });

  const mkFade = (delay: number) => ({
    hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.58, delay, ease: EASE },
    },
  });

  const line1Variants = mkLine(0.04);
  const line2Variants = mkLine(0.14);
  const line3Variants = mkLine(0.24);
  const subtitleVariants = mkFade(0.38);
  const ctaVariants = mkFade(0.5);

  const init = prefersReduced ? "visible" : "hidden";

  return (
    <section className="mx-auto max-w-5xl text-center">
      <motion.h1 className="text-balance tracking-[-0.035em] text-foreground font-black text-[36px] leading-[1.04] sm:text-[46px] md:text-[68px]">
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
            className="block text-muted-foreground"
          >
            Make every device
          </motion.span>
        </span>

        <span className="mt-1 block overflow-hidden pb-[0.1em] sm:mt-2">
          <motion.span
            variants={line3Variants}
            initial={init}
            animate="visible"
            className="block text-muted-foreground"
          >
            feel like the same computer.
          </motion.span>
        </span>
      </motion.h1>

      <motion.p
        variants={subtitleVariants}
        initial={init}
        animate="visible"
        className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15px]"
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
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-foreground px-5 py-2.5 text-[14px] font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Start a bridge{" "}
          <span aria-hidden="true" className="ml-1">
            ↓
          </span>
        </motion.button>
      )}
    </section>
  );
}
