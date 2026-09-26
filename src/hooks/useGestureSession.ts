import { useCallback, useEffect, useRef, useState } from 'react';
import type { Swara } from '../types';
import { CONFIDENCE_THRESHOLD, NO_HAND_FRAMES, SWARAS } from '../constants';
import { getRecognizer } from '../gesture/recognizer';
import { drawCameraError, drawFaceMesh, drawHand, type Landmark } from '../gesture/drawHand';
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
  /** Lip tracking frame processor callback */
  onLipProcess?(video: HTMLVideoElement, nowMs: number): void;
  onLipReset?(): void;
}

export interface GestureSessionApi {
  isRunning: boolean;
  start(): Promise<void>;
  stop(): void;
  error: string | null;
}

export function useGestureSession(args: GestureSessionArgs): GestureSessionApi {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastInferenceRef = useRef(0);
  const lastFaceInferenceRef = useRef(0);
  const lastTriggerRef = useRef(0);
  const lastSwaraRef = useRef<Swara | null>(null);
  const noHandFramesRef = useRef(0);
  const lastHandLandmarksRef = useRef<Landmark[] | null>(null);

  // Stable refs for the latest callbacks
  const cbRef = useRef(args);
  cbRef.current = args;

  const recognizerRef = useRef<Awaited<ReturnType<typeof getRecognizer>> | null>(null);

  const tick = useCallback((nowMs: number) => {
    rafRef.current = requestAnimationFrame(tick);
    if (!runningRef.current) return;

    const canvas = cbRef.current.canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Staggered model inference scheduling:
    // Hand gesture recognition target: ~30 FPS (every 33ms)
    // Face / Lip tracking target: ~15 FPS (every 66ms)
    const gestureDue = nowMs - lastInferenceRef.current >= 33;
    const faceDue = nowMs - lastFaceInferenceRef.current >= 66;

    let ranGesture = false;

    if (gestureDue) {
      lastInferenceRef.current = nowMs;
      ranGesture = true;

      const recognizer = recognizerRef.current;
      if (recognizer) {
        const inferenceStart = performance.now();
        const results = recognizer.recognizeForVideo(video, nowMs);
        const inferenceEnd = performance.now();
        cbRef.current.onGestureLatency?.(inferenceEnd - inferenceStart);

        if (results.landmarks && results.landmarks.length > 0) {
          noHandFramesRef.current = 0;
          lastHandLandmarksRef.current = results.landmarks[0] as Landmark[];
          cbRef.current.onHandPresence(true);

          const scores: Record<Swara, number> = { Sa: 0, Re: 0, Ga: 0, Ma: 0, Pa: 0, Dha: 0, Ni: 0 };
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
            const noneIsSignificant = noneScore >= 0.3; // None competing = ambiguous = silence

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
          if (noHandFramesRef.current >= NO_HAND_FRAMES) {
            lastHandLandmarksRef.current = null;
            cbRef.current.onHandPresence(false);
            if (lastSwaraRef.current) {
              cbRef.current.onAllRelease();
              lastSwaraRef.current = null;
            }
          }
        }
      }
    }

    // Only run face detection on ticks where gesture did NOT run,
    // ensuring both models never compete on the same frame.
    if (!ranGesture && faceDue && cbRef.current.onLipProcess) {
      lastFaceInferenceRef.current = nowMs;
      cbRef.current.onLipProcess(video, nowMs);
    }

    // Draw face mesh underneath hand skeleton
    const faceLm = cbRef.current.faceLandmarksRef?.current;
    if (faceLm) {
      drawFaceMesh(canvas, faceLm);
    }

    // Draw hand skeleton
    if (lastHandLandmarksRef.current) {
      drawHand(canvas, lastHandLandmarksRef.current);
    }
  }, []);

  const isMobile = useIsMobile();

  const start = useCallback(async () => {
    setError(null);
    try {
      // Soft constraints only: ideal allows downscaling without throwing OverconstrainedError on portrait/unusual sensors
      const videoConstraints: MediaTrackConstraints = isMobile
        ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' };

      // 1. Immediately request camera access on user gesture turn so the browser's permission prompt appears instantly!
      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      // 2. Concurrently ensure recognizer is loaded
      const recognizerPromise = recognizerRef.current
        ? Promise.resolve(recognizerRef.current)
        : getRecognizer().then((r) => {
            recognizerRef.current = r;
            return r;
          });

      const stream = await streamPromise;
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

      await recognizerPromise;

      noHandFramesRef.current = 0;
      lastSwaraRef.current = null;
      lastHandLandmarksRef.current = null;
      lastTriggerRef.current = 0;
      lastInferenceRef.current = 0;
      lastFaceInferenceRef.current = 0;
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
  }, [tick]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cbRef.current.onAllRelease();
    cbRef.current.onLipReset?.();
    lastSwaraRef.current = null;
    lastHandLandmarksRef.current = null;
    noHandFramesRef.current = 0;
    cbRef.current.onScores({ Sa: 0, Re: 0, Ga: 0, Ma: 0, Pa: 0, Dha: 0, Ni: 0 }, 0);
    cbRef.current.onHandPresence(false);
    const canvas = cbRef.current.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { isRunning, start, stop, error };
}
