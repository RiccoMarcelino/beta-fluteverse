import { SWARAS } from '../../constants';
import type { Swara } from '../../types';

interface Props {
  scores: Record<Swara, number>;
  top: Swara | null;
  noneScore: number; // 0–100
}

export function ConfidencePanel({ scores, top, noneScore }: Props) {
  const noneIsTop = noneScore > 0 && top === null;

  return (
    <div className="confidence-panel">
      <div className="panel-title">GESTURE CONFIDENCE</div>
      <div className="confidence-rows">
        {/* None row — shown first as a "silence" indicator */}
        <div className="conf-row">
          <span className="conf-label conf-label--none">—</span>
          <div className="conf-bar-bg">
            <div
              className={`conf-bar-fill conf-bar-fill--none${noneIsTop ? ' active' : ''}`}
              style={{ width: `${noneScore}%` }}
            />
          </div>
          <span className="conf-pct">{noneScore}%</span>
        </div>

        {SWARAS.map(s => {
          const pct = Math.round(scores[s] * 100);
          const isTop = top === s && pct > 0;
          return (
            <div className="conf-row" key={s}>
              <span className="conf-label">{s}</span>
              <div className="conf-bar-bg">
                <div className={`conf-bar-fill${isTop ? ' active' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="conf-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
