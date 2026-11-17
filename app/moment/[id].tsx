import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiFace } from '@/components/Lumi';
import { popIn, riseIn } from '@/components/motion';
import { FaceBubble } from '@/components/PersonAvatar';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SpeechBubble } from '@/components/SpeechBubble';
import { Avatar, IconButton, MentionText, PressableScale, TypingBubble, monoText } from '@/components/ui';
import { isFresh } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, display, F, useTheme } from '@/theme';

/**
 * Um moment aberto. As fotos vêm primeiro, grandes, em páginas; ao rolar elas
 * ficam um pouco para trás (parallax) e, puxando para baixo, esticam.
 * Quando o título some, ele passa para o topo da tela.
 */
export default function MomentDetail() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moments, people, stories, profile, faces, deleteMoment } = useStore();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const photoW = width - 40;
  const photoH = Math.round(photoW * 1.18);
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value > 0 ? y.value * 0.28 : y.value * 0.5 },
      { scale: interpolate(y.value, [-160, 0], [1.14, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(y.value, [0, photoH], [1, 0.35], Extrapolation.CLAMP),
  }));

  const m = moments.find((x) => x.id === id);
  if (!m) return null;

  const who = people.filter((p) => m.people.includes(p.id));
  const inPhotos = faces.filter((f) => f.momentId === m.id && (f.status === 'new' || f.status === 'person'));
  const story = stories.find((s) => s.id === m.storyId);
  const date = new Date(m.date);
  const hasPhotos = m.photos.length > 0;

  const remove = () =>
    Alert.alert('Apagar moment?', 'Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => { deleteMoment(m.id); router.back(); } },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        label="Moment"
        title={m.title}
        scrollY={y}
        threshold={hasPhotos ? photoH + 90 : 90}
        right={<IconButton icon="more" label="Opções" onPress={remove} />}
      />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {hasPhotos && (
          <Animated.View style={[photoStyle, { marginBottom: 22 }]}>
            <Animated.View entering={popIn(60, 480)}>
              <PhotoCarousel
                photos={m.photos}
                width={photoW}
                height={photoH}
                onOpen={(i) => router.push({ pathname: '/viewer', params: { id: m.id, i: String(i) } })}
              />
            </Animated.View>
          </Animated.View>
        )}

        {/* o texto tem fundo para passar por cima da foto no parallax */}
        <View style={{ backgroundColor: c.bg }}>
          <Animated.View entering={riseIn(hasPhotos ? 160 : 40)}>
            <Text style={monoText(c.muted, 11)}>
              — {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={[display(32, c.text), { marginTop: 10 }]}>{m.title}</Text>
            {!!m.text && <MentionText text={m.text} style={[body(16.5, c.text), { marginTop: 12 }]} />}
          </Animated.View>

          {inPhotos.length > 0 && (
            <Animated.View entering={FadeIn.duration(380).delay(240)} style={styles.faces}>
              {inPhotos.map((f) => {
                const p = people.find((x) => x.id === f.personId);
                return (
                  <PressableScale
                    key={f.id}
                    scaleTo={0.92}
                    style={{ alignItems: 'center', width: 58 }}
                    onPress={() => (p ? router.push(`/person/${p.id}`) : router.push({ pathname: '/faces', params: { face: f.id } }))}
                  >
                    <FaceBubble crop={f.crop} size={44} ring={p ? undefined : c.text} />
                    <Text style={[monoText(p ? c.text : c.muted, 10.5), { marginTop: 5 }]} numberOfLines={1}>
                      {p ? p.name : 'quem é?'}
                    </Text>
                  </PressableScale>
                );
              })}
            </Animated.View>
          )}

          <Animated.View entering={FadeIn.duration(380).delay(280)} style={[styles.meta, { borderTopColor: c.border }]}>
            {who.length > 0 && (
              <Row label="Com">
                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                  {who.map((p, i) => (
                    <View key={p.id} style={{ marginLeft: i ? -6 : 0 }}>
                      <Avatar name={p.name} size={22}>
                        {p.photo ? <Image source={{ uri: photoUri(p.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
                      </Avatar>
                    </View>
                  ))}
                  <Text style={[styles.value, { color: c.text, marginLeft: 8 }]} numberOfLines={1}>
                    {who.map((p) => p.name).join(', ')}
                  </Text>
                </View>
              </Row>
            )}
            {m.place && (
              <Row label="Onde">
                <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>
                  {m.place.name}
                </Text>
              </Row>
            )}
            {story && (
              <Row label="Story" onPress={() => router.push(`/story/${story.id}`)}>
                <Text style={[styles.value, { color: c.text }]}>
                  {story.category} · {story.year} ›
                </Text>
              </Row>
            )}
            <Row label="Hora">
              <Text style={[styles.value, { color: c.text }]}>
                {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Row>
          </Animated.View>

          {(m.commentPending || m.companionComment) && (
            <Animated.View entering={FadeInUp.duration(420).delay(380)} style={styles.lumi}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {m.commentPending ? <TypingBubble /> : <SpeechBubble text={m.companionComment!} instant={!isFresh(m.commentAt, 15000)} />}
              </View>
              {profile.showBuddy && <LumiFace size={56} mood={m.commentPending ? 'thinking' : 'excited'} />}
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, children, onPress }: { label: string; children: React.ReactNode; onPress?: () => void }) {
  const c = useTheme();
  return (
    <PressableScale scaleTo={0.99} disabled={!onPress} onPress={onPress} style={[styles.row, { borderBottomColor: c.border }]}>
      <Text style={monoText(c.muted, 11)}>{label}</Text>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  meta: { marginTop: 26, borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  value: { fontFamily: F.medium, fontSize: 14 },
  lumi: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 30 },
});
