import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3300),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      {/* Background data flow */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-[#22d3ee]"
            style={{
              top: `${15 + i * 14}%`,
              left: 0,
              width: `${25 + (i * 11) % 30}%`
            }}
            animate={{ x: ['-100vw', '100vw'] }}
            transition={{
              duration: 2.5 + (i % 3) * 0.8,
              repeat: Infinity,
              delay: i * 0.35,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="absolute top-[12%] text-center w-full px-12">
        <h2 className="text-[3.6vw] font-black text-white tracking-tight leading-tight">
          Direct from device to device.
        </h2>
        <p className="text-[1.4vw] text-white/55 mt-3 font-medium tracking-wide">
          No upload step. No middleman. Instant.
        </p>
      </div>

      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-between px-20">
        {/* Computer */}
        <motion.div
          className="w-64 h-48 bg-[#151821] rounded-xl border border-[#22d3ee]/30 flex flex-col items-center justify-center relative z-10"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Computer</span>
          <div className="w-16 h-16 rounded-full bg-[#22d3ee]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
        </motion.div>

        {/* Bridge */}
        <div className="flex-1 h-32 relative mx-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-full" />
          </div>

          {phase >= 2 && (
            <motion.div
              className="absolute z-20"
              initial={{ left: "0%", scale: 0.5, opacity: 0, y: -20, rotate: -10 }}
              animate={{ left: "100%", scale: 1, opacity: [0, 1, 1, 0], y: 0, rotate: 10 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <img
                src={`${import.meta.env.BASE_URL}images/file-photo.png`}
                className="w-24 h-24 object-cover rounded-lg shadow-xl shadow-[#22d3ee]/20"
                alt=""
              />
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div
              className="absolute z-20"
              initial={{ left: "0%", scale: 0.5, opacity: 0, y: 20, rotate: 10 }}
              animate={{ left: "100%", scale: 1, opacity: [0, 1, 1, 0], y: 0, rotate: -10 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <div className="w-24 h-24 bg-white rounded-lg shadow-xl shadow-white/10 flex flex-col p-3">
                <div className="w-1/2 h-2 bg-gray-200 mb-2 rounded" />
                <div className="w-full h-2 bg-gray-200 mb-1 rounded" />
                <div className="w-3/4 h-2 bg-gray-200 mb-1 rounded" />
                <div className="w-full h-2 bg-gray-200 mb-1 rounded" />
                <div className="flex-1" />
                <div className="w-full h-8 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-xs">DOCX</span>
                </div>
              </div>
            </motion.div>
          )}

          {phase >= 4 && (
            <motion.div
              className="absolute z-20"
              initial={{ left: "100%", scale: 0.5, opacity: 0, y: 0 }}
              animate={{ left: "0%", scale: 1.1, opacity: [0, 1, 1, 0], y: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <div className="px-6 py-3 bg-[#22d3ee] text-black font-bold rounded-full shadow-lg whitespace-nowrap">
                Meeting notes.txt
              </div>
            </motion.div>
          )}
        </div>

        {/* Phone */}
        <motion.div
          className="w-40 h-64 bg-[#151821] rounded-xl border border-[#22d3ee]/30 flex flex-col items-center justify-center relative z-10"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Phone</span>
          <div className="w-16 h-16 rounded-full bg-[#22d3ee]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
