import { useEffect, useRef, useState } from 'react';
import { initFaceLandmarker, detectLipOpennessWithLandmarks, BlowIntensitySmoothing } from '../gesture/lipTracker';

export interface LipTrackingApi {
  intensity: number;
  ready: boolean;
  enabled: boolean;
  landmarks: Array<{ x: number; y: number; z: number }> | null;
}

interface UseLipTrackingArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isRunning: boolean;
  faceLandmarksRef?: React.RefObject<Array<{ x: number; y: number; z: number }> | null>;
  onIntensityChange?: (intensity: number) => void;
  onFaceLatency?: (latency: number) => void;
}

export function useLipTracking({ videoRef, isRunning, faceLandmarksRef, onIntensityChange, onFaceLatency }: UseLipTrackingArgs): LipTrackingApi {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [intensity, setIntensity] = useState(0.5);
  const [landmarks, setLandmarks] = useState<Array<{ x: number; y: number; z: number }> | null>(null);
  
  const smoothingRef = useRef(new BlowIntensitySmoothing());
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef(0);

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

  // Lip tracking loop
  useEffect(() => {
    if (!isRunning || !enabled || !ready) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = (nowMs: number) => {
      rafRef.current = requestAnimationFrame(tick);

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      // Throttle to ~30fps
      if (nowMs - lastTimestampRef.current < 33) return;
      
      // Add small offset to avoid timestamp collision with gesture recognizer
      const faceTs = nowMs + 0.1;
      if (faceTs <= lastTimestampRef.current) return;
      
      lastTimestampRef.current = faceTs;

      const inferenceStart = performance.now();
      const result = detectLipOpennessWithLandmarks(video, faceTs);
      const inferenceEnd = performance.now();
      
      if (result) {
        onFaceLatency?.(inferenceEnd - inferenceStart);
        const smoothed = smoothingRef.current.update(result.intensity);
        setIntensity(smoothed);
        setLandmarks(result.landmarks);
        if (faceLandmarksRef) faceLandmarksRef.current = result.landmarks;
        onIntensityChange?.(smoothed);
      } else {
        const smoothed = smoothingRef.current.update(null);
        setIntensity(smoothed);
        setLandmarks(null);
        if (faceLandmarksRef) faceLandmarksRef.current = null;
        onIntensityChange?.(smoothed);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, enabled, ready, videoRef, onIntensityChange]);

  // Reset on stop
  useEffect(() => {
    if (!isRunning) {
      smoothingRef.current.reset();
      setIntensity(0.5);
      setLandmarks(null);
      onIntensityChange?.(0.5);
    }
  }, [isRunning, onIntensityChange]);

  return {
    intensity,
    ready,
    enabled,
    landmarks,
  };
}
