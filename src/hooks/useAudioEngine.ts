import { useEffect, useRef, useState } from 'react';
import type { FluteKey, Swara } from '../types';
import { getEngine, startAudio, type FluteEngine } from '../audio/engine';
import { getSamplerEngine, type SamplerEngine } from '../audio/samplerEngine';
import type { AudioMode } from '../state/FluteContext';

export interface AudioEngineApi {
  ready: boolean;
  start(): Promise<void>;
  trigger(flute: FluteKey, swara: Swara): void;
  release(flute: FluteKey, swara: Swara): void;
  releaseAll(): void;
  setBlowIntensity(intensity: number): void;
}

export function useAudioEngine(mode: AudioMode = 'synthetic'): AudioEngineApi {
  const synthRef    = useRef<FluteEngine | null>(null);
  const samplerRef  = useRef<SamplerEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (mode === 'synthetic') {
      const engine = getEngine();
      synthRef.current = engine;
      let cancelled = false;
      engine.loaded.then(() => { if (!cancelled) setReady(true); });
      return () => { cancelled = true; };
    } else {
      const engine = getSamplerEngine();
      samplerRef.current = engine;
      let cancelled = false;
      engine.loaded.then(() => { if (!cancelled) setReady(true); });
      return () => { cancelled = true; };
    }
  }, [mode]);

  return {
    ready,
    async start() {
      await startAudio();
    },
    trigger(flute, swara) {
      if (mode === 'sampler') samplerRef.current?.trigger(flute, swara);
      else synthRef.current?.trigger(flute, swara);
    },
    release(flute, swara) {
      if (mode === 'sampler') samplerRef.current?.release(flute, swara);
      else synthRef.current?.release(flute, swara);
    },
    releaseAll() {
      if (mode === 'sampler') samplerRef.current?.releaseAll();
      else synthRef.current?.releaseAll();
    },
    setBlowIntensity(intensity: number) {
      if (mode === 'sampler') samplerRef.current?.setBlowIntensity(intensity);
      else synthRef.current?.setBlowIntensity(intensity);
    },
  };
}
