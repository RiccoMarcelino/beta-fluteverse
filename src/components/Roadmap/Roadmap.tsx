import { useEffect, useRef } from 'react';
import { ROADMAP_FEATURES } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import ScrollReveal from '../ui/ScrollReveal';
import { FloatingLines } from './FloatingLines';

export function Roadmap() {
  const { roadmapOpen, closeRoadmap } = useFlute();
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roadmapOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRoadmap(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roadmapOpen, closeRoadmap]);

  return (
    <div
      id="roadmap-overlay"
      ref={overlayRef}
      className={roadmapOpen ? 'visible' : ''}
      role="main"
      aria-label="Roadmap page"
      aria-hidden={!roadmapOpen}
    >
      <MobileGate>
        <div className="roadmap-bg" aria-hidden="true">
          <FloatingLines
            linesGradient={['#00FFE0', '#0a3a3a', '#000000']}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[8, 12, 10]}
            lineDistance={[8, 6, 5]}
            bendRadius={5.0}
            bendStrength={-0.5}
            interactive
            parallax
            animationSpeed={1.4}
            mixBlendMode="screen"
          />
        </div>
      </MobileGate>

      <div
        className="play-back-btn"
        role="button"
        tabIndex={0}
        onClick={closeRoadmap}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeRoadmap(); } }}
      >
        ← BACK
      </div>

      <div className="roadmap-page">
        <header className="roadmap-head">
          <span className="roadmap-eyebrow">WHAT&apos;S NEXT</span>
          <h1 className="roadmap-title">ROADMAP</h1>
          <p className="roadmap-lede">
            Every gesture is just the beginning. Here&apos;s what we&apos;re building next.
          </p>
        </header>

        <ol className="roadmap-list">
          {ROADMAP_FEATURES.map((f, i) => (
            <li className="roadmap-item" key={f.id}>
              <span className="roadmap-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="roadmap-body">
                <h3 className="roadmap-item-title">{f.title}</h3>
                <ScrollReveal
                  scrollContainerRef={overlayRef}
                  textClassName="roadmap-item-desc"
                  baseOpacity={0.1}
                  baseRotation={2}
                  blurStrength={6}
                  enableBlur
                >
                  {f.desc}
                </ScrollReveal>
              </div>
            </li>
          ))}
        </ol>

        <footer className="roadmap-foot">
          <span>FLUTEVERSE</span>
          <span>v0 · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
