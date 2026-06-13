import { useEffect } from 'react';
import { ROADMAP_FEATURES } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import BlurText from '../ui/BlurText';
import TextType from '../ui/TextType';
import TextPressure from '../ui/TextPressure';
import { FloatingLines } from './FloatingLines';

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
          <div className="roadmap-title" aria-label="ROADMAP" role="heading" aria-level={1}>
            <TextPressure
              text="ROADMAP"
              flex
              width
              weight
              italic
              alpha={false}
              stroke={false}
              scale={false}
              textColor="#F0EBE0"
              minFontSize={48}
            />
          </div>
          <TextType
            key={roadmapOpen ? 'open' : 'closed'}
            as="p"
            className="roadmap-lede"
            text="Every gesture is just the beginning. Here's what we're building next."
            typingSpeed={32}
            initialDelay={350}
            loop={false}
            showCursor
            cursorCharacter="|"
          />
        </header>

        <ol className="roadmap-list" key={roadmapOpen ? 'open' : 'closed'}>
          {ROADMAP_FEATURES.map((f, i) => (
            <li className="roadmap-item" key={f.id}>
              <span className="roadmap-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="roadmap-body">
                <BlurText
                  as="h3"
                  text={f.title}
                  className="roadmap-item-title"
                  animateBy="letters"
                  direction="top"
                  delay={28}
                  stepDuration={0.4}
                />
                <BlurText
                  text={f.desc}
                  className="roadmap-item-desc"
                  animateBy="words"
                  direction="bottom"
                  delay={40}
                  stepDuration={0.35}
                />
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
