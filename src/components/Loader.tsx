import { useCallback, useEffect, useState } from 'react';
import TextType from './ui/TextType';

const STAGES: Array<{ pct: number; label: string }> = [
  { pct: 10, label: 'DOM ready' },
  { pct: 22, label: 'Fonts resolved' },
  { pct: 38, label: 'Booting gesture engine' },
  { pct: 55, label: 'MediaPipe tasks-vision loaded' },
  { pct: 70, label: 'Gesture model ready' },
  { pct: 82, label: 'Decoding swaras' },
  { pct: 92, label: 'Warming up audio' },
];

const HIDE_DELAY = 900;          // ms held at 100% before fade-out begins
const FADE_DURATION = 800;       // matches #loader opacity transition in CSS

interface Props {
  done: boolean;
}

export function Loader({ done }: Props) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  const handleSentenceComplete = useCallback((_sentence: string, index: number) => {
    const stage = STAGES[index];
    if (!stage) return;
    setProgress(prev => Math.max(prev, stage.pct));
  }, []);

  useEffect(() => {
    if (!done) return;
    setProgress(100);
    const t = window.setTimeout(() => setHidden(true), HIDE_DELAY);
    return () => window.clearTimeout(t);
  }, [done]);

  const labels = STAGES.map(s => s.label);
  const statusText = done ? ['Ready'] : labels;

  return (
    <div
      id="loader"
      className={hidden ? 'hidden' : ''}
      aria-live="polite"
      aria-label="Loading FluteVerse"
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
    >
      <div className="loader-inner">
        <div className="loader-title">FLUTEVERSE</div>
        <div className="status-text">
          <TextType
            as="span"
            text={statusText}
            typingSpeed={95}
            deletingSpeed={55}
            pauseDuration={1400}
            initialDelay={250}
            loop={!done}
            showCursor
            cursorCharacter="|"
            cursorClassName="loader-cursor"
            cursorBlinkDuration={0.9}
            onSentenceComplete={handleSentenceComplete}
          />
        </div>
        <div className="bar">
          <div
            className="bar-fill"
            style={{ ['--progress' as string]: `${progress}%` } as React.CSSProperties}
          />
        </div>
        <span className="bar-pct">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
