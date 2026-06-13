import { useEffect } from 'react';
import { ROADMAP_FEATURES } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import GradientBlinds from './GradientBlinds';

export function Roadmap() {
  const { roadmapOpen, closeRoadmap } = useFlute();

  useEffect(() => {
    if (!roadmapOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRoadmap(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roadmapOpen, closeRoadmap]);

  return (
    <div
      id="roadmap-overlay"
      className={roadmapOpen ? 'visible' : ''}
      role="main"
      aria-label="Roadmap page"
      aria-hidden={!roadmapOpen}
    >
      <MobileGate>
        <div className="roadmap-bg" aria-hidden="true">
          <GradientBlinds
            gradientColors={['#FF9FFC', '#5227FF']}
            angle={0}
            noise={0.3}
            blindCount={12}
            blindMinWidth={50}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
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
                <p className="roadmap-item-desc">{f.desc}</p>
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
