import { motion, useReducedMotion } from "framer-motion";

export function SecuritySection() {
  const prefersReduced = useReducedMotion();

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
      {/* ── Visual Flow: Your file -> Encrypted -> Direct -> Gone ── */}
      <div className="flex flex-col items-center justify-center py-9 sm:py-11">
        <div className="grid w-full max-w-2xl grid-cols-2 justify-items-center gap-y-4 font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75 sm:flex sm:items-center sm:justify-between sm:gap-y-0 sm:text-[13px]">
          <span>Your file</span>
          <span>Encrypted</span>
          <span className="font-semibold text-primary/90">Direct</span>
          <span>Gone</span>
        </div>

        <div className="relative mt-5 h-[1px] w-full max-w-2xl bg-white/10">
          {!prefersReduced && (
            <motion.div
              className="absolute left-0 top-0 h-full w-1/4 bg-primary/60"
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
