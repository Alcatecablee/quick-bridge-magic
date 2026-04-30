import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col gap-12 w-full max-w-4xl px-12 relative z-10">
        
        <motion.div 
          className="flex items-center gap-8"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
        >
           <div className="w-16 h-16 rounded-full bg-[#151821] border border-white/10 flex items-center justify-center shrink-0">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="3" y1="3" x2="21" y2="21" stroke="red"></line></svg>
           </div>
           <h2 className="text-[4vw] font-black text-white leading-none">No accounts</h2>
        </motion.div>

        <motion.div 
          className="flex items-center gap-8 pl-[10%]"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
        >
           <div className="w-16 h-16 rounded-full bg-[#151821] border border-white/10 flex items-center justify-center shrink-0">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><line x1="3" y1="3" x2="21" y2="21" stroke="red"></line></svg>
           </div>
           <h2 className="text-[4vw] font-black text-white leading-none">Nothing stored</h2>
        </motion.div>

        <motion.div 
          className="flex items-center gap-8 pl-[20%]"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
        >
           <div className="w-16 h-16 rounded-full bg-[#151821] border border-[#22d3ee]/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
           </div>
           <h2 className="text-[4vw] font-black text-[#22d3ee] leading-none">Direct & encrypted</h2>
        </motion.div>

      </div>
    </motion.div>
  );
}
