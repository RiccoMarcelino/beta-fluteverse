import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Stepper, { Step } from '../ui/Stepper';
import type { AudioMode } from '../../state/FluteContext';
import type { FluteKey } from '../../types';

interface Props {
  fluteKey: FluteKey | null;
  onConfirm: (mode: AudioMode, showTutorial: boolean) => void;
  onCancel: () => void;
}

export function AudioModeModal({ fluteKey, onConfirm, onCancel }: Props) {
  const [chosen, setChosen] = useState<AudioMode>('synthetic');
  const [wantsTutorial, setWantsTutorial] = useState(true);

  return (
    <AnimatePresence>
      {fluteKey && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', duration: 0.4 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 201,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 16px',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: 'min(540px, 100%)',
              maxHeight: '100%',
              overflowY: 'auto',
              pointerEvents: 'all',
              position: 'relative',
            }}>
            <Stepper
              initialStep={1}
              disableStepIndicators={false}
              backButtonText="BACK"
              nextButtonText="NEXT"
              onFinalStepCompleted={() => onConfirm(chosen, wantsTutorial)}
            >
              {/* Step 1 — Pick mode */}
              <Step>
                <div style={{ color: '#888', fontSize: 11, letterSpacing: 3, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 8 }}>
                  {fluteKey} FLUTE
                </div>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#fff', letterSpacing: 4, marginBottom: 16 }}>
                  CHOOSE AUDIO MODE
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
                  <ModeCard
                    active={chosen === 'synthetic'}
                    onClick={() => setChosen('synthetic')}
                    title="SYNTHETIC"
                    badge="DEFAULT"
                    description="Tone.js triangle oscillator with vibrato, reverb and low-pass filter. Instant load, no samples needed. Great for playing around and low-latency response."
                    icon="🎛"
                  />
                  <ModeCard
                    active={chosen === 'sampler'}
                    onClick={() => setChosen('sampler')}
                    title="REAL FLUTE"
                    badge="SAMPLES"
                    description="Actual recorded flute samples pitched across the full range. Sounds like a real bansuri. Requires a short load time (~180 KB) on first use."
                    icon="🎵"
                  />
                </div>
              </Step>

              {/* Step 2 — Confirm */}
              <Step>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#fff', letterSpacing: 4, marginBottom: 12 }}>
                  CONFIRM AUDIO
                </h2>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 16 }}>
                  You're about to open the <span style={{ color: '#fff' }}>{fluteKey} Flute</span> with{' '}
                  <span style={{ color: '#00FFE0' }}>
                    {chosen === 'synthetic' ? 'Synthetic audio' : 'Real flute samples'}
                  </span>.
                </div>
                <div style={{
                  border: '1px solid #222',
                  padding: '14px 16px',
                  fontFamily: 'Space Grotesk',
                  fontSize: 12,
                  color: '#555',
                  lineHeight: 1.8,
                }}>
                  {chosen === 'synthetic' ? (
                    <>
                      <div>⚡ Instant start — no loading</div>
                      <div>🎛 Triangle wave + reverb + vibrato</div>
                      <div>🔇 Blow intensity controls volume</div>
                    </>
                  ) : (
                    <>
                      <div>🎵 Real recorded bansuri samples</div>
                      <div>⏳ Short load on first use (~180 KB)</div>
                      <div>🎚 Pitch-shifted across full scale range</div>
                    </>
                  )}
                </div>
              </Step>

              {/* Step 3 — Tutorial? */}
              <Step>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#fff', letterSpacing: 4, marginBottom: 12 }}>
                  WATCH A TUTORIAL?
                </h2>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 16 }}>
                  New here? See a short clip on how to play the flute with your hand before you start.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
                  <ModeCard
                    active={wantsTutorial}
                    onClick={() => setWantsTutorial(true)}
                    title="YES, SHOW ME"
                    badge="RECOMMENDED"
                    description="The flute opens with the how-to video playing over it. Playing unlocks when the video ends — or press ✕ to skip and start right away."
                    icon="🎬"
                  />
                  <ModeCard
                    active={!wantsTutorial}
                    onClick={() => setWantsTutorial(false)}
                    title="NO, JUST PLAY"
                    badge="SKIP"
                    description="Jump straight into the flute. You can revisit the tutorial later by reopening this flute."
                    icon="▶"
                  />
                </div>
              </Step>
            </Stepper>

            {/* Close button */}
            <button
              onClick={onCancel}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none',
                color: '#555', cursor: 'pointer',
                fontFamily: 'Bebas Neue', fontSize: 20,
                lineHeight: 1, padding: '4px 8px',
              }}
            >
              ✕
            </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ModeCardProps {
  active: boolean;
  onClick: () => void;
  title: string;
  badge: string;
  description: string;
  icon: string;
}

function ModeCard({ active, onClick, title, badge, description, icon }: ModeCardProps) {
  return (
    <motion.div
      onClick={onClick}
      animate={{
        borderColor: active ? '#00FFE0' : '#222',
        boxShadow: active ? '3px 3px 0px #00FFE0' : '3px 3px 0px #333',
      }}
      transition={{ duration: 0.15 }}
      style={{
        border: '2px solid',
        padding: '14px 16px',
        cursor: 'pointer',
        background: active ? 'rgba(0,255,224,0.04)' : '#000',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3,
            color: active ? '#00FFE0' : '#fff',
          }}>
            {title}
          </span>
          <span style={{
            fontFamily: 'Space Grotesk', fontSize: 9, letterSpacing: 2,
            color: active ? '#00FFE0' : '#444',
            border: `1px solid ${active ? '#00FFE0' : '#333'}`,
            padding: '1px 6px',
          }}>
            {badge}
          </span>
        </div>
        <p style={{
          fontFamily: 'Space Grotesk', fontSize: 12,
          color: '#777', lineHeight: 1.6, margin: 0,
        }}>
          {description}
        </p>
      </div>
      {/* Selection indicator */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `2px solid ${active ? '#00FFE0' : '#333'}`,
        background: active ? '#00FFE0' : 'transparent',
        flexShrink: 0, marginTop: 2,
        transition: 'all 150ms ease',
      }} />
    </motion.div>
  );
}
