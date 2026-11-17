import { sameDay } from './format';
import { FREE_COMMENTS, FREE_STORIES, Moment, Profile, Story } from './types';

/** Regras do produto num lugar só (e testadas em __tests__/rules.test.ts). */

/** A Lumi comenta? Grátis: os 10 primeiros moments. Memora+: todos. */
export const canComment = (p: Pick<Profile, 'plus' | 'commentsUsed'>) => p.plus || p.commentsUsed < FREE_COMMENTS;

/** Quantos stories ainda dá pra criar no grátis (Infinity no Memora+). */
export const storiesLeft = (p: Pick<Profile, 'plus'>, stories: Story[]) =>
  p.plus ? Infinity : Math.max(0, FREE_STORIES - stories.length);

/** @menções de um texto, sem repetir (ignora maiúsculas/minúsculas). */
export function extractMentions(text: string): string[] {
  const seen = new Map<string, string>();
  for (const m of text.matchAll(/@([\p{L}\d_]+)/gu)) {
    const key = m[1].toLowerCase();
    if (!seen.has(key)) seen.set(key, m[1]);
  }
  return [...seen.values()];
}

/** Transforma um nome num @usuário válido: minúsculas, sem acento, só a-z 0-9 . _ */
export const toHandle = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^@/, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 24);

/**
 * Lembrete da noite: "só nos dias sem moment".
 * Devolve os horários dos próximos `days` dias em que ainda não há moment.
 * Hoje entra só se o horário ainda não passou.
 */
export function reminderDates(now: Date, hour: number, moments: Pick<Moment, 'date'>[], days = 7): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0, 0, 0);
    if (d <= now) continue;
    if (moments.some((m) => sameDay(new Date(m.date), d))) continue;
    out.push(d);
  }
  return out;
}
