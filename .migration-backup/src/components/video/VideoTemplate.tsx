import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';
import { Scene9 } from './video_scenes/Scene9';
import { Scene10 } from './video_scenes/Scene10';
import { Scene11 } from './video_scenes/Scene11';
import { Scene12 } from './video_scenes/Scene12';

const SCENE_DURATIONS = {
  hook:     4000,
  problem:  4500,
  solution: 5000,
  transfer: 7000,
  content:  4500,
  moment:   4500,
  platform: 4000,
  friction: 4500,
  privacy:  4500,
  speed:    5500,
  diff:     5500,
  closer:   6000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0b0d12] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AnimatePresence initial={false} mode="wait">
        {currentScene === 0  && <Scene1  key="hook" />}
        {currentScene === 1  && <Scene2  key="problem" />}
        {currentScene === 2  && <Scene3  key="solution" />}
        {currentScene === 3  && <Scene4  key="transfer" />}
        {currentScene === 4  && <Scene5  key="content" />}
        {currentScene === 5  && <Scene6  key="moment" />}
        {currentScene === 6  && <Scene7  key="platform" />}
        {currentScene === 7  && <Scene8  key="friction" />}
        {currentScene === 8  && <Scene9  key="privacy" />}
        {currentScene === 9  && <Scene10 key="speed" />}
        {currentScene === 10 && <Scene11 key="diff" />}
        {currentScene === 11 && <Scene12 key="closer" />}
      </AnimatePresence>

      {/* Cinematic vignette only — no flash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 49,
          background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      {/* Safe-area frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 50, boxShadow: 'inset 0 0 0 2.2vw #0b0d12' }}
      />
    </div>
  );
}
