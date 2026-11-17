import { Face, Moment, Person } from '../types';

/**
 * Regras dos rostos, sem nada de câmera ou arquivo (testadas em __tests__/faces.test.ts).
 */
export type Box = { x: number; y: number; w: number; h: number };
export type DetectedFace = { frame: Box; yaw?: number | null };

/** Fica só com rostos bons pra virar avatar: grandes o bastante e mais ou menos de frente. */
export function keepFaces(faces: DetectedFace[], W: number, H: number, max = 8): DetectedFace[] {
  const minSide = Math.min(W, H) * 0.06;
  return faces
    .filter((f) => f.frame.w >= minSide && f.frame.h >= minSide && Math.abs(f.yaw ?? 0) <= 40)
    .sort((a, b) => b.frame.w * b.frame.h - a.frame.w * a.frame.h)
    .slice(0, max);
}

/**
 * Recorte quadrado em volta do rosto, com folga pro cabelo e o queixo,
 * sempre dentro da foto (em pixels inteiros).
 */
export function cropSquare(f: Box, W: number, H: number, pad = 1.7): Box {
  const side = Math.max(1, Math.floor(Math.min(Math.max(f.w, f.h) * pad, W, H)));
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2 - f.h * 0.08; // sobe um pouco: entra o cabelo
  const x = Math.min(Math.max(0, Math.round(cx - side / 2)), W - side);
  const y = Math.min(Math.max(0, Math.round(cy - side / 2)), H - side);
  return { x, y, w: side, h: side };
}

/** Caixa do rosto em frações da foto (0 a 1), pra não depender do tamanho da imagem. */
export const normalizeBox = (f: Box, W: number, H: number): Box => ({
  x: +(f.x / W).toFixed(4),
  y: +(f.y / H).toFixed(4),
  w: +(f.w / W).toFixed(4),
  h: +(f.h / H).toFixed(4),
});

/**
 * De quem é o rosto, sem perguntar? Só quando não há dúvida:
 * o moment inteiro tem um rosto só e uma pessoa só marcada com @.
 */
export function autoAssign(faceCount: number, mentioned: string[]): string | null {
  return faceCount === 1 && mentioned.length === 1 ? mentioned[0] : null;
}

/** Rostos esperando um nome, dos moments mais novos pros mais velhos. */
export function unnamedFaces(faces: Face[], moments: Pick<Moment, 'id' | 'date'>[]): Face[] {
  const date = new Map(moments.map((m) => [m.id, +new Date(m.date)]));
  return faces.filter((f) => f.status === 'new').sort((a, b) => (date.get(b.momentId) ?? 0) - (date.get(a.momentId) ?? 0));
}

/**
 * Ordem das bolinhas de pessoas: quem aparece em mais moments vem primeiro
 * (marcado com @ ou reconhecido pelo rosto); empate, quem apareceu por último.
 */
export function rankPeople(people: Person[], moments: Pick<Moment, 'id' | 'date' | 'people'>[], faces: Pick<Face, 'momentId' | 'personId' | 'status'>[]): Person[] {
  const seen = new Map<string, Set<string>>();
  const last = new Map<string, number>();
  const date = new Map(moments.map((m) => [m.id, +new Date(m.date)]));
  const add = (pid: string, mid: string) => {
    if (!seen.has(pid)) seen.set(pid, new Set());
    seen.get(pid)!.add(mid);
    last.set(pid, Math.max(last.get(pid) ?? 0, date.get(mid) ?? 0));
  };
  for (const m of moments) for (const pid of m.people) add(pid, m.id);
  for (const f of faces) if (f.status === 'person' && f.personId) add(f.personId, f.momentId);
  const count = (p: Person) => seen.get(p.id)?.size ?? 0;
  return [...people].sort((a, b) => count(b) - count(a) || (last.get(b.id) ?? 0) - (last.get(a.id) ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Quem fica marcado no moment depois que um rosto muda de dono:
 * quem ganhou o rosto entra; quem perdeu sai, a não ser que o texto marque
 * com @ ou outro rosto do mesmo moment seja dela.
 */
export function peopleAfterFaceChange(
  moment: Pick<Moment, 'id' | 'text' | 'people'>,
  facesAfter: Pick<Face, 'momentId' | 'personId'>[],
  people: Pick<Person, 'id' | 'name'>[],
  prev: string | undefined,
  next: string | undefined,
): string[] {
  let ids = moment.people;
  if (prev && prev !== next) {
    const name = people.find((p) => p.id === prev)?.name ?? '';
    const stillThere = (name && mentionsName(moment.text, name)) || facesAfter.some((f) => f.momentId === moment.id && f.personId === prev);
    if (!stillThere) ids = ids.filter((id) => id !== prev);
  }
  if (next && !ids.includes(next)) ids = [...ids, next];
  return ids;
}

/** O moment ainda cita a pessoa no texto com @? (aí ela continua marcada mesmo sem o rosto) */
export const mentionsName = (text: string, name: string) =>
  new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d_])`, 'iu').test(text);
