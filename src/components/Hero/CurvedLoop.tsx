import { useEffect, useRef } from 'react';

const MARQUEE_TEXT = '✦ Made ✦ For ✦ Demo ✦ Day ✦ By ✦ Ricco Marcelino ';
const SPEED = 3;

export function CurvedLoop() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    document.fonts.ready.then(() => {
      const measure = measureRef.current;
      const tp = textPathRef.current;
      if (!measure || !tp) return;

      measure.style.fontFamily = '"Bebas Neue", sans-serif';
      measure.style.fontSize = '1.8rem';
      measure.style.fontWeight = '700';
      measure.style.letterSpacing = '4px';
      measure.textContent = MARQUEE_TEXT;

      const spacing = measure.getComputedTextLength();
      if (!spacing) return;

      const copies = Math.ceil(1800 / spacing) + 2;
      tp.textContent = Array(copies).fill(MARQUEE_TEXT).join('');

      let offset = -spacing;
      tp.setAttribute('startOffset', `${offset}px`);

      const tick = () => {
        offset += SPEED;
        if (offset <= -spacing) offset += spacing;
        if (offset > 0) offset -= spacing;
        tp.setAttribute('startOffset', `${offset}px`);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const pathId = 'curve-loop-path';

  return (
    <div className="curved-loop-jacket" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 }}>
      <svg ref={svgRef} viewBox="0 0 1440 120" className="curved-loop-svg">
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }} />
        <defs>
          <path id={pathId} d="M-100,40 Q720,40 1540,40" fill="none" stroke="transparent" />
        </defs>
        <text fontWeight="bold" xmlSpace="preserve">
          <textPath ref={textPathRef} href={`#${pathId}`} xmlSpace="preserve" />
        </text>
      </svg>
    </div>
  );
}
