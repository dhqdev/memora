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
| **Stories** | Capítulos por parte da vida (Dia a dia, Amigos, Família, Estudos…). A Lumi escreve e reescreve cada capítulo a partir dos seus moments. |
| **Calendário** | Mês em grade com a miniatura de cada dia que tem moment. |
| **Lugares** | Mapa com pins de foto e um carrossel de vidro: deslize e o mapa voa até o lugar. |
| **Perfil** | Foto, nome, @usuário, bio, números, suas pessoas e o grid dos seus moments. Dá pra compartilhar. |
| **Lumi** | Botão flutuante para conversar com ela. Ela conhece seus moments recentes. |
| **Ajustes** | Nome, pronome, tema (claro/escuro/sistema), vibração, mostrar a Lumi e lembrete da noite. |
| **Memora+** | Paywall (anual com 7 dias grátis / mensal). No grátis: a Lumi comenta 10 moments e você tem 4 stories. *As compras ainda não estão integradas.* |

## Stack

- **Expo SDK 58** + **Expo Router** (rotas por arquivo em `app/`)
- TypeScript
- `AsyncStorage` para os dados locais (tudo fica no aparelho)
- `expo-image-picker`, `expo-location`, `react-native-maps`, `expo-notifications`, `expo-haptics`
- `react-native-svg` para a Lumi (desenho original com expressões) e os ícones
- `react-native-reanimated` para as transições (entrada dos itens, "digitando…", toque, Lumi flutuando)
- `@shopify/react-native-skia` para o efeito pontilhado (dithering) das capas dos stories
- Fontes Inter Tight (títulos), JetBrains Mono (etiquetas) e Pixelify Sans (falas da Lumi), via `@expo-google-fonts`
- **Liquid Glass** da Apple com `expo-glass-effect` nos botões, cartões do mapa e na assinatura (no Android e iOS antigo cai para um bloco translúcido)
- A Lumi é um retrato em traço preto e branco, em SVG (`src/components/lumiArt.ts`), com 4 humores
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
│   ├── store.tsx             # estado global + persistência
│   ├── theme.ts              # cores, tema claro/escuro
│   ├── types.ts
│   └── components/           # Lumi, SpeechBubble, botões, segmented…
├── server/index.mjs          # backend da IA (a chave fica só aqui)
└── assets/                   # ícone e splash (provisórios)
```

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

## Roadmap

- [ ] Compras reais do Memora+ (RevenueCat ou `expo-iap`)
- [ ] Sincronização na nuvem (iCloud/Supabase) e login
- [ ] Deploy do servidor de IA (Render, Railway, Fly ou Vercel)
- [ ] Som de "voz" da Lumi (o ajuste já existe; o áudio ainda não)
- [ ] Mais expressões da Lumi e ilustrações próprias
- [ ] Retrospectiva do ano e cards para compartilhar
- [ ] Busca nos moments
- [ ] Ícone e splash definitivos

## Privacidade

Fotos e localização ficam no aparelho. A Lumi recebe só o texto necessário para responder. Sem anúncios, sem rastreamento.

---

Feito com ✦ por [@dhqdev](https://github.com/dhqdev)
