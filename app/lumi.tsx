import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chat } from '@/ai';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Chip, IconButton, PrimaryButton, TypingBubble, monoText } from '@/components/ui';
import { useStore } from '@/store';
import { body, heading, radius, useTheme } from '@/theme';

type Msg = { role: 'user' | 'lumi'; text: string };

/** Puxadas de assunto para quem não sabe por onde começar. */
const STARTERS = ['O que eu fiz essa semana?', 'Me lembra um dia feliz', 'Com quem eu mais saio?', 'Me dá uma ideia de moment pra hoje'];

/** Conversa livre com a Lumi — ela conhece seus moments recentes. */
export default function LumiChat() {
  const c = useTheme();
  const { profile, moments } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'lumi', text: `Oi${profile.name ? ', ' + profile.name : ''}! Quer me contar alguma coisa ou perguntar sobre suas memórias?` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  async function send(typed?: string) {
    const text = (typed ?? input).trim();
    if (!text || busy) return;
    const history: Msg[] = [...msgs, { role: 'user', text }];
    setMsgs(history);
    setInput('');
    setBusy(true);
    const reply = await chat(history, profile, moments);
    setMsgs((m) => [...m, { role: 'lumi', text: reply }]);
    setBusy(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LumiFace size={44} mood={busy ? 'thinking' : 'happy'} />
            <View>
              <Text style={heading(17, c.text)}>Lumi</Text>
              <Text style={monoText(c.muted, 10.5)}>sua companheira de memórias · IA</Text>
            </View>
          </View>
          <IconButton icon="close" label="Fechar" onPress={() => router.back()} />
        </View>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20 }}>
          {msgs.map((m, i) =>
            m.role === 'lumi' ? (
              <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', marginBottom: 10 }}>
                <SpeechBubble text={m.text} instant={i < msgs.length - 1} />
              </View>
            ) : (
              <Animated.View key={i} entering={FadeInUp.duration(220)} style={[styles.me, { backgroundColor: c.invert }]}>
                <Text style={body(15, c.invertText)}>{m.text}</Text>
              </Animated.View>
            ),
          )}
          {busy && (
            <Animated.View entering={FadeIn.duration(200)}>
              <TypingBubble />
            </Animated.View>
          )}
          {msgs.length === 1 && !busy && (
            <Animated.View entering={FadeInDown.duration(320).delay(700)} exiting={FadeOut.duration(150)} style={styles.starters}>
              {STARTERS.map((t) => (
                <Chip key={t} label={t} onPress={() => send(t)} />
              ))}
            </Animated.View>
          )}
        </ScrollView>

        <View style={[styles.bar, { borderTopColor: c.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Fale com a Lumi…"
            placeholderTextColor={c.muted}
            style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <PrimaryButton title="" icon="send" onPress={() => send()} disabled={!input.trim() || busy} style={{ width: 50, height: 50, paddingHorizontal: 0 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  me: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, marginBottom: 10, maxWidth: '80%' },
  bar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  starters: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  input: { flex: 1, height: 50, borderRadius: radius.pill, paddingHorizontal: 18, fontSize: 15 },
});
