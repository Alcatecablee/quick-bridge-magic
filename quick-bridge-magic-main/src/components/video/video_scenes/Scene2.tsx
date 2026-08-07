import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const CHARS = 'QWERTYUIOPASDFGHJKLZXCVBNM0123456789!@#$%&';

function useScramble(text: string, active: boolean, duration = 680): string {
  const [out, setOut] = useState('');
  const raf = useRef(0);
  useEffect(() => {
    if (!active) { setOut(''); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setOut(text.split('').map((ch, i) => {
        const lock = (i / text.length) * 0.55;
        if (p >= lock + 0.45 || ch === ' ' || ch === '.') return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(''));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  return out || text;
}

function SpeedLines({ count = 14 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: `${4 + i * 6.5}%`,
            left: 0, right: 0,
            height: '1px',
            background: `rgba(34,211,238,${0.05 + (i % 3) * 0.03})`,
            zIndex: 8,
          }}
          initial={{ scaleX: 2.2, opacity: 0.85, originX: 0 }}
          animate={{ scaleX: 0, opacity: 0, originX: 1, x: '25%' }}
          transition={{ duration: 0.2 + i * 0.008, ease: 'easeIn' }}
        />
      ))}
    </>
  );
}

const METHODS = [
  { word: 'EMAIL.', align: 'left'  as const, rotateDir:  1 },
  { word: 'CLOUD.', align: 'right' as const, rotateDir: -1 },
  { word: 'USB.',   align: 'left'  as const, rotateDir:  1 },
];

const FLIP_SPRING = { type: 'spring', stiffness: 660, damping: 18 } as const;
const SLAM_SPRING = { type: 'spring', stiffness: 860, damping: 11 } as const;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1),   80),   // EMAIL appears
      setTimeout(() => setPhase(2),  210),    // EMAIL crossed
      setTimeout(() => setPhase(3),  330),    // CLOUD appears
      setTimeout(() => setPhase(4),  460),    // CLOUD crossed
      setTimeout(() => setPhase(5),  580),    // USB appears
      setTimeout(() => setPhase(6),  710),    // USB crossed
      setTimeout(() => setPhase(7), 1150),    // NOT ANYMORE enters
      setTimeout(() => setPhase(8), 1380),    // speed lines + glow
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const notScramble = useScramble('NOT ANYMORE.', phase >= 7, 720);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(5px)', x: 60 }}
      transition={{ duration: 0.22 }}
    >
      {phase === 8 && <SpeedLines />}

      <div className="w-full px-[8vw] py-[2vh]">
        {METHODS.map((m, i) => {
          const appeared = phase >= i * 2 + 1;
          const crossed  = phase >= i * 2 + 2;
          return (
            <div
              key={m.word}
              style={{
                overflow: 'hidden',
                textAlign: m.align,
                perspective: '800px',
              }}
            >
              <motion.div
                className="relative inline-block leading-none tracking-tighter font-black"
                style={{ fontSize: 'min(13vw, 19vh)' }}
                initial={{ y: '110%', rotateX: m.rotateDir * 45 }}
                animate={appeared ? { y: '0%', rotateX: 0 } : {}}
                transition={FLIP_SPRING}
              >
                {/* Word with glitch on strikethrough */}
                <motion.span
                  style={{ display: 'block' }}
                  animate={crossed
                    ? { color: ['#ffffff', '#ff3366', 'rgba(255,255,255,0.18)'],
                        x: [0, -4, 4, -2, 0],
                        filter: ['blur(0px)', 'blur(1.5px)', 'blur(0px)'] }
                    : { color: '#ffffff', x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.22, times: [0, 0.25, 1] }}
                >
                  {m.word}
                </motion.span>

                {/* Strikethrough */}
                {crossed && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: 0, right: 0,
                      top: '52%',
                      height: '0.08em',
                      background: '#ef4444',
                      transformOrigin: 'left center',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.div>
            </div>
          );
        })}

        {/* NOT ANYMORE */}
        <AnimatePresence>
          {phase >= 7 && (
            <motion.div
              style={{ overflow: 'hidden', perspective: '800px', marginTop: '0.5vw' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="font-black leading-none tracking-tighter"
                style={{
                  fontSize: 'min(8.5vw, 12.5vh)',
                  color: '#22d3ee',
                  textShadow: phase >= 8
                    ? '0 0 4vw rgba(34,211,238,0.55), 0 0 1vw rgba(34,211,238,0.9)'
                    : 'none',
                  transition: 'text-shadow 0.4s',
                }}
                initial={{ y: '110%', rotateX: -40, scale: 1.12 }}
                animate={{ y: '0%', rotateX: 0, scale: 1 }}
                transition={SLAM_SPRING}
              >
                {notScramble}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
