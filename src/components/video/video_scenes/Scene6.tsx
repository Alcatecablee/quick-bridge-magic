import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),  // logo + wordmark
      setTimeout(() => setPhase(2), 1500), // tagline
      setTimeout(() => setPhase(3), 2600), // CTA pill + subline
      setTimeout(() => setPhase(4), 3800), // bottom microcopy
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Soft brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#22d3ee]/12 via-[#0b0d12] to-[#0b0d12] opacity-60" />

      {/* Particle backdrop reusing scene-1 asset */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/bg-particles.png`}
          className="w-full h-full object-cover opacity-15 mix-blend-screen"
          alt=""
        />
      </div>

      {/* Logo + wordmark, real brand assets */}
      <motion.div
        className="flex items-center gap-5 mb-10 z-10"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
          alt="QuickBridge"
          className="h-20 w-20 object-contain"
        />
        <img
          src={`${import.meta.env.BASE_URL}brand/quickbridge-wordmark.png`}
          alt="QuickBridge"
          className="h-12 w-auto object-contain"
        />
      </motion.div>

      {/* Tagline (canonical hero copy) */}
      <motion.p
        className="text-[2.2vw] text-white max-w-3xl text-center z-10 font-bold leading-tight tracking-tight px-12"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        The fastest way to move files{" "}
        <span className="text-white/50">between your devices.</span>
      </motion.p>

      {/* CTA pill */}
      <motion.div
        className="mt-10 flex items-center gap-3 bg-[#22d3ee] px-8 py-4 rounded-2xl z-10 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.6)]"
        initial={{ opacity: 0, scale: 0.9, y: 14 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <line x1="14" y1="14" x2="21" y2="14" />
          <line x1="14" y1="18" x2="18" y2="18" />
          <line x1="14" y1="21" x2="21" y2="21" />
        </svg>
        <span className="text-2xl font-black text-[#0b0d12] tracking-tight">
          quickbridge.app
        </span>
      </motion.div>

      <motion.p
        className="mt-5 text-white/60 text-base font-medium z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Open it on both devices. Scan the QR.
      </motion.p>

      <motion.p
        className="absolute bottom-12 text-white/45 text-xs uppercase tracking-[0.32em] font-bold z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        Free. Forever. No signup.
      </motion.p>
    </motion.div>
  );
}
