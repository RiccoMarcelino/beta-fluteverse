import { forwardRef } from 'react';
import { PerformanceStats } from './PerformanceStats';
import type { PerformanceMetrics } from '../../hooks/usePerformanceStats';

interface Props {
  showPrompt: boolean;
  promptLine1: string;
  promptLine2?: string;
  performanceMetrics?: PerformanceMetrics;
  showPerformance?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

export const GestureCanvas = forwardRef<HTMLCanvasElement, Props>(
  function GestureCanvas(
    {
      showPrompt,
      promptLine1,
      promptLine2,
      performanceMetrics,
      showPerformance,
      isClickable,
      onClick,
    },
    ref,
  ) {
    return (
      <div
        className={`canvas-wrapper${isClickable ? ' is-clickable' : ''}`}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable ? 'Click to start camera and enable gesture tracking' : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <canvas id="gestureCanvas" ref={ref} />
        {showPrompt && (
          <div className="canvas-no-hand">
            <div className="no-hand-inner">
              <span className="no-hand-line1">{promptLine1}</span>
              {promptLine2 && <span className="no-hand-line2">{promptLine2}</span>}
            </div>
          </div>
        )}
        {showPerformance && performanceMetrics && (
          <PerformanceStats
            fps={performanceMetrics.fps}
            gestureLatency={performanceMetrics.gestureLatency}
            faceLatency={performanceMetrics.faceLatency}
            gestureDevice={performanceMetrics.gestureDevice}
            faceDevice={performanceMetrics.faceDevice}
            visible={showPerformance}
          />
        )}
      </div>
    );
  },
);
