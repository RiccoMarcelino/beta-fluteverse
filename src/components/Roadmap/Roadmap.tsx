import { useEffect } from 'react';
import { useFlute } from '../../state/FluteContext';

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
      <div
        className="play-back-btn"
        role="button"
        tabIndex={0}
        onClick={closeRoadmap}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeRoadmap(); } }}
      >
        ← BACK
      </div>

      {/* Roadmap content goes here */}
    </div>
  );
}
