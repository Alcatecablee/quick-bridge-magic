import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2300),
      setTimeout(() => setPhase(4), 3600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0d12]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "brightness(0.5)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/bg-particles.png`}
          className="w-full h-full object-cover opacity-20 mix-blend-screen"
          alt=""
        />
      </div>

      {/* Brand mark intro */}
      <motion.img
        src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
        alt="QuickBridge"
        className="relative z-10 h-16 w-16 mb-8 object-contain"
        initial={{ opacity: 0, scale: 0.85, y: -10 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
      />

      <div className="relative z-10 text-center px-12" style={{ perspective: '1000px' }}>
        <h1 className="text-[5.4vw] font-black tracking-tight leading-[1.05] text-white">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          >
            The fastest way to move files
          </motion.span>
          <br />
          <motion.span
            className="inline-block text-white/55"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          >
            between your devices.
          </motion.span>
        </h1>

        <motion.p
          className="mt-8 text-[1.6vw] font-semibold tracking-[0.18em] uppercase text-[#22d3ee]"
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Open. Scan. Send.
        </motion.p>
      </div>

      {/* Subtle floating accent */}
      <motion.div
        className="absolute w-32 h-32 border border-[#22d3ee]/15 rounded-full z-0"
        animate={{
          y: [-20, 20, -20],
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ top: '18%', left: '12%' }}
      />
    </motion.div>
  );
}
