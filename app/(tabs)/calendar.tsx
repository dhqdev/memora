import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

  const inMonth = useMemo(
    () => moments.filter((m) => {
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

  const today = new Date();
  const shift = (n: number) => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + n, 1));
  const strip = inMonth.filter((m) => m.photos[0]).slice(0, 6);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
      <View style={styles.hero}>
        {strip.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {strip.map((m, i) => (
              <Image
                key={m.id}
                source={{ uri: photoUri(m.photos[0]) }}
                style={[styles.heroImg, { marginTop: i % 2 ? 40 : 0 }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        )}
        <View style={styles.heroLabel}>
          <Text style={[monoText('#F2EFE6', 13), { letterSpacing: 0.5 }]}>
            {inMonth.length} moment{inMonth.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.monthRow}>
        <View>
          <Text style={monoText(c.muted, 11)}>{cursor.getFullYear()}</Text>
          <Animated.Text key={cursor.toISOString()} entering={FadeIn.duration(260)} style={display(36, c.text)}>
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
          <Text key={i} style={[monoText(c.muted), styles.weekday]}>{w}</Text>
        ))}
      </View>

      <View style={[styles.grid, { borderColor: c.border }]}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
          const m = inMonth.find((x) => sameDay(new Date(x.date), date));
          return (
            <Pressable
              key={i}
              disabled={!m}
              onPress={() => m && router.push(`/moment/${m.id}`)}
              style={[styles.cell, { borderColor: c.border }]}
            >
              <Text style={{ color: c.text, fontSize: 12, fontFamily: sameDay(date, today) ? F.bold : F.regular }}>{day}</Text>
              {m?.photos[0] ? (
                <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" transition={200} />
              ) : m ? (
                <View style={[styles.dot, { backgroundColor: c.accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, justifyContent: 'center', marginBottom: 24 },
  heroImg: { width: 90, height: 120, borderRadius: 8, marginRight: 24, opacity: 0.85 },
  heroLabel: { position: 'absolute', alignSelf: 'center', backgroundColor: '#141413', paddingHorizontal: 12, paddingVertical: 8 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  week: { flexDirection: 'row', marginBottom: 12 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderLeftWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.82,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 6,
  },
  thumb: { flex: 1, borderRadius: 4, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
});
