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
        <div className="rounded-xl border border-border/60 bg-card/30 p-6 sm:p-9">
          <p className="mb-7 text-center font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            The old way
          </p>
          <motion.div
            variants={slowFlowVariants}
            initial={prefersReduced ? "visible" : "hidden"}
            animate="visible"
            className="flex flex-col items-center justify-between gap-7 sm:flex-row sm:gap-4"
          >
            <motion.div variants={slowItemVariants} className="font-mono text-[14px] text-muted-foreground/80">Phone</motion.div>
            
            <motion.div variants={slowItemVariants} className="flex flex-col items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/55">
                Upload {Math.round(uploadProgress)}%
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:w-20">
                <div
                  className="h-full bg-muted-foreground/50 transition-[width] duration-100 linear"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[15px] text-muted-foreground/80">Cloud...</motion.div>
            
            <motion.div variants={slowItemVariants} className="flex flex-col items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/55">
                Download {Math.round(downloadProgress)}%
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:w-20">
                <div
                  className="h-full bg-muted-foreground/50 transition-[width] duration-100 linear"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </motion.div>

            <motion.div variants={slowItemVariants} className="font-mono text-[14px] text-muted-foreground/80">Desktop</motion.div>
          </motion.div>
        </div>

        {/* ---- QUICKBRIDGE ---- */}
        <div className="rounded-xl border border-border/60 bg-card/30 p-6 sm:p-9">
          <p className="mb-8 text-center font-mono text-[15px] font-medium uppercase tracking-[0.2em] text-primary/80 sm:text-[16px]">
            QuickBridge
          </p>
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-end gap-4 sm:gap-8"
          >
            <div className="flex w-16 shrink-0 flex-col items-center gap-1 sm:w-24">
              <img
                src="/images/quickbridge-phone-trimmed.png"
                alt="Phone ready to send"
                className="h-20 w-full object-contain opacity-90 sm:h-24"
              />
              <div className="font-mono text-[18px] font-medium text-foreground sm:text-[20px]">Phone</div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/65">
                Sending
              </span>
            </div>
            <div className="relative mb-10 flex h-12 min-w-0 flex-1 items-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/10" />
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
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-foreground/80 sm:text-[13px]">
                Direct
              </div>
            </div>
            <div className="flex w-16 shrink-0 flex-col items-center gap-1 sm:w-24">
              <img
                src="/images/quickbridge-desktop-trimmed.png"
                alt="Desktop ready to receive"
                className="h-20 w-full object-contain opacity-90 sm:h-24"
              />
              <div className="font-mono text-[18px] font-medium text-foreground sm:text-[20px]">Desktop</div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/65">
                Receiving
              </span>
            </div>
          </motion.div>
          <div className="mt-6 border-t border-border/50 pt-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/55">
            Encrypted browser to browser transfer. No cloud step.
          </div>
        </div>
      </div>
    </div>
  );
}
