import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function WorkflowComparison() {
  const prefersReduced = useReducedMotion() ?? false;
  const [simulationTime, setSimulationTime] = useState(0);

  useEffect(() => {
    if (prefersReduced) return;

    const interval = window.setInterval(() => {
      setSimulationTime((current) => (current + 100) % 8_800);
    }, 100);

    return () => window.clearInterval(interval);
  }, [prefersReduced]);

  const uploadProgress = prefersReduced
    ? 100
    : simulationTime < 3_200
      ? (simulationTime / 3_200) * 100
      : 100;
  const downloadProgress = prefersReduced
    ? 100
    : simulationTime < 4_000
      ? 0
      : simulationTime < 7_200
        ? ((simulationTime - 4_000) / 3_200) * 100
        : 100;

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
        <div className="rounded-xl border border-border/70 bg-card/30 p-5 sm:p-8">
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
              <span className="text-[10px] uppercase text-muted-foreground/40">
                Upload {Math.round(uploadProgress)}%
              </span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5 sm:w-16">
                <div
                  className="h-full bg-muted-foreground/30 transition-[width] duration-100 linear"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[13px] text-muted-foreground">Cloud...</motion.div>
            
            <motion.div variants={slowItemVariants} className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground/40">
                Download {Math.round(downloadProgress)}%
              </span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5 sm:w-16">
                <div
                  className="h-full bg-muted-foreground/30 transition-[width] duration-100 linear"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[13px] text-muted-foreground">Desktop</motion.div>
          </motion.div>
        </div>

        {/* ---- QUICKBRIDGE ---- */}
        <div className="rounded-xl border border-border/70 bg-card/30 p-5 sm:p-8">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary text-center">
            QuickBridge
          </p>
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-3 sm:gap-6"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="font-mono text-[16px] font-medium text-foreground">Phone</div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-primary/70">
                Sending
              </span>
            </div>
            <div className="relative flex h-12 min-w-0 flex-1 items-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-primary/20" />
              {!prefersReduced &&
                [0, 1, 2].map((packet) => (
                  <motion.span
                    key={packet}
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-[1px] bg-primary"
                    animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.6,
                      delay: packet * 0.48,
                      ease: "linear",
                      repeat: Infinity,
                      repeatDelay: 0.7,
                    }}
                  />
                ))}
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md border border-primary/20 bg-card px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                  P2P
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-end gap-1">
              <div className="font-mono text-[16px] font-medium text-foreground">Desktop</div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-primary/70">
                Receiving
              </span>
            </div>
          </motion.div>
          <div className="mt-5 flex items-center justify-center gap-2 border-t border-border/50 pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/50">
            <span>Encrypted</span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span>Browser to browser</span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span>No cloud step</span>
          </div>
        </div>
      </div>
    </div>
  );
}
