import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),  // QR draws
      setTimeout(() => setPhase(2), 1100), // browser settles + phone slides in
      setTimeout(() => setPhase(3), 2200), // scan line active
      setTimeout(() => setPhase(4), 3400), // burst + connected
      setTimeout(() => setPhase(5), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -40, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
        {/* Browser mockup */}
        <motion.div
          className="w-[60vw] h-[40vw] bg-[#151821] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
          initial={{ rotateY: 15, rotateX: 5, z: -200 }}
          animate={phase >= 2 ? { rotateY: 0, rotateX: 0, z: 0, scale: 0.9 } : {}}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <div className="h-10 bg-black/40 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="mx-auto bg-black/30 px-4 py-1 rounded text-xs text-white/60 font-mono flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              quickbridge.app
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative gap-4">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
                alt=""
                className="h-7 w-7 object-contain"
              />
              <h3 className="text-2xl font-bold text-white tracking-tight">Scan to connect</h3>
            </div>
            <p className="text-[13px] text-white/45 font-medium tracking-wide">
              No app. No account. No upload.
            </p>

            {/* Fake QR — animate container once, not 81 individual cells */}
            <motion.div
              className="w-48 h-48 bg-white rounded-lg p-3 relative z-10 grid grid-cols-9 grid-rows-9 gap-[2px]"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {Array.from({ length: 81 }).map((_, i) => {
                const row = Math.floor(i / 9);
                const col = i % 9;
                const isFinder =
                  (row < 3 && col < 3) ||
                  (row < 3 && col > 5) ||
                  (row > 5 && col < 3);
                const isFinderInner =
                  (row >= 1 && row <= 1 && col >= 1 && col <= 1) ||
                  (row >= 1 && row <= 1 && col >= 7 && col <= 7) ||
                  (row >= 7 && row <= 7 && col >= 1 && col <= 1);
                const dataActive = !isFinder && (i * 7 + 3) % 5 < 2;
                const filled = isFinder ? !isFinderInner : dataActive;
                return (
                  <div
                    key={i}
                    className={`${filled ? 'bg-black' : 'bg-white'} rounded-[1px]`}
                  />
                );
              })}
            </motion.div>

            {phase >= 4 && (
              <motion.div
                className="absolute inset-0 bg-[#22d3ee] mix-blend-screen z-20 pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.7, 0], scale: [0.8, 2, 3] }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            )}
          </div>
        </motion.div>

        {/* Phone */}
        <motion.div
          className="absolute w-[18vw] h-[36vw] bg-black rounded-[2vw] border-4 border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden z-30"
          initial={{ y: "100vh", x: "20vw", rotateZ: 10, rotateY: -20 }}
          animate={
            phase >= 4 ? { y: "5vh", x: "15vw", rotateZ: 0, rotateY: -10, scale: 1.1 } :
            phase >= 2 ? { y: "10vh", x: "10vw", rotateZ: 5, rotateY: -15 } : {}
          }
          transition={{ type: "spring", damping: 22, stiffness: 160 }}
        >
          <div className="absolute inset-0 border-2 border-[#22d3ee]/50 m-4 rounded-xl flex items-center justify-center overflow-hidden">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Connected
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Caption */}
        <div className="absolute bottom-[8%] left-0 right-0 text-center z-40">
          <motion.h2
            className="text-3xl font-bold text-white bg-black/60 px-8 py-4 rounded-full inline-block backdrop-blur-md border border-white/10 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Just scan. Instantly connected.
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
}
