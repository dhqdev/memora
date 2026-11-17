/**
 * Cliente de IA do Memora.
 *
 * O app NUNCA fala direto com o provedor de IA (a chave vazaria no bundle).
 * Ele chama o servidor em `server/index.mjs` via EXPO_PUBLIC_AI_URL.
 * Se o servidor não estiver configurado ou falhar, a Lumi responde com
 * falas offline — o app continua funcionando.
 */
import { Moment, Profile, Pronoun } from './types';

const BASE = process.env.EXPO_PUBLIC_AI_URL;

export type AITask =
  | 'onboarding_react'
  | 'onboarding_welcome'
  | 'moment_comment'
  | 'moment_title'
  | 'story_write'
  | 'chat';

async function call<T extends object>(task: AITask, payload: T, fallback: string): Promise<string> {
  if (!BASE) return fallback;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${BASE}/v1/lumi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, payload }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return fallback;
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const adj = (p: Pronoun, m: string, f: string, n: string) => (p === 'ele' ? m : p === 'ela' ? f : n);

// ---------- Onboarding ----------

export function reactToAnswer(step: string, answer: string, profile: Partial<Profile>) {
  const name = profile.name || '';
  const fallbacks: Record<string, string> = {
    name: `${answer}! Que nome bonito. Já tô guardando aqui.`,
    pronoun: 'Anotado. Vou falar do jeitinho que você prefere.',
    interests: `Amei. ${answer.split(',')[0]} vai render boas histórias, sinto isso.`,
    people: answer ? `Já quero conhecer ${answer.split(',')[0].trim()} pelas suas memórias.` : 'Tudo bem, a gente descobre junto com o tempo.',
    reminder: answer === 'off' ? 'Sem lembretes então. Eu espero você vir.' : `Combinado, ${name}. Às ${answer}h eu dou um oi, só nos dias sem moment.`,
  };
  return call('onboarding_react', { step, answer, profile }, fallbacks[step] ?? 'Entendi!');
}

export function welcomeMessage(profile: Partial<Profile>) {
  const p = profile.pronoun ?? 'neutro';
  const fb = `Pronto, ${profile.name}! Agora é só salvar um moment quando algo acontecer — uma foto, uma frase, um @amigo. Eu leio tudo e vou transformando seus dias em histórias. Tô ${adj(p, 'animado', 'animada', 'animade')} pra começar com você.`;
  return call('onboarding_welcome', { profile }, fb);
}

// ---------- Moments ----------

export function commentMoment(moment: Moment, profile: Profile, peopleNames: string[]) {
  const who = peopleNames.length ? ` com ${peopleNames.join(' e ')}` : '';
  const fb = pick([
    `Que moment${who}! Isso aqui vai ficar lindo na sua história.`,
    `Guardei com carinho. Daqui a um ano você vai sorrir lendo isso.`,
    `Eu precisava saber disso. Me conta mais da próxima vez?`,
    `Esses são os dias que valem um capítulo inteiro.`,
  ]);
  return call(
    'moment_comment',
    { moment: { title: moment.title, text: moment.text, place: moment.place?.name, people: peopleNames, date: moment.date }, profile: { name: profile.name, pronoun: profile.pronoun } },
    fb,
  );
}

export function suggestTitle(text: string) {
  const fb = text.split(/[.!?\n]/)[0].slice(0, 40) || 'Um moment';
  return call('moment_title', { text }, fb);
}

// ---------- Stories ----------

export function writeStory(category: string, moments: Moment[], profile: Profile) {
  const fb =
    moments.length === 0
      ? `Esse capítulo ainda está em branco, ${profile.name}. O primeiro moment vai dar o tom.`
      : `Tudo começou com "${moments[moments.length - 1].title}". ${moments.length > 1 ? `Depois vieram mais ${moments.length - 1} moments, cada um somando um pedacinho.` : 'Um começo simples, do jeito que as melhores histórias começam.'} E a gente só está no início.`;
  return call(
    'story_write',
    { category, moments: moments.map((m) => ({ title: m.title, text: m.text, date: m.date, place: m.place?.name })), profile: { name: profile.name, pronoun: profile.pronoun } },
    fb,
  );
}

// ---------- Chat livre com a Lumi ----------

export function chat(history: { role: 'user' | 'lumi'; text: string }[], profile: Profile, recent: Moment[]) {
  const fb = pick([
    'Tô aqui! Me conta o que aconteceu hoje.',
    'Hmm, boa pergunta. Que tal salvar isso como um moment?',
    'Adoro quando você aparece pra conversar.',
  ]);
  return call('chat', { history, profile: { name: profile.name, pronoun: profile.pronoun }, recent: recent.slice(0, 8).map((m) => ({ title: m.title, text: m.text, date: m.date })) }, fb);
}
