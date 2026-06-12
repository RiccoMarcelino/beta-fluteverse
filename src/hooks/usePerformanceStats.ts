import { useEffect, useRef, useState } from 'react';

export interface PerformanceMetrics {
  fps: number;
  gestureLatency: number;
  faceLatency: number;
  gestureDevice: 'CPU' | 'GPU' | 'unknown';
  faceDevice: 'CPU' | 'GPU' | 'unknown';
}

export function usePerformanceStats(isRunning: boolean) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    gestureLatency: 0,
    faceLatency: 0,
    gestureDevice: 'unknown',
    faceDevice: 'unknown',
  });

  const frameTimesRef = useRef<number[]>([]);
  const gestureTimesRef = useRef<number[]>([]);
  const faceTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  // FPS calculation
  useEffect(() => {
    if (!isRunning) {
      setMetrics({
        fps: 0,
        gestureLatency: 0,
        faceLatency: 0,
        gestureDevice: 'unknown',
        faceDevice: 'unknown',
      });
      frameTimesRef.current = [];
      gestureTimesRef.current = [];
      faceTimesRef.current = [];
      return;
    }

    let rafId: number;
    const tick = (now: number) => {
      if (lastFrameTimeRef.current > 0) {
        const frameDelta = now - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameDelta);
        
        // Keep only last 30 frames for FPS calculation
        if (frameTimesRef.current.length > 30) {
          frameTimesRef.current.shift();
        }

        // Calculate average FPS
        if (frameTimesRef.current.length > 0) {
          const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const fps = 1000 / avgFrameTime;

          // Calculate average latencies
          const avgGestureLatency = gestureTimesRef.current.length > 0
            ? gestureTimesRef.current.reduce((a, b) => a + b, 0) / gestureTimesRef.current.length
            : 0;

          const avgFaceLatency = faceTimesRef.current.length > 0
            ? faceTimesRef.current.reduce((a, b) => a + b, 0) / faceTimesRef.current.length
            : 0;

          setMetrics(prev => ({
            ...prev,
            fps,
            gestureLatency: avgGestureLatency,
            faceLatency: avgFaceLatency,
          }));
        }
      }
      lastFrameTimeRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning]);

  const recordGestureLatency = (latency: number) => {
    gestureTimesRef.current.push(latency);
    if (gestureTimesRef.current.length > 30) {
      gestureTimesRef.current.shift();
    }
  };

  const recordFaceLatency = (latency: number) => {
    faceTimesRef.current.push(latency);
    if (faceTimesRef.current.length > 30) {
      faceTimesRef.current.shift();
    }
  };

  const setGestureDevice = (device: 'CPU' | 'GPU') => {
    setMetrics(prev => ({ ...prev, gestureDevice: device }));
  };

  const setFaceDevice = (device: 'CPU' | 'GPU') => {
    setMetrics(prev => ({ ...prev, faceDevice: device }));
  };

  return {
    metrics,
    recordGestureLatency,
    recordFaceLatency,
    setGestureDevice,
    setFaceDevice,
  };
}
