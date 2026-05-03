import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CARDS = [
  { label: "Email it to yourself", Icon: MailIcon },
  { label: "Upload to the cloud", Icon: CloudIcon },
  { label: "Plug in a cable", Icon: CableIcon },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => setPhase(2), 750),
      setTimeout(() => setPhase(3), 1350),
      setTimeout(() => setPhase(4), 2100),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 0.92, x: -30 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1.08, 1] }}
        transition={{ duration: 7, ease: "linear" }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/problem-clutter.png`}
          className="w-full h-full object-cover opacity-30 grayscale"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d12] via-[#0b0d12]/60 to-[#0b0d12]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-6xl flex justify-between items-center px-20 gap-12">
        <div className="flex flex-col gap-5 w-1/2">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/40">
            The old way
          </p>
          {CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              className="bg-[#151821]/85 backdrop-blur-md border border-white/10 px-6 py-5 rounded-2xl flex items-center gap-4"
              initial={{ opacity: 0, x: -60, scale: 0.95 }}
              animate={phase >= i + 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/55 shrink-0">
                <card.Icon />
              </div>
              <p className="text-[1.9vw] font-bold text-white leading-tight">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="w-1/2 flex flex-col justify-center items-end gap-3">
          <motion.p
            className="text-[1.4vw] font-medium text-white/55 text-right tracking-wide"
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            Slow. Fiddly. Unnecessary.
          </motion.p>
          <motion.h2
            className="text-[5.5vw] font-black text-[#22d3ee] leading-[0.9] text-right tracking-tight"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={phase >= 4 ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', damping: 16, stiffness: 200 }}
          >
            No more.
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <polyline points="9 13 12 10 15 13" />
      <line x1="12" y1="10" x2="12" y2="17" />
    </svg>
  );
}

function CableIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h5" />
      <path d="M17 12h5" />
      <rect x="7" y="8" width="10" height="8" rx="2" />
      <path d="M10 8V5" />
      <path d="M14 8V5" />
    </svg>
  );
}
