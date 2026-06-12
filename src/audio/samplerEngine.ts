import * as Tone from 'tone';
import type { FluteKey, Swara } from '../types';
import { FLUTE_SAMPLES } from './sampleMap';
import { noteFor } from './engine';

export interface SamplerEngine {
  loaded: Promise<void>;
  trigger(flute: FluteKey, swara: Swara): void;
  release(flute: FluteKey, swara: Swara): void;
  releaseAll(): void;
  setBlowIntensity(intensity: number): void;
}

let _samplerEngine: SamplerEngine | null = null;

export function getSamplerEngine(): SamplerEngine {
  if (_samplerEngine) return _samplerEngine;

  const masterGain = new Tone.Gain(0.7);
  const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
  masterGain.connect(reverb);

  const sampler = new Tone.Sampler({
    urls: FLUTE_SAMPLES,
    release: 0.8,
    attack: 0.05,
  }).connect(masterGain);

  const loaded = new Promise<void>((resolve) => {
    Tone.loaded().then(resolve).catch(() => resolve());
  });

  _samplerEngine = {
    loaded,
    trigger(flute, swara) {
      const note = noteFor(flute, swara);
      sampler.triggerAttack(note);
    },
    release(flute, swara) {
      const note = noteFor(flute, swara);
      sampler.triggerRelease(note);
    },
    releaseAll() {
      sampler.releaseAll();
    },
    setBlowIntensity(intensity: number) {
      const volume = 0.1 + intensity * 0.9;
      masterGain.gain.setTargetAtTime(volume, Tone.getContext().currentTime, 0.05);
    },
  };

  return _samplerEngine;
}
