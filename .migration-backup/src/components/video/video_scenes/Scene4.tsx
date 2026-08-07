import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function PhotoThumbnail() {
  return (
    <svg viewBox="0 0 88 88" width={88} height={88} style={{ borderRadius: 8, display: 'block' }}>
      <defs>
        <linearGradient id="s4sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a5c" />
          <stop offset="48%" stopColor="#c0622a" />
          <stop offset="100%" stopColor="#e8924a" />
        </linearGradient>
      </defs>
      <rect width="88" height="88" fill="url(#s4sky)" />
      <circle cx="58" cy="36" r="9" fill="#ffd966" opacity="0.9" />
      <ellipse cx="44" cy="68" rx="50" ry="12" fill="#c0622a" opacity="0.22" />
      <polygon points="0,88 0,56 14,44 26,52 40,34 54,48 66,36 80,44 88,40 88,88" fill="#0d1a0e" />
      <rect x="0" y="74" width="88" height="14" fill="#0d2a3a" opacity="0.65" />
    </svg>
  );
}

function MacBrowser({ phase }: { phase: number }) {
  return (
    <div style={{
      width: '40vw',
      background: '#11141d',
      borderRadius: '0.7vw',
      border: '0.06vw solid rgba(255,255,255,0.1)',
      overflow: 'hidden',
      boxShadow: '0 2vw 6vw rgba(0,0,0,0.6), 0 0 0 0.06vw rgba(255,255,255,0.04)',
      flexShrink: 0,
    }}>
      {/* Title bar with tab */}
      <div style={{ background: '#0c0f17', height: '2.3vw', display: 'flex', alignItems: 'center', padding: '0 0.8vw', gap: '0.42vw', borderBottom: '0.06vw solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '0.62vw', height: '0.62vw', borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: '0.62vw', height: '0.62vw', borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: '0.62vw', height: '0.62vw', borderRadius: '50%', background: '#28c840' }} />
        <div style={{ marginLeft: '0.6vw', background: '#11141d', height: '1.65vw', borderRadius: '0.35vw 0.35vw 0 0', padding: '0 0.7vw', display: 'flex', alignItems: 'center', gap: '0.35vw', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <img src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`} style={{ width: '0.75vw', height: '0.75vw', objectFit: 'contain' }} alt="" />
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.62vw', fontWeight: 600 }}>QuickBridge</span>
        </div>
        <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '0.06vw solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.3vw' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" style={{ width: '0.55vw', height: '0.55vw' }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>
      {/* URL bar */}
      <div style={{ background: '#0c0f17', height: '1.9vw', display: 'flex', alignItems: 'center', padding: '0 0.8vw', gap: '0.45vw', borderBottom: '0.06vw solid rgba(255,255,255,0.05)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" style={{ width: '0.72vw', height: '0.72vw', flexShrink: 0 }}><polyline points="15 18 9 12 15 6" /></svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" style={{ width: '0.72vw', height: '0.72vw', flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '0.32vw', height: '1.18vw', display: 'flex', alignItems: 'center', padding: '0 0.55vw', gap: '0.32vw' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" style={{ width: '0.6vw', height: '0.6vw', flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.58vw', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>quickbridge.app/s/7k2px9</span>
        </div>
      </div>
      {/* Page content */}
      <div style={{ padding: '1vw 1.3vw', display: 'flex', flexDirection: 'column', gap: '0.75vw', minHeight: '14vw' }}>
        {/* App header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
            <img src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`} style={{ width: '0.95vw', height: '0.95vw', objectFit: 'contain' }} alt="" />
            <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.72vw', fontWeight: 700 }}>QuickBridge</span>
          </div>
          <div style={{ background: 'rgba(34,211,238,0.08)', border: '0.05vw solid rgba(34,211,238,0.28)', borderRadius: '0.25vw', padding: '0.1vw 0.42vw', display: 'flex', alignItems: 'center', gap: '0.26vw' }}>
            <div style={{ width: '0.28vw', height: '0.28vw', borderRadius: '50%', background: '#22d3ee' }} />
            <span style={{ color: '#22d3ee', fontSize: '0.48vw', fontWeight: 700, letterSpacing: '0.06em' }}>CONNECTED</span>
          </div>
        </div>

        <div style={{ height: '0.06vw', background: 'rgba(255,255,255,0.06)' }} />

        {/* File area */}
        {phase >= 2 ? (
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '0.06vw solid rgba(255,255,255,0.07)', borderRadius: '0.42vw', padding: '0.65vw 0.85vw', display: 'flex', alignItems: 'center', gap: '0.6vw' }}>
            <div style={{ width: '2.1vw', height: '2.6vw', background: 'rgba(34,211,238,0.06)', border: '0.06vw solid rgba(34,211,238,0.18)', borderRadius: '0.28vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '0.22vw', flexShrink: 0 }}>
              <span style={{ color: '#22d3ee', fontSize: '0.42vw', fontWeight: 800, letterSpacing: '0.04em' }}>MP4</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.65vw', fontWeight: 600, marginBottom: '0.18vw', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>holiday_trip.mp4</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.56vw', marginBottom: phase >= 4 ? '0.35vw' : 0 }}>3.8 GB</div>
              {phase >= 4 && (
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '1vw', overflow: 'hidden', height: '0.2vw' }}>
                  <motion.div
                    style={{ height: '100%', background: '#22d3ee', borderRadius: '1vw' }}
                    initial={{ width: '0%' }}
                    animate={{ width: phase >= 5 ? '100%' : '68%' }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
              {phase >= 5 ? (
                <div style={{ width: '1.25vw', height: '1.25vw', borderRadius: '50%', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="3.5" strokeLinecap="round" style={{ width: '0.62vw', height: '0.62vw' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : phase >= 3 ? (
                <span style={{ color: '#22d3ee', fontSize: '0.56vw', fontWeight: 700 }}>Sending…</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div style={{ border: '0.08vw dashed rgba(255,255,255,0.09)', borderRadius: '0.42vw', padding: '1.6vw 1vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35vw' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ width: '1.6vw', height: '1.6vw' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.62vw' }}>Drop files here to send</span>
          </div>
        )}

        {/* Status line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.38vw', marginTop: 'auto', paddingTop: '0.4vw', borderTop: '0.06vw solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '0.28vw', height: '0.28vw', borderRadius: '50%', background: phase >= 3 ? '#22d3ee' : 'rgba(255,255,255,0.2)', transition: 'background 0.4s' }} />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.52vw', fontFamily: 'monospace' }}>
            {phase >= 5 ? 'Transfer complete · 3.8 GB · WebRTC direct' : phase >= 3 ? 'Transferring directly · no relay · no upload' : 'Session 7k2px9 · awaiting receiver…'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReceiverPhone({ phase }: { phase: number }) {
  return (
    <div style={{ position: 'relative', width: '11vw', height: '22vw', flexShrink: 0 }}>
      {/* Buttons */}
      <div style={{ position: 'absolute', left: '-0.2vw', top: '5.2vw', width: '0.2vw', height: '1.2vw', background: '#2c2c30', borderRadius: '0.1vw 0 0 0.1vw' }} />
      <div style={{ position: 'absolute', left: '-0.2vw', top: '6.9vw', width: '0.2vw', height: '1.2vw', background: '#2c2c30', borderRadius: '0.1vw 0 0 0.1vw' }} />
      <div style={{ position: 'absolute', right: '-0.2vw', top: '6.5vw', width: '0.2vw', height: '2.2vw', background: '#2c2c30', borderRadius: '0 0.1vw 0.1vw 0' }} />
      {/* Body */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, #252529 0%, #16161a 100%)', borderRadius: '1.8vw', border: '0.1vw solid rgba(255,255,255,0.12)', boxShadow: '0 0 0 0.05vw rgba(255,255,255,0.04) inset, 0 1.2vw 4vw rgba(0,0,0,0.65)' }} />
      {/* Screen */}
      <div style={{ position: 'absolute', inset: '0.2vw', background: '#000', borderRadius: '1.62vw', overflow: 'hidden' }}>
        {/* Screen bg */}
        <div style={{ position: 'absolute', inset: 0, background: '#0b0d12' }} />
        {/* Dynamic island */}
        <div style={{ position: 'absolute', top: '0.5vw', left: '50%', transform: 'translateX(-50%)', width: '3.2vw', height: '0.72vw', background: '#000', borderRadius: '0.38vw', zIndex: 20, border: '0.05vw solid rgba(255,255,255,0.07)' }} />
        {/* Status bar */}
        <div style={{ position: 'absolute', top: '0.28vw', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.9vw', zIndex: 15 }}>
          <span style={{ color: 'white', fontSize: '0.65vw', fontWeight: 700 }}>9:41</span>
          <div style={{ display: 'flex', gap: '0.22vw', alignItems: 'center' }}>
            <svg width="10" height="8" viewBox="0 0 20 14" fill="white" style={{ width: '0.55vw', height: '0.44vw' }}>
              <rect x="0" y="9" width="3" height="5" rx="0.5" /><rect x="4.5" y="6" width="3" height="8" rx="0.5" /><rect x="9" y="3" width="3" height="11" rx="0.5" /><rect x="13.5" y="0" width="3" height="14" rx="0.5" opacity="0.35" />
            </svg>
            <svg width="12" height="7" viewBox="0 0 28 14" fill="none" style={{ width: '0.75vw', height: '0.38vw' }}>
              <rect x="0" y="1" width="24" height="12" rx="2" stroke="white" strokeWidth="1.5" />
              <rect x="24.5" y="4" width="2" height="6" rx="1" fill="white" opacity="0.5" />
              <rect x="1.5" y="2.5" width={phase >= 5 ? 20 : 14} height="9" rx="1.2" fill="white" />
            </svg>
          </div>
        </div>

        {/* Browser mini bar */}
        <div style={{ position: 'absolute', top: '1.6vw', left: '0.5vw', right: '0.5vw', height: '1.1vw', background: 'rgba(255,255,255,0.05)', borderRadius: '0.28vw', display: 'flex', alignItems: 'center', padding: '0 0.4vw', gap: '0.25vw' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" style={{ width: '0.5vw', height: '0.5vw', flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.44vw', fontFamily: 'monospace' }}>quickbridge.app/s/7k2px9</span>
        </div>

        {/* App content */}
        <div style={{ position: 'absolute', top: '3.1vw', left: '0.5vw', right: '0.5vw', bottom: '1vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6vw', padding: '0.5vw' }}>
          {phase < 3 ? (
            <>
              <div style={{ width: '2.2vw', height: '2.2vw', borderRadius: '50%', border: '0.1vw solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" style={{ width: '1.1vw', height: '1.1vw' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.55vw', fontWeight: 600, textAlign: 'center' }}>Waiting for files…</span>
            </>
          ) : phase >= 5 ? (
            <>
              <motion.div
                style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 380 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="3.5" strokeLinecap="round" style={{ width: '1.25vw', height: '1.25vw' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
              <span style={{ color: '#22d3ee', fontSize: '0.6vw', fontWeight: 700 }}>Received!</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5vw', textAlign: 'center' }}>holiday_trip.mp4</span>
            </>
          ) : (
            <>
              <div style={{ width: '2.4vw', height: '2.8vw', background: 'rgba(34,211,238,0.06)', border: '0.06vw solid rgba(34,211,238,0.2)', borderRadius: '0.28vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '0.2vw' }}>
                <span style={{ color: '#22d3ee', fontSize: '0.42vw', fontWeight: 800 }}>MP4</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.58vw', fontWeight: 600, textAlign: 'center' }}>holiday_trip.mp4</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5vw' }}>3.8 GB</span>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '1vw', overflow: 'hidden', height: '0.2vw' }}>
                <motion.div
                  style={{ height: '100%', background: '#22d3ee', borderRadius: '1vw' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '68%' }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span style={{ color: '#22d3ee', fontSize: '0.5vw', fontWeight: 700 }}>Receiving…</span>
            </>
          )}
        </div>

        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: '0.45vw', left: '50%', transform: 'translateX(-50%)', width: '3.5vw', height: '0.18vw', background: 'rgba(255,255,255,0.4)', borderRadius: '1vw', zIndex: 20 }} />
      </div>
    </div>
  );
}

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 5200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      {/* Subtle bg streams */}
      <div className="absolute inset-0 opacity-[0.05]">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div key={i} className="absolute h-px bg-[#22d3ee]"
            style={{ top: `${18 + i * 14}%`, left: 0, width: `${22 + (i * 11) % 25}%` }}
            animate={{ x: ['-100vw', '150vw'] }}
            transition={{ duration: 3.2 + (i % 3) * 0.8, repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
          />
        ))}
      </div>

      {/* Top text */}
      <div className="w-full px-[8vw] mb-[2.5vw]">
        <motion.h2
          className="font-black text-white tracking-tight leading-tight"
          style={{ fontSize: '3.2vw' }}
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Direct from device to device.
        </motion.h2>
        <motion.p
          className="text-white/45 font-medium tracking-wide"
          style={{ fontSize: '1.2vw', marginTop: '0.5vw' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          No upload step. No middleman. Instant.
        </motion.p>
        <motion.div
          className="flex items-center gap-4 mt-3"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {['android.png', 'ios.png', 'macos.png', 'windows.png', 'linux.png'].map(logo => (
            <img key={logo} src={`${import.meta.env.BASE_URL}logos/${logo}`} alt={logo.replace('.png', '')}
              style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.4 }} />
          ))}
          <span className="text-white/28 font-medium" style={{ fontSize: '0.85vw' }}>Any device. Any network.</span>
        </motion.div>
      </div>

      {/* Device bridge row */}
      <div className="w-full px-[8vw] flex items-center gap-[2.5vw]">
        {/* Mac browser */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={phase >= 1 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, type: 'spring', damping: 24 }}
        >
          <MacBrowser phase={phase} />
        </motion.div>

        {/* Transfer channel */}
        <div className="flex-1 relative flex items-center justify-center" style={{ height: '6vw' }}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-white/6" />
          </div>

          {/* Badge */}
          <motion.div
            className="relative z-10 bg-[#0b0d12] px-[0.8vw] py-[0.4vw] border border-white/10 rounded text-white/35 font-semibold tracking-wide"
            style={{ fontSize: '0.72vw' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Up to 10 GB
          </motion.div>

          {/* File flying L→R */}
          {phase >= 2 && phase < 4 && (
            <motion.div
              className="absolute z-20 flex items-center gap-[0.4vw] bg-[#151821] border border-white/10 rounded-lg px-[0.7vw] py-[0.5vw]"
              style={{ left: 0, whiteSpace: 'nowrap' }}
              initial={{ left: '-2vw', opacity: 0 }}
              animate={{ left: '110%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            >
              <PhotoThumbnail />
            </motion.div>
          )}

          {/* File flying R→L */}
          {phase >= 3 && phase < 5 && (
            <motion.div
              className="absolute z-20"
              style={{ right: 0 }}
              initial={{ right: '-2vw', opacity: 0 }}
              animate={{ right: '110%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            >
              <div className="bg-[#151821] border border-white/10 rounded-lg px-[0.9vw] py-[0.5vw]">
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7vw', fontWeight: 600 }}>holiday_trip.mp4</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6vw' }}>3.8 GB</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Phone */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={phase >= 1 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, type: 'spring', damping: 24 }}
        >
          <ReceiverPhone phase={phase} />
        </motion.div>
      </div>
    </motion.div>
  );
}
