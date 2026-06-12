import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { Flute } from '../../types';
import { FLUTE_IMAGE } from '../../constants';

const TILT_AMPLITUDE = 12;
const HOVER_SCALE = 1.05;
const SPRING = { damping: 30, stiffness: 100, mass: 2 };

interface Props {
  flute: Flute;
  rotateY: number;
  translateZ: number;
  imageRotate: string;
  active: boolean;
  onActivate(): void;
}

export function FluteCard({
  flute,
  rotateY: baseRotateY,
  translateZ,
  imageRotate,
  active,
  onActivate,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const baseScale = active ? 1.08 : 1;

  // Mouse-driven tilt — sprung for the same "weighty" feel as the React Bits
  // TiltedCard. We compose mouse rotateY with the carousel's base angle so the
  // card tilts *around* its existing position instead of snapping flat.
  const mouseTiltX = useMotionValue(0);
  const mouseTiltY = useMotionValue(0);
  const rotateXSpring = useSpring(mouseTiltX, SPRING);
  const rotateYSpring = useSpring(mouseTiltY, SPRING);
  const composedRotateY = useTransform(rotateYSpring, (mr) => baseRotateY + mr);
  const scale = useSpring(baseScale, SPRING);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ox = e.clientX - rect.left - rect.width / 2;
    const oy = e.clientY - rect.top - rect.height / 2;
    mouseTiltX.set((oy / (rect.height / 2)) * -TILT_AMPLITUDE);
    mouseTiltY.set((ox / (rect.width / 2)) * TILT_AMPLITUDE);
  }

  function handleMouseEnter() {
    scale.set(baseScale * HOVER_SCALE);
  }

  function handleMouseLeave() {
    mouseTiltX.set(0);
    mouseTiltY.set(0);
    scale.set(baseScale);
  }

  const handle = () => onActivate();

  return (
    <motion.article
      ref={ref as React.Ref<HTMLElement>}
      className={`flute-card${active ? ' active' : ''}`}
      style={{
        rotateX: rotateXSpring,
        rotateY: composedRotateY,
        translateZ,
        scale,
        ['--img-rotate' as string]: imageRotate,
      } as unknown as React.CSSProperties}
      data-key={flute.key}
      tabIndex={0}
      role="button"
      aria-label={`Play ${flute.name}`}
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handle();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flute-image-wrap">
        <img src={FLUTE_IMAGE[flute.key]} alt={flute.name} loading="eager" decoding="async" />
      </div>
      <h3 className="card-name">{flute.name}</h3>
      <div className="root-note">{flute.root}</div>
      <div className="badge">TAP TO PLAY</div>
    </motion.article>
  );
}
