/** @jest-environment node */
import { fold, highlight, search, terms } from '@/search';
import { Moment, Person, Story } from '@/types';

const people: Person[] = [
  { id: 'p1', name: 'Mari' },
  { id: 'p2', name: 'Théo' },
];
const stories: Story[] = [{ id: 's1', title: 'Amigos', category: 'Amigos', year: 2026, updatedAt: '2026-10-01T00:00:00Z' }];
const m = (id: string, over: Partial<Moment>): Moment => ({
  id,
  title: '',
  text: '',
  photos: [],
  people: [],
  date: '2026-10-01T12:00:00Z',
  ...over,
});
const moments: Moment[] = [
  m('a', { title: 'Primeiro café do outono', text: 'Latte de abóbora, óbvio', place: { name: 'Café da Esquina', latitude: 0, longitude: 0 }, date: '2026-10-20T10:00:00Z' }),
  m('b', { title: 'Piquenique', text: 'Com @Mari depois da aula', people: ['p1'], storyId: 's1', date: '2026-10-12T10:00:00Z' }),
  m('c', { title: 'Treino de perna', text: 'Com o @Théo', people: ['p2'], place: { name: 'Iron Gym', latitude: 0, longitude: 0 }, date: '2026-09-03T10:00:00Z' }),
  m('d', { title: 'Mais café', text: 'segunda xícara', place: { name: 'Café da Esquina', latitude: 0, longitude: 0 }, date: '2026-10-21T10:00:00Z' }),
];
const data = { moments, people, stories };

describe('busca', () => {
  it('ignora acento e caixa', () => {
    expect(fold('Café da MANHÃ')).toBe('cafe da manha');
    expect(terms('  @Théo  perna ')).toEqual(['theo', 'perna']);
  });

  it('acha pelo título, sem acento (empate: o mais recente primeiro)', () => {
    const r = search('cafe', data);
    expect(r.moments.map((x) => x.id)).toEqual(['d', 'a']);
  });

  it('todas as palavras precisam bater', () => {
    expect(search('cafe outono', data).moments.map((x) => x.id)).toEqual(['a']);
    expect(search('cafe gym', data).moments).toEqual([]);
  });

  it('acha pela pessoa marcada, pelo lugar e pelo story', () => {
    expect(search('@theo', data).moments.map((x) => x.id)).toEqual(['c']);
    expect(search('theo', data).people.map((p) => p.id)).toEqual(['p2']);
    expect(search('iron', data).moments.map((x) => x.id)).toEqual(['c']);
    expect(search('amigos', data).moments.map((x) => x.id)).toEqual(['b']);
    expect(search('amigos', data).stories.map((s) => s.id)).toEqual(['s1']);
  });

  it('agrupa lugares e conta os moments', () => {
    expect(search('esquina', data).places).toEqual([{ name: 'Café da Esquina', count: 2, momentId: 'a' }]);
  });

  it('busca vazia não devolve nada', () => {
    expect(search('   ', data).moments).toEqual([]);
  });
});

describe('marca-texto', () => {
  it('pinta o trecho original, com acento', () => {
    expect(highlight('Primeiro café do outono', 'cafe')).toEqual([
      { text: 'Primeiro ', hit: false },
      { text: 'café', hit: true },
      { text: ' do outono', hit: false },
    ]);
  });

  it('corta texto longo em volta do acerto', () => {
    const long = 'a '.repeat(80) + 'praia' + ' b'.repeat(80);
    const parts = highlight(long, 'praia', 20);
    expect(parts[0].text).toBe('…');
    expect(parts.some((p) => p.hit && p.text === 'praia')).toBe(true);
    expect(parts[parts.length - 1].text).toBe('…');
  });

  it('sem busca devolve o texto inteiro', () => {
    expect(highlight('oi', '')).toEqual([{ text: 'oi', hit: false }]);
  });
});
