import { useMemo } from 'react';
import { FLUTES, FLUTE_IMAGE } from '../../constants';
import { useFlute } from '../../state/FluteContext';
import { MobileGate } from '../MobileGate';
import { GradientText } from '../ui/GradientText';
import DecryptedText from '../ui/DecryptedText';
import CircularGallery, { type GalleryItem } from './CircularGallery';
import { LightRays } from './LightRays';

export function Carousel() {
  const { openPlay } = useFlute();

  const items: GalleryItem[] = useMemo(
    () => FLUTES.map(f => ({ image: FLUTE_IMAGE[f.key], text: f.name })),
    []
  );

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
      <div className="carousel-wrapper carousel-wrapper--gallery" aria-label="Flute selector">
        <CircularGallery
          items={items}
          bend={3}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.04}
          scrollSpeed={2}
          font="bold 28px Bebas Neue"
          onItemClick={(i) => {
            const flute = FLUTES[i];
            if (flute) openPlay(flute.key);
          }}
        />
      </div>
    </section>
  );
}
