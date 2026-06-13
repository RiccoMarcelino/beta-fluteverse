import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import './ScrambledText.css';

// Component inspired by Tom Miller from the GSAP community
// https://codepen.io/creativeocean/pen/NPWLwJM
gsap.registerPlugin(SplitText, ScrambleTextPlugin);

export interface ScrambledTextProps {
  /** Radius (px) around the pointer within which characters scramble. */
  radius?: number;
  /** Duration of the scramble settle on a character. */
  duration?: number;
  /** Speed of the scramble animation. */
  speed?: number;
  /** Characters used while scrambling. */
  scrambleChars?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const ScrambledText = ({
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
  className = '',
  style = {},
  children,
}: ScrambledTextProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const p = root.querySelector('p');
    if (!p) return;

    const split = SplitText.create(p, { type: 'chars', charsClass: 'char' });
    charsRef.current = split.chars as HTMLElement[];

    charsRef.current.forEach((c) => {
      gsap.set(c, {
        display: 'inline-block',
        attr: { 'data-content': c.innerHTML },
      });
    });

    const handleMove = (e: PointerEvent) => {
      charsRef.current.forEach((c) => {
        const { left, top, width, height } = c.getBoundingClientRect();
        const dx = e.clientX - (left + width / 2);
        const dy = e.clientY - (top + height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          gsap.to(c, {
            overwrite: true,
            duration: duration * (1 - dist / radius),
            scrambleText: {
              text: c.dataset.content || '',
              chars: scrambleChars,
              speed,
            },
            ease: 'none',
          });
        }
      });
    };

    root.addEventListener('pointermove', handleMove);

    return () => {
      root.removeEventListener('pointermove', handleMove);
      split.revert();
    };
  }, [radius, duration, speed, scrambleChars]);

  return (
    <div ref={rootRef} className={`scrambled-text ${className}`} style={style}>
      <p>{children}</p>
    </div>
  );
};

export default ScrambledText;
