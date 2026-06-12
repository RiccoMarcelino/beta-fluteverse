import type { Flute } from '../../types';
import { FLUTE_IMAGE } from '../../constants';

interface Props {
  flute: Flute;
  rotateY: number;
  translateZ: number;
  imageRotate: string;
  active: boolean;
  onActivate(): void;
}

export function FluteCard({ flute, rotateY, translateZ, imageRotate, active, onActivate }: Props) {
  const handle = () => onActivate();
  return (
    <article
      className={`flute-card${active ? ' active' : ''}`}
      style={{
        // CSS uses these custom props for the 3D transform
        ['--rotate-y' as string]: `${rotateY}deg`,
        ['--translate-z' as string]: `${translateZ}px`,
        ['--scale' as string]: active ? '1.08' : '1',
        ['--img-rotate' as string]: imageRotate,
      } as React.CSSProperties}
      data-key={flute.key}
      tabIndex={0}
      role="button"
      aria-label={`Play ${flute.name}`}
      onClick={handle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } }}
    >
      <div className="flute-image-wrap">
        <img src={FLUTE_IMAGE[flute.key]} alt={flute.name} loading="eager" decoding="async" />
      </div>
      <h3 className="card-name">{flute.name}</h3>
      <div className="root-note">{flute.root}</div>
      <div className="badge">TAP TO PLAY</div>
    </article>
  );
}
