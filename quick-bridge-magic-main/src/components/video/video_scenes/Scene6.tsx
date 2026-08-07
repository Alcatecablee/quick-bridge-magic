import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function MiniPhone({ lit, phase }: { lit: boolean; phase: number }) {
  return (
    <div style={{ position: 'relative', width: '7vw', height: '14vw', flexShrink: 0 }}>
      {/* Buttons */}
      <div style={{ position: 'absolute', left: '-0.18vw', top: '3.8vw', width: '0.18vw', height: '1vw', background: '#2c2c30', borderRadius: '0.1vw 0 0 0.1vw' }} />
      <div style={{ position: 'absolute', left: '-0.18vw', top: '5.4vw', width: '0.18vw', height: '1vw', background: '#2c2c30', borderRadius: '0.1vw 0 0 0.1vw' }} />
      <div style={{ position: 'absolute', right: '-0.18vw', top: '4.5vw', width: '0.18vw', height: '1.6vw', background: '#2c2c30', borderRadius: '0 0.1vw 0.1vw 0' }} />
      {/* Body */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, #252529, #16161a)', borderRadius: '1.4vw', border: `0.08vw solid ${lit ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.12)'}`, boxShadow: lit ? '0 0 1.5vw rgba(34,211,238,0.15), 0 1vw 3vw rgba(0,0,0,0.6)' : '0 1vw 3vw rgba(0,0,0,0.6)', transition: 'border-color 0.4s, box-shadow 0.4s' }} />
      {/* Screen */}
      <div style={{ position: 'absolute', inset: '0.15vw', background: '#000', borderRadius: '1.28vw', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#08090e' }} />
        {/* Dynamic island */}
        <div style={{ position: 'absolute', top: '0.38vw', left: '50%', transform: 'translateX(-50%)', width: '2.5vw', height: '0.55vw', background: '#000', borderRadius: '0.3vw', zIndex: 10 }} />
        {/* Status bar */}
        <div style={{ position: 'absolute', top: '0.22vw', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 0.7vw', zIndex: 9 }}>
          <span style={{ color: 'white', fontSize: '0.5vw', fontWeight: 700 }}>9:41</span>
          <div style={{ display: 'flex', gap: '0.15vw', alignItems: 'center' }}>
            <svg viewBox="0 0 20 14" fill="white" style={{ width: '0.42vw', height: '0.34vw' }}>
              <rect x="0" y="9" width="3" height="5" rx="0.5" /><rect x="4.5" y="6" width="3" height="8" rx="0.5" /><rect x="9" y="3" width="3" height="11" rx="0.5" />
            </svg>
            <svg viewBox="0 0 28 14" fill="none" style={{ width: '0.58vw', height: '0.3vw' }}>
              <rect x="0" y="1" width="24" height="12" rx="2" stroke="white" strokeWidth="1.5" />
              <rect x="24.5" y="4" width="2" height="6" rx="1" fill="white" opacity="0.5" />
              <rect x="1.5" y="2.5" width="18" height="9" rx="1.2" fill="white" />
            </svg>
          </div>
        </div>
        {/* App content */}
        <div style={{ position: 'absolute', top: '1.4vw', left: '0.35vw', right: '0.35vw', bottom: '0.7vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4vw' }}>
          <div style={{ width: '1.6vw', height: '2vw', background: 'rgba(34,211,238,0.08)', border: '0.06vw solid rgba(34,211,238,0.2)', borderRadius: '0.22vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '0.15vw' }}>
            <span style={{ color: '#22d3ee', fontSize: '0.32vw', fontWeight: 800 }}>MP4</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.42vw', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>beach_trip{'\n'}.mp4</span>
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.38vw' }}>2.1 GB</span>
          {phase >= 4 && (
            <motion.div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2vw' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div style={{ width: '90%', background: 'rgba(255,255,255,0.06)', borderRadius: '1vw', overflow: 'hidden', height: '0.16vw' }}>
                <motion.div style={{ height: '100%', background: '#22d3ee', borderRadius: '1vw' }}
                  initial={{ width: '0%' }} animate={{ width: phase >= 5 ? '100%' : '75%' }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              <span style={{ color: '#22d3ee', fontSize: '0.36vw', fontWeight: 700 }}>{phase >= 5 ? 'Sent!' : 'Sending…'}</span>
            </motion.div>
          )}
        </div>
        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: '0.35vw', left: '50%', transform: 'translateX(-50%)', width: '2.8vw', height: '0.15vw', background: 'rgba(255,255,255,0.4)', borderRadius: '1vw' }} />
      </div>
    </div>
  );
}

function MiniLaptop({ lit, phase }: { lit: boolean; phase: number }) {
  return (
    <div style={{ position: 'relative', width: '15vw', flexShrink: 0 }}>
      {/* Screen */}
      <div style={{
        background: '#11141d',
        borderRadius: '0.5vw 0.5vw 0 0',
        border: `0.06vw solid ${lit ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderBottom: 'none',
        overflow: 'hidden',
        boxShadow: lit ? '0 0 1.5vw rgba(34,211,238,0.12)' : 'none',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {/* Browser bar */}
        <div style={{ background: '#0c0f17', height: '1.4vw', display: 'flex', alignItems: 'center', padding: '0 0.5vw', gap: '0.28vw', borderBottom: '0.06vw solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, marginLeft: '0.4vw', background: 'rgba(255,255,255,0.04)', borderRadius: '0.22vw', height: '0.75vw', display: 'flex', alignItems: 'center', padding: '0 0.4vw', gap: '0.22vw' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" style={{ width: '0.4vw', height: '0.4vw', flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.38vw', fontFamily: 'monospace' }}>quickbridge.app/s/4xm8r2</span>
          </div>
        </div>
        {/* Page */}
        <div style={{ padding: '0.65vw 0.8vw', display: 'flex', flexDirection: 'column', gap: '0.5vw', minHeight: '7vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.28vw' }}>
              <img src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`} style={{ width: '0.65vw', height: '0.65vw', objectFit: 'contain' }} alt="" />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.48vw', fontWeight: 700 }}>QuickBridge</span>
            </div>
            <div style={{ background: 'rgba(34,211,238,0.08)', border: '0.04vw solid rgba(34,211,238,0.28)', borderRadius: '0.18vw', padding: '0.07vw 0.3vw', display: 'flex', alignItems: 'center', gap: '0.18vw' }}>
              <div style={{ width: '0.2vw', height: '0.2vw', borderRadius: '50%', background: '#22d3ee' }} />
              <span style={{ color: '#22d3ee', fontSize: '0.32vw', fontWeight: 700 }}>CONNECTED</span>
            </div>
          </div>

          {phase >= 4 ? (
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '0.05vw solid rgba(255,255,255,0.07)', borderRadius: '0.3vw', padding: '0.5vw 0.6vw', display: 'flex', alignItems: 'center', gap: '0.45vw' }}>
              <div style={{ width: '1.4vw', height: '1.7vw', background: 'rgba(34,211,238,0.06)', border: '0.05vw solid rgba(34,211,238,0.18)', borderRadius: '0.2vw', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#22d3ee', fontSize: '0.28vw', fontWeight: 800 }}>MP4</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.44vw', fontWeight: 600, marginBottom: '0.12vw' }}>beach_trip.mp4</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.38vw', marginBottom: phase >= 4 ? '0.28vw' : 0 }}>2.1 GB</div>
                {phase >= 4 && (
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '1vw', overflow: 'hidden', height: '0.14vw' }}>
                    <motion.div style={{ height: '100%', background: '#22d3ee', borderRadius: '1vw' }}
                      initial={{ width: '0%' }} animate={{ width: phase >= 5 ? '100%' : '75%' }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                )}
              </div>
              {phase >= 5 ? (
                <div style={{ width: '0.95vw', height: '0.95vw', borderRadius: '50%', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="3.5" strokeLinecap="round" style={{ width: '0.48vw', height: '0.48vw' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <span style={{ color: '#22d3ee', fontSize: '0.38vw', fontWeight: 700, flexShrink: 0 }}>Receiving…</span>
              )}
            </div>
          ) : (
            <div style={{ border: '0.06vw dashed rgba(255,255,255,0.08)', borderRadius: '0.3vw', padding: '0.9vw 0.5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25vw' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ width: '1.1vw', height: '1.1vw' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.4vw' }}>Waiting for files…</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.28vw' }}>
            <div style={{ width: '0.2vw', height: '0.2vw', borderRadius: '50%', background: phase >= 4 ? '#22d3ee' : 'rgba(255,255,255,0.18)', transition: 'background 0.4s' }} />
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.36vw', fontFamily: 'monospace' }}>
              {phase >= 5 ? 'beach_trip.mp4 · saved to Downloads' : phase >= 4 ? 'receiving via WebRTC direct…' : 'session 4xm8r2 · ready'}
            </span>
          </div>
        </div>
      </div>
      {/* Laptop base */}
      <div style={{ background: 'linear-gradient(180deg, #252529 0%, #1c1c20 100%)', height: '0.5vw', borderRadius: '0 0 0.5vw 0.5vw', border: '0.06vw solid rgba(255,255,255,0.1)', borderTop: 'none' }} />
      <div style={{ background: 'linear-gradient(180deg, #1c1c20 0%, #18181c 100%)', height: '0.22vw', borderRadius: '0 0 0.6vw 0.6vw', marginTop: '0.05vw', width: '110%', marginLeft: '-5%', border: '0.06vw solid rgba(255,255,255,0.07)', borderTop: 'none' }} />
    </div>
  );
}

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 250),
      setTimeout(() => setPhase(2), 750),
      setTimeout(() => setPhase(3), 1350),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col items-center justify-center overflow-hidden gap-[3vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      {/* Devices row */}
      <div className="w-full flex items-center justify-center gap-0 px-[8vw]">

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-[1vw]">
            <MiniPhone lit={phase >= 5} phase={phase} />
            <span className="font-semibold text-white/30 uppercase tracking-[0.18em]" style={{ fontSize: '0.75vw' }}>Phone</span>
          </div>
        </motion.div>

        {/* Bridge */}
        <div className="flex-1 mx-[2.5vw] flex flex-col items-center gap-[0.9vw]">
          {/* File label */}
          <motion.div
            className="font-mono text-white/40 border border-white/10 bg-white/4 rounded"
            style={{ fontSize: '0.95vw', padding: '0.35vw 0.9vw' }}
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 0.35 }}
          >
            beach_trip.mp4 · 2.1 GB
          </motion.div>

          {/* Transfer line */}
          <div className="relative w-full flex items-center" style={{ height: '1.2vw' }}>
            <div className="w-full h-px bg-white/8" />
            {phase >= 4 && (
              <motion.div
                className="absolute h-[2px] bg-[#22d3ee] left-0 top-1/2 -translate-y-1/2"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            {phase >= 5 && (
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-[#22d3ee]"
                style={{ width: '0.6vw', height: '0.6vw' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 420 }}
              />
            )}
          </div>

          {/* Transfer label */}
          <motion.div
            className="flex items-center gap-[0.6vw]"
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <span className="text-[#22d3ee] font-mono" style={{ fontSize: '0.8vw' }}>Transferring</span>
            <span className="text-white/22 font-mono" style={{ fontSize: '0.8vw' }}>Direct · No relay</span>
          </motion.div>
        </div>

        {/* Laptop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-[1vw]">
            <MiniLaptop lit={phase >= 5} phase={phase} />
            <span className="font-semibold text-white/30 uppercase tracking-[0.18em]" style={{ fontSize: '0.75vw' }}>Laptop</span>
          </div>
        </motion.div>
      </div>

      {/* Time stat */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 5 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="font-black text-[#22d3ee] leading-none tracking-tighter" style={{ fontSize: '7vw' }}>
          12 seconds.
        </div>
        <div className="text-white/35 font-medium mt-[0.6vw] tracking-wide" style={{ fontSize: '1.3vw' }}>
          No cable. No cloud. Just done.
        </div>
      </motion.div>
    </motion.div>
  );
}
