import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute inset-0"
        animate={{ scale: [1.1, 1] }}
        transition={{ duration: 6, ease: "linear" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/problem-clutter.png`}
          className="w-full h-full object-cover opacity-40 grayscale-[50%]"
          alt="cable clutter"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d12] via-transparent to-[#0b0d12]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-6xl flex justify-between items-center px-20">
        <div className="flex flex-col gap-8 w-1/2">
          <motion.div
            className="bg-[#151821]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', damping: 25 }}
          >
            <h3 className="text-2xl font-semibold text-white/50 uppercase tracking-widest mb-2">The old way</h3>
            <p className="text-4xl font-bold text-white">Cable clutter</p>
          </motion.div>

          <motion.div
            className="bg-[#151821]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', damping: 25 }}
          >
            <p className="text-4xl font-bold text-white">Emailing yourself</p>
          </motion.div>

          <motion.div
            className="bg-[#151821]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', damping: 25 }}
          >
            <p className="text-4xl font-bold text-white">USB drives</p>
          </motion.div>
        </div>

        <div className="w-1/2 flex justify-center items-center">
            <motion.h2 
              className="text-[5vw] font-black text-[#22d3ee] leading-tight text-right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              No more.
            </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}
