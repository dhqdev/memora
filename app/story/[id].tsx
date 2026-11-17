import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { writeStory } from '@/ai';
import { LumiFace } from '@/components/Lumi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { OutlineButton, monoText } from '@/components/ui';
import { MONTHS_SHORT } from '@/format';
import { useStore } from '@/store';
import { mono, radius, useTheme } from '@/theme';

export default function StoryDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stories, moments, profile, updateStory } = useStore();
  const [writing, setWriting] = useState(false);
  const story = stories.find((s) => s.id === id);
  if (!story) return null;

  const list = moments
    .filter((m) => m.storyId === story.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  async function rewrite() {
    setWriting(true);
    const body = await writeStory(story!.category, list, profile);
    updateStory(story!.id, { body, updatedAt: new Date().toISOString() });
    setWriting(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader label="STORY" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={monoText(c.muted)}>
          {story.year} · {list.length} moment{list.length === 1 ? '' : 's'}, escrito pela Lumi ✦
        </Text>
        <View style={[styles.tag, { borderColor: c.text }]}>
          <Text style={{ fontFamily: mono, fontSize: 11, color: c.text, letterSpacing: 1 }}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: '500', marginTop: 8 }}>{story.title}</Text>

        <View style={{ marginTop: 18 }}>
          {story.body ? (
            <Text style={{ color: c.text, fontSize: 17, lineHeight: 26 }}>{story.body}</Text>
          ) : (
            <Text style={{ color: c.muted, fontSize: 16 }}>A Lumi ainda não escreveu esse capítulo.</Text>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          {writing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LumiFace size={40} mood="thinking" />
              <ActivityIndicator color={c.muted} />
              <Text style={monoText(c.muted)}>escrevendo…</Text>
            </View>
          ) : (
            <OutlineButton title={story.body ? 'Pedir para a Lumi reescrever' : 'Pedir para a Lumi escrever'} onPress={rewrite} />
          )}
        </View>

        <Text style={[monoText(c.muted), { marginTop: 32, marginBottom: 12 }]}>MOMENTS</Text>
        {list.map((m) => {
          const d = new Date(m.date);
          return (
            <Pressable key={m.id} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
              {m.photos[0] ? (
                <Image source={{ uri: m.photos[0] }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: c.card }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={monoText(c.muted, 12)}>
                  {MONTHS_SHORT[d.getMonth()]} {d.getDate()}
                </Text>
                <Text style={{ color: c.text, fontSize: 16 }}>{m.title}</Text>
              </View>
              <Text style={{ color: c.muted }}>›</Text>
            </Pressable>
          );
        })}
        {!list.length && <Text style={{ color: c.muted }}>Escolha esse story ao salvar um moment.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
});
