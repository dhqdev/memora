import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiFace } from '@/components/Lumi';
import { FaceBubble, PersonAvatar } from '@/components/PersonAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Label, OutlineButton, PressableScale, PrimaryButton, monoText } from '@/components/ui';
import { rankPeople, unnamedFaces } from '@/faces/logic';
import { MONTHS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { FaceOwner, useStore } from '@/store';
import { display, F, radius, useTheme } from '@/theme';

/**
 * "Quem é?": os rostos achados nas fotos que ainda não têm nome.
 * Um toque liga o rosto a alguém; ele vira a bolinha da pessoa e o moment
 * passa a ser dela também.
 */
export default function Faces() {
  const c = useTheme();
  const { faces, moments, people, profile, setFaceOwner, upsertPerson } = useStore();
  const waiting = useMemo(() => unnamedFaces(faces, moments), [faces, moments]);
  const ranked = useMemo(() => rankPeople(people, moments, faces), [people, moments, faces]);
  const params = useLocalSearchParams<{ face?: string }>();
  const [pick, setPick] = useState<string | null>(params.face ?? null);
  const [name, setName] = useState('');

  const face = waiting.find((f) => f.id === pick) ?? waiting[0];

  if (!face) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader label="Quem é?" />
        <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
          {profile.showBuddy && <LumiFace size={88} mood="happy" />}
          <View style={{ marginTop: 18 }}>
            <SpeechBubble text="Todo mundo das suas fotos já tem nome ✦" />
          </View>
          <View style={{ marginTop: 24, alignSelf: 'stretch' }}>
            <OutlineButton title="Voltar" onPress={() => router.back()} />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const moment = moments.find((m) => m.id === face.momentId);
  const d = moment ? new Date(moment.date) : null;
  // quem foi marcado com @ nesse moment e ainda não tem rosto nele vem primeiro
  const taken = new Set(faces.filter((f) => f.momentId === face.momentId && f.personId).map((f) => f.personId));
  const suggested = ranked.filter((p) => moment?.people.includes(p.id) && !taken.has(p.id));
  const others = ranked.filter((p) => !suggested.includes(p));

  function give(owner: FaceOwner) {
    setFaceOwner(face!.id, owner);
    setName('');
    setPick(null);
    if (profile.haptics) Haptics.selectionAsync().catch(() => {});
  }

  function giveNew() {
    const n = name.trim().replace(/^@/, '');
    if (!n) return;
    give({ personId: upsertPerson(n).id });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader label={`Quem é? · ${waiting.length}`} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Animated.View key={face.id} entering={ZoomIn.duration(260)} style={{ alignItems: 'center' }}>
            <FaceBubble crop={face.crop} size={168} />
          </Animated.View>

          {moment && (
            <PressableScale scaleTo={0.98} onPress={() => router.push(`/moment/${moment.id}`)} style={[styles.from, { borderColor: c.border }]}>
              <Image source={{ uri: photoUri(face.photo) }} style={styles.fromPhoto} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={monoText(c.muted, 10.5)}>
                  {d!.getDate()} {MONTHS_SHORT[d!.getMonth()]} {d!.getFullYear()}
                </Text>
                <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 14 }} numberOfLines={1}>
                  {moment.title}
                </Text>
              </View>
            </PressableScale>
          )}

          <Text style={[display(26, c.text), { marginTop: 22 }]}>Quem é?</Text>

          {suggested.length + others.length > 0 && (
            <View style={styles.people}>
              {[...suggested, ...others].map((p) => (
                <PressableScale key={p.id} scaleTo={0.94} onPress={() => give({ personId: p.id })} style={[styles.chip, { borderColor: suggested.includes(p) ? c.text : c.border }]}>
                  <PersonAvatar person={p} size={28} />
                  <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 14 }}>{p.name}</Text>
                </PressableScale>
              ))}
            </View>
          )}

          <View style={styles.newRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Outra pessoa: escreva o nome"
              placeholderTextColor={c.muted}
              returnKeyType="done"
              onSubmitEditing={giveNew}
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
            />
            <PrimaryButton title="" icon="send" disabled={!name.trim()} onPress={giveNew} style={{ width: 50, height: 50, paddingHorizontal: 0 }} />
          </View>

          <View style={styles.actions}>
            <PressableScale onPress={() => give('me')} style={[styles.action, { borderColor: c.border }]}>
              <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 14 }}>Sou eu</Text>
            </PressableScale>
            <PressableScale onPress={() => give('ignored')} style={[styles.action, { borderColor: c.border }]}>
              <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 14 }}>Não é ninguém</Text>
            </PressableScale>
            {waiting.length > 1 && (
              <PressableScale
                onPress={() => setPick(waiting[(waiting.indexOf(face) + 1) % waiting.length].id)}
                style={[styles.action, { borderColor: c.border }]}
              >
                <Text style={{ color: c.muted, fontFamily: F.medium, fontSize: 14 }}>Pular</Text>
              </PressableScale>
            )}
          </View>

          {waiting.length > 1 && (
            <>
              <Label style={{ marginTop: 30, marginBottom: 12 }}>Esperando nome</Label>
              <View style={styles.grid}>
                {waiting.map((f) => (
                  <PressableScale key={f.id} scaleTo={0.92} onPress={() => setPick(f.id)}>
                    <FaceBubble crop={f.crop} size={52} ring={f.id === face.id ? c.text : undefined} />
                  </PressableScale>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  from: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  fromPhoto: { width: 40, height: 40, borderRadius: radius.sm },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 5, paddingRight: 14, height: 40, borderRadius: 20, borderWidth: 1 },
  newRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  input: { flex: 1, height: 50, borderRadius: radius.pill, paddingHorizontal: 18, fontSize: 15 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  action: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
