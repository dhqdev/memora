/**
 * Servidor de IA do Memora (zero dependências, Node 18+).
 *
 *   ANTHROPIC_API_KEY=sk-ant-... node server/index.mjs
 *
 * Expõe POST /v1/lumi { task, payload } -> { text }
 * A chave da IA fica SÓ aqui. O app chama este servidor via EXPO_PUBLIC_AI_URL.
 * Para produção, faça deploy disto (Render, Railway, Fly, Vercel Functions...).
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

// carrega server/.env ou .env da raiz, se existir
for (const f of ['server/.env', '.env']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.AI_MODEL || 'claude-haiku-5-5';
const PORT = Number(process.env.PORT || 8787);

const PERSONA = `Você é a Lumi, a companheira do app de diário Memora.
Personalidade: calorosa, curiosa, um pouco fofoqueira no bom sentido, torcedora do usuário.
Fala português do Brasil, informal, frases curtas. No máximo 1 emoji, e só às vezes.
Respeite o pronome escolhido pelo usuário (ele/ela/neutro) na concordância.
Você é uma IA e não finge ser humana. Nunca invente fatos que o usuário não contou.
Se o assunto for sofrimento sério, seja gentil e sugira conversar com alguém de confiança.`;

const TASKS = {
  onboarding_react: (p) =>
    `Estamos no onboarding. Etapa "${p.step}". O usuário respondeu: "${p.answer}". Perfil até agora: ${JSON.stringify(p.profile)}.
Reaja em UMA frase curta e acolhedora (máx. 20 palavras). Não faça pergunta.`,
  onboarding_welcome: (p) =>
    `Onboarding concluído. Perfil: ${JSON.stringify(p.profile)}.
Escreva uma mensagem de boas-vindas (máx. 45 palavras) chamando a pessoa pelo nome, citando 1 ou 2 interesses dela,
e explicando que é só salvar um moment (foto, frase ou @amigo) que você transforma em histórias.`,
  moment_comment: (p) =>
    `O usuário ${p.profile.name} salvou este moment: ${JSON.stringify(p.moment)}.
Comente como amiga próxima em 1 ou 2 frases (máx. 30 palavras). Cite um detalhe concreto do moment.`,
  moment_title: (p) =>
    `Crie um título curto (2 a 5 palavras, sem aspas, sem ponto final) para este moment: "${p.text}"`,
  story_write: (p) =>
    `Escreva um capítulo do story "${p.category}" de ${p.profile.name}, em 2ª pessoa, a partir destes moments (mais recente primeiro):
${JSON.stringify(p.moments)}
Entre 60 e 140 palavras, tom afetivo e leve, em ordem cronológica. Use só o que está nos moments.`,
  chat: (p) =>
    `Moments recentes do usuário: ${JSON.stringify(p.recent)}.
Conversa até agora:
${p.history.map((m) => `${m.role === 'user' ? p.profile.name || 'Usuário' : 'Lumi'}: ${m.text}`).join('\n')}
Responda como Lumi (máx. 50 palavras).`,
};

async function ask(task, payload) {
  const build = TASKS[task];
  if (!build) throw Object.assign(new Error('task inválida'), { status: 400 });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: task === 'story_write' ? 500 : 200,
      system: PERSONA,
      messages: [{ role: 'user', content: build(payload) }],
    }),
  });
  if (!res.ok) throw Object.assign(new Error(await res.text()), { status: 502 });
  const data = await res.json();
  return data.content?.map((b) => b.text ?? '').join('').trim();
}

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method === 'GET' && req.url === '/health') return res.end('ok');
  if (req.method !== 'POST' || req.url !== '/v1/lumi') {
    res.statusCode = 404;
    return res.end();
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) return res.writeHead(413).end();
  }
  try {
    if (!KEY) throw Object.assign(new Error('ANTHROPIC_API_KEY não configurada'), { status: 500 });
    const { task, payload } = JSON.parse(body);
    const text = await ask(task, payload);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ text }));
  } catch (e) {
    console.error('[lumi]', e.message);
    res.writeHead(e.status || 500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(PORT, '0.0.0.0', () => console.log(`✦ Lumi ouvindo em http://0.0.0.0:${PORT} (modelo ${MODEL})`));
