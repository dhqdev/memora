import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { PrimaryButton, monoText } from '@/components/ui';
import { MONTHS_SHORT, monthLabel } from '@/format';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';
import { Moment } from '@/types';

export default function MomentsTab() {
  const c = useTheme();
  const { moments, people, stories, profile } = useStore();

  const groups = useMemo(() => {
    const sorted = [...moments].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    const map = new Map<string, Moment[]>();
    sorted.forEach((m) => {
      const key = monthLabel(new Date(m.date));
      map.set(key, [...(map.get(key) ?? []), m]);
    });
    return [...map.entries()];
  }, [moments]);

  if (!moments.length) {
    return (
      <View style={styles.empty}>
        <LumiFace size={96} mood="excited" />
        <View style={{ marginVertical: 20 }}>
          <SpeechBubble text={`${profile.name ? profile.name + ', s' : 'S'}eu primeiro moment pode ser só uma frase. Bora?`} />
        </View>
        <PrimaryButton title="Salvar um moment" onPress={() => router.push('/new-moment')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
      {people.length > 0 && (
        <>
          <Text style={[styles.h2, { color: c.text }]}>Pessoas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {people.map((p) => (
              <Pressable key={p.id} style={styles.person} onPress={() => router.push(`/person/${p.id}`)}>
                <View style={[styles.avatar, { backgroundColor: c.card, borderColor: c.border }]}>
                  {p.photo ? (
                    <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <Text style={{ color: c.text, fontSize: 30 }}>{p.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <Text style={{ color: c.text, marginTop: 6 }}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {groups.map(([label, list]) => (
        <View key={label} style={{ marginBottom: 12 }}>
          <Text style={[styles.h2, { color: c.text, marginBottom: 20 }]}>{label}</Text>
          {list.map((m) => {
            const d = new Date(m.date);
            const story = stories.find((s) => s.id === m.storyId);
            return (
              <Pressable key={m.id} style={styles.item} onPress={() => router.push(`/moment/${m.id}`)}>
                <View style={{ width: 52, alignItems: 'flex-start' }}>
                  <Text style={{ color: c.text, fontSize: 30, fontWeight: '500' }}>{d.getDate()}</Text>
                  <Text style={monoText(c.muted)}>{MONTHS_SHORT[d.getMonth()]}</Text>
                  <View style={[styles.line, { backgroundColor: c.border }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 24, fontWeight: '500' }}>{m.title}</Text>
                  {!!m.text && <Text style={{ color: c.text, fontSize: 17, marginTop: 8 }}>{m.text}</Text>}
                  {m.photos[0] && <Image source={{ uri: m.photos[0] }} style={styles.photo} contentFit="cover" />}
                  {story && (
                    <View style={[styles.storyPill, { borderColor: c.border }]}>
                      <Text style={{ color: c.text, fontSize: 14 }}>
                        Story · {story.category} · {story.year}
                      </Text>
                    </View>
                  )}
                  {m.place && <Text style={[monoText(c.muted), { marginTop: 8 }]}>em {m.place.name}</Text>}
                  {m.companionComment && (
                    <View style={{ marginTop: 12 }}>
                      <SpeechBubble text={m.companionComment} instant />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  h2: { fontSize: 20, fontWeight: '500', marginBottom: 12 },
  person: { alignItems: 'center', marginRight: 16 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', marginBottom: 28 },
  line: { width: 1, flex: 1, marginLeft: 10, marginTop: 8 },
  photo: { width: 220, height: 270, borderRadius: radius.sm, marginTop: 12 },
  storyPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12 },
});
