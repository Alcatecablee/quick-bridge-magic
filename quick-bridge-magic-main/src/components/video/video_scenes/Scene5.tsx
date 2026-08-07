import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ITEMS = [
  'Photos and screenshots',
  '4K video files',
  'Documents and PDFs',
  'Clipboard text',
  'Any file type',
];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1),  80),
      setTimeout(() => setPhase(2), 210),
      setTimeout(() => setPhase(3), 340),
      setTimeout(() => setPhase(4), 470),
      setTimeout(() => setPhase(5), 600),
      setTimeout(() => setPhase(6), 1150),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: 60, filter: 'blur(4px)' }}
      transition={{ duration: 0.22 }}
    >
      <div className="w-full px-[8vw]">
        <div className="text-[1.05vw] font-bold uppercase tracking-[0.32em] text-white/28 mb-8">
          Send anything
        </div>

        <div className="flex flex-col gap-[1.1vw]">
          {ITEMS.map((label, i) => {
            const isLast = i === ITEMS.length - 1;
            return (
              <div key={label} className="flex items-center gap-5">
                <motion.div
                  className="flex-shrink-0 rounded-full bg-[#22d3ee]"
                  style={{ width: '0.3vw', height: '3.5vw', originY: 0.5 }}
                  initial={{ scaleY: 0 }}
                  animate={phase >= i + 1 ? { scaleY: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 700, damping: 18 }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <motion.span
                    className="font-black leading-none tracking-tight block"
                    style={{
                      fontSize: isLast ? '4vw' : '4.4vw',
                      color: isLast ? '#22d3ee' : '#ffffff',
                      textShadow: isLast && phase >= i + 1
                        ? '0 0 2.5vw rgba(34,211,238,0.35)'
                        : 'none',
                    }}
                    initial={{ y: '108%' }}
                    animate={phase >= i + 1 ? { y: '0%' } : {}}
                    transition={{ type: 'spring', stiffness: 560, damping: 22, delay: 0.025 }}
                  >
                    {label}
                  </motion.span>
                </div>
              </div>
            );
          })}
        </div>

        <motion.div
          className="mt-[3vw] flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-[1.15vw] font-semibold text-white/45 tracking-wide">Up to 10 GB per file</span>
          <div className="h-px flex-1 bg-white/8" />
        </motion.div>
      </div>
    </motion.div>
  );
}
