import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export interface VideoPlayerControls {
  currentScene: number;
  totalScenes: number;
  isPaused: boolean;
  togglePlay: () => void;
  goToScene: (index: number) => void;
  restart: () => void;
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }): VideoPlayerControls {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sceneKeys = useMemo(() => Object.keys(durations), [durations]);
  const totalScenes = sceneKeys.length;
  const recordedOnce = useRef(false);
  // Stable ref so callbacks always see the latest scene without needing it in deps.
  const currentSceneRef = useRef(currentScene);
  currentSceneRef.current = currentScene;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    if (currentScene === 0 && !recordedOnce.current) {
      window.startRecording?.();
    }

    if (isPaused) return;

    const duration = durations[sceneKeys[currentScene]];
    if (!duration) return;

    const timer = setTimeout(() => {
      setCurrentScene((prev) => {
        const next = prev + 1;
        if (next >= sceneKeys.length) {
          if (!recordedOnce.current) {
            window.stopRecording?.();
            recordedOnce.current = true;
          }
          return 0;
        }
        return next;
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [currentScene, isPaused, durations, sceneKeys]);

  const togglePlay = useCallback(() => {
    setIsPaused((v) => !v);
  }, []);

  const goToScene = useCallback((index: number) => {
    if (index < 0 || index >= sceneKeys.length) return;
    setCurrentScene(index);
    // Resume playback when the user jumps to a scene.
    setIsPaused(false);
  }, [sceneKeys.length]);

  const restart = useCallback(() => {
    setCurrentScene(0);
    setIsPaused(false);
  }, []);

  return { currentScene, totalScenes, isPaused, togglePlay, goToScene, restart };
}
