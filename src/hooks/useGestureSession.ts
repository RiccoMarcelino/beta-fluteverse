import { useCallback, useEffect, useRef, useState } from 'react';
import type { Swara } from '../types';
import { CONFIDENCE_THRESHOLD, NO_HAND_FRAMES, SWARAS } from '../constants';
import { getRecognizer } from '../gesture/recognizer';
import { drawCameraError, drawFaceMesh, drawHand } from '../gesture/drawHand';
import { useIsMobile } from './useIsMobile';

const makeScores = (): Record<Swara, number> => ({ Sa:0, Re:0, Ga:0, Ma:0, Pa:0, Dha:0, Ni:0 });

export interface GestureSessionArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cooldownMs: number;
  /** A swara became audible — fired once when the first hand starts playing it. */
  onSwaraStart(swara: Swara): void;
  /** A swara went silent — fired once when the last hand playing it stops. */
  onSwaraEnd(swara: Swara): void;
  /** The full set of swaras currently held across all hands (for UI highlight). */
  onActiveChange(active: Swara[]): void;
  onAllRelease(): void;
  onScores(scores: Record<Swara, number>, noneScore: number): void;
  onHandPresence(hasHand: boolean): void;
  /** Number of hands currently detected (0, 1 or 2). */
  onHandCount?(count: number): void;
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
  const noHandFramesRef = useRef(0);

  // Per-hand committed swara + cooldown, keyed by MediaPipe handedness ("Left"/"Right").
  const handStatesRef = useRef<Map<string, { swara: Swara | null; lastTrigger: number }>>(new Map());
  // Swaras currently sounding (the union across hands, deduped) — the audio truth.
  const soundingRef = useRef<Set<Swara>>(new Set());

  // Reconcile the desired set of held swaras (union across hands) against what is
  // currently sounding, firing start/end exactly once per swara. Dedupes the case
  // where both hands play the same swara → one note.
  const reconcile = useCallback((desired: Set<Swara>) => {
    for (const s of desired) {
      if (!soundingRef.current.has(s)) {
        soundingRef.current.add(s);
        cbRef.current.onSwaraStart(s);
      }
    }
    for (const s of [...soundingRef.current]) {
      if (!desired.has(s)) {
        soundingRef.current.delete(s);
        cbRef.current.onSwaraEnd(s);
      }
    }
    cbRef.current.onActiveChange([...soundingRef.current]);
  }, []);

  const resetHands = useCallback(() => {
    handStatesRef.current.clear();
    if (soundingRef.current.size > 0) {
      soundingRef.current.clear();
      cbRef.current.onAllRelease();
    }
    cbRef.current.onActiveChange([]);
  }, []);

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
      cbRef.current.onHandCount?.(results.landmarks.length);

      // Draw face mesh first (underneath hand skeletons), then every detected hand.
      const faceLm = cbRef.current.faceLandmarksRef?.current;
      if (faceLm) drawFaceMesh(canvas, faceLm);
      for (const hand of results.landmarks) drawHand(canvas, hand);

      const now = Date.now();
      const scores = makeScores();   // max confidence per swara across hands
      let minNone = 1;               // silence only when *every* hand is idle
      const presentKeys = new Set<string>();

      for (let h = 0; h < results.landmarks.length; h++) {
        // Stable per-hand key from handedness; fall back to index, and de-collide
        // if the model reports the same handedness for both hands in one frame.
        let key = results.handedness?.[h]?.[0]?.categoryName ?? `hand${h}`;
        if (presentKeys.has(key)) key = `${key}#${h}`;
        presentKeys.add(key);

        let state = handStatesRef.current.get(key);
        if (!state) { state = { swara: null, lastTrigger: 0 }; handStatesRef.current.set(key, state); }

        const gestures = results.gestures[h] ?? [];
        let handNone = 0;
        for (const g of gestures) {
          if (g.categoryName === 'None') {
            handNone = g.score;
          } else if (g.categoryName in scores) {
            scores[g.categoryName as Swara] = Math.max(scores[g.categoryName as Swara], g.score);
          }
        }
        minNone = Math.min(minNone, handNone);

        if (gestures.length > 0) {
          const top = gestures[0];
          const label = top.categoryName;
          // If None is the top result OR competes significantly, this hand is silent
          const noneIsTop = label === 'None' && top.score >= CONFIDENCE_THRESHOLD;
          const noneIsSignificant = handNone >= 0.30;

          if (noneIsTop || noneIsSignificant) {
            state.swara = null;
          } else {
            const swaraLabel = label as Swara;
            if (
              top.score >= CONFIDENCE_THRESHOLD &&
              SWARAS.includes(swaraLabel) &&
              swaraLabel !== state.swara &&
              now - state.lastTrigger >= cbRef.current.cooldownMs
            ) {
              state.swara = swaraLabel;
              state.lastTrigger = now;
            }
            // otherwise hold the hand's current swara (sustain)
          }
        }
      }

      // Drop state for hands that left the frame this tick.
      for (const key of [...handStatesRef.current.keys()]) {
        if (!presentKeys.has(key)) handStatesRef.current.delete(key);
      }

      // The set of swaras held across all hands (deduped) is the audio truth.
      const desired = new Set<Swara>();
      for (const state of handStatesRef.current.values()) {
        if (state.swara) desired.add(state.swara);
      }

      cbRef.current.onScores(scores, desired.size > 0 ? 0 : minNone);
      reconcile(desired);
    } else {
      noHandFramesRef.current += 1;
      // Still draw face mesh even when no hand present
      const faceLm = cbRef.current.faceLandmarksRef?.current;
      if (faceLm && canvas) drawFaceMesh(canvas, faceLm);
      if (noHandFramesRef.current >= NO_HAND_FRAMES) {
        cbRef.current.onHandPresence(false);
        cbRef.current.onHandCount?.(0);
        resetHands();
      }
    }
  }, [reconcile, resetHands]);

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
      handStatesRef.current.clear();
      soundingRef.current.clear();
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
    handStatesRef.current.clear();
    soundingRef.current.clear();
    cbRef.current.onActiveChange([]);
    noHandFramesRef.current = 0;
    cbRef.current.onScores(makeScores(), 0);
    cbRef.current.onHandPresence(false);
    cbRef.current.onHandCount?.(0);
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
