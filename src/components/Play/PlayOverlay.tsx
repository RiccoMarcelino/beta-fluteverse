import { useCallback, useEffect, useRef, useState } from 'react';
import type { Swara } from '../../types';
import { useFlute } from '../../state/FluteContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useGestureSession } from '../../hooks/useGestureSession';
import { useLipTracking } from '../../hooks/useLipTracking';
import { usePerformanceStats } from '../../hooks/usePerformanceStats';
import { MobileGate } from '../MobileGate';
import { GradientText } from '../ui/GradientText';
import DecryptedText from '../ui/DecryptedText';
import { ConfidencePanel } from './ConfidencePanel';
import { ControlsRow } from './ControlsRow';
import { GestureCanvas } from './GestureCanvas';
import { SideRays } from './SideRays';
import { SwaraStrip } from './SwaraStrip';

const EMPTY_SCORES: Record<Swara, number> = { Sa:0, Re:0, Ga:0, Ma:0, Pa:0, Dha:0, Ni:0 };

export function PlayOverlay() {
  const { selected, playOpen, closePlay, audioMode } = useFlute();
  const audio = useAudioEngine(audioMode);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scores, setScores] = useState<Record<Swara, number>>(EMPTY_SCORES);
  const [noneScore, setNoneScore] = useState(0);
  const [topSwara, setTopSwara] = useState<Swara | null>(null);
  const [activeSwara, setActiveSwara] = useState<Swara | null>(null);
  const [cooldownMs, setCooldownMs] = useState(300);
  const [hasHand, setHasHand] = useState(false);
  const fluteRef = useRef(selected);
  fluteRef.current = selected;

  // Shared ref for face landmarks — written by lip tracker, read by gesture tick
  const faceLandmarksRef = useRef<Array<{ x: number; y: number; z: number }> | null>(null);

  // Video ref for lip tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const session = useGestureSession({
    canvasRef,
    cooldownMs,
    faceLandmarksRef,
    onSwaraStart(swara) {
      setActiveSwara(swara);
      audio.trigger(fluteRef.current, swara);
    },
    onSwaraEnd(swara) {
      audio.release(fluteRef.current, swara);
    },
    onAllRelease() {
      audio.releaseAll();
      setActiveSwara(null);
    },
    onScores(s, none) {
      setScores(s);
      setNoneScore(Math.round(none * 100));
      let max: Swara | null = null;
      let maxVal = 0;
      (Object.entries(s) as [Swara, number][]).forEach(([k, v]) => {
        if (v > maxVal) { maxVal = v; max = k; }
      });
      setTopSwara(maxVal > 0 ? max : null);
    },
    onHandPresence: setHasHand,
    onGestureLatency: (latency) => {
      performanceStats.recordGestureLatency(latency);
    },
  });

  // Performance monitoring
  const performanceStats = usePerformanceStats(session.isRunning);

  // Update video ref when session has video
  useEffect(() => {
    videoRef.current = session.videoElement;
  }, [session.videoElement]);

  // Update performance tracking when session state changes
  useEffect(() => {
    if (session.isRunning) {
      performanceStats.setGestureDevice('GPU'); // Assuming GPU for gesture
      performanceStats.setFaceDevice('GPU'); // Assuming GPU for face
    }
  }, [session.isRunning, performanceStats]);

  // Lip tracking for blow intensity — writes face landmarks to shared ref for rendering
  const lipTracking = useLipTracking({
    videoRef,
    isRunning: session.isRunning,
    faceLandmarksRef,
    onIntensityChange: (intensity) => {
      audio.setBlowIntensity(intensity);
    },
    onFaceLatency: (latency) => {
      performanceStats.recordFaceLatency(latency);
    },
  });

  const handleStartStop = useCallback(async () => {
    if (session.isRunning) {
      session.stop();
      return;
    }
    try {
      await audio.start();
      await session.start();
    } catch (err) {
      console.error(err);
    }
  }, [session, audio]);

  // Stop session when overlay closes
  useEffect(() => {
    if (!playOpen && session.isRunning) {
      session.stop();
    }
  }, [playOpen, session]);

  // ESC + swipe-down to close
  useEffect(() => {
    if (!playOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePlay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playOpen, closePlay]);

  const showPrompt = !hasHand;
  const prompt = session.isRunning
    ? { line1: 'RAISE YOUR HAND' }
    : { line1: 'CLICK START', line2: '& RAISE YOUR HAND' };

  const sub = `GESTURE MODE — ${selected} MAJOR SCALE`;

  return (
    <div id="play-overlay" className={playOpen ? 'visible' : ''} role="main" aria-label="Play page">
      <MobileGate>
        <SideRays active={playOpen} />
      </MobileGate>

      <div
        className="play-back-btn"
        role="button"
        tabIndex={0}
        onClick={closePlay}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closePlay(); } }}
      >
        ← BACK
      </div>

      <div className="play-header">
        <span className="play-title">
          <GradientText colors={['#ffffff', '#00FFE0', '#a0a0a0', '#ffffff']} speed={4}>
            {selected} FLUTE
          </GradientText>
        </span>
        <span className="play-subtitle">
          <DecryptedText
            text={sub}
            animateOn="view"
            sequential={true}
            revealDirection="center"
            speed={30}
            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*—"
            className="dt-revealed"
            encryptedClassName="dt-encrypted"
          />
        </span>
      </div>

      <div className="play-grid">
        <GestureCanvas
          ref={canvasRef}
          showPrompt={showPrompt}
          promptLine1={prompt.line1}
          promptLine2={prompt.line2}
          performanceMetrics={performanceStats.metrics}
          showPerformance={session.isRunning}
        />
        <ConfidencePanel scores={scores} top={topSwara} noneScore={noneScore} />
      </div>

      <ControlsRow
        isRunning={session.isRunning}
        audioReady={audio.ready}
        cooldownMs={cooldownMs}
        onCooldownChange={setCooldownMs}
        onStartStop={handleStartStop}
        activeSwara={activeSwara}
        flute={selected}
        blowIntensity={lipTracking.intensity}
        blowEnabled={lipTracking.enabled}
      />

      <SwaraStrip active={activeSwara} noneActive={!activeSwara && noneScore > 50} />
    </div>
  );
}
