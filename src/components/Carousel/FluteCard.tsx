import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { Flute } from '../../types';
import { FLUTE_IMAGE } from '../../constants';
import { useToast } from '../ui/Toast';

const TILT_AMPLITUDE = 12;
const HOVER_SCALE = 1.05;
const SPRING = { damping: 30, stiffness: 100, mass: 2 };

const FLOAT_DISTANCE = 10;       // px the card bobs up and down
const FLOAT_DURATION_MIN = 3.2;  // seconds — randomized per card so they don't tick in sync
const FLOAT_DURATION_VAR = 1.4;
const FLOAT_DELAY_MAX = 1.5;

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
  const toast = useToast();
  const baseScale = active ? 1.08 : 1;

  // Mouse-driven tilt — composed with the carousel's base rotateY so cards
  // tilt around their existing position instead of snapping flat.
  const mouseTiltX = useMotionValue(0);
  const mouseTiltY = useMotionValue(0);
  const rotateXSpring = useSpring(mouseTiltX, SPRING);
  const rotateYSpring = useSpring(mouseTiltY, SPRING);
  const composedRotateY = useTransform(rotateYSpring, (mr) => baseRotateY + mr);
  const scale = useSpring(baseScale, SPRING);

  // Idle float — only on inactive cards, so the active one feels anchored
  // and the others read as "alive but not yet available." Each card uses a
  // randomized duration + delay so the row breathes asynchronously.
  const floatY = useMotionValue(0);
  useEffect(() => {
    if (active) return;
    const controls = animate(floatY, [0, -FLOAT_DISTANCE, 0], {
      duration: FLOAT_DURATION_MIN + Math.random() * FLOAT_DURATION_VAR,
      delay: Math.random() * FLOAT_DELAY_MAX,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [active, floatY]);

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

  // Pointer drag vs click disambiguation & double-trigger prevention
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastActivateRef = useRef(0);

  const triggerActivate = () => {
    const now = Date.now();
    if (now - lastActivateRef.current < 350) return;
    lastActivateRef.current = now;
    if (active) {
      onActivate();
    } else {
      toast.show(`${flute.name} — COMING SOON`);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;
    // If movement was minimal (<15px) and short (<500ms), treat as click
    if (dx < 15 && dy < 15 && dt < 500) {
      triggerActivate();
    }
  };

  return (
    <motion.article
      ref={ref as React.Ref<HTMLElement>}
      className={`flute-card${active ? ' active' : ' flute-card--locked'}`}
      style={{
        rotateX: rotateXSpring,
        rotateY: composedRotateY,
        translateZ,
        scale,
        y: floatY,
        cursor: 'pointer',
        ['--img-rotate' as string]: imageRotate,
      } as unknown as React.CSSProperties}
      data-key={flute.key}
      tabIndex={0}
      role="button"
      aria-disabled={active ? undefined : true}
      aria-label={active ? `Play ${flute.name}` : `${flute.name} — coming soon`}
      onClick={(e) => {
        e.stopPropagation();
        triggerActivate();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerActivate();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flute-image-wrap">
        <img
          src={FLUTE_IMAGE[flute.key]}
          alt={flute.name}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>
      <h3 className="card-name">{flute.name}</h3>
      <div className="root-note">{flute.root}</div>
      <div className="badge">{active ? 'TAP TO PLAY' : 'COMING SOON'}</div>
    </motion.article>
  );
}
