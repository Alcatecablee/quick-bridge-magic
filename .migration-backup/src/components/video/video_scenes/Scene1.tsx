import { motion } from 'framer-motion';
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

function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)',
        backgroundSize: '38px 38px',
        opacity: 0.55,
        maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 30%, transparent 100%)',
      }}
    />
  );
}

function SpeedLines({ count = 16 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: `${3 + i * 5.8}%`,
            left: 0, right: 0,
            height: '1px',
            background: `rgba(34,211,238,${0.05 + (i % 4) * 0.025})`,
            zIndex: 8,
          }}
          initial={{ scaleX: 2.2, opacity: 0.85, originX: 0 }}
          animate={{ scaleX: 0, opacity: 0, originX: 1, x: '25%' }}
          transition={{ duration: 0.22 + i * 0.007, ease: 'easeIn' }}
        />
      ))}
    </>
  );
}

const FLIP_SPRING  = { type: 'spring', stiffness: 650, damping: 18 } as const;
const CRASH_SPRING = { type: 'spring', stiffness: 880, damping: 11 } as const;

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1),   60),
      setTimeout(() => setPhase(2),  440),
      setTimeout(() => setPhase(3),  820),
      setTimeout(() => setPhase(4), 1050),  // impact state — speed lines + glow
      setTimeout(() => setPhase(5), 1700),  // logo
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const openScramble = useScramble('OPEN.',  phase >= 1);
  const scanScramble = useScramble('SCAN.',  phase >= 2);
  const sendScramble = useScramble('SEND.',  phase >= 3, 550);

  const scanChromatic = phase >= 2 && phase < 4;
  const sendGlow      = phase >= 4;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#0b0d12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(5px)' }}
      transition={{ duration: 0.22 }}
    >
      <DotGrid />

      {/* Pulsing ambient radial */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 18% 60%, rgba(34,211,238,0.07) 0%, transparent 70%)' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Speed lines burst on SEND impact */}
      {phase === 4 && <SpeedLines />}

      {/* Cyan bloom when SEND lands */}
      {sendGlow && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle 35vw at 22% 80%, rgba(34,211,238,0.14) 0%, transparent 70%)', zIndex: 2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55 }}
        />
      )}

      <div className="relative z-10 w-full px-[8vw] py-[2vh]">

        {/* OPEN — 3D perspective flip from below */}
        <div style={{ perspective: '900px', overflow: 'hidden' }}>
          <motion.div
            className="font-black text-white leading-none tracking-tighter"
            style={{ fontSize: 'min(15vw, 24vh)' }}
            initial={{ y: '115%', rotateX: 55 }}
            animate={phase >= 1 ? { y: '0%', rotateX: 0 } : {}}
            transition={FLIP_SPRING}
          >
            {openScramble}
          </motion.div>
        </div>

        {/* SCAN — crashes from the right + chromatic aberration during flight */}
        <div className="flex justify-end" style={{ overflow: 'hidden' }}>
          <motion.div
            className="font-black leading-none tracking-tighter"
            style={{
              fontSize: 'min(15vw, 24vh)',
              color: 'rgba(255,255,255,0.52)',
              textShadow: scanChromatic
                ? '5px 0 rgba(255,30,70,0.65), -5px 0 rgba(30,210,255,0.65)'
                : 'none',
              transition: 'text-shadow 0.25s ease',
            }}
            initial={{ x: '120%' }}
            animate={phase >= 2 ? { x: '0%' } : {}}
            transition={FLIP_SPRING}
          >
            {scanScramble}
          </motion.div>
        </div>

        {/* SEND — maximum crash + 3D flip + glow on settle */}
        <div style={{ perspective: '900px', overflow: 'hidden' }}>
          <motion.div
            className="font-black leading-none tracking-tighter"
            style={{
              fontSize: 'min(15vw, 24vh)',
              color: '#22d3ee',
              textShadow: sendGlow
                ? '0 0 5vw rgba(34,211,238,0.55), 0 0 1.2vw rgba(34,211,238,0.9)'
                : 'none',
              transition: 'text-shadow 0.5s ease',
            }}
            initial={{ y: '115%', rotateX: 55, scale: 1.1 }}
            animate={phase >= 3 ? { y: '0%', rotateX: 0, scale: 1 } : {}}
            transition={CRASH_SPRING}
          >
            {sendScramble}
          </motion.div>
        </div>

        {/* Logo + URL */}
        <motion.div
          className="flex items-center gap-3 mt-[1.5vh]"
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 5 ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
            alt="QuickBridge"
            style={{ width: 34, height: 34, objectFit: 'contain', opacity: 0.75, mixBlendMode: 'screen' }}
          />
          <span className="text-white/50 text-[1.3vw] font-semibold tracking-[0.25em] uppercase">
            quickbridge.app
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
