import { useEffect, useRef, useState } from 'react';
import { uid, useStore } from '../store';
import { Face } from '../types';
import { facesInPhoto, FoundFace } from './extract';
import { autoAssign } from './logic';
import { faceDetectionAvailable } from './mlkit';

/**
 * Procura rostos, um moment por vez, nas fotos que ainda não foram vistas
 * (os novos e os antigos). Roda em segundo plano, sem travar nada.
 * Desliga em Ajustes > Rostos nas fotos.
 */
export function useFaceScanner() {
  const { ready, moments, profile, addFaces } = useStore();
  const busy = useRef(false);
  const failed = useRef(new Set<string>());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ready || !profile.faces || busy.current || !faceDetectionAvailable()) return;
    const next = moments.find((m) => !m.facesScanned && m.photos.length > 0 && !failed.current.has(m.id));
    if (!next) return;
    busy.current = true;
    (async () => {
      try {
        const found: FoundFace[] = [];
        for (const p of next.photos) found.push(...(await facesInPhoto(p)));
        const who = autoAssign(found.length, next.people);
        const now = new Date().toISOString();
        const faces: Face[] = found.map((f) => ({
          ...f,
          id: uid(),
          momentId: next.id,
          status: who ? 'person' : 'new',
          ...(who ? { personId: who } : {}),
          createdAt: now,
        }));
        addFaces(next.id, faces);
      } catch (e) {
        console.warn('[memora/faces]', e);
        failed.current.add(next.id); // tenta de novo na próxima vez que o app abrir
      } finally {
        busy.current = false;
        setTick((t) => t + 1);
      }
    })();
  }, [ready, profile.faces, moments, addFaces, tick]);
}
