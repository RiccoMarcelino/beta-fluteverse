import { useEffect } from 'react';
import { ROADMAP_FEATURES } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import { FloatingLines } from './FloatingLines';

export function Roadmap() {
  const { roadmapOpen, closeRoadmap } = useFlute();

  // Escape closes the overlay (matches PlayOverlay's pattern)
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
        <FloatingLines />
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

      <div className="roadmap-content">
        <div className="roadmap-header">
          <h2 className="roadmap-kicker">WHAT'S NEXT</h2>
          <h1 className="roadmap-title">ROADMAP</h1>
          <p className="roadmap-subtitle">
            Every gesture is just the beginning. Here's what we're building next.
          </p>
        </div>
        <div className="roadmap-rail" id="roadmapRail">
          {ROADMAP_FEATURES.map(f => (
            <div className="feature-item" key={f.id}>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
