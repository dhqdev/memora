import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { writeStory } from '@/ai';
import { DitherImage } from '@/components/DitherImage';
import { Icon } from '@/components/Icon';
import { LumiFace } from '@/components/Lumi';
import { popIn, riseIn } from '@/components/motion';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SpeechBubble } from '@/components/SpeechBubble';
import { IconButton, Label, OutlineButton, PressableScale, TypingBubble, monoText } from '@/components/ui';
import { MONTHS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, F, heading, mono, useTheme } from '@/theme';

/**
 * Um story (capítulo). A capa em pixel art é a mesma do card da aba Stories,
 * só que grande — abrir o story parece o card crescendo. Embaixo, o texto
 * que a Lumi escreveu, em tipografia de leitura, e os moments do capítulo.
 */
export default function StoryDetail() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stories, moments, profile, updateStory, deleteStory } = useStore();
  const [writing, setWriting] = useState(false);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const coverW = width - 40;
  const coverH = Math.round(coverW * 0.9);
  const coverStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value > 0 ? y.value * 0.3 : y.value * 0.5 },
      { scale: interpolate(y.value, [-160, 0], [1.12, 1], Extrapolation.CLAMP) },
    ],
  }));

  const story = stories.find((s) => s.id === id);
  if (!story) return null;

  const list = moments
    .filter((m) => m.storyId === story.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const cover = list.find((m) => m.photos[0])?.photos[0];
  const paragraphs = (story.body ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const updated = new Date(story.updatedAt);

  async function rewrite() {
    setWriting(true);
    const text = await writeStory(story!.category, list, profile);
    updateStory(story!.id, { body: text, updatedAt: new Date().toISOString() });
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
      <ScreenHeader
        label="Story"
        title={story.title}
        scrollY={y}
        threshold={Math.round(coverH * 0.62)}
        right={<IconButton icon="more" label="Opções" onPress={remove} />}
      />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Animated.View style={coverStyle}>
          <Animated.View entering={popIn(40, 520)} style={[styles.cover, { width: coverW, height: coverH, backgroundColor: c.surface }]}>
            {cover ? (
              <View style={StyleSheet.absoluteFill}>
                <DitherImage uri={photoUri(cover)} width={coverW} height={coverH} cell={6} />
              </View>
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.blank]}>
                <Icon name="sparkle" size={120} color={c.chip} />
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {story.year} · {list.length} moment{list.length === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.labelWrap}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{story.category.toUpperCase()}</Text>
              </View>
              <View style={styles.titleBox}>
                <Text style={styles.title}>{story.title}</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        <View style={{ backgroundColor: c.bg, paddingTop: 24 }}>
          <Animated.View entering={riseIn(180)}>
            <View style={styles.byline}>
              {profile.showBuddy && <LumiFace size={28} mood="happy" />}
              <Text style={monoText(c.muted, 11)}>
                escrito pela Lumi ✦{story.body ? ` · ${updated.getDate()} ${MONTHS_SHORT[updated.getMonth()]}` : ''}
              </Text>
            </View>

            {paragraphs.length ? (
              <Animated.View key={story.updatedAt} entering={FadeIn.duration(600)} style={{ marginTop: 18, gap: 14 }}>
                {paragraphs.map((p, i) => (
                  <Text key={i} style={i === 0 ? [styles.lead, { color: c.text }] : [body(16.5, c.text), { lineHeight: 26 }]}>
                    {p}
                  </Text>
                ))}
              </Animated.View>
            ) : (
              <View style={{ marginTop: 18 }}>
                <SpeechBubble
                  text={
                    list.length
                      ? 'Ainda não escrevi esse capítulo. Me pede que eu escrevo com os seus moments!'
                      : 'Esse capítulo ainda está vazio. Escolhe ele quando salvar um moment.'
                  }
                />
              </View>
            )}
          </Animated.View>

          <View style={{ marginTop: 22 }}>
            {writing ? (
              <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {profile.showBuddy && <LumiFace size={40} mood="thinking" />}
                <TypingBubble />
              </Animated.View>
            ) : (
              list.length > 0 && <OutlineButton title={story.body ? 'Pedir para a Lumi reescrever' : 'Pedir para a Lumi escrever'} onPress={rewrite} />
            )}
          </View>

          {list.length > 0 && <Label style={{ marginTop: 34, marginBottom: 6 }}>Moments do capítulo</Label>}
          {list.map((m, i) => {
            const d = new Date(m.date);
            return (
              <Animated.View key={m.id} entering={FadeInDown.duration(320).delay(240 + Math.min(i, 6) * 40)}>
                <PressableScale scaleTo={0.98} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
                  {m.photos[0] ? (
                    <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" transition={150} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: c.surface }]}>
                      <Text style={heading(17, c.text)}>{d.getDate()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={monoText(c.muted, 10.5)}>
                      {d.getDate()} {MONTHS_SHORT[d.getMonth()]}
                      {m.place ? `  ·  ${m.place.name}` : ''}
                    </Text>
                    <Text style={[heading(15.5, c.text), { marginTop: 2 }]} numberOfLines={1}>
                      {m.title}
                    </Text>
                  </View>
                  <Icon name="chevRight" size={16} color={c.muted} />
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  blank: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#F2EFE6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontFamily: mono, fontSize: 11, color: '#141413' },
  labelWrap: { position: 'absolute', left: 24, right: 24, top: '40%', alignItems: 'center' },
  tag: { backgroundColor: '#E8E4D8', paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#141413' },
  tagText: { fontFamily: mono, fontSize: 10.5, color: '#141413', letterSpacing: 1.2 },
  titleBox: { backgroundColor: 'rgba(20,20,19,0.92)', paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  title: { color: '#F2EFE6', fontSize: 24, lineHeight: 29, fontFamily: F.medium, textAlign: 'center', letterSpacing: -0.5 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lead: { fontFamily: F.medium, fontSize: 19, lineHeight: 28, letterSpacing: -0.2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 50, height: 50, borderRadius: 12 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
});
