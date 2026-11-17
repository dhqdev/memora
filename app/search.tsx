import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { LumiFace } from '@/components/Lumi';
import { PersonAvatar } from '@/components/PersonAvatar';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Chip, Label, PressableScale, monoText } from '@/components/ui';
import { rankPeople } from '@/faces/logic';
import { MONTHS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { highlight, search } from '@/search';
import { useStore } from '@/store';
import { body, F, heading, radius, useTheme } from '@/theme';

/**
 * Busca: abre por cima da tela com um fade, já com o teclado.
 * Procura em título, texto, @pessoas, lugar e story — sem ligar pra acento.
 */
export default function SearchScreen() {
  const c = useTheme();
  const { moments, people, stories, faces, profile } = useStore();
  const [q, setQ] = useState('');
  const query = useDeferredValue(q);
  const results = useMemo(() => search(query, { moments, people, stories }), [query, moments, people, stories]);
  const ranked = useMemo(() => rankPeople(people, moments, faces).slice(0, 12), [people, moments, faces]);
  const topPlaces = useMemo(() => {
    const count = new Map<string, number>();
    moments.forEach((m) => m.place && count.set(m.place.name, (count.get(m.place.name) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  }, [moments]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const typing = query.trim().length > 0;
  const total = results.moments.length + results.people.length + results.stories.length + results.places.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Animated.View entering={FadeInDown.duration(260)} style={styles.top}>
        <View style={[styles.field, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Icon name="search" size={18} color={c.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="Moments, @pessoas, lugares…"
            placeholderTextColor={c.muted}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: c.text }]}
          />
          {!!q && (
            <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Limpar busca">
              <View style={[styles.clear, { backgroundColor: c.chip }]}>
                <Icon name="close" size={12} color={c.text} />
              </View>
            </Pressable>
          )}
        </View>
        <Pressable onPress={close} hitSlop={8}>
          <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 15 }}>Cancelar</Text>
        </Pressable>
      </Animated.View>

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        {!typing && (
          <Animated.View entering={FadeIn.duration(300).delay(80)}>
            {ranked.length > 0 && (
              <>
                <Label style={{ marginBottom: 12 }}>Pessoas</Label>
                <PeopleRow list={ranked} />
              </>
            )}
            {topPlaces.length > 0 && (
              <>
                <Label style={{ marginTop: 24, marginBottom: 10 }}>Lugares</Label>
                <View style={styles.wrap}>
                  {topPlaces.map((name) => (
                    <Chip key={name} icon="pin" label={name} onPress={() => setQ(name)} />
                  ))}
                </View>
              </>
            )}
            {stories.length > 0 && (
              <>
                <Label style={{ marginTop: 16, marginBottom: 10 }}>Stories</Label>
                <View style={styles.wrap}>
                  {stories.map((s) => (
                    <Chip key={s.id} icon="book" label={s.title} onPress={() => router.push(`/story/${s.id}`)} />
                  ))}
                </View>
              </>
            )}
            {profile.showBuddy && (
              <View style={styles.lumi}>
                <LumiFace size={52} mood="happy" />
                <View style={{ flex: 1 }}>
                  <SpeechBubble
                    text={moments.length ? 'Procura por uma palavra, uma @pessoa ou um lugar. Eu acho rapidinho.' : 'Quando você salvar uns moments, dá pra achar tudo por aqui.'}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {typing && total === 0 && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.lumi}>
            {profile.showBuddy && <LumiFace size={52} mood="thinking" />}
            <View style={{ flex: 1 }}>
              <SpeechBubble key={query} text={`Não achei nada com "${query.trim()}". Tenta outra palavra?`} />
            </View>
          </Animated.View>
        )}

        {typing && total > 0 && (
          <>
            <Text style={[monoText(c.muted, 11), { marginBottom: 16 }]}>
              {total} resultado{total === 1 ? '' : 's'}
            </Text>

            {results.people.length > 0 && (
              <Animated.View entering={FadeIn.duration(200)} layout={LinearTransition.duration(220)}>
                <PeopleRow list={results.people} />
              </Animated.View>
            )}

            {(results.places.length > 0 || results.stories.length > 0) && (
              <Animated.View entering={FadeIn.duration(200)} layout={LinearTransition.duration(220)} style={[styles.wrap, { marginBottom: 8 }]}>
                {results.places.map((p) => (
                  <Chip key={p.name} icon="pin" label={`${p.name} · ${p.count}`} onPress={() => router.push(`/moment/${p.momentId}`)} />
                ))}
                {results.stories.map((s) => (
                  <Chip key={s.id} icon="book" label={`${s.title} · ${s.year}`} onPress={() => router.push(`/story/${s.id}`)} />
                ))}
              </Animated.View>
            )}

            {results.moments.map((m, i) => {
              const d = new Date(m.date);
              const snippet = m.text ? highlight(m.text, query) : [];
              return (
                <Animated.View key={m.id} entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)} layout={LinearTransition.duration(220)}>
                  <PressableScale scaleTo={0.98} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
                    {m.photos[0] ? (
                      <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" transition={150} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: c.surface }]}>
                        <Text style={heading(18, c.text)}>{d.getDate()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={monoText(c.muted, 10.5)}>
                        {d.getDate()} {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
                        {m.place ? `  ·  ${m.place.name}` : ''}
                      </Text>
                      <Marked parts={highlight(m.title, query)} style={[heading(16, c.text), { marginTop: 2 }]} />
                      {snippet.length > 0 && <Marked parts={snippet} style={[body(13.5, c.muted), { marginTop: 2 }]} lines={2} />}
                    </View>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PeopleRow({ list }: { list: { id: string; name: string; photo?: string }[] }) {
  const c = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
      {list.map((p) => (
        <PressableScale key={p.id} style={{ alignItems: 'center', width: 60 }} onPress={() => router.push(`/person/${p.id}`)}>
          <PersonAvatar person={p} size={52} />
          <Text style={{ color: c.text, marginTop: 6, fontSize: 12, fontFamily: F.medium }} numberOfLines={1}>
            {p.name}
          </Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

/** Texto com o marca-texto amarelo onde a busca bateu. */
function Marked({ parts, style, lines }: { parts: { text: string; hit: boolean }[]; style: StyleProp<TextStyle>; lines?: number }) {
  const c = useTheme();
  return (
    <Text style={style} numberOfLines={lines}>
      {parts.map((p, i) =>
        p.hit ? (
          <Text key={i} style={{ backgroundColor: c.accent, color: c.accentText }}>
            {p.text}
          </Text>
        ) : (
          p.text
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  field: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, fontFamily: F.regular, paddingVertical: 0 },
  clear: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  lumi: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
});
