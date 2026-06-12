import { useEffect, type RefObject } from 'react';

interface Args {
  containerRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  thumbRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  sectionCount?: number;
}

export function useHorizontalScroll({
  containerRef,
  trackRef,
  thumbRef,
  enabled,
  sectionCount = 3,
}: Args) {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container) return;

    const thumbPct = 1 / sectionCount;
    if (thumb) thumb.style.width = `${thumbPct * 100}%`;

    const syncThumb = () => {
      if (!thumb) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;
      const progress = container.scrollLeft / maxScroll;
      const maxLeft = 100 - thumbPct * 100;
      thumb.style.left = `${progress * maxLeft}%`;
    };

    container.addEventListener('scroll', syncThumb, { passive: true });
    syncThumb();

    // Wheel → horizontal momentum scroll
    let velocity = 0;
    let rafId: number | null = null;
    let settleTimer: number | null = null;
    const friction = 0.85;
    const scale = 0.55;

    const snapToNearest = () => {
      const idx = Math.round(container.scrollLeft / window.innerWidth);
      container.scrollTo({ left: idx * window.innerWidth, behavior: 'smooth' });
    };

    const step = () => {
      if (Math.abs(velocity) < 0.8) {
        velocity = 0;
        rafId = null;
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = window.setTimeout(snapToNearest, 80);
        return;
      }
      container.scrollLeft += velocity;
      velocity *= friction;
      rafId = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      // Allow native vertical scroll on inputs inside the play overlay
      const target = e.target as HTMLElement;
      if (target.closest('#play-overlay')) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      e.preventDefault();
      velocity += delta * scale;
      if (rafId == null) rafId = requestAnimationFrame(step);
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    // Pointer Events for scrollbar drag — handles mouse + touch + pen
    let dragStartX = 0;
    let dragStartLeft = 0;
    let isDragging = false;
    let dragPointerId: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (!thumb) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartLeft = container.scrollLeft;
      dragPointerId = e.pointerId;
      thumb.classList.add('dragging');
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !track) return;
      const rect = track.getBoundingClientRect();
      const delta = e.clientX - dragStartX;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const scrollDelta = (delta / rect.width) * maxScroll / (1 - thumbPct);
      container.scrollLeft = Math.max(0, Math.min(maxScroll, dragStartLeft + scrollDelta));
    };

    const onPointerUp = (_e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (thumb) {
        thumb.classList.remove('dragging');
        if (dragPointerId != null) {
          try { thumb.releasePointerCapture(dragPointerId); } catch {/* ignore */}
        }
      }
      dragPointerId = null;
    };

    const onTrackClick = (e: MouseEvent) => {
      if (!track) return;
      if (thumb?.classList.contains('dragging')) return;
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
    };

    thumb?.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    track?.addEventListener('click', onTrackClick);

    return () => {
      container.removeEventListener('scroll', syncThumb);
      container.removeEventListener('wheel', onWheel);
      thumb?.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      track?.removeEventListener('click', onTrackClick);
      if (rafId != null) cancelAnimationFrame(rafId);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [enabled, containerRef, trackRef, thumbRef, sectionCount]);

  // Helper to scroll to a given section by id
  return {
    scrollToSection(id: string) {
      const container = containerRef.current;
      if (!container || !enabled) return;
      const section = container.querySelector<HTMLElement>(`#${id}`);
      if (!section) return;
      container.scrollTo({ left: section.offsetLeft, behavior: 'smooth' });
    },
  };
}
