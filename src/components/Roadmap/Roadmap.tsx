import { ROADMAP_FEATURES } from '../../constants';
import { MobileGate } from '../MobileGate';
import { FloatingLines } from './FloatingLines';

export function Roadmap() {
  return (
    <section className="section" id="roadmap">
      <MobileGate>
        <FloatingLines />
      </MobileGate>
      <div className="roadmap-content">
        <div className="roadmap-header">
          <h2 className="roadmap-kicker">WHAT'S NEXT</h2>
          <h1 className="roadmap-title">ROADMAP</h1>
          <p className="roadmap-subtitle">Every gesture is just the beginning. Here's what we're building next.</p>
        </div>
        <div className="roadmap-rail" id="roadmapRail">
          {ROADMAP_FEATURES.map(f => (
            <div className="feature-item" key={f.id}>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
