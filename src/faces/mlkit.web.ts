import type { DetectedFace } from './logic';

/** Na web (só prévias) não há detector de rostos. */
export const faceDetectionAvailable = () => false;
export async function detectFaces(_uri: string): Promise<DetectedFace[]> {
  return [];
}
