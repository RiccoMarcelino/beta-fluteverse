import { useEffect, useState } from 'react';

const WORDS = ['SWARS', 'RAGAS', 'TONES', 'NOTES', 'BEATS', 'VIBES'];
const INTERVAL = 2400;

export function RotatingPill() {
  const [idx, setIdx] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setEntering(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % WORDS.length);
        setEntering(true);
      }, 220);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="rotating-text-pill" aria-live="polite" style={{ opacity: 1 }}>
      <span className="rotating-text-inner">
        <span
          key={idx}
          style={{
            display: 'inline-block',
            transform: entering ? 'translateY(0)' : 'translateY(-120%)',
            opacity: entering ? 1 : 0,
            transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease',
          }}
        >
          {WORDS[idx]}
        </span>
      </span>
    </span>
  );
}
