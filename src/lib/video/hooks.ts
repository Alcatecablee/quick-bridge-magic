import { useState, useEffect, useRef, useMemo } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = useMemo(() => Object.keys(durations), [durations]);
  const recordedOnce = useRef(false);

  useEffect(() => {
    if (currentScene === 0 && !recordedOnce.current) {
      window.startRecording?.();
    }

    const duration = durations[sceneKeys[currentScene]];
    if (!duration) return;

    const timer = setTimeout(() => {
      if (currentScene === sceneKeys.length - 1) {
        if (!recordedOnce.current) {
          window.stopRecording?.();
          recordedOnce.current = true;
        }
        setCurrentScene(0);
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentScene, durations, sceneKeys]);

  return { currentScene };
}
