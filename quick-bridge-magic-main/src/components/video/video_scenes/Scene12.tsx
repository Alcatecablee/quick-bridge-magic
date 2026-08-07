import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export function Scene12() {
  const [phase, setPhase] = useState(0);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;
    QRCode.toCanvas(qrRef.current, 'https://quickbridge.app', {
      width: 88,
      margin: 1,
      color: { dark: '#0b0d12', light: '#ffffff' },
    });
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0b0d12] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo + wordmark */}
      <motion.div
        className="flex items-center gap-5 mb-[2.5vw] z-10"
        initial={{ scale: 0.78, opacity: 0, y: 22 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 20, stiffness: 320 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/quickbridge-logo.png`}
          alt="QuickBridge"
          style={{
            width: 72, height: 72, objectFit: 'contain',
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.28))',
          }}
        />
        <img
          src={`${import.meta.env.BASE_URL}brand/quickbridge-wordmark.png`}
          alt="QuickBridge"
          style={{
            height: 44, width: 'auto', objectFit: 'contain',
            mixBlendMode: 'screen',
          }}
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="text-white max-w-2xl text-center z-10 font-bold leading-tight tracking-tight px-12"
        style={{ fontSize: '2.1vw' }}
        initial={{ opacity: 0, y: 18 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        The fastest way to move files{' '}
        <span className="text-white/45">between your devices.</span>
      </motion.p>

      {/* CTA: URL + QR */}
      <motion.div
        className="mt-[2.5vw] z-10 flex items-center gap-6"
        initial={{ opacity: 0, scale: 0.9, y: 14 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ type: 'spring', damping: 20, stiffness: 320 }}
      >
        <div className="flex items-center gap-3 bg-[#22d3ee] px-7 py-3.5 rounded-xl">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <line x1="14" y1="14" x2="21" y2="14" />
            <line x1="14" y1="18" x2="18" y2="18" />
            <line x1="14" y1="21" x2="21" y2="21" />
          </svg>
          <span className="text-2xl font-black text-[#0b0d12] tracking-tight">
            quickbridge.app
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-white rounded-lg p-1">
            <canvas ref={qrRef} width={88} height={88} style={{ width: 88, height: 88, display: 'block' }} />
          </div>
          <span className="font-semibold uppercase tracking-widest text-white/35" style={{ fontSize: '0.6vw' }}>Scan to open</span>
        </div>
      </motion.div>

      <motion.p
        className="mt-4 text-white/50 font-medium z-10"
        style={{ fontSize: '1.05vw' }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        Open on both devices. Scan the QR. Done.
      </motion.p>

      <motion.p
        className="mt-[1.8vw] text-white/38 font-bold uppercase tracking-[0.3em] z-10"
        style={{ fontSize: '0.8vw' }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        Free. Forever. No signup.
      </motion.p>

      <motion.p
        className="mt-[0.8vw] text-white/20 italic z-10"
        style={{ fontSize: '0.9vw' }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.4 }}
      >
        It's just a website.
      </motion.p>
    </motion.div>
  );
}
