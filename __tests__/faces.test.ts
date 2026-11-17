/** @jest-environment node */
import { autoAssign, cropSquare, keepFaces, mentionsName, normalizeBox, peopleAfterFaceChange, rankPeople, unnamedFaces } from '@/faces/logic';
import { Face, Person } from '@/types';

const W = 1000, H = 800;

describe('keepFaces', () => {
  it('descarta rostos minúsculos e de perfil, maiores primeiro', () => {
    const faces = [
      { frame: { x: 10, y: 10, w: 20, h: 20 } }, // pequeno demais (fundo da foto)
      { frame: { x: 100, y: 100, w: 120, h: 140 }, yaw: 5 },
      { frame: { x: 500, y: 100, w: 200, h: 220 }, yaw: -12 },
      { frame: { x: 300, y: 300, w: 150, h: 150 }, yaw: 70 }, // de lado
    ];
    expect(keepFaces(faces, W, H).map((f) => f.frame.x)).toEqual([500, 100]);
  });
  it('no máximo 8 por foto', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ frame: { x: i * 80, y: 0, w: 70, h: 70 } }));
    expect(keepFaces(many, W, H)).toHaveLength(8);
  });
});

describe('cropSquare', () => {
  it('quadrado com folga em volta do rosto', () => {
    const c = cropSquare({ x: 400, y: 300, w: 100, h: 120 }, W, H);
    expect(c.w).toBe(c.h);
    expect(c.w).toBe(204);
    // o rosto inteiro fica dentro do recorte
    expect(c.x).toBeLessThanOrEqual(400);
    expect(c.x + c.w).toBeGreaterThanOrEqual(500);
    expect(c.y).toBeLessThanOrEqual(300);
    expect(c.y + c.h).toBeGreaterThanOrEqual(420);
  });
  it('nunca sai da foto, nem no canto', () => {
    for (const f of [
      { x: 0, y: 0, w: 150, h: 150 },
      { x: 900, y: 700, w: 100, h: 100 },
      { x: 50, y: 10, w: 700, h: 780 },
    ]) {
      const c = cropSquare(f, W, H);
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(W);
      expect(c.y + c.h).toBeLessThanOrEqual(H);
      expect(Number.isInteger(c.x) && Number.isInteger(c.w)).toBe(true);
    }
  });
});

it('normalizeBox guarda a posição em frações', () => {
  expect(normalizeBox({ x: 250, y: 200, w: 100, h: 80 }, W, H)).toEqual({ x: 0.25, y: 0.25, w: 0.1, h: 0.1 });
});

describe('autoAssign', () => {
  it('um rosto e uma pessoa marcada: é ela', () => {
    expect(autoAssign(1, ['p1'])).toBe('p1');
  });
  it('na dúvida, pergunta', () => {
    expect(autoAssign(2, ['p1'])).toBeNull();
    expect(autoAssign(1, ['p1', 'p2'])).toBeNull();
    expect(autoAssign(1, [])).toBeNull();
    expect(autoAssign(0, ['p1'])).toBeNull();
  });
});

const face = (id: string, momentId: string, over: Partial<Face> = {}): Face => ({
  id, momentId, photo: 'a.jpg', crop: id + '.jpg', box: { x: 0, y: 0, w: 0.1, h: 0.1 }, status: 'new', createdAt: '', ...over,
});

it('unnamedFaces: só os sem nome, do moment mais novo pro mais velho', () => {
  const moments = [{ id: 'velho', date: '2026-01-01' }, { id: 'novo', date: '2026-11-01' }];
  const faces = [face('a', 'velho'), face('b', 'novo'), face('c', 'novo', { status: 'person', personId: 'p1' }), face('d', 'novo', { status: 'ignored' })];
  expect(unnamedFaces(faces, moments).map((f) => f.id)).toEqual(['b', 'a']);
});

describe('rankPeople (ordem das bolinhas)', () => {
  const people: Person[] = [{ id: 'ana', name: 'Ana' }, { id: 'bia', name: 'Bia' }, { id: 'caio', name: 'Caio' }, { id: 'davi', name: 'Davi' }];
  const moments = [
    { id: 'm1', date: '2026-11-01', people: ['ana'] },
    { id: 'm2', date: '2026-11-02', people: ['bia'] },
    { id: 'm3', date: '2026-11-03', people: [] },
    { id: 'm4', date: '2026-11-04', people: ['caio'] },
  ];
  it('quem aparece em mais moments (por @ ou pelo rosto) vem primeiro', () => {
    const faces = [
      face('f1', 'm3', { status: 'person', personId: 'bia' }),
      face('f2', 'm1', { status: 'person', personId: 'bia' }),
      face('f3', 'm2', { status: 'person', personId: 'bia' }), // mesmo moment do @: conta uma vez
    ];
    expect(rankPeople(people, moments, faces).map((p) => p.id)).toEqual(['bia', 'caio', 'ana', 'davi']);
  });
  it('rosto sem nome não conta pra ninguém', () => {
    const faces = [face('f1', 'm3', { status: 'new' })];
    expect(rankPeople(people, moments, faces).map((p) => p.id)).toEqual(['caio', 'bia', 'ana', 'davi']);
  });
});

it('mentionsName acha o @ inteiro, sem confundir nomes parecidos', () => {
  expect(mentionsName('café com @Bia hoje', 'bia')).toBe(true);
  expect(mentionsName('café com @Biazinha', 'Bia')).toBe(false);
  expect(mentionsName('café com Bia', 'Bia')).toBe(false);
});

describe('peopleAfterFaceChange (quem fica marcado no moment)', () => {
  const people = [{ id: 'bia', name: 'Bia' }, { id: 'caio', name: 'Caio' }];
  const m = { id: 'm1', text: 'Show com @Caio', people: ['caio'] };

  it('dar o rosto a alguém marca a pessoa no moment', () => {
    expect(peopleAfterFaceChange(m, [], people, undefined, 'bia')).toEqual(['caio', 'bia']);
  });
  it('tirar o rosto de alguém que só estava pelo rosto desmarca', () => {
    const mm = { ...m, people: ['caio', 'bia'] };
    expect(peopleAfterFaceChange(mm, [], people, 'bia', undefined)).toEqual(['caio']);
  });
  it('quem está marcado com @ no texto continua', () => {
    expect(peopleAfterFaceChange(m, [], people, 'caio', 'bia')).toEqual(['caio', 'bia']);
  });
  it('se outro rosto do moment ainda é da pessoa, ela continua', () => {
    const mm = { ...m, people: ['caio', 'bia'] };
    expect(peopleAfterFaceChange(mm, [{ momentId: 'm1', personId: 'bia' }], people, 'bia', undefined)).toEqual(['caio', 'bia']);
  });
  it('sem mudança, devolve a mesma lista', () => {
    expect(peopleAfterFaceChange(m, [], people, undefined, 'caio')).toBe(m.people);
  });
});
