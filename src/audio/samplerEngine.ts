import * as Tone from 'tone';
import { ToneBufferSource } from 'tone';
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

  const masterGain = new Tone.Gain(1.4);
  const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
  masterGain.connect(reverb);

  const ATTACK = 0.05;
  const RELEASE = 0.8;

  const sampler = new Tone.Sampler({
    urls: FLUTE_SAMPLES,
    release: RELEASE,
    attack: ATTACK,
  }).connect(masterGain);

  // Replace the default triggerAttack with one that loops the sample
  // indefinitely instead of stopping after one playthrough. Mirrors
  // Tone.Sampler's internal logic but creates a ToneBufferSource with
  // loop=true and no scheduled stop, so the note sustains until release.
  type SamplerInternals = {
    _activeSources: Map<number, ToneBufferSource[]>;
    _buffers: { get(midi: number): { duration: number; get(): AudioBuffer } };
    _findClosest(midi: number): number;
  };
  const internals = sampler as unknown as SamplerInternals;

  sampler.triggerAttack = function patchedTriggerAttack(
    notes: Tone.Unit.Frequency | Tone.Unit.Frequency[],
    time?: Tone.Unit.Time,
    velocity = 1,
  ) {
    const list = Array.isArray(notes) ? notes : [notes];
    list.forEach((note) => {
      const freq = Tone.Frequency(note).toFrequency();
      const midiFloat = 69 + 12 * Math.log2(freq / 440);
      const midi = Math.round(midiFloat);
      const remainder = midiFloat - midi;
      const difference = internals._findClosest(midi);
      const closestNote = midi - difference;
      const buffer = internals._buffers.get(closestNote);
      const playbackRate = Math.pow(2, (difference + remainder) / 12);

      const source = new ToneBufferSource({
        url: buffer as unknown as Tone.ToneAudioBuffer,
        context: sampler.context,
        curve: sampler.curve,
        fadeIn: ATTACK,
        fadeOut: RELEASE,
        playbackRate,
        loop: true,
      }).connect(sampler.output);

      // Start with no duration → no scheduled stop, sample loops until released
      source.start(time, 0, undefined, velocity);

      if (!internals._activeSources.get(midi)) {
        internals._activeSources.set(midi, []);
      }
      internals._activeSources.get(midi)!.push(source);

      source.onended = () => {
        const sources = internals._activeSources.get(midi);
        if (sources) {
          const idx = sources.indexOf(source);
          if (idx !== -1) sources.splice(idx, 1);
        }
      };
    });
    return sampler;
  };

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
      const volume = 0.5 + intensity * 1.0;
      masterGain.gain.setTargetAtTime(volume, Tone.getContext().currentTime, 0.05);
    },
  };

  return _samplerEngine;
}
