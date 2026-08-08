import { motion, useReducedMotion } from "framer-motion";

export function SecuritySection() {
  const prefersReduced = useReducedMotion() ?? false;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Private by default
        </p>
        <h2 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Your files take the shortest route.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          QuickBridge connects your devices directly, then gets out of the way.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/30 p-6 sm:p-9">
        <div
          className="flex flex-col items-center justify-center py-9 sm:py-11"
          role="img"
          aria-label="Your file is encrypted, sent directly, then gone from the server"
        >
          <div className="grid w-full max-w-2xl grid-cols-4 justify-items-center font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground/75 sm:text-[13px] sm:tracking-[0.2em]">
            <span>Your file</span>
            <span>Encrypted</span>
            <span className="font-semibold text-primary/90">Direct</span>
            <span>Gone</span>
          </div>

          <div className="relative mt-5 h-3 w-full max-w-2xl overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
            <motion.div
              className="absolute left-1/2 top-1/2 h-px w-1/4 -translate-y-1/2 bg-primary/80 shadow-[0_0_12px_oklch(0.7_0.13_245_/_0.55)]"
              animate={prefersReduced ? { opacity: 1 } : { opacity: [0.5, 0.95, 0.5] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            />
            {!prefersReduced && (
              <>
                {[0, 1, 2].map((packet) => (
                  <motion.span
                    key={packet}
                    className="absolute top-1/2 h-px w-8 -translate-y-1/2 bg-foreground shadow-[0_0_8px_oklch(0.965_0.004_250_/_0.8)]"
                    animate={{ left: ["-8%", "108%"], opacity: [0, 0.9, 0] }}
                    transition={{
                      duration: 2.8,
                      delay: packet * 0.62,
                      ease: "linear",
                      repeat: Infinity,
                      repeatDelay: 0.8,
                    }}
                  />
                ))}
                <motion.span
                  className="absolute left-[66.666%] top-1/2 h-3 w-px -translate-y-1/2 bg-primary shadow-[0_0_9px_oklch(0.7_0.13_245_/_0.75)]"
                  animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, delay: 1.4, ease: "easeInOut", repeat: Infinity }}
                />
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Nothing stored.
            <br className="hidden sm:block" /> Nothing to clean up.
            <br className="hidden sm:block" /> Nothing to leak.
          </h2>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6 text-center sm:mt-16">
          <p className="mx-auto max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            <span className="font-semibold text-foreground">Up to 10 GB</span> with auto-save,
            pairing in under five seconds, and no subscription or account required.
          </p>
        </div>
      </div>
    </div>
  );
}
