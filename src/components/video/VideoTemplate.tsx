import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

const SCENE_DURATIONS = {
  hook: 4500,
  problem: 5000,
  solution: 5500,
  transfer: 7500,
  diff: 5500,
  closer: 6000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0b0d12] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Persistent Background — static gradient, no animation to avoid GPU blur cost on mobile */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[55vw] h-[55vw] rounded-full opacity-[0.08] blur-[70px]"
          style={{ background: 'radial-gradient(circle, #22d3ee, transparent)', top: '5%', left: '5%' }}
        />
      </div>

      {/* Persistent Accent Line */}
      <motion.div
        className="absolute h-[2px] bg-[#22d3ee]"
        animate={{
          left: ['0%', '0%', '50%', '0%', '0%', '20%'][currentScene],
          width: ['0%', '100%', '0%', '100%', '100%', '60%'][currentScene],
          top: ['50%', '90%', '50%', '10%', '50%', '80%'][currentScene],
          opacity: [0, 0.3, 0.8, 0.3, 0.5, 0.8][currentScene],
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence initial={false} mode="wait">
        {currentScene === 0 && <Scene1 key="hook" />}
        {currentScene === 1 && <Scene2 key="problem" />}
        {currentScene === 2 && <Scene3 key="solution" />}
        {currentScene === 3 && <Scene4 key="transfer" />}
        {currentScene === 4 && <Scene5 key="diff" />}
        {currentScene === 5 && <Scene6 key="closer" />}
      </AnimatePresence>
    </div>
  );
}
