import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, monoText } from '@/components/ui';
import { uid, useStore } from '@/store';
import { mono, radius, useTheme } from '@/theme';
import { FREE_STORIES } from '@/types';

const CATEGORIES = ['Dia a dia', 'Amigos', 'Família', 'Amor', 'Estudos', 'Treino', 'Viagens', 'Trabalho'];

export default function StoriesTab() {
  const c = useTheme();
  const { stories, moments, profile, addStory } = useStore();
  const remaining = Math.max(0, FREE_STORIES - stories.length);
  const [picking, setPicking] = useState(false);

  function newStory() {
    if (!profile.plus && remaining === 0) return router.push('/paywall');
    setPicking((p) => !p);
  }

  function create(cat: string) {
    const id = uid();
    addStory({ id, title: cat, category: cat, year: new Date().getFullYear(), updatedAt: new Date().toISOString() });
    setPicking(false);
    router.push(`/story/${id}`);
  }

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {picking && (
        <View style={{ width: '100%' }}>
          <Text style={[monoText(c.muted), { marginBottom: 10 }]}>Sobre qual parte da sua vida?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} onPress={() => create(cat)} />
            ))}
          </View>
        </View>
      )}
      <Pressable onPress={newStory} style={[styles.card, styles.newCard, { borderColor: c.muted }]}>
        <View style={[styles.plus, { backgroundColor: c.invert }]}>
          <Text style={{ color: c.invertText, fontSize: 30 }}>+</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '500', marginTop: 12 }}>Novo story</Text>
        <Text style={[monoText(c.muted), { marginTop: 6 }]}>
          {profile.plus ? 'ilimitado' : `restam ${remaining} grátis`}
        </Text>
      </Pressable>

      {stories.map((s) => {
        const list = moments.filter((m) => m.storyId === s.id);
        const cover = list.find((m) => m.photos[0])?.photos[0];
        return (
          <Pressable key={s.id} onPress={() => router.push(`/story/${s.id}`)} style={[styles.card, { backgroundColor: c.card }]}>
            {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={2} />}
            <View style={styles.badge}>
              <Text style={{ fontFamily: mono, fontSize: 12, color: '#121212' }}>
                {s.year} · {list.length} moment{list.length === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.labelWrap}>
              <View style={styles.tag}>
                <Text style={{ fontFamily: mono, fontSize: 11, color: '#121212', letterSpacing: 1 }}>{s.category.toUpperCase()}</Text>
              </View>
              <View style={styles.titleBox}>
                <Text style={{ color: '#F2EFE6', fontSize: 18, textAlign: 'center' }}>{s.title}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 14, paddingBottom: 140 },
  card: { width: '47.5%', aspectRatio: 0.82, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  newCard: { borderWidth: 1.5, borderStyle: 'dashed' },
  plus: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#F2EFE6', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  labelWrap: { alignItems: 'center', paddingHorizontal: 10 },
  tag: { backgroundColor: '#E8E4D8', paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#121212' },
  titleBox: { backgroundColor: '#161616', paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
});
