import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FluteKey } from '../types';

export type AudioMode = 'synthetic' | 'sampler';

interface FluteApi {
  selected: FluteKey;
  setSelected(k: FluteKey): void;
  playOpen: boolean;
  openPlay(k: FluteKey): void;
  closePlay(): void;
  /** Pending flute key waiting for audio mode selection */
  pendingKey: FluteKey | null;
  confirmPlay(mode: AudioMode): void;
  cancelPending(): void;
  audioMode: AudioMode;
}

const FluteCtx = createContext<FluteApi | null>(null);

export function useFlute(): FluteApi {
  const ctx = useContext(FluteCtx);
  if (!ctx) throw new Error('useFlute must be inside <FluteProvider>');
  return ctx;
}

export function FluteProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected]     = useState<FluteKey>('C#');
  const [playOpen, setPlayOpen]     = useState(false);
  const [pendingKey, setPendingKey] = useState<FluteKey | null>(null);
  const [audioMode, setAudioMode]   = useState<AudioMode>('synthetic');

  return (
    <FluteCtx.Provider
      value={{
        selected,
        setSelected,
        playOpen,
        audioMode,
        pendingKey,
        // Show audio mode picker before opening play
        openPlay(k) {
          setSelected(k);
          setPendingKey(k);
        },
        confirmPlay(mode) {
          setAudioMode(mode);
          setPendingKey(null);
          setPlayOpen(true);
        },
        cancelPending() {
          setPendingKey(null);
        },
        closePlay() {
          setPlayOpen(false);
        },
      }}
    >
      {children}
    </FluteCtx.Provider>
  );
}
