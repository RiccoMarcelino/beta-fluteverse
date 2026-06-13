import { SWARAS } from '../../constants';
import type { Swara } from '../../types';

interface Props {
  /** All swaras currently held (one per hand; deduped). */
  active: Swara[];
  noneActive: boolean;
}

export function SwaraStrip({ active, noneActive }: Props) {
  return (
    <div className="swara-strip">
      {/* None / silence indicator */}
      <div className={`swara-box swara-box--none${noneActive ? ' active' : ''}`}>
        —
      </div>

      {SWARAS.map(s => (
        <div key={s} className={`swara-box${active.includes(s) ? ' active' : ''}`}>
          {s}
        </div>
      ))}
    </div>
  );
}
