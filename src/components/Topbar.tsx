import FuzzyText from './ui/FuzzyText';

interface Props {
  onBrandClick(): void;
  onNavClick(target: string): void;
}

export function Topbar({ onBrandClick, onNavClick }: Props) {
  return (
    <header className="topbar">
      <div
        className="brand"
        onClick={onBrandClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBrandClick(); } }}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', lineHeight: 1 }}
        title="FluteVerse"
      >
        <FuzzyText
          fontSize="inherit"
          fontWeight={400}
          fontFamily="'Bebas Neue', sans-serif"
          color="#ffffff"
          baseIntensity={0.08}
          hoverIntensity={0.35}
          enableHover={true}
          fuzzRange={20}
          fps={60}
          direction="horizontal"
          transitionDuration={8}
          letterSpacing={6}
        >
          FLUTEVERSE
        </FuzzyText>
      </div>
      <div className="center-kicker">A GESTURE-BASED INSTRUMENT</div>
      <nav className="nav" aria-label="Primary navigation">
        <a
          data-target="carousel"
          onClick={() => onNavClick('carousel')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavClick('carousel'); } }}
          role="button"
          tabIndex={0}
        >
          ABOUT
        </a>
      </nav>
    </header>
  );
}
