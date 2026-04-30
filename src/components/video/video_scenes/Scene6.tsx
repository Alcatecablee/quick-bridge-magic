import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0b0d12] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#22d3ee]/10 via-[#0b0d12] to-[#0b0d12] opacity-50" />

      <motion.div 
        className="flex items-center gap-4 mb-8 z-10"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 20 }}
      >
         <div className="w-16 h-16 relative">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <rect x="10" y="10" width="30" height="30" rx="6" fill="white" />
              <rect x="60" y="10" width="30" height="30" rx="6" fill="#22d3ee" />
              <rect x="10" y="60" width="30" height="30" rx="6" fill="#22d3ee" />
              <rect x="60" y="60" width="30" height="30" rx="6" fill="white" />
              <path d="M40 40 L60 60 M60 40 L40 60" stroke="#0b0d12" strokeWidth="8" strokeLinecap="round" />
            </svg>
         </div>
         <h1 className="text-6xl font-black tracking-tight">
           <span className="text-white">Quick</span>
           <span className="text-[#22d3ee]">Bridge</span>
         </h1>
      </motion.div>

      <motion.p 
        className="text-2xl text-[#94a3b8] max-w-2xl text-center z-10 font-medium"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        Send anything between your phone and PC in seconds.
      </motion.p>

      <motion.div
        className="mt-12 bg-[#151821] border border-white/10 px-8 py-4 rounded-2xl z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1 } : {}}
        transition={{ type: 'spring', damping: 20 }}
      >
         <span className="text-3xl font-bold text-white tracking-wide">quickbridge.app</span>
      </motion.div>
      
      <motion.p
        className="absolute bottom-12 text-[#94a3b8] text-sm uppercase tracking-widest font-bold"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.5 }}
      >
         Free. Forever.
      </motion.p>

    </motion.div>
  );
}
