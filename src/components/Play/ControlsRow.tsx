import { useEffect, useState } from 'react';
import type { FluteKey, Swara } from '../../types';
import { FLUTE_ROOT_MIDI, SWARA_INTERVALS } from '../../constants';
import * as Tone from 'tone';

interface Props {
  isRunning: boolean;
  audioReady: boolean;
  cooldownMs: number;
  onCooldownChange(v: number): void;
  onStartStop(): void;
  /** Swaras held across both hands (dual-hand) — drives the active-note readout. */
  activeSwaras: Swara[];
  /** Number of hands currently detected (0–2) — shown as a live readout. */
  handCount?: number;
  flute: FluteKey;
  blowIntensity?: number;
  blowEnabled?: boolean;
  /** Lock Start while the how-to tutorial is playing. */
  locked?: boolean;
}

function noteLabel(flute: FluteKey, swara: Swara): { note: string; freq: number } {
  const midi = FLUTE_ROOT_MIDI[flute] + SWARA_INTERVALS[swara];
  const note = Tone.Frequency(midi, 'midi').toNote();
  const freq = Tone.Frequency(midi, 'midi').toFrequency();
  return { note, freq: Math.round(freq * 100) / 100 };
}

export function ControlsRow({ isRunning, audioReady, cooldownMs, onCooldownChange, onStartStop, activeSwaras, handCount = 0, flute, blowIntensity = 0.5, blowEnabled = false, locked = false }: Props) {
  const [flash, setFlash] = useState(false);
  const activeKey = activeSwaras.join(',');

  useEffect(() => {
    if (!activeKey) return;
    setFlash(false);
    const id = window.setTimeout(() => setFlash(true), 10);
    return () => clearTimeout(id);
  }, [activeKey]);

  const notes = activeSwaras.map(s => noteLabel(flute, s));
  const multi = activeSwaras.length > 1;
  const swaraText = activeSwaras.length ? activeSwaras.join(' · ') : '—';
  const detailText =
    notes.length === 0 ? ''
    : notes.length === 1 ? `${notes[0].note} — ${notes[0].freq} Hz`
    : notes.map(n => n.note).join(' · ');

  return (
    <div className="controls-row">
      <div className="control-box">
        <div className="control-label">CONTROL</div>
        <button className="brut-btn" onClick={onStartStop} disabled={!audioReady || locked}>
          {locked ? 'TUTORIAL…' : isRunning ? 'STOP' : 'START'}
        </button>
      </div>

      <div className="control-box">
        <div className="control-label">COOLDOWN (MS)</div>
        <input
          className="brut-input"
          type="number"
          value={cooldownMs}
          min={100}
          max={2000}
          step={50}
          onChange={e => onCooldownChange(Math.max(100, Math.min(2000, Number(e.target.value) || 300)))}
        />
      </div>

      <div className={`control-box active-note-box${flash ? ' flash' : ''}`}>
        <div className={`active-note-swara${multi ? ' active-note-swara--multi' : ''}`}>{swaraText}</div>
        <div className="active-note-detail">{detailText}</div>
        {isRunning && handCount > 0 && (
          <div className="active-hands-line">
            HANDS <span className={`active-hands-n${handCount > 1 ? ' dual' : ''}`}>{handCount}</span>
          </div>
        )}
        {blowEnabled && isRunning && (
          <div className="active-blow-line">
            BLOW <span className="active-blow-pct">{Math.round(blowIntensity * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
