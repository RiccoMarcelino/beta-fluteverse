import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  colors?: string[];
  speed?: number;
}

export function GradientText({ children, colors = ['#ffffff', '#00FFE0', '#ffffff', '#aaaaaa'], speed = 5 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Repeat the color stops so the gradient tiles seamlessly when background-position loops
    el.style.backgroundImage = `linear-gradient(120deg, ${colors.join(', ')}, ${colors.join(', ')})`;
    let pos = 0;
    let raf = 0;
    const step = () => {
      // Animate within 0–100% so it always stays within the background area
      pos = (pos + speed * 0.025) % 100;
      el.style.backgroundPosition = `${pos}% center`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [colors, speed]);

  return <span ref={ref} className="gradient-text-el">{children}</span>;
}
