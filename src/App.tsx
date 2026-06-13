import { useEffect, useRef, useState } from 'react';
import { Carousel } from './components/Carousel/Carousel';
import { Hero } from './components/Hero/Hero';
import { Loader } from './components/Loader';
import { AudioModeModal } from './components/Play/AudioModeModal';
import { PlayOverlay } from './components/Play/PlayOverlay';
import { Roadmap } from './components/Roadmap/Roadmap';
import { Topbar } from './components/Topbar';
import { ToastProvider } from './components/ui/Toast';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useHorizontalScroll } from './hooks/useHorizontalScroll';
import { useIsMobile } from './hooks/useIsMobile';
import { getRecognizer } from './gesture/recognizer';
import { FluteProvider, useFlute } from './state/FluteContext';

function RoadmapLink() {
  const { openRoadmap } = useFlute();
  return (
    <button
      type="button"
      className="roadmap-link"
      onClick={openRoadmap}
      aria-label="Open roadmap"
    >
      ROADMAP
    </button>
  );
}

const LOADER_HIDE_DELAY = 900;
const LOADER_FADE_DURATION = 800;

function Shell() {
  const audio = useAudioEngine('synthetic');
  const isMobile = useIsMobile();
  const [bootDone, setBootDone] = useState(false);
  const [uiReady, setUiReady] = useState(false);
  const { pendingKey, confirmPlay, cancelPending } = useFlute();

  // Boot: warm up gesture model in background (so first START is fast)
  useEffect(() => {
    let cancelled = false;
    getRecognizer().catch(err => console.warn('Gesture init failed:', err));
    audio
      ? Promise.resolve(audio.ready).then(() => { if (!cancelled) setBootDone(true); })
      : setBootDone(true);
    const t = window.setTimeout(() => setBootDone(true), 6000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [audio]);

  useEffect(() => {
    if (audio.ready) setBootDone(true);
  }, [audio.ready]);

  // Mount the main UI only after the loader has fully faded out, so the
  // loader's centered "FLUTEVERSE" doesn't visually overlap the topbar's
  // fuzzy-text "FLUTEVERSE" during the crossfade.
  useEffect(() => {
    if (!bootDone) return;
    const t = window.setTimeout(
      () => setUiReady(true),
      LOADER_HIDE_DELAY + LOADER_FADE_DURATION
    );
    return () => window.clearTimeout(t);
  }, [bootDone]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const { scrollToSection } = useHorizontalScroll({
    containerRef,
    trackRef,
    thumbRef,
    enabled: !isMobile,
    sectionCount: 2,
  });

  return (
    <>
      <Loader done={bootDone} />

      <div className="grain" aria-hidden="true" />

      <div className="horizontal-container" ref={containerRef}>
        <div className="horizontal-track">
          <Hero />
          <Carousel />
        </div>
      </div>

      {uiReady && (
        <Topbar
          onBrandClick={() => scrollToSection('hero')}
          onNavClick={id => scrollToSection(id)}
        />
      )}

      {uiReady && <RoadmapLink />}

      <Roadmap />

      <PlayOverlay />

      <AudioModeModal
        fluteKey={pendingKey}
        onConfirm={confirmPlay}
        onCancel={cancelPending}
      />

      {!isMobile && (
        <div id="custom-scrollbar" aria-hidden="true">
          <div id="scrollbar-hint">SCROLL HORIZONTALLY</div>
          <div id="scrollbar-track" ref={trackRef}>
            <div id="scrollbar-thumb" ref={thumbRef} />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <FluteProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </FluteProvider>
  );
}
