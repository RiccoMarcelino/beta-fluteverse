import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  proceedText?: string;
}

const SWARA_GUIDE = [
  { name: 'Sa', gesture: '✊ Closed Fist', desc: 'All fingers tucked in' },
  { name: 'Re', gesture: '✌️ Two Fingers', desc: 'Index & middle extended' },
  { name: 'Ga', gesture: '🤟 Three Fingers', desc: 'Index, middle & ring' },
  { name: 'Ma', gesture: '✋ Four Fingers', desc: 'Four fingers up, thumb in' },
  { name: 'Pa', gesture: '🖐️ Full Open Palm', desc: 'All five fingers spread' },
  { name: 'Dha', gesture: '👍 Thumbs Up', desc: 'Thumb upright or 6 fingers' },
  { name: 'Ni', gesture: '☝️ One Finger', desc: 'Single index finger pointing' },
];

export function TutorialModal({
  isOpen,
  onClose,
  onProceed,
  proceedText = 'CONTINUE TO PLAY',
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tutorial-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 300,
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal Container */}
          <motion.div
            key="tutorial-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', duration: 0.4 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 301,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 'min(760px, 100%)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#0a0a0a',
                border: '2px solid #00FFE0',
                boxShadow: '0 0 40px rgba(0, 255, 224, 0.2), 6px 6px 0px #00FFE0',
                padding: '24px',
                pointerEvents: 'all',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      color: '#00FFE0',
                      fontSize: 11,
                      letterSpacing: 3,
                      fontFamily: 'Space Grotesk',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    INTERACTIVE GESTURE GUIDE
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Bebas Neue',
                      fontSize: 32,
                      color: '#fff',
                      letterSpacing: 4,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    HOW TO PLAY FLUTEVERSE
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid #333',
                    color: '#888',
                    cursor: 'pointer',
                    fontFamily: 'Bebas Neue',
                    fontSize: 20,
                    lineHeight: 1,
                    padding: '4px 10px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = '#00FFE0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                  aria-label="Close tutorial"
                >
                  ✕
                </button>
              </div>

              {/* Tutorial Video Player */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%', // 16:9 ratio
                  background: '#000',
                  border: '1px solid #222',
                  overflow: 'hidden',
                }}
              >
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
                  title="FluteVerse Tutorial Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Swara Gestures Cheatsheet */}
              <div>
                <h3
                  style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: 20,
                    color: '#fff',
                    letterSpacing: 2,
                    marginBottom: 10,
                  }}
                >
                  7 SWARA HAND GESTURES
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {SWARA_GUIDE.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        background: '#111',
                        border: '1px solid #222',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'Bebas Neue',
                            fontSize: 18,
                            color: '#00FFE0',
                            letterSpacing: 1,
                          }}
                        >
                          {item.name}
                        </span>
                        <span style={{ fontSize: 16 }}>{item.gesture.split(' ')[0]}</span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Space Grotesk',
                          fontSize: 11,
                          color: '#aaa',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lip Blow Intensity Tracking Guide */}
              <div
                style={{
                  background: 'rgba(0, 255, 224, 0.03)',
                  border: '1px solid #1a3a35',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ fontSize: 28 }}>👄</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'Bebas Neue',
                      fontSize: 16,
                      color: '#00FFE0',
                      letterSpacing: 2,
                      marginBottom: 2,
                    }}
                  >
                    LIP BLOW INTENSITY TRACKING
                  </div>
                  <div
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: 12,
                      color: '#aaa',
                      lineHeight: 1.5,
                    }}
                  >
                    Purse your lips tight (like blowing into a flute embouchure) to produce sound. Relax or open your mouth to cut the note.
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#888',
                    fontFamily: 'Bebas Neue',
                    fontSize: 16,
                    letterSpacing: 2,
                    padding: '8px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = '#666';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  CLOSE
                </button>
                {onProceed && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceed();
                    }}
                    style={{
                      background: '#00FFE0',
                      border: '2px solid #00FFE0',
                      color: '#000',
                      fontFamily: 'Bebas Neue',
                      fontSize: 17,
                      letterSpacing: 3,
                      padding: '8px 24px',
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0px rgba(0,255,224,0.4)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '5px 5px 0px #00FFE0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0,255,224,0.4)';
                    }}
                  >
                    {proceedText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
