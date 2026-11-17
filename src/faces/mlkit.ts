import { requireOptionalNativeModule } from 'expo';
import type { DetectedFace } from './logic';

/**
 * Detecção de rostos no próprio aparelho (Google ML Kit). Nenhuma foto sai do
 * celular. Precisa do app instalado (build do EAS ou `expo run`); no Expo Go o
 * módulo nativo não existe e a função fica desligada sem quebrar nada.
 */
let available: boolean | undefined;
export const faceDetectionAvailable = () => (available ??= !!requireOptionalNativeModule('RNMLKitFaceDetection'));

type Detector = {
  initialize(): Promise<void>;
  detectFaces(uri: string): Promise<{ faces: { frame: { origin: { x: number; y: number }; size: { x: number; y: number } }; headEulerAngleY?: number | null }[] } | undefined>;
};
let detector: Promise<Detector> | null = null;

function getDetector() {
  detector ??= (async () => {
    // carregado só aqui: importar no topo quebraria o app no Expo Go
    const { RNMLKitFaceDetector } = require('@infinitered/react-native-mlkit-face-detection');
    const d: Detector = new RNMLKitFaceDetector(
      { performanceMode: 'accurate', landmarkMode: false, contourMode: false, classificationMode: false, minFaceSize: 0.08, isTrackingEnabled: false },
      true,
    );
    await d.initialize();
    return d;
  })().catch((e) => {
    detector = null;
    throw e;
  });
  return detector;
}

/** Rostos de uma imagem já normalizada (em pixels dessa imagem). */
export async function detectFaces(uri: string): Promise<DetectedFace[]> {
  if (!faceDetectionAvailable()) return [];
  const d = await getDetector();
  const res = await d.detectFaces(uri);
  return (res?.faces ?? []).map((f) => ({
    frame: { x: f.frame.origin.x, y: f.frame.origin.y, w: f.frame.size.x, h: f.frame.size.y },
    yaw: f.headEulerAngleY ?? null,
  }));
}
