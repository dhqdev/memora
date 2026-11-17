import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { LumiFace } from '@/components/Lumi';
import { riseIn } from '@/components/motion';
import { FaceBubble, PersonAvatar } from '@/components/PersonAvatar';
import { SpeechBubble } from '@/components/SpeechBubble';
import { AvatarStack, Label, MentionText, PressableScale, StoryPill, TypingBubble, monoText } from '@/components/ui';
import { rankPeople, unnamedFaces } from '@/faces/logic';
import { isFresh, MONTHS, sameDay, WEEKDAYS, WEEKDAYS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, display, F, heading, hero, radius, useTheme } from '@/theme';
import { Moment, Person, Story } from '@/types';

const WEEKDAYS_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export default function MomentsTab() {
  const c = useTheme();
  const { moments, people, stories, profile, faces } = useStore();
  // bolinhas: quem mais aparece nas fotos e nas @menções vem primeiro
  const ranked = useMemo(() => rankPeople(people, moments, faces), [people, moments, faces]);
  const waiting = useMemo(() => (profile.faces ? unnamedFaces(faces, moments) : []), [profile.faces, faces, moments]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const groups = useMemo(() => {
    const sorted = [...moments].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    const map = new Map<string, { month: number; year: number; list: Moment[] }>();
    sorted.forEach((m) => {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const g = map.get(key) ?? { month: d.getMonth(), year: d.getFullYear(), list: [] };
      g.list.push(m);
      map.set(key, g);
    });
    return [...map.entries()];
  }, [moments]);

  let order = 0; // escalonamento da entrada: só os primeiros itens esperam

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <Greeting />
      <Composer />

      {!moments.length && (
        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.empty}>
          {profile.showBuddy && <LumiFace size={88} mood="excited" />}
          <View style={{ marginTop: 18, maxWidth: 300 }}>
            <SpeechBubble text={`${profile.name ? profile.name + ', s' : 'S'}eu primeiro moment pode ser só uma frase. Bora?`} />
          </View>
        </Animated.View>
      )}

      {(ranked.length > 0 || waiting.length > 0) && (
        <Animated.View entering={FadeIn.duration(300).delay(120)}>
          <Label style={{ marginBottom: 12 }}>Pessoas</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
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

      {groups.map(([key, g]) => (
        <View key={key} style={{ marginBottom: 8 }}>
          <View style={styles.monthRow}>
            <Text style={display(22, c.text)}>{MONTHS[g.month]}</Text>
            <Text style={monoText(c.muted, 11)}>
              {g.year} · {g.list.length} moment{g.list.length === 1 ? '' : 's'}
            </Text>
          </View>
          {g.list.map((m) => {
            const i = order++;
            return (
              <Animated.View
                key={m.id}
                entering={FadeInDown.duration(380).delay(Math.min(i, 6) * 55)}
                layout={LinearTransition.duration(260)}
              >
                <FeedItem
                  moment={m}
                  story={stories.find((s) => s.id === m.storyId)}
                  who={m.people.map((id) => byId.get(id)).filter((p): p is Person => !!p)}
                />
              </Animated.View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

/** "Boa tarde, Caio." + a semana em bolinhas (com a foto do dia, quando tem). */
function Greeting() {
  const c = useTheme();
  const { profile, moments } = useStore();
  const now = new Date();
  const h = now.getHours();
  const hello = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const first = profile.name.trim().split(/\s+/)[0];

  const week = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, k) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - k));
      const dayMoments = moments.filter((m) => sameDay(new Date(m.date), d));
      return { d, moment: dayMoments.find((m) => m.photos[0]) ?? dayMoments[0], count: dayMoments.length };
    });
  }, [moments]);
  const thisWeek = week.reduce((n, w) => n + w.count, 0);

  return (
    <View>
      <Animated.View entering={riseIn(0)}>
        <Label>
          {WEEKDAYS_LONG[now.getDay()]} · {now.getDate()} de {MONTHS[now.getMonth()].toLowerCase()}
        </Label>
        <Text style={[hero(38, c.text), { marginTop: 10 }]}>
          {hello}
          {first ? `, ${first}` : ''}.
        </Text>
      </Animated.View>

      <Animated.View entering={riseIn(90)} style={{ marginTop: 22 }}>
        <View style={styles.weekHead}>
          <Label>Sua semana</Label>
          <Text style={monoText(c.muted, 11)}>
            {thisWeek ? `${thisWeek} moment${thisWeek === 1 ? '' : 's'}` : 'nenhum moment ainda'}
          </Text>
        </View>
        <View style={styles.week}>
          {week.map(({ d, moment }, k) => {
            const isToday = k === 6;
            const photo = moment?.photos[0];
            return (
              <Pressable
                key={k}
                disabled={!moment}
                onPress={() => moment && router.push(`/moment/${moment.id}`)}
                style={styles.weekDay}
                accessibilityLabel={moment ? `Moment de ${d.getDate()}` : undefined}
              >
                <Text style={[monoText(isToday ? c.text : c.muted, 10.5), { marginBottom: 7 }]}>{WEEKDAYS[d.getDay()]}</Text>
                <View
                  style={[
                    styles.weekDot,
                    {
                      borderColor: isToday ? c.text : c.border,
                      borderWidth: isToday ? 1.5 : StyleSheet.hairlineWidth * 2,
                      backgroundColor: moment && !photo ? c.accent : 'transparent',
                    },
                  ]}
                >
                  {photo ? (
                    <Image source={{ uri: photoUri(photo) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  ) : (
                    <Text style={{ fontFamily: F.medium, fontSize: 13, color: moment ? c.accentText : isToday ? c.text : c.muted }}>{d.getDate()}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

/** Atalho para salvar: toca e escreve; a câmera abre direto. */
function Composer() {
  const c = useTheme();
  const { profile } = useStore();
  return (
    <Animated.View entering={riseIn(170)}>
      <PressableScale scaleTo={0.98} onPress={() => router.push('/new-moment')} style={[styles.composer, { backgroundColor: c.surface, borderColor: c.border }]}>
        {profile.showBuddy ? <LumiFace size={36} mood="happy" /> : <Icon name="edit" size={20} color={c.muted} />}
        <Text style={[body(15, c.muted), { flex: 1 }]} numberOfLines={1}>
          Como foi hoje? Escreva uma linha…
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: '/new-moment', params: { camera: '1' } })}
          hitSlop={8}
          accessibilityLabel="Tirar foto para um moment"
          style={[styles.composerCam, { backgroundColor: c.invert }]}
        >
          <Icon name="camera" size={19} color={c.invertText} />
        </Pressable>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Um moment na linha do tempo: dia grande à esquerda, título, texto, fotos
 * (uma em retrato, duas lado a lado), o comentário da Lumi colado na foto,
 * quem estava junto, o story e o lugar.
 */
function FeedItem({ moment: m, story, who }: { moment: Moment; story?: Story; who: Person[] }) {
  const c = useTheme();
  const d = new Date(m.date);
  const today = sameDay(d, new Date());
  const photos = m.photos.slice(0, 2);
  const extra = m.photos.length - photos.length;

  return (
    <PressableScale scaleTo={0.985} style={styles.item} onPress={() => router.push(`/moment/${m.id}`)}>
      <View style={styles.dayCol}>
        <Text style={display(26, c.text)}>{d.getDate()}</Text>
        <Text style={monoText(today ? c.text : c.muted, 10)}>{today ? 'hoje' : WEEKDAYS_SHORT[d.getDay()]}</Text>
        <View style={[styles.line, { backgroundColor: c.border }]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={heading(17, c.text)}>{m.title}</Text>
        {!!m.text && <MentionText text={m.text} style={[body(14, c.text), { marginTop: 4, opacity: 0.85 }]} />}

        {photos.length === 1 && (
          <Image source={{ uri: photoUri(photos[0]) }} style={styles.photo} contentFit="cover" transition={250} />
        )}
        {photos.length === 2 && (
          <View style={styles.pair}>
            {photos.map((p, k) => (
              <View key={p} style={styles.pairCell}>
                <Image source={{ uri: photoUri(p) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
                {k === 1 && extra > 0 && (
                  <View style={styles.more}>
                    <Text style={{ color: '#F2EFE6', fontFamily: F.semibold, fontSize: 18 }}>+{extra}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {(m.commentPending || m.companionComment) && (
          <Animated.View
            entering={FadeIn.duration(250)}
            layout={LinearTransition.duration(260)}
            style={photos.length ? styles.bubbleOverPhoto : styles.bubble}
          >
            {m.commentPending ? <TypingBubble /> : <SpeechBubble text={m.companionComment!} instant={!isFresh(m.commentAt)} />}
          </Animated.View>
        )}

        {(who.length > 0 || story) && (
          <View style={styles.footer}>
            <AvatarStack people={who} />
            {story && <StoryPill label={`Story · ${story.category} · ${story.year}`} />}
          </View>
        )}
        {m.place && (
          <View style={styles.placeRow}>
            <Icon name="pin" size={12} color={c.muted} />
            <Text style={monoText(c.muted, 10.5)} numberOfLines={1}>
              em {m.place.name}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 36 },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    marginTop: 22,
    marginBottom: 30,
  },
  composerCam: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
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
  monthRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 },
  item: { flexDirection: 'row', marginBottom: 28 },
  dayCol: { width: 46, alignItems: 'flex-start' },
  line: { width: StyleSheet.hairlineWidth * 2, flex: 1, marginLeft: 9, marginTop: 8 },
  photo: { width: '66%', aspectRatio: 0.86, borderRadius: radius.sm + 2, marginTop: 10 },
  pair: { flexDirection: 'row', gap: 6, marginTop: 10, width: '92%' },
  pairCell: { flex: 1, aspectRatio: 0.78, borderRadius: radius.sm + 2, overflow: 'hidden' },
  more: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,19,0.45)', alignItems: 'center', justifyContent: 'center' },
  bubble: { marginTop: 10, maxWidth: '92%' },
  // o balão "encosta" no canto da foto, como um comentário colado nela
  bubbleOverPhoto: { marginTop: -34, marginLeft: '30%', maxWidth: '70%' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
});
