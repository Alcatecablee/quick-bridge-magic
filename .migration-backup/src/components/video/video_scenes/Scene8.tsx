import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ROWS = [
  { label: 'No install required', strike: true },
  { label: 'No app store', strike: true },
  { label: 'No sign-up', strike: true },
  { label: 'Open the URL. Start sending.', strike: false },
];

const MutedCheck = ({ size }: { size: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CyanCheck = ({ size }: { size: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ROW_SPRING = { type: 'spring', stiffness: 580, damping: 17 } as const;

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1),  150),
      setTimeout(() => setPhase(2),  580),
      setTimeout(() => setPhase(3),  920),
      setTimeout(() => setPhase(4), 1260),
      setTimeout(() => setPhase(5), 1700),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 60, filter: 'blur(4px)' }}
      transition={{ duration: 0.28 }}
    >

      <div className="w-full px-[8vw] flex flex-col gap-[2vw]">

        {/* Browser bar drops from higher up */}
        <motion.div
          className="w-full bg-[#151821] border border-white/10 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: -55, scale: 0.95 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        >
          <div className="flex items-center px-4 gap-2 border-b border-white/5" style={{ height: '2.5vw' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          <div className="flex items-center gap-[0.8vw] px-[1.5vw]" style={{ height: '3vw' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.1vw', height: '1.1vw', flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-white/65 font-mono" style={{ fontSize: '1.25vw' }}>quickbridge.app</span>
          </div>
        </motion.div>

        {/* Checklist */}
        <div className="flex flex-col gap-[1.1vw]">
          {ROWS.map((row, i) => {
            const isLast = i === ROWS.length - 1;
            return (
              <motion.div
                key={row.label}
                className="flex items-center gap-[1.2vw]"
                initial={{ opacity: 0, y: -22 }}
                animate={phase >= i + 2 ? { opacity: 1, y: 0 } : {}}
                transition={ROW_SPRING}
              >
                <motion.div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '2vw',
                    height: '2vw',
                    background: row.strike ? 'rgba(255,255,255,0.04)' : 'rgba(34,211,238,0.12)',
                    border: row.strike ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(34,211,238,0.38)',
                  }}
                  initial={{ scale: 0 }}
                  animate={phase >= i + 2 ? { scale: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 700, damping: 14, delay: 0.08 }}
                >
                  {row.strike ? (
                    <MutedCheck size="0.9vw" />
                  ) : (
                    <CyanCheck size="0.9vw" />
                  )}
                </motion.div>

                <span
                  className="font-bold leading-none"
                  style={{
                    fontSize: row.strike ? '2.2vw' : '2.6vw',
                    color: row.strike ? 'rgba(255,255,255,0.45)' : '#22d3ee',
                    textShadow: isLast && phase >= i + 2
                      ? '0 0 2vw rgba(34,211,238,0.4)'
                      : 'none',
                    transition: 'text-shadow 0.5s',
                  }}
                >
                  {row.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
