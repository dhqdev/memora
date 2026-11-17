import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiFace } from '@/components/Lumi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SpeechBubble } from '@/components/SpeechBubble';
import { monoText } from '@/components/ui';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

export default function MomentDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moments, people, stories, deleteMoment } = useStore();
  const m = moments.find((x) => x.id === id);
  if (!m) return null;

  const who = people.filter((p) => m.people.includes(p.id));
  const story = stories.find((s) => s.id === m.storyId);
  const date = new Date(m.date);

  const remove = () =>
    Alert.alert('Apagar moment?', 'Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => { deleteMoment(m.id); router.back(); } },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        label="MOMENT"
        right={<Pressable onPress={remove}><Text style={{ color: c.muted, fontSize: 22 }}>⋯</Text></Pressable>}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={monoText(c.muted)}>
          — {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: '500', marginTop: 10 }}>{m.title}</Text>
        {!!m.text && <Text style={{ color: c.text, fontSize: 18, marginTop: 12, lineHeight: 26 }}>{m.text}</Text>}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {m.photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
          ))}
        </View>

        <View style={[styles.meta, { borderTopColor: c.border }]}>
          {who.length > 0 && <Row label="Com" value={who.map((p) => p.name).join(', ')} />}
          {m.place && <Row label="Onde" value={m.place.name} />}
          {story && <Row label="Story" value={`${story.category} · ${story.year}`} />}
        </View>

        {m.companionComment && (
          <View style={styles.lumi}>
            <View style={{ flex: 1 }}>
              <SpeechBubble text={m.companionComment} />
            </View>
            <LumiFace size={58} mood="excited" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <Text style={monoText(c.muted)}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 15 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '48%', aspectRatio: 0.8, borderRadius: radius.sm },
  meta: { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  lumi: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 28 },
});
