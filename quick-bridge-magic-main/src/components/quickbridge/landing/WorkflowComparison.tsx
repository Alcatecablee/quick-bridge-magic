import { motion, useReducedMotion } from "framer-motion";

export function WorkflowComparison() {
  const prefersReduced = useReducedMotion();

  // Slow, painful animation for the old way
  const slowFlowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 1.5, delayChildren: 0.5 },
    },
  };

  const slowItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 1 } },
  };

  const slowBarVariants = {
    hidden: { width: "0%" },
    visible: {
      width: "100%",
      transition: { duration: 2.5, ease: "linear" as const },
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          One direct connection
        </p>
        <h2 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          The old way vs. QuickBridge.
        </h2>
      </div>

      <div className="mt-10 flex flex-col gap-5 sm:mt-14 sm:gap-6">
        {/* ---- OLD WAY ---- */}
        <div className="rounded-2xl border border-border/70 bg-card/30 p-5 sm:p-8">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 text-center">
            The old way
          </p>
          <motion.div
            variants={slowFlowVariants}
            initial={prefersReduced ? "visible" : "hidden"}
            animate="visible"
            className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-2"
          >
            <motion.div variants={slowItemVariants} className="font-mono text-[13px] text-muted-foreground">Phone</motion.div>
            
            <motion.div variants={slowItemVariants} className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground/40">Upload...</span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5 sm:w-16">
                {!prefersReduced && (
                  <motion.div variants={slowBarVariants} className="h-full bg-muted-foreground/30" />
                )}
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[13px] text-muted-foreground">Cloud...</motion.div>
            
            <motion.div variants={slowItemVariants} className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground/40">Download...</span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5 sm:w-16">
                {!prefersReduced && (
                  <motion.div variants={slowBarVariants} className="h-full bg-muted-foreground/30" />
                )}
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[13px] text-muted-foreground">Desktop</motion.div>
          </motion.div>
        </div>

        {/* ---- QUICKBRIDGE ---- */}
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.045] p-5 shadow-lg shadow-primary/[0.04] sm:p-8">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary text-center">
            QuickBridge
          </p>
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-4 sm:gap-8"
          >
            <div className="font-mono text-[16px] font-medium text-foreground">Phone</div>
            <div className="relative flex h-px w-32 items-center bg-primary/40 sm:w-64">
              {!prefersReduced && (
                <motion.div
                  className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-primary"
                  style={{ boxShadow: "0 0 10px oklch(0.7 0.13 245 / 0.8)" }}
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 0.3, ease: "easeOut", repeat: Infinity, repeatDelay: 1.5 }}
                />
              )}
            </div>
            <div className="font-mono text-[16px] font-medium text-foreground">Desktop</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
