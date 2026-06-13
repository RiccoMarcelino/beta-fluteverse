import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { GESTURE_MODEL_URL } from '../constants';

let _recognizer: GestureRecognizer | null = null;
let _pending: Promise<GestureRecognizer> | null = null;

export async function getRecognizer(): Promise<GestureRecognizer> {
  if (_recognizer) return _recognizer;
  if (_pending) return _pending;

  _pending = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    const baseOpts = {
      baseOptions: { modelAssetPath: GESTURE_MODEL_URL, delegate: 'GPU' as const },
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      _recognizer = await GestureRecognizer.createFromOptions(vision, baseOpts);
    } catch (err) {
      console.warn('GPU delegate failed, falling back to CPU:', err);
      _recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...baseOpts,
        baseOptions: { ...baseOpts.baseOptions, delegate: 'CPU' as const },
      });
    }
    return _recognizer;
  })();

  return _pending;
}
