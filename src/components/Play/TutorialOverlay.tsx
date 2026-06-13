import { useEffect, useRef } from 'react';

const TUTORIAL_VIDEO_URL =
  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/how%20to%20use.mp4';

interface Props {
  /** Show the tutorial video over the play page. */
  active: boolean;
  /** Called when the video finishes or the user skips — unlocks play. */
  onDismiss: () => void;
}

/**
 * Full-cover overlay shown on the play page when the user opted into the
 * how-to-play tutorial. The flute controls underneath stay covered (and
 * locked) until the video ends or the user presses the ✕ to skip.
 */
export function TutorialOverlay({ active, onDismiss }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Start playback from the top when the tutorial becomes active. If the
  // browser blocks autoplay-with-sound, the native controls let the user
  // start it manually — the ✕ remains the guaranteed escape hatch.
  useEffect(() => {
    if (!active) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [active]);

  if (!active) return null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="How to play tutorial">
      <button
        type="button"
        className="tutorial-skip"
        onClick={onDismiss}
        aria-label="Skip tutorial and start playing"
        title="Skip tutorial"
      >
        ✕
      </button>

      <div className="tutorial-frame">
        <span className="tutorial-eyebrow">HOW TO PLAY</span>
        <video
          ref={videoRef}
          className="tutorial-video"
          src={TUTORIAL_VIDEO_URL}
          autoPlay
          playsInline
          controls
          onEnded={onDismiss}
        />
        <p className="tutorial-caption">
          Playing unlocks when the video ends — or press ✕ to skip and start now.
        </p>
      </div>
    </div>
  );
}
