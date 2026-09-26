import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initFaceLandmarker,
  detectLipOpennessWithLandmarks,
  resetLipTracker,
  BlowIntensitySmoothing,
} from '../gesture/lipTracker';

export interface LipTrackingApi {
  intensity: number;
  ready: boolean;
  enabled: boolean;
  processFrame(video: HTMLVideoElement, nowMs: number): void;
  reset(): void;
}

interface UseLipTrackingArgs {
  faceLandmarksRef?: React.RefObject<Array<{ x: number; y: number; z: number }> | null>;
  onIntensityChange?: (intensity: number) => void;
  onFaceLatency?: (latency: number) => void;
}

export function useLipTracking({
  faceLandmarksRef,
  onIntensityChange,
  onFaceLatency,
}: UseLipTrackingArgs): LipTrackingApi {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [intensity, setIntensity] = useState(0.5);

  const smoothingRef = useRef(new BlowIntensitySmoothing());
  const missedFramesRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const lastIntensityRef = useRef(0.5);

  // Initialize face landmarker on mount
  useEffect(() => {
    let cancelled = false;

    initFaceLandmarker().then((landmarker) => {
      if (cancelled) return;
      setReady(true);
      setEnabled(landmarker !== null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => {
    smoothingRef.current.reset();
    missedFramesRef.current = 0;
    resetLipTracker();
    setIntensity(0.5);
    lastIntensityRef.current = 0.5;
    if (faceLandmarksRef) faceLandmarksRef.current = null;
    onIntensityChange?.(0.5);
  }, [faceLandmarksRef, onIntensityChange]);

  const processFrame = useCallback(
    (video: HTMLVideoElement, nowMs: number) => {
      if (!enabled || !ready) return;

      const inferenceStart = performance.now();
      const result = detectLipOpennessWithLandmarks(video, nowMs);
      const inferenceEnd = performance.now();

      if (result) {
        missedFramesRef.current = 0;
        onFaceLatency?.(inferenceEnd - inferenceStart);
        const smoothed = smoothingRef.current.update(result.intensity);

        // Update audio engine immediately without React render delay
        onIntensityChange?.(smoothed);

        if (faceLandmarksRef) {
          faceLandmarksRef.current = result.landmarks;
        }

        // Throttle React state update to avoid re-rendering entire tree every frame
        const now = performance.now();
        if (
          Math.abs(smoothed - lastIntensityRef.current) >= 0.02 ||
          now - lastUiUpdateRef.current >= 100
        ) {
          lastIntensityRef.current = smoothed;
          lastUiUpdateRef.current = now;
          setIntensity(smoothed);
        }
      } else {
        missedFramesRef.current += 1;
        const smoothed = smoothingRef.current.update(null);
        onIntensityChange?.(smoothed);

        // Only clear landmarks after 10 consecutive missed frames to avoid mesh flicker
        if (missedFramesRef.current > 10) {
          if (faceLandmarksRef) faceLandmarksRef.current = null;
        }

        const now = performance.now();
        if (
          Math.abs(smoothed - lastIntensityRef.current) >= 0.02 ||
          now - lastUiUpdateRef.current >= 100
        ) {
          lastIntensityRef.current = smoothed;
          lastUiUpdateRef.current = now;
          setIntensity(smoothed);
        }
      }
    },
    [enabled, ready, onFaceLatency, onIntensityChange, faceLandmarksRef],
  );

  return {
    intensity,
    ready,
    enabled,
    processFrame,
    reset,
  };
}
