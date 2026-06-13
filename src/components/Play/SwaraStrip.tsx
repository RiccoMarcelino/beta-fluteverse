import { SWARAS } from '../../constants';
import type { Swara } from '../../types';
import BlurText from '../ui/BlurText';

interface Props {
  active: Swara | null;
  noneActive: boolean;
}

export function SwaraStrip({ active, noneActive }: Props) {
  return (
    <div className="swara-strip">
      <div className={`swara-box swara-box--none${noneActive ? ' active' : ''}`}>
        <BlurText
          as="span"
          text="—"
          animateBy="letters"
          direction="bottom"
          delay={0}
          startDelay={0}
          stepDuration={0.3}
          triggerOnce={false}
          inline
        />
      </div>

      {SWARAS.map((s, i) => (
        <div key={s} className={`swara-box${active === s ? ' active' : ''}`}>
          <BlurText
            as="span"
            text={s}
            animateBy="letters"
            direction="bottom"
            delay={40}
            startDelay={120 + i * 90}
            stepDuration={0.32}
            triggerOnce={false}
            inline
          />
        </div>
      ))}
    </div>
  );
}
