import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const FROM = ['android.png', 'ios.png'];
const TO   = ['macos.png', 'windows.png', 'linux.png'];
const ALL  = [...FROM, ...TO];

const TILE_SPRING = { type: 'spring', stiffness: 620, damping: 18 } as const;

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 650),
      setTimeout(() => setPhase(3), 1150),
      setTimeout(() => setPhase(4), 1900),
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
      <div className="flex flex-col items-center gap-[3vw] w-full px-[10vw]">

        {/* Label */}
        <motion.div
          className="font-bold uppercase text-white/28 tracking-[0.32em]"
          style={{ fontSize: '1.05vw' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.3 }}
        >
          Works across every platform
        </motion.div>

        {/* Platform diagram */}
        <div className="flex items-center justify-center gap-[4vw] w-full max-w-3xl mx-auto">

          {/* Send from */}
          <div className="flex flex-col items-center gap-[1.5vw]">
            <span className="font-bold uppercase text-white/28 tracking-[0.2em]" style={{ fontSize: '0.85vw' }}>Send from</span>
            <div className="flex gap-[1.5vw]">
              {FROM.map((p, fi) => (
                <motion.div
                  key={p}
                  className="flex items-center justify-center bg-white/4 border border-white/10 rounded-xl"
                  style={{ width: '5vw', height: '5vw' }}
                  initial={{ opacity: 0, y: 20, scale: 0.75 }}
                  animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ ...TILE_SPRING, delay: fi * 0.055 }}
                >
                  <img src={`${import.meta.env.BASE_URL}logos/${p}`} alt={p.replace('.png', '')}
                    style={{ width: '2.4vw', height: '2.4vw', objectFit: 'contain', opacity: 0.78 }} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={phase >= 2 ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0 }}
          >
            <svg viewBox="0 0 80 20" fill="none" style={{ width: '6vw', height: '1.5vw' }}>
              <line x1="0" y1="10" x2="66" y2="10" stroke="#22d3ee" strokeWidth="1.8" />
              <polyline points="58,3 74,10 58,17" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* Receive on */}
          <div className="flex flex-col items-center gap-[1.5vw]">
            <span className="font-bold uppercase text-white/28 tracking-[0.2em]" style={{ fontSize: '0.85vw' }}>Receive on</span>
            <div className="flex gap-[1.5vw]">
              {TO.map((p, ti) => (
                <motion.div
                  key={p}
                  className="flex items-center justify-center bg-white/4 border border-white/10 rounded-xl"
                  style={{ width: '5vw', height: '5vw' }}
                  initial={{ opacity: 0, y: 20, scale: 0.75 }}
                  animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ ...TILE_SPRING, delay: (FROM.length + ti) * 0.055 }}
                >
                  <img src={`${import.meta.env.BASE_URL}logos/${p}`} alt={p.replace('.png', '')}
                    style={{ width: '2.4vw', height: '2.4vw', objectFit: 'contain', opacity: 0.78 }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Punchline - snaps hard */}
        <motion.div
          className="overflow-hidden"
          initial={false}
        >
          <motion.div
            className="font-black text-white leading-none tracking-tight text-center"
            style={{
              fontSize: '4.5vw',
              textShadow: phase >= 3 ? '0 0 2.5vw rgba(255,255,255,0.15)' : 'none',
              transition: 'text-shadow 0.4s',
            }}
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: '0%' } : {}}
            transition={{ type: 'spring', stiffness: 700, damping: 16 }}
          >
            Any combination.
          </motion.div>
        </motion.div>

        {/* Footnote */}
        <motion.p
          className="font-medium text-white/28 tracking-wide text-center"
          style={{ fontSize: '1.1vw' }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          No shared network required. Works across different WiFis, mobile data, and hotspots.
        </motion.p>
      </div>
    </motion.div>
  );
}
