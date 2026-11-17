import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Glass } from '@/components/Glass';
import { PhotoMarquee } from '@/components/PhotoMarquee';
import { IconButton, monoText } from '@/components/ui';
import { photoUri } from '@/photos';
import { MONTHS, WEEKDAYS, sameDay } from '@/format';
import { useStore } from '@/store';
import { display, F, useTheme } from '@/theme';

export default function CalendarTab() {
  const c = useTheme();
  const { moments } = useStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // de que lado o mês novo entra (seta da direita: vem da direita)
  const [dir, setDir] = useState<1 | -1>(1);

  const inMonth = useMemo(
    () =>
      moments.filter((m) => {
        const d = new Date(m.date);
        return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
      }),
    [moments, cursor],
  );

  const cells = useMemo(() => {
    const first = cursor.getDay();
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [cursor]);

  const strip = useMemo(() => inMonth.filter((m) => m.photos[0]).map((m) => m.photos[0]), [inMonth]);
  const today = new Date();
  const shift = (n: 1 | -1) => {
    setDir(n);
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + n, 1));
  };
  const Enter = dir > 0 ? FadeInRight : FadeInLeft;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { height: strip.length ? 200 : 96 }]}>
        <Animated.View key={`strip-${cursor.toISOString()}`} entering={FadeIn.duration(420)} style={StyleSheet.absoluteFill}>
          <PhotoMarquee photos={strip} />
        </Animated.View>
        <Glass style={styles.heroLabel}>
          <Animated.Text key={`n-${cursor.toISOString()}`} entering={FadeIn.duration(300)} style={display(26, c.text)}>
            {inMonth.length} moment{inMonth.length === 1 ? '' : 's'}
          </Animated.Text>
        </Glass>
      </View>

      <View style={styles.monthRow}>
        <View>
          <Text style={monoText(c.muted, 11)}>{cursor.getFullYear()}</Text>
          <Animated.Text key={cursor.toISOString()} entering={Enter.duration(280)} style={display(40, c.text)}>
            {MONTHS[cursor.getMonth()]}
          </Animated.Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton icon="chevLeft" label="Mês anterior" onPress={() => shift(-1)} />
          <IconButton icon="chevRight" label="Próximo mês" onPress={() => shift(1)} />
        </View>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[monoText(c.muted), styles.weekday]}>
            {w}
          </Text>
        ))}
      </View>

      <Animated.View key={`grid-${cursor.toISOString()}`} entering={Enter.duration(300)} style={[styles.grid, { borderColor: c.border }]}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
          const m = inMonth.find((x) => sameDay(new Date(x.date), date));
          const isToday = sameDay(date, today);
          return (
            <Pressable
              key={i}
              disabled={!m}
              onPress={() => m && router.push(`/moment/${m.id}`)}
              style={({ pressed }) => [styles.cell, { borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}
            >
              <View style={[styles.num, isToday && { backgroundColor: c.invert }]}>
                <Text style={{ color: isToday ? c.invertText : c.text, fontSize: 12, fontFamily: isToday ? F.bold : F.regular }}>{day}</Text>
              </View>
              {m?.photos[0] ? (
                <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" transition={200} />
              ) : m ? (
                <View style={[styles.dot, { backgroundColor: c.accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { justifyContent: 'center', marginBottom: 24 },
  heroLabel: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  week: { flexDirection: 'row', marginBottom: 12 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderLeftWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.82,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 5,
  },
  num: { alignSelf: 'flex-start', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  thumb: { flex: 1, borderRadius: 4, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8, marginLeft: 4 },
});
