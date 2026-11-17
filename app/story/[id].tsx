import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { writeStory } from '@/ai';
import { LumiFace } from '@/components/Lumi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { IconButton, Label, OutlineButton, PressableScale, TypingBubble, monoText } from '@/components/ui';
import { photoUri } from '@/photos';
import { MONTHS_SHORT } from '@/format';
import { useStore } from '@/store';
import { body, display, heading, mono, radius, useTheme } from '@/theme';

export default function StoryDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stories, moments, profile, updateStory, deleteStory } = useStore();
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

  const remove = () =>
    Alert.alert('Apagar story?', 'Os moments continuam salvos, só saem deste story.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteStory(story!.id);
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader label="Story" right={<IconButton icon="more" label="Opções" onPress={remove} />} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(380)}>
        <Text style={monoText(c.muted, 11)}>
          {story.year} · {list.length} moment{list.length === 1 ? '' : 's'}, escrito pela Lumi ✦
        </Text>
        <View style={[styles.tag, { borderColor: c.text }]}>
          <Text style={{ fontFamily: mono, fontSize: 11, color: c.text, letterSpacing: 1 }}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={[display(30, c.text), { marginTop: 8 }]}>{story.title}</Text>
        </Animated.View>

        <View style={{ marginTop: 18 }}>
          {story.body ? (
            <Animated.Text key={story.updatedAt} entering={FadeIn.duration(500)} style={body(16, c.text)}>
              {story.body}
            </Animated.Text>
          ) : (
            <Text style={body(15, c.muted)}>A Lumi ainda não escreveu esse capítulo.</Text>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          {writing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {profile.showBuddy && <LumiFace size={40} mood="thinking" />}
              <TypingBubble />
            </View>
          ) : (
            <OutlineButton title={story.body ? 'Pedir para a Lumi reescrever' : 'Pedir para a Lumi escrever'} onPress={rewrite} />
          )}
        </View>

        <Label style={{ marginTop: 32, marginBottom: 12 }}>Moments</Label>
        {list.map((m) => {
          const d = new Date(m.date);
          return (
            <PressableScale key={m.id} scaleTo={0.98} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
              {m.photos[0] ? (
                <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: c.card }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={monoText(c.muted, 10.5)}>
                  {MONTHS_SHORT[d.getMonth()]} {d.getDate()}
                </Text>
                <Text style={heading(15, c.text)}>{m.title}</Text>
              </View>
              <Text style={{ color: c.muted }}>›</Text>
            </PressableScale>
          );
        })}
        {!list.length && <Text style={body(14, c.muted)}>Escolha esse story ao salvar um moment.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
});
