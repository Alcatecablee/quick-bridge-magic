import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0d12]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "brightness(0.5)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 z-0">
         <img 
            src={`${import.meta.env.BASE_URL}images/bg-particles.png`}
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
            alt="particles"
         />
      </div>

      <div className="relative z-10 text-center px-12" style={{ perspective: '1000px' }}>
        <motion.h1 
          className="text-[6vw] font-black tracking-tighter leading-[1.1] text-white"
        >
          <motion.span 
            className="inline-block"
            initial={{ opacity: 0, y: 50, rotateX: -30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            Move files between
          </motion.span>
          <br />
          <motion.span 
            className="inline-block"
            initial={{ opacity: 0, y: 50, rotateX: -30 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            your devices.
          </motion.span>
          <br />
          <motion.span 
            className="inline-block text-[#22d3ee] mt-4"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={phase >= 3 ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Instantly.
          </motion.span>
        </motion.h1>
      </div>

      {/* Floating accents */}
      <motion.div 
        className="absolute w-32 h-32 border border-[#22d3ee]/20 rounded-full z-0"
        animate={{ 
          y: [-20, 20, -20],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ top: '20%', left: '15%' }}
      />
    </motion.div>
  );
}
