interface Props {
  intensity: number; // 0–1
  enabled: boolean;
  isRunning: boolean;
}

export function BlowIntensityPanel({ intensity, enabled, isRunning }: Props) {
  // useLipTracking holds intensity at 0.5 as a neutral default for the audio
  // engine when idle — but the UI should read 0% until the camera is actually
  // tracking. Only surface the real value when the session is running and the
  // face landmarker is enabled.
  const tracking = isRunning && enabled;
  const pct = tracking ? Math.round(intensity * 100) : 0;
  const isActive = tracking && pct > 5;

  return (
    <div className="confidence-panel">
      <div className="panel-title">BLOW INTENSITY</div>
      <div className="conf-row">
        <span className={`conf-label${tracking ? '' : ' conf-label--none'}`}>BLOW</span>
        <div className="conf-bar-bg">
          <div
            className={`conf-bar-fill conf-bar-fill--blow${isActive ? ' active' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="conf-pct">{pct}%</span>
      </div>
      {!enabled && (
        <div className="blow-disabled-hint">FACE TRACKING DISABLED</div>
      )}
    </div>
  );
}
