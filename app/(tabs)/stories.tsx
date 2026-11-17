import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { DitherImage } from '@/components/DitherImage';
import { popIn } from '@/components/motion';
import { Icon } from '@/components/Icon';
import { Chip, Label, PressableScale, monoText } from '@/components/ui';
import { photoUri } from '@/photos';
import { uid, useStore } from '@/store';
import { F, heading, mono, radius, useTheme } from '@/theme';
import { storiesLeft } from '@/rules';
import { Story } from '@/types';

const CATEGORIES = ['Dia a dia', 'Amigos', 'Família', 'Amor', 'Estudos', 'Treino', 'Viagens', 'Trabalho'];
/** Alturas relativas à largura da coluna: o grid fica "em degraus". */
const HEIGHTS = [1.28, 1.0, 1.12, 0.92, 1.2, 1.04];
const GAP = 12;

type Cell = { kind: 'new' } | { kind: 'story'; story: Story };

export default function StoriesTab() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { stories, moments, profile, addStory } = useStore();
  const remaining = storiesLeft(profile, stories);
  const [picking, setPicking] = useState(false);
  const colW = (width - 40 - GAP) / 2;

  function newStory() {
    if (remaining === 0) return router.push('/paywall');
    setPicking((p) => !p);
  }

  function create(cat: string) {
    const id = uid();
    addStory({ id, title: cat, category: cat, year: new Date().getFullYear(), updatedAt: new Date().toISOString() });
    setPicking(false);
    router.push(`/story/${id}`);
  }

  // distribui os cards na coluna mais baixa (masonry simples)
  const cells: Cell[] = [{ kind: 'new' }, ...stories.map((story) => ({ kind: 'story' as const, story }))];
  const cols: { cell: Cell; h: number; i: number }[][] = [[], []];
  const colH = [0, 0];
  cells.forEach((cell, i) => {
    const h = Math.round(colW * HEIGHTS[i % HEIGHTS.length]);
    const col = colH[0] <= colH[1] ? 0 : 1;
    cols[col].push({ cell, h, i });
    colH[col] += h + GAP;
  });

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}>
      {picking && (
        <Animated.View entering={FadeInDown.duration(260)} style={{ marginBottom: 16 }}>
          <Label style={{ marginBottom: 10 }}>Sobre qual parte da sua vida?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} onPress={() => create(cat)} />
            ))}
          </View>
        </Animated.View>
      )}

      <View style={{ flexDirection: 'row', gap: GAP }}>
        {cols.map((col, ci) => (
          <View key={ci} style={{ width: colW, gap: GAP }}>
            {col.map(({ cell, h, i }) =>
              cell.kind === 'new' ? (
                <Animated.View key="new" entering={FadeIn.duration(300)} layout={LinearTransition}>
                  <PressableScale onPress={newStory} style={[styles.card, styles.newCard, { height: h, borderColor: c.muted }]}>
                    <View style={[styles.plus, { backgroundColor: c.invert }]}>
                      <Icon name="plus" size={20} color={c.invertText} />
                    </View>
                    <Text style={[heading(15, c.text), { marginTop: 12 }]}>Novo story</Text>
                    <Text style={[monoText(c.muted, 10.5), { marginTop: 4 }]}>
                      {profile.plus ? 'ilimitado' : `restam ${remaining} grátis`}
                    </Text>
                  </PressableScale>
                </Animated.View>
              ) : (
                <Animated.View key={cell.story.id} entering={popIn(Math.min(i, 6) * 60, 440)} layout={LinearTransition}>
                  <StoryCard story={cell.story} width={colW} height={h} count={moments.filter((m) => m.storyId === cell.story.id).length} cover={moments.find((m) => m.storyId === cell.story.id && m.photos[0])?.photos[0]} />
                </Animated.View>
              ),
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StoryCard({ story, width, height, count, cover }: { story: Story; width: number; height: number; count: number; cover?: string }) {
  const c = useTheme();
  return (
    <PressableScale onPress={() => router.push(`/story/${story.id}`)} style={[styles.card, { height, backgroundColor: c.surface }]}>
      {cover ? (
        <View style={StyleSheet.absoluteFill}>
          <DitherImage uri={photoUri(cover)} width={width} height={height} />
        </View>
      ) : null}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {story.year} · {count} moment{count === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.labelWrap}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{story.category.toUpperCase()}</Text>
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.title} numberOfLines={3}>
            {story.title}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  newCard: { borderWidth: 1.2, borderStyle: 'dashed' },
  plus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#F2EFE6', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontFamily: mono, fontSize: 10, color: '#141413' },
  labelWrap: { position: 'absolute', top: '38%', left: 10, right: 10, alignItems: 'center' },
  tag: { backgroundColor: '#E8E4D8', paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#141413' },
  tagText: { fontFamily: mono, fontSize: 9, color: '#141413', letterSpacing: 1 },
  titleBox: { backgroundColor: 'rgba(20,20,19,0.92)', paddingHorizontal: 10, paddingVertical: 6, marginTop: 3 },
  title: { color: '#F2EFE6', fontSize: 15, lineHeight: 19, fontFamily: F.medium, textAlign: 'center' },
});
