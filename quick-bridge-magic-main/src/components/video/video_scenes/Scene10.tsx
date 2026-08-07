import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.5,
        maskImage: 'radial-gradient(ellipse 88% 80% at 50% 50%, black 25%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 88% 80% at 50% 50%, black 25%, transparent 100%)',
      }}
    />
  );
}

function SpeedLines({ count = 18, color = 'rgba(34,211,238,' }: { count?: number; color?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: `${2 + i * 5.3}%`,
            left: 0, right: 0,
            height: '1px',
            background: `${color}${0.04 + (i % 5) * 0.022})`,
            zIndex: 8,
          }}
          initial={{ scaleX: 2.5, opacity: 1, originX: 0 }}
          animate={{ scaleX: 0, opacity: 0, x: '30%' }}
          transition={{ duration: 0.18 + i * 0.006, ease: 'easeIn' }}
        />
      ))}
    </>
  );
}

const SLAM = { type: 'spring', stiffness: 860, damping: 11 } as const;

export function Scene10() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1),  200),
      setTimeout(() => setPhase(2),  600),
      setTimeout(() => setPhase(3), 2650),   // words slam in
      setTimeout(() => setPhase(4), 2750),   // speed lines burst
      setTimeout(() => setPhase(5), 3000),   // chromatic fades, glow appears
      setTimeout(() => setPhase(6), 3900),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const aberration = phase === 3 || phase === 4;

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col justify-center overflow-hidden"
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(5px)', x: 60 }}
      transition={{ duration: 0.25 }}
    >
      <DotGrid />

      {/* Speed lines on slam */}
      {phase === 4 && <SpeedLines />}

      {/* Ambient glow after words land */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 75% 60% at 55% 72%, rgba(34,211,238,0.09) 0%, transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* File info + progress */}
      <div className="w-full px-[8vw] flex flex-col gap-[2vw]">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -14 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 460, damping: 22 }}
        >
          <span className="font-mono text-white/42" style={{ fontSize: '1.2vw' }}>video_4k_raw.mp4</span>
          <span className="font-mono text-white/28" style={{ fontSize: '1.2vw' }}>2.1 GB</span>
        </motion.div>

        <div>
          <div className="w-full rounded-full overflow-hidden bg-white/6" style={{ height: '0.5vw' }}>
            {phase >= 2 && (
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#22d3ee', boxShadow: '0 0 0.8vw rgba(34,211,238,0.6)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.9, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </div>
          {phase >= 2 && (
            <motion.div
              className="flex justify-between mt-[0.5vw]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              <span className="font-mono text-[#22d3ee]" style={{ fontSize: '0.8vw' }}>Transferring...</span>
              <span className="font-mono text-white/28" style={{ fontSize: '0.8vw' }}>Direct connection</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* DIRECT + INSTANT: full width slam with perspective */}
      <div className="w-full mt-[2vw]" style={{ perspective: '900px' }}>
        <div className="overflow-hidden px-[8vw]">
          <motion.div
            className="font-black text-white leading-none tracking-tighter"
            style={{
              fontSize: '11vw',
              textShadow: aberration
                ? '5px 0 rgba(255,30,70,0.6), -5px 0 rgba(30,210,255,0.6)'
                : phase >= 5
                  ? '0 0 4vw rgba(255,255,255,0.12)'
                  : 'none',
              transition: 'text-shadow 0.35s ease',
            }}
            initial={{ y: '110%', rotateX: 50 }}
            animate={phase >= 3 ? { y: '0%', rotateX: 0 } : {}}
            transition={SLAM}
          >
            DIRECT.
          </motion.div>
        </div>
        <div className="overflow-hidden flex justify-end px-[8vw]">
          <motion.div
            className="font-black leading-none tracking-tighter"
            style={{
              fontSize: '11vw',
              color: '#22d3ee',
              textShadow: aberration
                ? '5px 0 rgba(255,30,70,0.6), -5px 0 rgba(30,210,255,0.6)'
                : phase >= 5
                  ? '0 0 5vw rgba(34,211,238,0.55), 0 0 1.2vw rgba(34,211,238,0.9)'
                  : 'none',
              transition: 'text-shadow 0.35s ease',
            }}
            initial={{ y: '110%', rotateX: 50 }}
            animate={phase >= 3 ? { y: '0%', rotateX: 0 } : {}}
            transition={{ ...SLAM, delay: 0.048 }}
          >
            INSTANT.
          </motion.div>
        </div>
      </div>

      <motion.div
        className="w-full px-[8vw] mt-[1.5vw] text-white/28 font-medium tracking-wide"
        style={{ fontSize: '1.2vw' }}
        initial={{ opacity: 0 }}
        animate={phase >= 6 ? { opacity: 1 } : {}}
        transition={{ duration: 0.4 }}
      >
        Your network. Full speed. No throttling.
      </motion.div>
    </motion.div>
  );
}
