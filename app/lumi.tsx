import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chat } from '@/ai';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { PrimaryButton, SquareButton, monoText } from '@/components/ui';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

type Msg = { role: 'user' | 'lumi'; text: string };

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

  async function send() {
    const text = input.trim();
    if (!text) return;
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
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '500' }}>Lumi</Text>
              <Text style={monoText(c.muted, 11)}>sua companheira de memórias · IA</Text>
            </View>
          </View>
          <SquareButton icon="✕" label="Fechar" onPress={() => router.back()} />
        </View>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20 }}>
          {msgs.map((m, i) =>
            m.role === 'lumi' ? (
              <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', marginBottom: 10 }}>
                <SpeechBubble text={m.text} instant={i < msgs.length - 1} />
              </View>
            ) : (
              <View key={i} style={[styles.me, { backgroundColor: c.card }]}>
                <Text style={{ color: c.text, fontSize: 16 }}>{m.text}</Text>
              </View>
            ),
          )}
          {busy && <ActivityIndicator color={c.muted} style={{ alignSelf: 'flex-start' }} />}
        </ScrollView>

        <View style={[styles.bar, { borderTopColor: c.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Fale com a Lumi…"
            placeholderTextColor={c.muted}
            style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <PrimaryButton title="↑" onPress={send} disabled={!input.trim() || busy} style={{ width: 56, height: 56, paddingHorizontal: 0 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  me: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, marginBottom: 10, maxWidth: '80%' },
  bar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, height: 56, borderRadius: radius.pill, paddingHorizontal: 20, fontSize: 16 },
});
