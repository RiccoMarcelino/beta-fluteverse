import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let _faceLandmarker: FaceLandmarker | null = null;
let _initPromise: Promise<FaceLandmarker | null> | null = null;

/**
 * Initialize Face Landmarker for lip tracking
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (_faceLandmarker) return _faceLandmarker;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      _faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      console.log('[FluteVerse] Face Landmarker loaded for lip tracking.');
      return _faceLandmarker;
    } catch (err) {
      console.warn('[FluteVerse] Face Landmarker failed to load. Blow intensity disabled.', err);
      _faceLandmarker = null;
      return null;
    }
  })();

  return _initPromise;
}

export function getFaceLandmarker(): FaceLandmarker | null {
  return _faceLandmarker;
}

/**
 * Calculate lip openness from face landmarks
 * Uses landmarks: 13 (upper lip), 14 (lower lip), 61 (left corner), 291 (right corner)
 */
export function getLipOpenness(landmarks: Array<{ x: number; y: number; z: number }>): number {
  if (!landmarks || landmarks.length < 478) return 0.5;

  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];

  // Vertical opening (euclidean distance upper → lower lip)
  const lipHeight = Math.sqrt(
    Math.pow(upperLip.x - lowerLip.x, 2) +
    Math.pow(upperLip.y - lowerLip.y, 2)
  );

  // Mouth width (left corner → right corner) — used to normalize
  const mouthWidth = Math.sqrt(
    Math.pow(leftCorner.x - rightCorner.x, 2) +
    Math.pow(leftCorner.y - rightCorner.y, 2)
  );

  if (mouthWidth === 0) return 0;
  const rawRatio = lipHeight / mouthWidth;

  // Remap to 0.0 → 1.0 range
  // Empirical thresholds: closed ≈ 0.02, wide open ≈ 0.35
  const MIN_RATIO = 0.03;
  const MAX_RATIO = 0.32;
  const clamped = Math.max(0, Math.min(1,
    (rawRatio - MIN_RATIO) / (MAX_RATIO - MIN_RATIO)
  ));

  return clamped; // 0.0 = closed, 1.0 = fully open
}

/**
 * Detect face and extract lip openness
 * Returns both intensity and the landmarks for visualization
 */
export function detectLipOpennessWithLandmarks(
  video: HTMLVideoElement,
  timestampMs: number
): { intensity: number; landmarks: Array<{ x: number; y: number; z: number }> } | null {
  if (!_faceLandmarker) return null;

  try {
    const results: FaceLandmarkerResult = _faceLandmarker.detectForVideo(video, timestampMs);
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];
      const intensity = getLipOpenness(landmarks);
      return { intensity, landmarks };
    }
  } catch (err) {
    // Timestamp conflict - skip this frame silently
    return null;
  }

  return null;
}

/**
 * Detect face and extract lip openness (legacy - for backward compatibility)
 */
export function detectLipOpenness(
  video: HTMLVideoElement,
  timestampMs: number
): number | null {
  const result = detectLipOpennessWithLandmarks(video, timestampMs);
  return result ? result.intensity : null;
}

/**
 * Smooth blow intensity using lerp
 */
export class BlowIntensitySmoothing {
  private smoothed: number = 0.5;
  private lastKnown: number = 0.5;
  private readonly lerpFactor: number = 0.12;

  update(rawValue: number | null): number {
    if (rawValue !== null) {
      this.smoothed += (rawValue - this.smoothed) * this.lerpFactor;
      this.lastKnown = this.smoothed;
    }
    // If no face detected, hold last known value
    return this.lastKnown;
  }

  reset(): void {
    this.smoothed = 0.5;
    this.lastKnown = 0.5;
  }

  getCurrent(): number {
    return this.lastKnown;
  }
}
