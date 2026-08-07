import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function TinyPhone() {
  return (
    <div style={{ position: 'relative', width: '5.5vw', height: '11vw' }}>
      <div style={{ position: 'absolute', left: '-0.15vw', top: '3vw', width: '0.15vw', height: '0.9vw', background: '#2c2c30', borderRadius: '0.08vw 0 0 0.08vw' }} />
      <div style={{ position: 'absolute', left: '-0.15vw', top: '4.4vw', width: '0.15vw', height: '0.9vw', background: '#2c2c30', borderRadius: '0.08vw 0 0 0.08vw' }} />
      <div style={{ position: 'absolute', right: '-0.15vw', top: '3.7vw', width: '0.15vw', height: '1.4vw', background: '#2c2c30', borderRadius: '0 0.08vw 0.08vw 0' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, #252529, #16161a)', borderRadius: '1.1vw', border: '0.08vw solid rgba(255,255,255,0.13)', boxShadow: '0 0.8vw 2.5vw rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', inset: '0.12vw', background: '#08090e', borderRadius: '1.02vw', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0.3vw', left: '50%', transform: 'translateX(-50%)', width: '1.9vw', height: '0.42vw', background: '#000', borderRadius: '0.22vw', zIndex: 5 }} />
        <div style={{ position: 'absolute', top: '0.18vw', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 0.55vw', zIndex: 4 }}>
          <span style={{ color: 'white', fontSize: '0.38vw', fontWeight: 700 }}>9:41</span>
        </div>
        <div style={{ position: 'absolute', top: '1.1vw', left: '0.25vw', right: '0.25vw', bottom: '0.5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3vw' }}>
          <img src="/brand/quickbridge-logo.png" style={{ width: '0.9vw', height: '0.9vw', objectFit: 'contain', opacity: 0.7 }} alt="" />
          <div style={{ width: '70%', height: '0.12vw', background: 'rgba(34,211,238,0.4)', borderRadius: '1vw' }} />
          <div style={{ width: '90%', height: '0.12vw', background: 'rgba(255,255,255,0.08)', borderRadius: '1vw' }} />
          <div style={{ width: '75%', height: '0.12vw', background: 'rgba(255,255,255,0.06)', borderRadius: '1vw' }} />
          <div style={{ width: '55%', height: '0.12vw', background: 'rgba(255,255,255,0.05)', borderRadius: '1vw' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '0.28vw', left: '50%', transform: 'translateX(-50%)', width: '2.2vw', height: '0.12vw', background: 'rgba(255,255,255,0.38)', borderRadius: '1vw' }} />
      </div>
    </div>
  );
}

function TinyLaptop() {
  return (
    <div style={{ width: '12vw' }}>
      <div style={{ background: '#11141d', borderRadius: '0.42vw 0.42vw 0 0', border: '0.05vw solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ background: '#0c0f17', height: '1.1vw', display: 'flex', alignItems: 'center', padding: '0 0.4vw', gap: '0.22vw', borderBottom: '0.05vw solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '0.32vw', height: '0.32vw', borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: '0.32vw', height: '0.32vw', borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: '0.32vw', height: '0.32vw', borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, marginLeft: '0.3vw', background: 'rgba(255,255,255,0.04)', borderRadius: '0.18vw', height: '0.6vw', display: 'flex', alignItems: 'center', padding: '0 0.32vw', gap: '0.18vw' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" style={{ width: '0.32vw', height: '0.32vw', flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.3vw', fontFamily: 'monospace' }}>quickbridge.app</span>
          </div>
        </div>
        <div style={{ padding: '0.5vw 0.6vw', minHeight: '5.5vw', display: 'flex', flexDirection: 'column', gap: '0.38vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.22vw' }}>
            <img src="/brand/quickbridge-logo.png" style={{ width: '0.52vw', height: '0.52vw', objectFit: 'contain' }} alt="" />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.36vw', fontWeight: 700 }}>QuickBridge</span>
          </div>
          <div style={{ width: '100%', height: '0.1vw', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ border: '0.05vw dashed rgba(255,255,255,0.08)', borderRadius: '0.25vw', padding: '0.6vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.22vw' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ width: '0.9vw', height: '0.9vw' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.3vw' }}>Drop files to send</span>
          </div>
        </div>
      </div>
      <div style={{ background: '#1c1c20', height: '0.38vw', borderRadius: '0 0 0.4vw 0.4vw', border: '0.05vw solid rgba(255,255,255,0.09)', borderTop: 'none' }} />
      <div style={{ background: '#18181c', height: '0.17vw', borderRadius: '0 0 0.45vw 0.45vw', width: '108%', marginLeft: '-4%', border: '0.05vw solid rgba(255,255,255,0.07)', borderTop: 'none' }} />
    </div>
  );
}

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 950),
      setTimeout(() => setPhase(3), 1750),
      setTimeout(() => setPhase(4), 2700),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col items-center justify-center overflow-hidden gap-[4vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      {/* Device diagram */}
      <div className="relative flex items-center justify-center w-full px-[10vw]">

        {/* Phone */}
        <motion.div
          className="flex flex-col items-center gap-[0.8vw]"
          initial={{ opacity: 0, x: -28 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <TinyPhone />
          <span className="font-semibold uppercase tracking-[0.18em] text-white/28" style={{ fontSize: '0.75vw' }}>Your Phone</span>
        </motion.div>

        {/* Connection line + cloud */}
        <div className="flex-1 mx-[2.5vw] relative flex items-center" style={{ height: '11vw' }}>
          {/* Base line */}
          <div className="w-full h-px bg-white/8" />

          {/* Animated cyan line */}
          {phase >= 2 && (
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#22d3ee]"
              style={{ height: 2 }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Data packets traveling along the line */}
          {phase >= 2 && [0, 0.5, 1.0].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[#22d3ee]"
              style={{ width: '0.4vw', height: '0.4vw', left: 0 }}
              animate={{ left: ['0%', '100%'] }}
              transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'linear' }}
            />
          ))}

          {/* Cloud struck through */}
          {phase >= 3 && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-[0.35vw]"
              style={{ top: '-3.8vw' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative flex items-center justify-center" style={{ width: '3.5vw', height: '2.5vw' }}>
                <svg viewBox="0 0 32 22" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeLinecap="round" style={{ width: '100%', height: '100%' }}>
                  <path d="M26 18H9a5.5 5.5 0 0 1-1.2-10.87A7 7 0 1 1 21.89 8.5H22a4 4 0 0 1 4 4.5V18z" />
                </svg>
                <motion.svg
                  viewBox="0 0 32 22" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
                  className="absolute inset-0 opacity-70"
                  style={{ width: '100%', height: '100%' }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <line x1="4" y1="3" x2="28" y2="19" />
                  <line x1="28" y1="3" x2="4" y2="19" />
                </motion.svg>
              </div>
              <span className="font-bold uppercase tracking-wider text-red-500/50" style={{ fontSize: '0.65vw' }}>No server</span>
            </motion.div>
          )}
        </div>

        {/* Laptop */}
        <motion.div
          className="flex flex-col items-center gap-[0.8vw]"
          initial={{ opacity: 0, x: 28 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <TinyLaptop />
          <span className="font-semibold uppercase tracking-[0.18em] text-white/28" style={{ fontSize: '0.75vw' }}>Your Laptop</span>
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        className="text-center px-[8vw]"
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="font-black text-white leading-tight tracking-tight" style={{ fontSize: '4.5vw' }}>
          No cloud. No server.
        </div>
        <div className="font-black text-[#22d3ee] leading-tight tracking-tight" style={{ fontSize: '4.5vw' }}>
          Pure peer-to-peer.
        </div>
      </motion.div>
    </motion.div>
  );
}
