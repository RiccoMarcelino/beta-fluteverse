import './PerformanceStats.css';

interface PerformanceStatsProps {
  fps: number;
  gestureLatency: number;
  faceLatency: number;
  gestureDevice: 'CPU' | 'GPU' | 'unknown';
  faceDevice: 'CPU' | 'GPU' | 'unknown';
  visible: boolean;
}

export function PerformanceStats({ 
  fps, 
  gestureLatency, 
  faceLatency, 
  gestureDevice,
  faceDevice,
  visible 
}: PerformanceStatsProps) {
  if (!visible) return null;

  return (
    <div className="perf-stats">
      <div className="perf-stat">
        <span className="perf-label">FPS</span>
        <span className="perf-value">{fps.toFixed(0)}</span>
      </div>
      <div className="perf-stat">
        <span className="perf-label">GESTURE</span>
        <span className="perf-value">
          {gestureLatency.toFixed(1)}ms
          <span className="perf-device">{gestureDevice}</span>
        </span>
      </div>
      <div className="perf-stat">
        <span className="perf-label">FACE</span>
        <span className="perf-value">
          {faceLatency.toFixed(1)}ms
          <span className="perf-device">{faceDevice}</span>
        </span>
      </div>
    </div>
  );
}
