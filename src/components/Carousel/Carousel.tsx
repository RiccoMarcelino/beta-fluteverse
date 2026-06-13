import { FLUTES } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import { GradientText } from '../ui/GradientText';
import DecryptedText from '../ui/DecryptedText';
import { FluteCard } from './FluteCard';
import { LightRays } from './LightRays';

const ROTATIONS = [-35, -18, 0, 18, 35];
const DEPTHS = [-80, -40, 0, -40, -80];
const IMG_ROTATIONS = ['-12deg', '-12deg', '-12deg', '-12deg', '0deg'];

export function Carousel() {
  const { openPlay } = useFlute();
  return (
    <section className="section" id="carousel">
      <MobileGate>
        <LightRays />
      </MobileGate>
      <div className="section-heading">
        <h2>
          <GradientText colors={['#ffffff', '#ffffff', '#00FFE0', '#ffffff', '#ffffff']} speed={3}>
            SELECT YOUR INSTRUMENT
          </GradientText>
        </h2>
        <p id="carouselSubtitle">
          <DecryptedText
            text="Choose a flute scale to begin"
            animateOn="view"
            sequential={true}
            revealDirection="start"
            speed={35}
            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%&*"
            className="dt-revealed"
            encryptedClassName="dt-encrypted"
          />
        </p>
      </div>
      <div className="carousel-wrapper" id="carouselWrapper" aria-label="Flute selector">
        {FLUTES.map((flute, idx) => (
          <FluteCard
            key={flute.key}
            flute={flute}
            rotateY={ROTATIONS[idx]}
            translateZ={DEPTHS[idx]}
            imageRotate={IMG_ROTATIONS[idx]}
            active={flute.key === 'C#'}
            onActivate={() => openPlay(flute.key)}
          />
        ))}
      </div>
    </section>
  );
}
