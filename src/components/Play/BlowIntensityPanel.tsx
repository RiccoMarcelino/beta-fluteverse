interface Props {
  intensity: number; // 0–1
  enabled: boolean;
}

export function BlowIntensityPanel({ intensity, enabled }: Props) {
  const pct = enabled ? Math.round(intensity * 100) : 0;
  const isActive = enabled && pct > 5;

  return (
    <div className="confidence-panel">
      <div className="panel-title">BLOW INTENSITY</div>
      <div className="conf-row">
        <span className={`conf-label${enabled ? '' : ' conf-label--none'}`}>BLOW</span>
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
