import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reactToAnswer, welcomeMessage } from '@/ai';
import { toHandle } from '@/rules';
import { LumiFace, Mood } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Chip, Label, PrimaryButton, Segmented, TypingBubble } from '@/components/ui';
import { useStore } from '@/store';
import { body, radius, useTheme } from '@/theme';
import { Pronoun, Reminder } from '@/types';

type Step = 'intro' | 'name' | 'pronoun' | 'interests' | 'people' | 'reminder' | 'welcome';
type Msg = { from: 'lumi' | 'me'; text: string };

const INTERESTS = ['Dia a dia', 'Amigos', 'Família', 'Amor', 'Estudos', 'Treino', 'Viagens', 'Trabalho', 'Comida', 'Música'];

const QUESTIONS: Record<Exclude<Step, 'intro' | 'welcome'>, string> = {
  name: 'Antes de tudo: como você gosta de ser chamado?',
  pronoun: 'E como prefere que eu fale com você?',
  interests: 'O que você quer guardar por aqui? Pode escolher quantos quiser.',
  people: 'Tem alguém que aparece muito nas suas memórias? Me conta os nomes, separados por vírgula.',
  reminder: 'Última coisa: quer que eu te lembre à noite, só nos dias sem moment?',
};

export default function Onboarding() {
  const c = useTheme();
  const { updateProfile, upsertPerson, profile } = useStore();
  const [step, setStep] = useState<Step>('intro');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mood, setMood] = useState<Mood>('happy');
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ name: string; pronoun: Pronoun; interests: string[]; reminder: Reminder }>({
    name: '',
    pronoun: 'neutro',
    interests: [],
    reminder: 'off',
  });
  const scroll = useRef<ScrollViewInstance>(null);

  const lumiSays = (...texts: string[]) => {
    setTypingDone(false);
    setMsgs((m) => [...m, ...texts.map((t) => ({ from: 'lumi' as const, text: t }))]);
  };

  useEffect(() => {
    lumiSays('Oi! Eu sou a Lumi. Prazer te conhecer ✦');
    setTimeout(
      () => lumiSays('Aqui no Memora você guarda pedacinhos do seu dia, e eu transformo eles em histórias pra você reler depois.'),
      1600,
    );
  }, []);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  }, [msgs, typingDone, thinking]);

  /** Usuário respondeu: mostra a resposta, a Lumi reage com IA e faz a próxima pergunta. */
  async function answer(display: string, key: Exclude<Step, 'intro' | 'welcome'>, value: string, next: Step, patch: Partial<typeof draft>) {
    const nextDraft = { ...draft, ...patch };
    setDraft(nextDraft);
    setMsgs((m) => [...m, { from: 'me', text: display }]);
    setInput('');
    setTypingDone(false);
    setThinking(true);
    setMood('thinking');
    const reaction = await reactToAnswer(key, value, nextDraft);
    setThinking(false);
    setMood('excited');
    if (next === 'welcome') {
      lumiSays(reaction);
      setThinking(true);
      const welcome = await welcomeMessage(nextDraft);
      setThinking(false);
      setMood('happy');
      lumiSays(welcome);
    } else {
      lumiSays(reaction, QUESTIONS[next as keyof typeof QUESTIONS]);
      setMood('happy');
    }
    setStep(next);
  }

  async function finish() {
    if (draft.reminder !== 'off') await Notifications.requestPermissionsAsync().catch(() => {});
    updateProfile({ ...draft, onboarded: true, joinedAt: new Date().toISOString(), handle: toHandle(draft.name) });
    router.replace('/(tabs)');
  }

  const lastLumiIndex = msgs.map((m) => m.from).lastIndexOf('lumi');
  const showControls = typingDone && !thinking;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Label>Memora · boas-vindas</Label>
        </View>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Animated.View entering={FadeIn.duration(600)}>
              <LumiFace size={104} mood={mood} />
            </Animated.View>
          </View>

          {msgs.map((m, i) =>
            m.from === 'lumi' ? (
              <View key={i} style={{ marginBottom: 10, alignSelf: 'flex-start', maxWidth: '88%' }}>
                <SpeechBubble
                  text={m.text}
                  instant={i < lastLumiIndex}
                  onDone={i === lastLumiIndex ? () => setTypingDone(true) : undefined}
                />
              </View>
            ) : (
              <Animated.View key={i} entering={FadeInUp.duration(220)} style={[styles.me, { backgroundColor: c.invert }]}>
                <Text style={body(15, c.invertText)}>{m.text}</Text>
              </Animated.View>
            ),
          )}

          {thinking && (
            <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 2 }}>
              <TypingBubble />
            </Animated.View>
          )}
        </ScrollView>

        {showControls && (
          <Animated.View key={step} entering={FadeInDown.duration(300)} style={[styles.controls, { borderTopColor: c.border }]}>
            {step === 'intro' && (
              <PrimaryButton
                title="Prazer, Lumi!"
                onPress={() => {
                  setMsgs((m) => [...m, { from: 'me', text: 'Prazer, Lumi!' }]);
                  lumiSays(QUESTIONS.name);
                  setStep('name');
                }}
              />
            )}

            {step === 'name' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Seu nome"
                  placeholderTextColor={c.muted}
                  autoFocus
                  style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
                  onSubmitEditing={() => input.trim() && answer(input.trim(), 'name', input.trim(), 'pronoun', { name: input.trim() })}
                  returnKeyType="send"
                />
                <PrimaryButton
                  title=""
                  icon="send"
                  disabled={!input.trim()}
                  style={{ width: 54, height: 54, paddingHorizontal: 0 }}
                  onPress={() => answer(input.trim(), 'name', input.trim(), 'pronoun', { name: input.trim() })}
                />
              </View>
            )}

            {step === 'pronoun' && (
              <Segmented<Pronoun>
                value={draft.pronoun}
                options={[
                  { value: 'ele', label: 'Ele' },
                  { value: 'ela', label: 'Ela' },
                  { value: 'neutro', label: 'Neutro' },
                ]}
                onChange={(v) => answer(v === 'ele' ? 'Ele' : v === 'ela' ? 'Ela' : 'Neutro', 'pronoun', v, 'interests', { pronoun: v })}
              />
            )}

            {step === 'interests' && (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {INTERESTS.map((i) => (
                    <Chip
                      key={i}
                      label={i}
                      active={picked.includes(i)}
                      onPress={() => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
                    />
                  ))}
                </View>
                <PrimaryButton
                  title="Continuar"
                  disabled={!picked.length}
                  onPress={() => answer(picked.join(', '), 'interests', picked.join(', '), 'people', { interests: picked })}
                />
              </>
            )}

            {step === 'people' && (
              <>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ex.: Isabela, Caio, mãe"
                  placeholderTextColor={c.muted}
                  autoFocus
                  style={[styles.input, { backgroundColor: c.surface, color: c.text, marginBottom: 10 }]}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PrimaryButton
                    title="Pular"
                    style={{ flex: 1, backgroundColor: c.card }}
                    onPress={() => answer('Depois eu conto', 'people', '', 'reminder', {})}
                  />
                  <PrimaryButton
                    title="Enviar"
                    style={{ flex: 1 }}
                    disabled={!input.trim()}
                    onPress={() => {
                      input.split(',').map((n) => n.trim()).filter(Boolean).forEach((n) => upsertPerson(n));
                      answer(input.trim(), 'people', input.trim(), 'reminder', {});
                    }}
                  />
                </View>
              </>
            )}

            {step === 'reminder' && (
              <Segmented<Reminder>
                value={draft.reminder}
                options={[
                  { value: 'off', label: 'Não' },
                  { value: '21', label: '21h' },
                  { value: '22', label: '22h' },
                ]}
                onChange={(v) => answer(v === 'off' ? 'Sem lembrete' : `Às ${v}h`, 'reminder', v, 'welcome', { reminder: v })}
              />
            )}

            {step === 'welcome' && <PrimaryButton title="Começar meu Memora" onPress={finish} />}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8 },
  me: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, marginBottom: 10, maxWidth: '80%' },
  controls: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, height: 54, borderRadius: radius.pill, paddingHorizontal: 20, fontSize: 16 },
});

