import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(GSAPSplitText);

type ValidTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  textAlign?: string;
  tag?: ValidTag;
  /** Extra delay in ms before the animation starts (useful for sequencing lines) */
  startDelay?: number;
  onLetterAnimationComplete?: () => void;
}

type SplitEl = HTMLElement & { _rbsplitInstance?: InstanceType<typeof GSAPSplitText> };

const SplitText = ({
  text,
  className = '',
  delay = 40,
  duration = 0.75,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 50 },
  to = { opacity: 1, y: 0 },
  threshold = 0.05,
  textAlign = 'center',
  tag = 'p',
  startDelay = 0,
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<SplitEl>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    const el = ref.current;
    if (!el) return;

    // Hide immediately before any paint so there's no flash
    gsap.set(el, { visibility: 'hidden' });

    let splitInstance: InstanceType<typeof GSAPSplitText> | null = null;
    let targets: Element[] = [];
    let observer: IntersectionObserver | null = null;
    let tween: gsap.core.Tween | null = null;

    const runAnimation = () => {
      if (doneRef.current || !splitInstance || !targets.length) return;

      // Set initial per-char state, then make parent visible
      gsap.set(targets, { ...from });
      gsap.set(el, { visibility: 'visible' });

      tween = gsap.to(targets, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        delay: startDelay / 1000,
        force3D: true,
        onComplete: () => {
          doneRef.current = true;
          try { splitInstance?.revert(); } catch { /* noop */ }
          splitInstance = null;
          onLetterAnimationComplete?.();
        },
      });
    };

    const init = () => {
      if (!el) return;

      // Clean up previous
      if ((el as SplitEl)._rbsplitInstance) {
        try { (el as SplitEl)._rbsplitInstance!.revert(); } catch { /* noop */ }
        (el as SplitEl)._rbsplitInstance = undefined;
      }

      splitInstance = new GSAPSplitText(el, {
        type: splitType,
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
      });

      (el as SplitEl)._rbsplitInstance = splitInstance;

      if (splitType.includes('chars') && splitInstance.chars?.length) targets = splitInstance.chars;
      else if (splitType.includes('words') && splitInstance.words?.length) targets = splitInstance.words;
      else if (splitType.includes('lines') && splitInstance.lines?.length) targets = splitInstance.lines;
      else targets = [];

      if (!targets.length) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }

      // If already in viewport, animate immediately
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        runAnimation();
        return;
      }

      // Otherwise wait for scroll into view
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            observer?.disconnect();
            observer = null;
            runAnimation();
          }
        },
        { threshold }
      );
      observer.observe(el);
    };

    // Wait for fonts so GSAP measures correctly, but we've already hidden the text
    if (document.fonts.status === 'loaded') {
      init();
    } else {
      document.fonts.ready.then(init);
    }

    return () => {
      observer?.disconnect();
      tween?.kill();
      if (splitInstance) {
        try { splitInstance.revert(); } catch { /* noop */ }
      }
      gsap.set(el, { clearProps: 'all' });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const Tag = tag as ValidTag;

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      style={{ textAlign: textAlign as React.CSSProperties['textAlign'] }}
      className={`split-parent ${className}`}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
