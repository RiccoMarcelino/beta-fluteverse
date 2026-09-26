import { GestureRecognizer } from '@mediapipe/tasks-vision';
import { GESTURE_MODEL_URL } from '../constants';
import { getVision } from './vision';

let _recognizer: GestureRecognizer | null = null;
let _pending: Promise<GestureRecognizer> | null = null;
let _gestureDevice: 'GPU' | 'CPU' = 'GPU';

export function getGestureDevice(): 'GPU' | 'CPU' {
  return _gestureDevice;
}

export async function getRecognizer(): Promise<GestureRecognizer> {
  if (_recognizer) return _recognizer;
  if (_pending) return _pending;

  _pending = (async () => {
    const vision = await getVision();
    const baseOpts = {
      baseOptions: { modelAssetPath: GESTURE_MODEL_URL, delegate: 'GPU' as const },
      runningMode: 'VIDEO' as const,
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      _recognizer = await GestureRecognizer.createFromOptions(vision, baseOpts);
      _gestureDevice = 'GPU';
    } catch (err) {
      console.warn('GestureRecognizer GPU delegate failed, falling back to CPU:', err);
      _recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...baseOpts,
        baseOptions: { ...baseOpts.baseOptions, delegate: 'CPU' as const },
      });
      _gestureDevice = 'CPU';
    }
    return _recognizer;
  })();

  return _pending;
}
