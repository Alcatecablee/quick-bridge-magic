import { AnimatePresence, motion } from 'framer-motion';
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

const SCENE_LABELS = [
  'Hook',
  'Problem',
  'Solution',
  'Transfer',
  'Content',
  'Moment',
  'Platforms',
  'Friction',
  'Privacy',
  'Speed',
  'Difference',
  'Closer',
];

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export default function VideoTemplate() {
  const { currentScene, totalScenes, isPaused, togglePlay, goToScene, restart } =
    useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0b0d12] text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Scenes */}
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

      {/* Cinematic vignette */}
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

      {/* Playback controls — above safe-area frame (z-51) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-[3.5vw] px-[3vw]"
        style={{ zIndex: 51 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        role="toolbar"
        aria-label="Video playback controls"
      >
        {/* Scene progress dots */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Scenes">
          {Array.from({ length: totalScenes }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentScene}
              aria-label={`Scene ${i + 1}: ${SCENE_LABELS[i] ?? ''}`}
              onClick={() => goToScene(i)}
              className="group relative flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
              style={{ width: i === currentScene ? 20 : 8, height: 8 }}
            >
              <span
                className="block rounded-full transition-all duration-200"
                style={{
                  width: i === currentScene ? 20 : 8,
                  height: 8,
                  backgroundColor: i === currentScene
                    ? 'rgba(255,255,255,0.95)'
                    : i < currentScene
                      ? 'rgba(255,255,255,0.45)'
                      : 'rgba(255,255,255,0.18)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Play/Pause + Restart row */}
        <div className="flex items-center gap-3">
          <button
            onClick={restart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            aria-label="Restart from the beginning"
          >
            <RestartIcon />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </button>

          {/* Scene label */}
          <div
            className="min-w-[4rem] text-center text-[11px] font-medium tracking-wider text-white/40"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentScene + 1} / {totalScenes}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
