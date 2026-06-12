import { useEffect, useRef, useState } from 'react';

/**
 * Loading screen that mirrors the _legacy/script.js behavior:
 *  - bar fill driven by --progress CSS var (so the 500ms cubic-bezier
 *    transition on .bar-fill kicks in instead of snapping)
 *  - status text types in / deletes out character by character
 *  - progress steps through labeled milestones rather than random ticks
 */

const STAGES: Array<{ pct: number; label: string }> = [
  { pct: 10, label: 'DOM ready' },
  { pct: 22, label: 'Fonts resolved' },
  { pct: 38, label: 'Booting gesture engine' },
  { pct: 55, label: 'MediaPipe tasks-vision loaded' },
  { pct: 70, label: 'Gesture model ready' },
  { pct: 82, label: 'Decoding swaras' },
  { pct: 92, label: 'Warming up audio' },
];

const TYPING_SPEED = 38;     // ms per char added
const DELETING_SPEED = 18;   // ms per char removed (faster delete)
const STAGE_INTERVAL = 850;  // ms between staged progress steps
const HIDE_DELAY = 600;      // ms held at 100% before fade-out begins

interface Props {
  done: boolean;
}

export function Loader({ done }: Props) {
  const [progress, setProgress] = useState(0);
  const [targetText, setTargetText] = useState('Waking the instrument');
  const [displayText, setDisplayText] = useState('');
  const [hidden, setHidden] = useState(false);
  const stageIdxRef = useRef(0);

  // Step through staged progress until App reports boot complete
  useEffect(() => {
    if (done) {
      setProgress(100);
      setTargetText('Ready');
      const t = window.setTimeout(() => setHidden(true), HIDE_DELAY);
      return () => window.clearTimeout(t);
    }
    const id = window.setInterval(() => {
      const i = stageIdxRef.current;
      if (i >= STAGES.length) return;
      const stage = STAGES[i];
      setProgress(stage.pct);
      setTargetText(stage.label);
      stageIdxRef.current = i + 1;
    }, STAGE_INTERVAL);
    return () => window.clearInterval(id);
  }, [done]);

  // Typewriter: when targetText changes, delete whatever is currently shown
  // then type the new text character by character. Mirrors the legacy
  // textTyper in _legacy/script.js (lines 375-446).
  useEffect(() => {
    let cancelled = false;
    let current = displayText;
    let timer: number | null = null;

    const stepType = () => {
      if (cancelled) return;
      if (current.length < targetText.length) {
        current = current + targetText[current.length];
        setDisplayText(current);
        timer = window.setTimeout(stepType, TYPING_SPEED);
      }
    };

    const stepDelete = () => {
      if (cancelled) return;
      if (current.length === 0) {
        stepType();
        return;
      }
      current = current.slice(0, -1);
      setDisplayText(current);
      timer = window.setTimeout(stepDelete, DELETING_SPEED);
    };

    if (current === targetText) {
      // already showing the right text — nothing to animate
    } else if (current === '') {
      stepType();
    } else {
      stepDelete();
    }

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
    // displayText intentionally omitted — we read the latest value via closure
    // on each effect re-run (driven by targetText) and self-update via setState,
    // so including it would restart the typewriter on every character tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText]);

  return (
    <div
      id="loader"
      className={hidden ? 'hidden' : ''}
      aria-live="polite"
      aria-label="Loading FluteVerse"
    >
      <div className="loader-inner">
        <div className="loader-title">FLUTEVERSE</div>
        <div className="status-text">
          <span className="status-text__content">{displayText}</span>
          <span className="status-text__cursor">|</span>
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
