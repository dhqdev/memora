# Memora ✦

> O diário que responde. Salve um moment em segundos, a **Lumi** reage, e seus dias viram histórias que dá vontade de reler.

Memora é um app de diário social para **iOS e Android**, feito em **React Native + Expo**. Ele tem uma companheira de IA, a Lumi, que conversa com você desde a primeira tela, comenta seus moments e escreve seus stories.

Inspiração de produto e de estilo: [OhMy! Journal](https://ohmyjournal.app/), com visual escuro, tipografia grande, falas em fonte mono e uma personagem sempre por perto.

---

## Funcionalidades

| Área | O que faz |
|---|---|
| **Boas-vindas com IA** | Uma conversa leve com a Lumi: nome, como ela deve falar com você (ele/ela/neutro), o que você quer guardar, pessoas importantes e lembrete da noite. A cada resposta a Lumi reage com IA, e no final escreve uma mensagem de boas-vindas personalizada. |
| **Moments** | Linha do tempo agrupada por mês, com fotos, lugar, story e pessoas. Marque amigos com `@nome` e uma página da pessoa é criada automaticamente. |
| **Pessoas pelos rostos** | O app acha os rostos nas fotos que você salva (no próprio aparelho) e monta as bolinhas de pessoas com eles, ordenadas por quem mais aparece. Rosto sem nome cai no **Quem é?**: um toque liga o rosto a alguém, a "Sou eu" ou a "Não é ninguém". Dá pra juntar duas pessoas que são a mesma. |
| **Stories** | Capítulos por parte da vida (Dia a dia, Amigos, Família, Estudos…). A Lumi escreve e reescreve cada capítulo a partir dos seus moments. |
| **Calendário** | Mês em grade com a miniatura de cada dia que tem moment. |
| **Lugares** | Mapa com pins de foto e um carrossel de vidro: deslize e o mapa voa até o lugar. No iOS usa o Apple Maps (tom discreto); no Android, Google Maps com estilo próprio creme/grafite. |
| **Perfil** | Foto, nome, @usuário, bio, números, suas pessoas e o grid dos seus moments. Dá pra compartilhar. |
| **Lumi** | Botão flutuante para conversar com ela. Ela conhece seus moments recentes. |
| **Ajustes** | Nome, pronome, tema (claro/escuro/sistema), voz da Lumi (um "pio" baixinho por palavra), vibração, mostrar a Lumi, notificações e apagar todos os dados (inclusive as fotos). |
| **Memora+** | Paywall (anual com 7 dias grátis / mensal). No grátis: a Lumi comenta 10 moments e você tem 4 stories. *As compras ainda não estão integradas.* |

## Stack

- **Expo SDK 58** + **Expo Router** (rotas por arquivo em `app/`)
- TypeScript
- **SQLite local** (`expo-sqlite`) para os dados: tudo fica no aparelho, com migrações versionadas (ver [Banco de dados local](#banco-de-dados-local))
- `expo-image-picker`, `expo-location`, `react-native-maps`, `expo-notifications`, `expo-haptics`, `expo-audio`, `expo-file-system`
- `react-native-svg` para a Lumi (desenho original com expressões) e os ícones
- `react-native-reanimated` para as transições (entrada dos itens, "digitando…", toque, Lumi flutuando)
- `@shopify/react-native-skia` para o efeito pontilhado (dithering) das capas dos stories
- Fontes Inter Tight (títulos), JetBrains Mono (etiquetas) e Pixelify Sans (falas da Lumi), via `@expo-google-fonts`
- **Liquid Glass** da Apple com `expo-glass-effect` nos botões, cartões do mapa e na assinatura (no Android e iOS antigo cai para um bloco translúcido)
- A Lumi é um retrato original em traço preto e branco, estilo mangá, desenhado em SVG (`src/components/lumiArt.ts`): franja em mechas, presilha ✦, olhos com íris em camadas, blush em retícula e suéter de gola canelada. 4 humores (feliz, animada, pensando, com sono) e piscada
- **Servidor de IA** em `server/index.mjs` (Node puro, zero dependências) chamando a API da Anthropic

## Estrutura

```
memora/
├── app/                      # telas (Expo Router)
│   ├── _layout.tsx           # providers + stack
│   ├── index.tsx             # redireciona para onboarding ou abas
│   ├── onboarding.tsx        # introdução conversada com a Lumi (IA)
│   ├── (tabs)/               # Moments · Stories · Calendário · Lugares
│   ├── new-moment.tsx        # criar moment (foto, @amigos, lugar, story)
│   ├── moment/[id].tsx
│   ├── story/[id].tsx        # capítulo escrito pela Lumi
│   ├── person/[id].tsx
│   ├── lumi.tsx              # chat com a Lumi
│   ├── settings.tsx
│   └── paywall.tsx
├── src/
│   ├── ai.ts                 # cliente de IA (com falas offline de fallback)
│   ├── store.tsx             # estado global (grava no banco a cada ação)
│   ├── db/                   # SQLite: schema + migrações, leitura/escrita, importação
│   ├── rules.ts              # regras do produto (limites, @menções, lembrete)
│   ├── reminders.ts          # agenda o lembrete só nos dias sem moment
│   ├── photos.ts             # copia as fotos pra pasta do app
│   ├── map/styles.ts         # estilo do mapa no Android
│   ├── faces/                # rostos: detecção (ML Kit), recorte, regras e varredura
│   ├── theme.ts              # cores, tema claro/escuro
│   ├── types.ts
│   └── components/           # Lumi, SpeechBubble, botões, segmented…
├── __tests__/                # testes (Jest)
├── server/index.mjs          # backend da IA (a chave fica só aqui)
└── assets/                   # ícone e splash (provisórios)
```

## Banco de dados local

Tudo fica num arquivo SQLite no aparelho (`memora.db`), aberto em `src/db/index.ts`.

| Tabela | Guarda |
|---|---|
| `settings` | o perfil (chave `profile`, em JSON) |
| `moments` | texto, fotos (caminhos relativos), lugar, data, story e o comentário da Lumi |
| `stories` | capítulos (o texto escrito pela Lumi fica em `body`) |
| `people` | pessoas marcadas com `@` (nome único, sem diferenciar maiúsculas) |
| `moment_people` | quem aparece em cada moment |

- **Migrações:** ficam em `src/db/schema.ts` e a versão em `PRAGMA user_version`. Para mudar o schema, **adicione** um item no fim de `MIGRATIONS` (nunca edite um que já foi publicado).
- **Integridade:** chaves estrangeiras ligadas. Apagar um moment apaga as marcações; apagar um story mantém os moments (só tira deles o story).
- **Escritas em fila:** cada ação da tela grava na hora, numa fila que nunca se atropela. A tela não espera o banco.
- **Quem usava a versão antiga** (dados no AsyncStorage) tem tudo importado na primeira abertura, uma vez só. Nomes repetidos viram uma pessoa só e referências quebradas são limpas.
- **Fotos** são copiadas para a pasta do app (`photos/`) e somem junto quando o moment é apagado.

## Rostos nas fotos

Tudo acontece **no aparelho**, com o Google ML Kit (`@infinitered/react-native-mlkit-face-detection`). Nenhuma foto sai do celular.

1. Depois que você salva um moment, o app procura rostos nas fotos dele em segundo plano. Também passa pelos moments antigos, um de cada vez.
2. Cada rosto vira um recorte quadrado de 256×256 (`photos/faces/`) e uma linha na tabela `faces`.
3. Se o moment tem **um rosto só e uma pessoa só marcada com @**, o rosto já vai pra ela. Nos outros casos ele espera no **Quem é?**.
4. Quando uma pessoa ganha um rosto e ainda não tem foto, o rosto vira a bolinha dela. Ela também passa a aparecer no moment.

O app só **detecta** onde há um rosto: não cria "assinatura facial" e não reconhece ninguém sozinho. Quem é quem é sempre você que diz. Isso mantém tudo leve e longe de dados biométricos.

> ⚠️ A detecção precisa do **app instalado** (`eas build --profile development` ou `npx expo run:ios`/`run:android`). No **Expo Go** o módulo nativo não existe: o app funciona normal, só não procura rostos. O ajuste fica em **Ajustes > Rostos nas fotos**.

## Regras do produto

Ficam em `src/rules.ts` e têm testes:

| Regra | Como funciona |
|---|---|
| Comentários da Lumi | Grátis: 10 moments comentados. Conta na hora de salvar, então dois moments seguidos não passam do limite. Memora+: ilimitado. |
| Stories | Grátis: 4. O 5º abre a assinatura. Memora+: ilimitado. |
| `@menções` | Cada `@nome` vira uma pessoa (sem repetir, sem diferenciar maiúsculas). |
| Lembrete da noite | Às 21h ou 22h, **só nos dias sem moment**, para os próximos 7 dias. Reagenda ao salvar ou apagar um moment. |
| Rostos | Um rosto e um @ no moment: é dessa pessoa. Mais de um: pergunta no **Quem é?**. Bolinhas ordenadas por quantos moments a pessoa aparece (por @ ou pelo rosto). |
| Título automático | Se você não escrever título, a Lumi sugere um; sem IA, usa a primeira frase cortada numa palavra inteira. |

## Testes

```bash
npm test          # Jest: regras, rostos, banco (SQLite de verdade), datas, arte da Lumi
npm run lint      # checagem de tipos (tsc)
```

Os testes do banco rodam no SQLite que vem no Node 22+ (`node:sqlite`), com o mesmo schema e as mesmas queries do aparelho.

## Rodando no celular com Expo Go

Pré-requisitos: Node 20+ e o app **Expo Go** no celular.

```bash
git clone https://github.com/dhqdev/memora.git
cd memora
npm install
npx expo install --fix    # alinha as versões com a SDK instalada
npx expo start
```

Escaneie o QR code com a câmera (iOS) ou com o Expo Go (Android).

> Se a versão do Expo Go da loja pedir uma SDK mais nova, rode `npx expo install expo@latest && npx expo install --fix`.

### Ligando a IA de verdade

Sem servidor, a Lumi responde com falas offline (o app funciona normal). Para usar IA:

```bash
cp .env.example .env
# edite .env: ANTHROPIC_API_KEY e EXPO_PUBLIC_AI_URL com o IP da sua máquina
npm run server            # sobe em http://0.0.0.0:8787
npx expo start -c         # reinicia o bundler lendo o .env
```

`EXPO_PUBLIC_AI_URL` precisa ser o **IP da sua máquina na rede** (ex.: `http://192.168.0.10:8787`), não `localhost`, porque quem chama é o celular.

⚠️ Nunca coloque a chave da IA no app. Tudo que começa com `EXPO_PUBLIC_` vai dentro do bundle.

### Como a IA é usada

| Tarefa (`task`) | Quando |
|---|---|
| `onboarding_react` | Lumi reage a cada resposta da introdução |
| `onboarding_welcome` | Mensagem final personalizada |
| `moment_comment` | Comentário da Lumi ao salvar um moment |
| `moment_title` | Sugere título se você deixar em branco |
| `story_write` | Escreve/reescreve o capítulo de um story |
| `chat` | Conversa livre com a Lumi |

Os prompts e a personalidade da Lumi ficam em `server/index.mjs`.

## Publicando na App Store e na Play Store

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --platform ios       # precisa de conta Apple Developer
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

Bundle IDs atuais: `com.dhqdev.memora` (ajuste em `app.json` se quiser).

**Mapa no Android:** crie uma chave do *Maps SDK for Android* no Google Cloud (restrita ao pacote `com.dhqdev.memora`) e cadastre no EAS como `GOOGLE_MAPS_ANDROID_API_KEY`. O `app.config.js` injeta a chave no build. Sem ela, a aba Lugares fica cinza no Android. No iOS não precisa (Apple Maps).

## Roadmap

- [ ] Compras reais do Memora+ (RevenueCat ou `expo-iap`)
- [ ] Sincronização na nuvem (iCloud/Supabase) e login
- [ ] Deploy do servidor de IA (Render, Railway, Fly ou Vercel)
- [ ] Mais expressões da Lumi e ilustrações para as telas vazias
- [ ] Retrospectiva do ano e cards para compartilhar
- [ ] Busca nos moments
- [ ] Ícone e splash definitivos

## Privacidade

Fotos, rostos e localização ficam no aparelho. A detecção de rostos roda localmente e não gera dados biométricos. A Lumi recebe só o texto necessário para responder. Sem anúncios, sem rastreamento.

---

Feito com ✦ por [@dhqdev](https://github.com/dhqdev)
