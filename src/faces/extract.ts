import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { persistPhoto, photoUri } from '../photos';
import { Face } from '../types';
import { cropSquare, keepFaces, normalizeBox } from './logic';
import { detectFaces } from './mlkit';

export type FoundFace = Pick<Face, 'photo' | 'crop' | 'box'>;

/**
 * Acha os rostos de uma foto e salva um recorte quadrado de cada um
 * (256×256, na pasta photos/faces). Tudo no aparelho.
 */
export async function facesInPhoto(stored: string): Promise<FoundFace[]> {
  // 1) a foto "em pé" (orientação da câmera aplicada) e menor: detecção mais
  //    rápida, e as caixas do detector ficam no mesmo sistema do recorte
  const img = await ImageManipulator.manipulate(photoUri(stored), { maxWidth: 1280, maxHeight: 1280 }).renderAsync();
  const norm = await img.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
  try {
    const W = norm.width;
    const H = norm.height;
    const faces = keepFaces(await detectFaces(norm.uri), W, H);
    const out: FoundFace[] = [];
    for (const f of faces) {
      // 2) recorte com folga em volta do rosto, vira a "bolinha" da pessoa
      const c = cropSquare(f.frame, W, H);
      const crop = await ImageManipulator.manipulate(img)
        .crop({ originX: c.x, originY: c.y, width: c.w, height: c.h })
        .resize({ width: 256, height: 256 })
        .renderAsync();
      const saved = await crop.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
      out.push({ photo: stored, crop: await persistPhoto(saved.uri, 'faces'), box: normalizeBox(f.frame, W, H) });
    }
    return out;
  } finally {
    try {
      new File(norm.uri).delete();
    } catch {}
  }
}
