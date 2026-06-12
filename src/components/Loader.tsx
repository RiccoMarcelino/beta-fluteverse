import { useEffect, useState } from 'react';

const MESSAGES = [
  'Waking the instrument',
  'Loading flute samples',
  'Tuning the gesture engine',
  'Warming up the audio',
  'Almost ready',
];

interface Props {
  /** When true, the loader fades out. */
  done: boolean;
}

export function Loader({ done }: Props) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (done) {
      setProgress(100);
      return;
    }
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(90, p + Math.random() * 8);
      setProgress(p);
    }, 250);
    const m = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 1500);
    return () => { clearInterval(t); clearInterval(m); };
  }, [done]);

  return (
    <div id="loader" className={done ? 'hidden' : ''} aria-live="polite" aria-label="Loading FluteVerse">
      <div className="loader-inner">
        <div className="loader-title">FLUTEVERSE</div>
        <div className="status-text">
          <span className="status-text__content">{MESSAGES[msgIdx]}</span>
          <span className="status-text__cursor">|</span>
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="bar-pct">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
