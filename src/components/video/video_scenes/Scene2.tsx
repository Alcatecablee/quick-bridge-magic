import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ERRORS = [
  {
    from: 'Email client',
    status: 'Attachment blocked',
    message: 'File exceeds 25 MB limit.',
    detail: 'Your file: 3.7 GB',
    color: '#ef4444',
    progress: null as number | null,
  },
  {
    from: 'Cloud storage',
    status: 'Upload interrupted',
    message: 'Connection lost at 67%.',
    detail: 'Retry when signal improves',
    color: '#f59e0b',
    progress: 67 as number | null,
  },
  {
    from: 'USB transfer',
    status: 'Device not recognized',
    message: 'No compatible driver found.',
    detail: 'Requires USB-C to USB-A adapter',
    color: '#64748b',
    progress: null as number | null,
  },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2700),
      setTimeout(() => setPhase(4), 3800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center"
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col gap-4 w-full max-w-2xl px-12 relative z-10">
        {ERRORS.map((err, i) => (
          <motion.div
            key={err.from}
            className="w-full bg-[#0e1018] rounded-xl p-5 font-mono"
            style={{ borderLeftWidth: 3, borderLeftColor: err.color, borderLeftStyle: 'solid' }}
            initial={{ opacity: 0, x: -60, scale: 0.97 }}
            animate={phase >= i + 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[1.1vw] font-bold" style={{ color: err.color }}>
                {err.status}
              </span>
              <span className="ml-auto text-white/20 text-[0.85vw]">{err.from}</span>
            </div>
            <p className="text-[1.25vw] text-white/80">{err.message}</p>
            {err.progress !== null && (
              <div className="mt-2 mb-1 h-1.5 bg-white/8 rounded-full overflow-hidden w-40">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${err.progress}%`, backgroundColor: err.color }}
                />
              </div>
            )}
            <p className="text-[0.9vw] text-white/25 mt-1">{err.detail}</p>
          </motion.div>
        ))}

        {phase >= 4 && (
          <motion.div
            className="mt-4 text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="text-[4.5vw] font-black text-white/90 tracking-tight">
              No more.
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
