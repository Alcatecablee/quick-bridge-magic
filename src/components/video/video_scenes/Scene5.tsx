import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const PHRASES = [
  {
    text: 'No accounts.',
    initial: { x: -280, opacity: 0 },
    align: 'text-left',
    color: 'text-white',
  },
  {
    text: 'No uploads.',
    initial: { x: 280, opacity: 0 },
    align: 'text-right',
    color: 'text-white/80',
  },
  {
    text: 'Nothing stored.',
    initial: { y: -200, opacity: 0 },
    align: 'text-left pl-[12%]',
    color: 'text-white/65',
  },
  {
    text: 'End-to-end encrypted.',
    initial: { y: 200, opacity: 0 },
    align: 'text-right',
    color: 'text-[#22d3ee]',
  },
];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2300),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.88, x: 40 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-2 w-full px-[6vw] relative z-10">
        {PHRASES.map((phrase, i) => (
          <motion.div
            key={phrase.text}
            className={`w-full ${phrase.align}`}
            initial={phrase.initial}
            animate={phase >= i + 1 ? { x: 0, y: 0, opacity: 1 } : {}}
            transition={{ type: 'spring', damping: 18, stiffness: 320 }}
          >
            <span
              className={`text-[7.5vw] font-black leading-none tracking-tighter ${phrase.color}`}
            >
              {phrase.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
