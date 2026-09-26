import { FilesetResolver } from '@mediapipe/tasks-vision';

let _visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

export function getVision() {
  if (!_visionPromise) {
    _visionPromise = FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );
  }
  return _visionPromise;
}
