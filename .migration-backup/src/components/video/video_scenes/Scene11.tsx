import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)',
        backgroundSize: '42px 42px',
        opacity: 0.45,
        maskImage: 'radial-gradient(ellipse 88% 82% at 50% 50%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 88% 82% at 50% 50%, black 20%, transparent 100%)',
      }}
    />
  );
}

// Each phrase comes from a different direction with 3D rotation
const PHRASES = [
  {
    text: 'No accounts.',
    initial: { x: -320, rotateY: -28, opacity: 0 },
    align: 'text-left',
    color: 'text-white',
  },
  {
    text: 'No uploads.',
    initial: { x: 320, rotateY: 28, opacity: 0 },
    align: 'text-right',
    color: 'text-white/70',
  },
  {
    text: 'Nothing stored.',
    initial: { y: -220, rotateX: -25, opacity: 0 },
    align: 'text-left pl-[10%]',
    color: 'text-white/50',
  },
  {
    text: 'Encrypted. Always.',
    initial: { y: 220, rotateX: 25, opacity: 0 },
    align: 'text-right',
    color: 'text-[#22d3ee]',
  },
];

const STAGGER_MS = 135;
const PHRASE_SPRING = { type: 'spring', stiffness: 640, damping: 18 } as const;

export function Scene11() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const base = 160;
    const t = PHRASES.map((_, i) =>
      setTimeout(() => setPhase(i + 1), base + i * STAGGER_MS)
    );
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.93, filter: 'blur(6px)' }}
      transition={{ duration: 0.25 }}
    >
      <DotGrid />

      {/* Ambient cyan bloom for final phrase */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 88% 90%, rgba(34,211,238,0.09) 0%, transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.55 }}
      />

      <div
        className="flex flex-col gap-[0.8vw] w-full px-[6vw] relative z-10"
        style={{ perspective: '1100px' }}
      >
        {PHRASES.map((phrase, i) => {
          const isLast = i === PHRASES.length - 1;
          return (
            <motion.div
              key={phrase.text}
              className={`w-full ${phrase.align}`}
              initial={phrase.initial}
              animate={phase >= i + 1 ? { x: 0, y: 0, rotateX: 0, rotateY: 0, opacity: 1 } : {}}
              transition={PHRASE_SPRING}
            >
              <span
                className={`font-black leading-none tracking-tighter ${phrase.color}`}
                style={{
                  fontSize: '7vw',
                  display: 'inline-block',
                  textShadow: isLast && phase >= 4
                    ? '0 0 3.5vw rgba(34,211,238,0.6), 0 0 0.8vw rgba(34,211,238,0.95)'
                    : 'none',
                  transition: 'text-shadow 0.5s ease',
                }}
              >
                {phrase.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
