import { motion, useReducedMotion } from "framer-motion";

export function SecuritySection() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      {/* ── Visual Flow: Your file -> Encrypted -> Direct -> Gone ── */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex w-full max-w-2xl items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[12px]">
          <span>Your file</span>
          <span className="hidden sm:inline">Encrypted</span>
          <span className="hidden sm:inline">Direct</span>
          <span>Gone</span>
        </div>

        <div className="relative mt-4 h-[1px] w-full max-w-2xl bg-white/5">
          {!prefersReduced && (
            <motion.div
              className="absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
              animate={{ left: ["-25%", "100%"] }}
              transition={{
                duration: 3,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Trust Statement ── */}
      <div className="text-center">
        <h2 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Nothing stored.
          <br className="hidden sm:block" /> Nothing to clean up.
          <br className="hidden sm:block" /> Nothing to leak.
        </h2>
      </div>

      {/* ── Metrics without cards ── */}
      <div className="mt-20 sm:mt-32">
        <div className="grid grid-cols-1 gap-8 divide-y divide-white/5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col items-center py-4 text-center sm:py-0">
            <span className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              10<span className="text-3xl text-muted-foreground/50">GB</span>
            </span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Maximum file size
            </span>
          </div>

          <div className="flex flex-col items-center py-4 text-center sm:py-0">
            <span className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              &lt;5<span className="text-3xl text-muted-foreground/50">s</span>
            </span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Average pairing time
            </span>
          </div>

          <div className="flex flex-col items-center py-4 text-center sm:py-0">
            <span className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              Free
            </span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Forever
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
