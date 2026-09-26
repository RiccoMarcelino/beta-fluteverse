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

function Shell() {
  const audio = useAudioEngine('synthetic');
  const isMobile = useIsMobile();
  const [bootDone, setBootDone] = useState(false);
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

  const [hideAbout, setHideAbout] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const threshold = Math.min(250, window.innerWidth * 0.25);
      const isPast = container.scrollLeft > threshold;
      setHideAbout(prev => (prev !== isPast ? isPast : prev));
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

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

      <Topbar
        onBrandClick={() => scrollToSection('hero')}
        onNavClick={id => scrollToSection(id)}
        hideAbout={hideAbout}
      />

      <RoadmapLink />

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
