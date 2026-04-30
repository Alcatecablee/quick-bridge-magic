import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ITEMS = [
  { label: "No accounts", Icon: PersonIcon, indent: "" },
  { label: "No uploads", Icon: UploadIcon, indent: "pl-[10%]" },
  { label: "Nothing stored", Icon: ServerIcon, indent: "pl-[20%]", emphasis: true },
];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2700),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col gap-10 w-full max-w-4xl px-12 relative z-10">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            className={`flex items-center gap-8 ${item.indent}`}
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= i + 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div
              className={`w-16 h-16 rounded-full bg-[#151821] border ${
                item.emphasis
                  ? 'border-[#22d3ee]/40 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
                  : 'border-white/10'
              } flex items-center justify-center shrink-0`}
            >
              <item.Icon />
            </div>
            <h2
              className={`text-[4vw] font-black ${
                item.emphasis ? 'text-[#22d3ee]' : 'text-white'
              } leading-none tracking-tight`}
            >
              {item.label}
            </h2>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PersonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
