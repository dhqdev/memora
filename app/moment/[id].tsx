import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiFace } from '@/components/Lumi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Avatar, IconButton, MentionText, TypingBubble, monoText } from '@/components/ui';
import { isFresh } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, display, F, radius, useTheme } from '@/theme';

export default function MomentDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moments, people, stories, profile, deleteMoment } = useStore();
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
      <ScreenHeader label="Moment" right={<IconButton icon="more" label="Opções" onPress={remove} />} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(380)}>
          <Text style={monoText(c.muted, 11)}>
            — {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={[display(30, c.text), { marginTop: 10 }]}>{m.title}</Text>
          {!!m.text && <MentionText text={m.text} style={[body(16, c.text), { marginTop: 10 }]} />}
        </Animated.View>

        {m.photos.length > 0 && (
          <Animated.View entering={FadeIn.duration(420).delay(120)} style={styles.photos}>
            {m.photos.map((p) => (
              <Image key={p} source={{ uri: photoUri(p) }} style={styles.photo} contentFit="cover" transition={250} />
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(380).delay(200)} style={[styles.meta, { borderTopColor: c.border }]}>
          {who.length > 0 && (
            <Row label="Com">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {who.map((p, i) => (
                  <View key={p.id} style={{ marginLeft: i ? -6 : 0 }}>
                    <Avatar name={p.name} size={22}>
                      {p.photo ? <Image source={{ uri: photoUri(p.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
                    </Avatar>
                  </View>
                ))}
                <Text style={[styles.value, { color: c.text, marginLeft: 8 }]}>{who.map((p) => p.name).join(', ')}</Text>
              </View>
            </Row>
          )}
          {m.place && <Row label="Onde"><Text style={[styles.value, { color: c.text }]}>{m.place.name}</Text></Row>}
          {story && (
            <Row label="Story">
              <Text style={[styles.value, { color: c.text }]} onPress={() => router.push(`/story/${story.id}`)}>
                {story.category} · {story.year}
              </Text>
            </Row>
          )}
        </Animated.View>

        {(m.commentPending || m.companionComment) && (
          <Animated.View entering={FadeInUp.duration(380).delay(280)} style={styles.lumi}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {m.commentPending ? <TypingBubble /> : <SpeechBubble text={m.companionComment!} instant={!isFresh(m.commentAt, 15000)} />}
            </View>
            {profile.showBuddy && <LumiFace size={52} mood={m.commentPending ? 'thinking' : 'excited'} />}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <Text style={monoText(c.muted, 11)}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  photo: { width: '48.5%', aspectRatio: 0.82, borderRadius: radius.sm },
  meta: { marginTop: 26, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  value: { fontFamily: F.medium, fontSize: 14 },
  lumi: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 30 },
});
