import { useCallback, useEffect, useRef, useState } from 'react';
import type { Swara } from '../types';
import { CONFIDENCE_THRESHOLD, NO_HAND_FRAMES, SWARAS } from '../constants';
import { getRecognizer } from '../gesture/recognizer';
import { drawCameraError, drawFaceMesh, drawHand } from '../gesture/drawHand';
import { useIsMobile } from './useIsMobile';

export interface GestureSessionArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cooldownMs: number;
  onSwaraStart(swara: Swara): void;
  onSwaraEnd(swara: Swara): void;
  onAllRelease(): void;
  onScores(scores: Record<Swara, number>, noneScore: number): void;
  onHandPresence(hasHand: boolean): void;
  onGestureLatency?(latency: number): void;
  /** Latest face landmarks from lip tracker — drawn each frame after the hand */
  faceLandmarksRef?: React.RefObject<Array<{ x: number; y: number; z: number }> | null>;
}

export interface GestureSessionApi {
  isRunning: boolean;
  start(): Promise<void>;
  stop(): void;
  error: string | null;
  videoElement: HTMLVideoElement | null;
}

export function useGestureSession(args: GestureSessionArgs): GestureSessionApi {
  const isMobile = useIsMobile();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastInferenceRef = useRef(0);
  const lastTriggerRef = useRef(0);
  const lastSwaraRef = useRef<Swara | null>(null);
  const noHandFramesRef = useRef(0);

  // Stable refs for the latest callbacks
  const cbRef = useRef(args);
  cbRef.current = args;

  const tick = useCallback((nowMs: number) => {
    rafRef.current = requestAnimationFrame(tick);
    if (!runningRef.current) return;

    if (nowMs - lastInferenceRef.current < 33) return;
    lastInferenceRef.current = nowMs;

    const canvas = cbRef.current.canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const recognizer = recognizerRef.current;
    if (!recognizer) return;
    
    const inferenceStart = performance.now();
    const results = recognizer.recognizeForVideo(video, nowMs);
    const inferenceEnd = performance.now();
    
    cbRef.current.onGestureLatency?.(inferenceEnd - inferenceStart);

    if (results.landmarks && results.landmarks.length > 0) {
      noHandFramesRef.current = 0;
      cbRef.current.onHandPresence(true);
      // Draw face mesh first (underneath hand skeleton)
      const faceLm = cbRef.current.faceLandmarksRef?.current;
      if (faceLm) drawFaceMesh(canvas, faceLm);
      drawHand(canvas, results.landmarks[0]);

      const scores: Record<Swara, number> = { Sa:0, Re:0, Ga:0, Ma:0, Pa:0, Dha:0, Ni:0 };
      let noneScore = 0;
      if (results.gestures.length > 0) {
        for (const g of results.gestures[0]) {
          if (g.categoryName === 'None') {
            noneScore = g.score;
          } else if (g.categoryName in scores) {
            scores[g.categoryName as Swara] = g.score;
          }
        }
      }
      cbRef.current.onScores(scores, noneScore);

      if (results.gestures.length > 0 && results.gestures[0].length > 0) {
        const top = results.gestures[0][0];
        const label = top.categoryName;

        // If None is the top result OR has significant score, treat as silence
        const noneIsTop = label === 'None' && top.score >= CONFIDENCE_THRESHOLD;
        const noneIsSignificant = noneScore >= 0.30; // None competing = ambiguous = silence

        if (noneIsTop || noneIsSignificant) {
          if (lastSwaraRef.current) {
            cbRef.current.onAllRelease();
            lastSwaraRef.current = null;
          }
        } else {
          const swaraLabel = label as Swara;
          const now = Date.now();
          if (
            top.score >= CONFIDENCE_THRESHOLD &&
            SWARAS.includes(swaraLabel) &&
            swaraLabel !== lastSwaraRef.current &&
            now - lastTriggerRef.current >= cbRef.current.cooldownMs
          ) {
            const prev = lastSwaraRef.current;
            if (prev) cbRef.current.onSwaraEnd(prev);
            lastSwaraRef.current = swaraLabel;
            lastTriggerRef.current = now;
            cbRef.current.onSwaraStart(swaraLabel);
          }
        }
      }
    } else {
      noHandFramesRef.current += 1;
      // Still draw face mesh even when no hand present
      const faceLm = cbRef.current.faceLandmarksRef?.current;
      if (faceLm && canvas) drawFaceMesh(canvas, faceLm);
      if (noHandFramesRef.current >= NO_HAND_FRAMES) {
        cbRef.current.onHandPresence(false);
        if (lastSwaraRef.current) {
          cbRef.current.onAllRelease();
          lastSwaraRef.current = null;
        }
      }
    }
  }, []);

  const recognizerRef = useRef<Awaited<ReturnType<typeof getRecognizer>> | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      if (!recognizerRef.current) {
        recognizerRef.current = await getRecognizer();
      }

      const videoConstraints: MediaTrackConstraints = isMobile
        ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      streamRef.current = stream;

      let video = videoRef.current;
      if (!video) {
        video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        videoRef.current = video;
      }
      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        if (!video) return reject(new Error('no video element'));
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('video error'));
      });
      await video.play();

      noHandFramesRef.current = 0;
      lastSwaraRef.current = null;
      lastTriggerRef.current = 0;
      runningRef.current = true;
      setIsRunning(true);
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      const canvas = cbRef.current.canvasRef.current;
      if (canvas) drawCameraError(canvas);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [isMobile, tick]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cbRef.current.onAllRelease();
    lastSwaraRef.current = null;
    noHandFramesRef.current = 0;
    cbRef.current.onScores({ Sa:0, Re:0, Ga:0, Ma:0, Pa:0, Dha:0, Ni:0 }, 0);
    cbRef.current.onHandPresence(false);
    const canvas = cbRef.current.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { isRunning, start, stop, error, videoElement: videoRef.current };
}
