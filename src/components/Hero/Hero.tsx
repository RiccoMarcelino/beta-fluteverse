import { MobileGate } from '../MobileGate';
import { GradientText } from '../ui/GradientText';
import { RotatingPill } from '../ui/RotatingPill';
import BlurText from '../ui/BlurText';
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
            <BlurText
              as="span"
              text="PLAY YOUR HANDS."
              animateBy="words"
              direction="top"
              delay={140}
              stepDuration={0.4}
              triggerOnce={false}
              inline
            />
          </GradientText>
        </h1>
        <h1>
          <GradientText colors={['#ffffff', '#00FFE0', '#ffffff', '#aaaaaa']}>
            <BlurText
              as="span"
              text="HEAR THE"
              animateBy="words"
              direction="top"
              delay={140}
              startDelay={300}
              stepDuration={0.4}
              triggerOnce={false}
              inline
            />
          </GradientText>
          <RotatingPill />
        </h1>
        <p>
          <BlurText
            as="span"
            text="Gesture-powered Indian classical music. No instrument required."
            animateBy="words"
            direction="bottom"
            delay={60}
            startDelay={600}
            stepDuration={0.35}
            triggerOnce={false}
            inline
          />
        </p>
      </div>
    </section>
  );
}
