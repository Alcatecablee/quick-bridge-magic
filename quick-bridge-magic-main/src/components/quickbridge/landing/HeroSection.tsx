import { motion, useReducedMotion } from "framer-motion";
import { HeroDeviceViz } from "./HeroDeviceViz";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Landing page hero with clip-mask reveal animation.
 */
export function HeroSection() {
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
  const line2Variants = mkLine(0.3);
  const line3Variants = mkLine(0.4);
  const subtitleVariants = mkFade(0.7);
  const vizVariants = mkFade(0.9);

  const init = prefersReduced ? "visible" : "hidden";

  return (
    <section className="mb-10 pt-4 text-center sm:mb-12 sm:pt-8">
      <div className="overflow-hidden pb-[0.1em]">
        <motion.div
          role="heading"
          aria-level={1}
          variants={line1Variants}
          initial={init}
          animate="visible"
          className="block font-black tracking-tight text-foreground text-[44px] leading-[1.1] sm:text-[58px] md:text-[72px]"
        >
          Move files instantly.
        </motion.div>
      </div>

      <div className="mt-1 overflow-hidden pb-[0.1em] sm:mt-2">
        <motion.div
          variants={line2Variants}
          initial={init}
          animate="visible"
          className="block font-black tracking-tight text-foreground/70 text-[44px] leading-[1.1] sm:text-[58px] md:text-[72px]"
        >
          Make every device
        </motion.div>
      </div>
      
      <div className="mt-1 overflow-hidden pb-[0.1em] sm:mt-2">
        <motion.div
          variants={line3Variants}
          initial={init}
          animate="visible"
          className="block font-black tracking-tight text-foreground/70 text-[44px] leading-[1.1] sm:text-[58px] md:text-[72px]"
        >
          feel like the same computer.
        </motion.div>
      </div>

      <motion.p
        variants={subtitleVariants}
        initial={init}
        animate="visible"
        className="mx-auto mt-8 max-w-2xl text-[18px] font-medium leading-relaxed text-muted-foreground sm:text-[22px]"
      >
        Files. Tabs. Clipboard. Photos. One click.
      </motion.p>

      {/* Remove the CTA button completely, rely on the Pairing UI right below */}

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
