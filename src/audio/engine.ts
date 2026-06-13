import * as Tone from 'tone';
import type { FluteKey, Swara } from '../types';

export interface FluteEngine {
  synth: Tone.PolySynth;
  vibrato: Tone.Vibrato;
  reverb: Tone.Reverb;
  filter: Tone.Filter;
  masterGain: Tone.Gain;
  loaded: Promise<void>;
  trigger(flute: FluteKey, swara: Swara): void;
  release(flute: FluteKey, swara: Swara): void;
  releaseAll(): void;
  setBlowIntensity(intensity: number): void;
  dispose(): void;
}

let _engine: FluteEngine | null = null;

// Flute Scale Mappings - Swara to Western Note
const FLUTE_SCALE_MAPPINGS: Record<FluteKey, Record<Swara, string>> = {
  'C': {
    Sa: 'C4',
    Re: 'D4',
    Ga: 'E4',
    Ma: 'F4',
    Pa: 'G4',
    Dha: 'A4',
    Ni: 'B4',
  },
  'C#': {
    Sa: 'C#4',
    Re: 'D#4',
    Ga: 'F4',
    Ma: 'F#4',
    Pa: 'G#4',
    Dha: 'A#4',
    Ni: 'C5',
  },
  'D': {
    Sa: 'D4',
    Re: 'E4',
    Ga: 'F#4',
    Ma: 'G4',
    Pa: 'A4',
    Dha: 'B4',
    Ni: 'C#5',
  },
  'E': {
    Sa: 'E4',
    Re: 'F#4',
    Ga: 'G#4',
    Ma: 'A4',
    Pa: 'B4',
    Dha: 'C#5',
    Ni: 'D#5',
  },
  'F': {
    Sa: 'F4',
    Re: 'G4',
    Ga: 'A4',
    Ma: 'A#4',
    Pa: 'C5',
    Dha: 'D5',
    Ni: 'E5',
  },
};

/**
 * Get the note for a given flute and swara
 */
export function noteFor(flute: FluteKey, swara: Swara): string {
  return FLUTE_SCALE_MAPPINGS[flute][swara];
}

export function getEngine(): FluteEngine {
  if (_engine) return _engine;

  // Create a low-pass filter for breathy flute sound
  const filter = new Tone.Filter({
    frequency: 2000,
    type: 'lowpass',
    rolloff: -12,
  });

  // Create vibrato effect to mimic breath variations
  const vibrato = new Tone.Vibrato({
    frequency: 5,
    depth: 0.08,
    wet: 0.5,
  });

  // Master gain for blow intensity control (cut to 1/5 to quiet the flute)
  const masterGain = new Tone.Gain(0.1);

  // Add reverb for natural room sound
  const reverb = new Tone.Reverb({
    decay: 1.2,
    wet: 0.25,
  }).toDestination();

  // Create PolySynth with flute-like characteristics
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.8,
      release: 0.5,
    },
    volume: -6,
  }).chain(filter, vibrato, masterGain, reverb);
  
  synth.maxPolyphony = 8;

  const loaded = Promise.resolve();

  const engine: FluteEngine = {
    synth,
    vibrato,
    reverb,
    filter,
    masterGain,
    loaded,
    trigger(flute, swara) {
      const note = noteFor(flute, swara);
      synth.triggerAttack(note);
    },
    release(flute, swara) {
      const note = noteFor(flute, swara);
      synth.triggerRelease(note);
    },
    releaseAll() {
      synth.releaseAll();
    },
    setBlowIntensity(intensity: number) {
      // Range cut to 1/5 to quiet the flute.
      const volume = 0.01 + intensity * 0.19;
      masterGain.gain.setTargetAtTime(volume, Tone.getContext().currentTime, 0.04);
    },
    dispose() {
      synth.dispose();
      vibrato.dispose();
      reverb.dispose();
      filter.dispose();
      masterGain.dispose();
      _engine = null;
    },
  };

  _engine = engine;
  return engine;
}

/**
 * Tone.js requires a user gesture to start its AudioContext.
 * Call this on the first click/tap (e.g. carousel card click or START button).
 */
export async function startAudio(): Promise<void> {
  if (Tone.getContext().state !== 'running') {
    await Tone.start();
  }
}

