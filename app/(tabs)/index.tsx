import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { LumiFace } from '@/components/Lumi';
import { FaceBubble, PersonAvatar } from '@/components/PersonAvatar';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Label, MentionText, PressableScale, PrimaryButton, TypingBubble, monoText } from '@/components/ui';
import { rankPeople, unnamedFaces } from '@/faces/logic';
import { isFresh, monthLabel, WEEKDAYS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, display, F, heading, radius, useTheme } from '@/theme';
import { Moment } from '@/types';

export default function MomentsTab() {
  const c = useTheme();
  const { moments, people, stories, profile, faces } = useStore();
  // bolinhas: quem mais aparece nas fotos e nas @menções vem primeiro
  const ranked = useMemo(() => rankPeople(people, moments, faces), [people, moments, faces]);
  const waiting = useMemo(() => (profile.faces ? unnamedFaces(faces, moments) : []), [profile.faces, faces, moments]);

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
      <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
        {profile.showBuddy && <LumiFace size={88} mood="excited" />}
        <View style={{ marginVertical: 20 }}>
          <SpeechBubble text={`${profile.name ? profile.name + ', s' : 'S'}eu primeiro moment pode ser só uma frase. Bora?`} />
        </View>
        <PrimaryButton title="Salvar um moment" onPress={() => router.push('/new-moment')} />
      </Animated.View>
    );
  }

  let order = 0; // escalonamento da entrada: só os primeiros itens esperam

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}>
      {(ranked.length > 0 || waiting.length > 0) && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Label style={{ marginBottom: 12 }}>Pessoas</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {waiting.length > 0 && (
              <PressableScale style={styles.person} onPress={() => router.push('/faces')} accessibilityLabel={`${waiting.length} rostos sem nome`}>
                <View>
                  <FaceBubble crop={waiting[0].crop} size={56} ring={c.text} />
                  <View style={[styles.count, { backgroundColor: c.invert, borderColor: c.bg }]}>
                    <Text style={{ color: c.invertText, fontSize: 11, fontFamily: F.semibold }}>{waiting.length}</Text>
                  </View>
                </View>
                <Text style={{ color: c.text, marginTop: 6, fontSize: 12, fontFamily: F.semibold }}>Quem é?</Text>
              </PressableScale>
            )}
            {ranked.map((p) => (
              <Animated.View key={p.id} layout={LinearTransition.duration(260)}>
                <PressableScale style={styles.person} onPress={() => router.push(`/person/${p.id}`)}>
                  <PersonAvatar person={p} size={56} />
                  <Text style={{ color: c.text, marginTop: 6, fontSize: 12, fontFamily: F.medium }} numberOfLines={1}>
                    {p.name}
                  </Text>
                </PressableScale>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {groups.map(([label, list]) => (
        <View key={label} style={{ marginBottom: 8 }}>
          <Text style={[heading(15, c.text), { marginBottom: 18 }]}>{label}</Text>
          {list.map((m) => {
            const d = new Date(m.date);
            const story = stories.find((s) => s.id === m.storyId);
            const meta = [m.place?.name, story ? `${story.category} · ${story.year}` : null].filter(Boolean).join('  ·  ');
            const i = order++;
            return (
              <Animated.View
                key={m.id}
                entering={FadeInDown.duration(380).delay(Math.min(i, 6) * 55)}
                layout={LinearTransition.duration(260)}
              >
                <PressableScale scaleTo={0.985} style={styles.item} onPress={() => router.push(`/moment/${m.id}`)}>
                  <View style={styles.dayCol}>
                    <Text style={display(24, c.text)}>{d.getDate()}</Text>
                    <Text style={monoText(c.muted, 10)}>{WEEKDAYS_SHORT[d.getDay()]}</Text>
                    <View style={[styles.line, { backgroundColor: c.border }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={heading(17, c.text)}>{m.title}</Text>
                    {!!m.text && <MentionText text={m.text} style={[body(14, c.text), { marginTop: 4, opacity: 0.85 }]} />}
                    {m.photos[0] && (
                      <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.photo} contentFit="cover" transition={250} />
                    )}
                    {(m.commentPending || m.companionComment) && (
                      <Animated.View
                        entering={FadeIn.duration(250)}
                        layout={LinearTransition.duration(260)}
                        style={m.photos[0] ? styles.bubbleOverPhoto : styles.bubble}
                      >
                        {m.commentPending ? (
                          <TypingBubble />
                        ) : (
                          <SpeechBubble text={m.companionComment!} instant={!isFresh(m.commentAt)} />
                        )}
                      </Animated.View>
                    )}
                    {!!meta && <Text style={[monoText(c.muted, 10.5), { marginTop: 10 }]}>{meta}</Text>}
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  person: { alignItems: 'center', marginRight: 14, width: 60 },
  count: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: { flexDirection: 'row', marginBottom: 26 },
  dayCol: { width: 44, alignItems: 'flex-start' },
  line: { width: StyleSheet.hairlineWidth * 2, flex: 1, marginLeft: 8, marginTop: 8 },
  photo: { width: '66%', aspectRatio: 0.86, borderRadius: radius.sm, marginTop: 10 },
  bubble: { marginTop: 10, maxWidth: '92%' },
  // o balão "encosta" no canto da foto, como um comentário colado nela
  bubbleOverPhoto: { marginTop: -34, marginLeft: '30%', maxWidth: '70%' },
});
