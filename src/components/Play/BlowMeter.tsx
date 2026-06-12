import { useEffect, useState } from 'react';
import './BlowMeter.css';

interface BlowMeterProps {
  intensity: number; // 0.0 to 1.0
  visible: boolean;
}

export function BlowMeter({ intensity, visible }: BlowMeterProps) {
  const [displayIntensity, setDisplayIntensity] = useState(intensity);

  useEffect(() => {
    setDisplayIntensity(intensity);
  }, [intensity]);

  if (!visible) return null;

  const percent = Math.round(displayIntensity * 100);

  // Color shifts warmer at high intensity
  let gradient = 'linear-gradient(to top, #00aa88, rgba(0,170,136,0.3))';
  if (percent > 80) {
    gradient = 'linear-gradient(to top, #ffffff, #00FFE0)';
  } else if (percent > 50) {
    gradient = 'linear-gradient(to top, #00FFE0, rgba(0,255,224,0.4))';
  }

  return (
    <div className="blow-meter-wrap">
      <div className="blow-meter-label">BLOW</div>
      <div className="blow-meter-track">
        <div 
          className="blow-meter-fill" 
          style={{ 
            height: `${percent}%`,
            background: gradient
          }}
        />
      </div>
      <div className="blow-meter-pct">{percent}%</div>
    </div>
  );
}
