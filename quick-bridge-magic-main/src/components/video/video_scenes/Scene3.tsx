import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

function PhoneMockup({ phase }: { phase: number }) {
  return (
    <div style={{ position: 'relative', width: '16vw', height: '33vw' }}>
      {/* Side buttons */}
      <div style={{ position: 'absolute', left: '-0.22vw', top: '6vw', width: '0.22vw', height: '1.4vw', background: '#2c2c30', borderRadius: '0.12vw 0 0 0.12vw' }} />
      <div style={{ position: 'absolute', left: '-0.22vw', top: '8.1vw', width: '0.22vw', height: '1.4vw', background: '#2c2c30', borderRadius: '0.12vw 0 0 0.12vw' }} />
      <div style={{ position: 'absolute', left: '-0.22vw', top: '10.2vw', width: '0.22vw', height: '2.2vw', background: '#2c2c30', borderRadius: '0.12vw 0 0 0.12vw' }} />
      <div style={{ position: 'absolute', right: '-0.22vw', top: '7.5vw', width: '0.22vw', height: '2.6vw', background: '#2c2c30', borderRadius: '0 0.12vw 0.12vw 0' }} />

      {/* Phone body */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #232328 0%, #18181c 100%)',
        borderRadius: '2.2vw',
        border: '0.12vw solid rgba(255,255,255,0.13)',
        boxShadow: '0 0 0 0.06vw rgba(255,255,255,0.04) inset, 0 1.5vw 5vw rgba(0,0,0,0.7)',
      }} />

      {/* Screen */}
      <div style={{
        position: 'absolute', inset: '0.25vw',
        background: '#000',
        borderRadius: '2vw',
        overflow: 'hidden',
      }}>
        {/* Camera viewfinder bg - simulated room */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0e1420 0%, #05070c 100%)' }}>
          <div style={{ position: 'absolute', top: '28%', left: '5%', width: '55%', height: '18%', background: 'rgba(255,255,255,0.025)', borderRadius: '3px', filter: 'blur(1px)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '5%', width: '40%', height: '10%', background: 'rgba(255,255,255,0.018)', borderRadius: '2px', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', top: '35%', right: '8%', width: '20%', height: '28%', background: 'rgba(80,120,200,0.04)', borderRadius: '2px', filter: 'blur(3px)' }} />
        </div>

        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: '0.55vw', left: '50%', transform: 'translateX(-50%)',
          width: '3.8vw', height: '0.85vw',
          background: '#000',
          borderRadius: '0.45vw',
          zIndex: 20,
          border: '0.06vw solid rgba(255,255,255,0.07)',
        }} />

        {/* Status bar */}
        <div style={{
          position: 'absolute', top: '0.3vw', left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 1.1vw',
          zIndex: 15,
        }}>
          <span style={{ color: 'white', fontSize: '0.78vw', fontWeight: 700, letterSpacing: '-0.01em' }}>9:41</span>
          <div style={{ display: 'flex', gap: '0.28vw', alignItems: 'center' }}>
            <svg width="10" height="8" viewBox="0 0 20 14" fill="white" style={{ width: '0.62vw', height: '0.5vw' }}>
              <rect x="0" y="9" width="3" height="5" rx="0.5" opacity="1" />
              <rect x="4.5" y="6" width="3" height="8" rx="0.5" opacity="1" />
              <rect x="9" y="3" width="3" height="11" rx="0.5" opacity="1" />
              <rect x="13.5" y="0" width="3" height="14" rx="0.5" opacity="0.35" />
            </svg>
            <svg width="10" height="7" viewBox="0 0 20 14" fill="white" style={{ width: '0.65vw', height: '0.45vw' }}>
              <path d="M10 3C13.5 3 16.7 4.3 19 6.5L17.2 8.3C15.4 6.5 12.8 5.5 10 5.5S4.6 6.5 2.8 8.3L1 6.5C3.3 4.3 6.5 3 10 3Z" opacity="0.4" />
              <path d="M10 7C12.2 7 14.2 7.8 15.7 9.2L13.9 11C12.8 9.9 11.5 9.2 10 9.2S7.2 9.9 6.1 11L4.3 9.2C5.8 7.8 7.8 7 10 7Z" opacity="0.7" />
              <circle cx="10" cy="13" r="1.5" />
            </svg>
            <svg width="14" height="7" viewBox="0 0 28 14" fill="none" style={{ width: '0.85vw', height: '0.42vw' }}>
              <rect x="0" y="1" width="24" height="12" rx="2" stroke="white" strokeWidth="1.5" />
              <rect x="24.5" y="4" width="2" height="6" rx="1" fill="white" opacity="0.5" />
              <rect x="1.5" y="2.5" width="18" height="9" rx="1.2" fill="white" />
            </svg>
          </div>
        </div>

        {/* QR Scanner viewfinder */}
        {phase >= 2 && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -52%)',
            width: '9vw', height: '9vw',
          }}>
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTop: true, borderLeft: true },
              { top: 0, right: 0, borderTop: true, borderRight: true },
              { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
              { bottom: 0, right: 0, borderBottom: true, borderRight: true },
            ].map((corner, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: corner.top !== undefined ? corner.top : undefined,
                bottom: corner.bottom !== undefined ? corner.bottom : undefined,
                left: corner.left !== undefined ? corner.left : undefined,
                right: corner.right !== undefined ? corner.right : undefined,
                width: '1.4vw', height: '1.4vw',
                borderTop: corner.borderTop ? '0.18vw solid #22d3ee' : 'none',
                borderBottom: corner.borderBottom ? '0.18vw solid #22d3ee' : 'none',
                borderLeft: corner.borderLeft ? '0.18vw solid #22d3ee' : 'none',
                borderRight: corner.borderRight ? '0.18vw solid #22d3ee' : 'none',
                borderTopLeftRadius: (corner.borderTop && corner.borderLeft) ? '0.3vw' : 0,
                borderTopRightRadius: (corner.borderTop && corner.borderRight) ? '0.3vw' : 0,
                borderBottomLeftRadius: (corner.borderBottom && corner.borderLeft) ? '0.3vw' : 0,
                borderBottomRightRadius: (corner.borderBottom && corner.borderRight) ? '0.3vw' : 0,
              }} />
            ))}

            {/* Scan line */}
            <motion.div
              style={{
                position: 'absolute', left: '0.18vw', right: '0.18vw',
                height: '0.12vw',
                background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                boxShadow: '0 0 0.5vw rgba(34,211,238,0.6)',
                top: 0,
              }}
              animate={{ top: ['5%', '95%'] }}
              transition={{ duration: 1.3, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            />

            {/* Ambient scanner glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(34,211,238,0.04)',
              border: '0.06vw solid rgba(34,211,238,0.15)',
            }} />
          </div>
        )}

        {/* Success overlay */}
        {phase >= 4 && (
          <motion.div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(11,13,18,0.72)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.6vw',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              style={{
                width: '2.8vw', height: '2.8vw', borderRadius: '50%',
                background: '#22d3ee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 400 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.4vw', height: '1.4vw' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <span style={{ color: 'white', fontSize: '0.9vw', fontWeight: 700 }}>Connected</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62vw', fontWeight: 500 }}>quickbridge.app</span>
          </motion.div>
        )}

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: '0.55vw', left: '50%', transform: 'translateX(-50%)',
          width: '4vw', height: '0.22vw',
          background: 'rgba(255,255,255,0.45)',
          borderRadius: '1vw',
          zIndex: 20,
        }} />
      </div>
    </div>
  );
}

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;
    QRCode.toCanvas(qrRef.current, 'https://quickbridge.app/s/7k2px9', {
      width: 160,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2100),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1400px' }}>
        {/* Browser mockup */}
        <motion.div
          className="w-[56vw] h-[36vw] bg-[#151821] rounded-xl border border-white/10 flex flex-col overflow-hidden relative"
          initial={{ rotateY: 12, rotateX: 4, z: -180 }}
          animate={phase >= 2 ? { rotateY: 0, rotateX: 0, z: 0, scale: 0.88 } : {}}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
        >
          {/* Title bar */}
          <div className="h-10 bg-black/40 flex items-center px-4 gap-2 border-b border-white/5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="mx-auto bg-black/30 px-4 py-1 rounded text-xs text-white/55 font-mono flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              quickbridge.app/s/7k2px9
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative gap-4 min-h-0">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
                alt=""
                style={{ width: 26, height: 26, objectFit: 'contain' }}
              />
              <h3 className="text-xl font-bold text-white tracking-tight">Scan to connect</h3>
            </div>
            <p className="text-[13px] text-white/40 font-medium tracking-wide">
              No app. No account. No upload.
            </p>

            {/* QR code */}
            <motion.div
              className="bg-white rounded-lg p-2 relative z-10"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <canvas ref={qrRef} width={160} height={160} style={{ width: 160, height: 160, display: 'block' }} />
            </motion.div>

            {/* Scan burst */}
            {phase >= 4 && (
              <motion.div
                className="absolute inset-0 bg-[#22d3ee] mix-blend-screen z-20 pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.4, 0], scale: [0.8, 2, 3] }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            )}
          </div>
        </motion.div>

        {/* Realistic phone */}
        <motion.div
          className="absolute z-30"
          initial={{ y: '100vh', x: '20vw', rotateZ: 8 }}
          animate={
            phase >= 4 ? { y: '3vh', x: '14vw', rotateZ: 0, scale: 1.08 } :
            phase >= 2 ? { y: '7vh', x: '10vw', rotateZ: 4 } : {}
          }
          transition={{ type: 'spring', damping: 22, stiffness: 160 }}
        >
          <PhoneMockup phase={phase} />
        </motion.div>

        {/* Caption */}
        <div className="absolute bottom-[9%] left-0 right-0 text-center z-40">
          <motion.div
            className="text-[2.2vw] font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.45 }}
          >
            Just scan. Instantly connected.
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
