import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000), // phone sweeps in
      setTimeout(() => setPhase(3), 3500), // scanning
      setTimeout(() => setPhase(4), 5000), // connected burst
      setTimeout(() => setPhase(5), 8000), 
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-full h-full flex items-center justify-center perspective-[1200px]">
        {/* Browser Mockup */}
        <motion.div 
          className="w-[60vw] h-[40vw] bg-[#151821] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
          initial={{ rotateY: 15, rotateX: 5, z: -200 }}
          animate={phase >= 2 ? { rotateY: 0, rotateX: 0, z: 0, scale: 0.9 } : {}}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <div className="h-10 bg-black/40 flex items-center px-4 gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500/50" />
             <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
             <div className="w-3 h-3 rounded-full bg-green-500/50" />
             <div className="mx-auto bg-black/30 px-4 py-1 rounded text-xs text-white/50">quickbridge.app</div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative">
             <h3 className="text-2xl font-bold mb-6">Scan to connect</h3>
             {/* Fake QR */}
             <div className="w-48 h-48 bg-white rounded-lg p-2 grid grid-cols-4 grid-rows-4 gap-1 relative z-10">
                {Array.from({length: 16}).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="bg-black rounded-sm"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={phase >= 1 ? { opacity: Math.random() > 0.3 ? 1 : 0, scale: 1 } : {}}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  />
                ))}
             </div>
             
             {/* Connection burst effect */}
             {phase >= 4 && (
                <motion.div 
                  className="absolute inset-0 bg-[#22d3ee] mix-blend-screen z-20"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0.8, 2, 3] }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
             )}
          </div>
        </motion.div>

        {/* Phone Mockup */}
        <motion.div 
          className="absolute w-[18vw] h-[36vw] bg-black rounded-[2vw] border-4 border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden z-30"
          initial={{ y: "100vh", x: "20vw", rotateZ: 10, rotateY: -20 }}
          animate={
            phase >= 4 ? { y: "5vh", x: "15vw", rotateZ: 0, rotateY: -10, scale: 1.1 } :
            phase >= 2 ? { y: "10vh", x: "10vw", rotateZ: 5, rotateY: -15 } : {}
          }
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
            <div className="absolute inset-0 border-2 border-[#22d3ee]/50 m-4 rounded-xl flex items-center justify-center">
               <motion.div 
                 className="w-full h-1 bg-[#22d3ee] shadow-[0_0_10px_#22d3ee]"
                 animate={phase >= 3 ? { y: ["-15vw", "15vw"] } : {}}
                 transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
               />
            </div>
            
            {phase >= 4 && (
              <motion.div 
                className="absolute inset-0 bg-[#22d3ee]/20 backdrop-blur-sm flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                 <div className="text-white font-bold text-xl flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#22d3ee] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    Connected
                 </div>
              </motion.div>
            )}
        </motion.div>

        {/* Text */}
        <div className="absolute bottom-[10%] left-0 right-0 text-center z-40">
           <motion.h2 
             className="text-4xl font-bold text-white bg-black/50 px-8 py-4 rounded-full inline-block backdrop-blur-md border border-white/10"
             initial={{ opacity: 0, y: 20 }}
             animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
             transition={{ duration: 0.5 }}
           >
             Just scan — instantly connected
           </motion.h2>
        </div>

      </div>
    </motion.div>
  );
}
