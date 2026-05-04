import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const METHODS = [
  { word: 'EMAIL.', align: 'left' as const },
  { word: 'CLOUD.', align: 'right' as const },
  { word: 'USB.', align: 'left' as const },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1900),
      setTimeout(() => setPhase(5), 2400),
      setTimeout(() => setPhase(6), 3000),
      setTimeout(() => setPhase(7), 3600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full px-[8vw]">
        {METHODS.map((m, i) => {
          const visible = phase >= i * 2 + 1;
          const crossed = phase >= i * 2 + 2;
          return (
            <div
              key={m.word}
              className="overflow-hidden"
              style={{ textAlign: m.align }}
            >
              <motion.div
                className="relative inline-block leading-none tracking-tighter font-black"
                style={{
                  fontSize: '13vw',
                  color: crossed ? 'rgba(255,255,255,0.28)' : '#fff',
                  transition: 'color 0.2s ease',
                }}
                initial={{ y: '110%' }}
                animate={visible ? { y: '0%' } : { y: '110%' }}
                transition={{ type: 'spring', damping: 22, stiffness: 360 }}
              >
                {m.word}
                {crossed && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '50%',
                      height: '0.11em',
                      background: '#ef4444',
                      transformOrigin: 'left center',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </motion.div>
            </div>
          );
        })}

        <AnimatePresence>
          {phase >= 7 && (
            <motion.div
              className="mt-6 overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="font-black leading-none tracking-tighter"
                style={{ fontSize: '9vw', color: '#22d3ee' }}
              >
                NOT ANYMORE.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
