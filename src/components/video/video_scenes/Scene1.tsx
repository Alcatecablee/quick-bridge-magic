import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 120),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#0b0d12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'brightness(0.3)' }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/bg-particles.png`}
          className="w-full h-full object-cover opacity-20 mix-blend-screen"
          alt=""
        />
      </div>

      <div className="relative z-10 w-full px-[8vw]">
        <div className="overflow-hidden">
          <motion.div
            className="text-[15vw] font-black text-white leading-none tracking-tighter"
            initial={{ y: '105%' }}
            animate={phase >= 1 ? { y: '0%' } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 380 }}
          >
            OPEN.
          </motion.div>
        </div>

        <div className="overflow-hidden flex justify-end">
          <motion.div
            className="text-[15vw] font-black text-white/60 leading-none tracking-tighter"
            initial={{ y: '105%' }}
            animate={phase >= 2 ? { y: '0%' } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 380 }}
          >
            SCAN.
          </motion.div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="text-[15vw] font-black text-[#22d3ee] leading-none tracking-tighter"
            initial={{ y: '105%' }}
            animate={phase >= 3 ? { y: '0%' } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 380 }}
          >
            SEND.
          </motion.div>
        </div>

        <motion.div
          className="flex items-center gap-3 mt-10"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
            alt="QuickBridge"
            className="h-9 w-9 object-contain opacity-70"
          />
          <span className="text-white/30 text-[1.4vw] font-semibold tracking-[0.25em] uppercase">
            quickbridge.app
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
