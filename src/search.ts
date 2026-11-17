import { Moment, Person, Story } from './types';

/**
 * Busca nos moments, pessoas, stories e lugares — tudo no aparelho.
 * Sem acento e sem diferenciar maiúsculas: "cafe" acha "Café".
 * Cada palavra digitada precisa aparecer em algum lugar do moment.
 */

/** Tira acentos e caixa: "Café da Manhã" → "cafe da manha". */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Palavras da busca, sem o @ das menções. */
export const terms = (q: string) =>
  fold(q)
    .split(/\s+/)
    .map((t) => t.replace(/^@/, ''))
    .filter(Boolean);

export interface PlaceHit {
  name: string;
  count: number;
  momentId: string;
}

export interface SearchResults {
  moments: Moment[];
  people: Person[];
  stories: Story[];
  places: PlaceHit[];
}

export const EMPTY_RESULTS: SearchResults = { moments: [], people: [], stories: [], places: [] };

export function search(
  q: string,
  data: { moments: Moment[]; people: Person[]; stories: Story[] },
): SearchResults {
  const t = terms(q);
  if (!t.length) return EMPTY_RESULTS;
  const all = (hay: string) => t.every((w) => hay.includes(w));

  const names = new Map(data.people.map((p) => [p.id, fold(p.name)]));
  const storyText = new Map(data.stories.map((s) => [s.id, fold(`${s.title} ${s.category}`)]));

  const scored: { m: Moment; score: number }[] = [];
  for (const m of data.moments) {
    const title = fold(m.title);
    const text = fold(m.text);
    const place = fold(m.place?.name ?? '');
    const who = m.people.map((id) => names.get(id) ?? '').join(' ');
    const story = m.storyId ? storyText.get(m.storyId) ?? '' : '';
    if (!all(`${title} ${text} ${place} ${who} ${story}`)) continue;
    // título vale mais; pessoa e lugar, um pouco mais que o texto corrido
    let score = 0;
    for (const w of t) {
      if (title.includes(w)) score += 3;
      if (who.includes(w) || place.includes(w)) score += 2;
      if (text.includes(w)) score += 1;
    }
    scored.push({ m, score });
  }
  scored.sort((a, b) => b.score - a.score || +new Date(b.m.date) - +new Date(a.m.date));

  const places = new Map<string, PlaceHit>();
  for (const m of data.moments) {
    if (!m.place || !all(fold(m.place.name))) continue;
    const hit = places.get(m.place.name);
    if (hit) hit.count += 1;
    else places.set(m.place.name, { name: m.place.name, count: 1, momentId: m.id });
  }

  return {
    moments: scored.map((s) => s.m),
    people: data.people.filter((p) => all(fold(p.name))),
    stories: data.stories.filter((s) => all(storyText.get(s.id) ?? '')),
    places: [...places.values()].sort((a, b) => b.count - a.count),
  };
}

/**
 * Quebra um texto em pedaços marcando onde a busca bateu (para pintar o
 * marca-texto). Respeita acentos: buscar "cafe" pinta o "Café" original.
 * Textos longos são cortados em volta do primeiro acerto.
 */
export function highlight(text: string, q: string, around = 48): { text: string; hit: boolean }[] {
  const t = terms(q);
  if (!t.length || !text) return [{ text, hit: false }];

  // versão sem acento + de qual letra original veio cada letra dela
  let folded = '';
  const from: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]);
    for (let k = 0; k < f.length; k++) {
      folded += f[k];
      from.push(i);
    }
  }

  const marks = new Array<boolean>(text.length).fill(false);
  for (const w of t) {
    let at = folded.indexOf(w);
    while (at !== -1) {
      for (let k = at; k < at + w.length; k++) marks[from[k]] = true;
      at = folded.indexOf(w, at + w.length);
    }
  }

  let start = 0;
  let end = text.length;
  const first = marks.indexOf(true);
  if (text.length > around * 2 && first !== -1) {
    start = Math.max(0, first - Math.round(around * 0.6));
    end = Math.min(text.length, start + around * 2);
  } else if (text.length > around * 2) {
    end = around * 2;
  }

  const parts: { text: string; hit: boolean }[] = [];
  for (let i = start; i < end; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: marks[i] });
  }
  if (start > 0) parts.unshift({ text: '…', hit: false });
  if (end < text.length) parts.push({ text: '…', hit: false });
  return parts;
}
