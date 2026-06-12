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
  });

  return (
    <>
      <Loader done={bootDone} />

      <div className="grain" aria-hidden="true" />

      <div className="horizontal-container" ref={containerRef}>
        <div className="horizontal-track">
          <Hero />
          <Carousel />
          <Roadmap />
        </div>
      </div>

      <Topbar
        onBrandClick={() => scrollToSection('hero')}
        onNavClick={id => scrollToSection(id)}
      />

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
