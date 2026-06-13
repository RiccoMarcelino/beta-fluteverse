import { MobileGate } from '../MobileGate';
import { GradientText } from '../ui/GradientText';
import { RotatingPill } from '../ui/RotatingPill';
import DecryptedText from '../ui/DecryptedText';
import { Galaxy } from './Galaxy';

export function Hero() {
  return (
    <section className="section" id="hero">
      <MobileGate>
        <Galaxy />
      </MobileGate>

      <div className="hero-text">
        <h1>
          <GradientText colors={['#ffffff', '#00FFE0', '#ffffff', '#aaaaaa']}>
            PLAY YOUR HANDS.
          </GradientText>
        </h1>
        <h1>
          <GradientText colors={['#ffffff', '#00FFE0', '#ffffff', '#aaaaaa']}>
            HEAR THE
          </GradientText>
          <RotatingPill />
        </h1>
        <p>
          <DecryptedText
            text="Gesture-powered Indian classical music. No instrument required."
            animateOn="view"
            sequential={true}
            revealDirection="start"
            speed={28}
            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%&*"
            className="dt-revealed"
            encryptedClassName="dt-encrypted"
          />
        </p>
      </div>
    </section>
  );
}
