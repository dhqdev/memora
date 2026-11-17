import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PersonAvatar } from '@/components/PersonAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { rankPeople } from '@/faces/logic';
import { Avatar, IconButton, Label, OutlineButton, PressableScale, monoText } from '@/components/ui';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, display, F, heading, useTheme } from '@/theme';

/** Perfil: quem você é, seus números, suas pessoas e o grid dos seus moments. */
export default function ProfileScreen() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { profile, moments, stories, people, faces } = useStore();
  const ranked = useMemo(() => rankPeople(people, moments, faces), [people, moments, faces]);
  const tile = (width - 40 - 4) / 3;

  const sorted = useMemo(() => [...moments].sort((a, b) => +new Date(b.date) - +new Date(a.date)), [moments]);
  const places = useMemo(() => new Set(moments.map((m) => m.place?.name).filter(Boolean)).size, [moments]);
  const handle = profile.handle ? '@' + profile.handle : '';

  const share = () =>
    Share.share({
      message: `${profile.name || 'Eu'} no Memora ✦ ${moments.length} moments e ${stories.length} stories guardados.${handle ? ' ' + handle : ''}`,
    }).catch(() => {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        label="Perfil"
        right={
          <>
            <IconButton icon="share" label="Compartilhar perfil" onPress={share} />
            <IconButton icon="sliders" label="Ajustes" onPress={() => router.push('/settings')} />
          </>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.head}>
          <PressableScale scaleTo={0.95} onPress={() => router.push('/edit-profile')} accessibilityLabel="Editar foto">
            <Avatar name={profile.name || 'M'} size={92}>
              {profile.photo ? <Image source={{ uri: photoUri(profile.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
            </Avatar>
          </PressableScale>
          <View style={{ flex: 1 }}>
            <Text style={display(28, c.text)} numberOfLines={1}>{profile.name || 'Seu nome'}</Text>
            {!!handle && <Text style={[monoText(c.muted, 12), { marginTop: 2 }]}>{handle}</Text>}
            {profile.joinedAt && (
              <Text style={[monoText(c.muted, 10.5), { marginTop: 6 }]}>
                no Memora desde {new Date(profile.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </Text>
            )}
          </View>
        </Animated.View>

        {!!profile.bio && <Text style={[body(15, c.text), { marginTop: 14 }]}>{profile.bio}</Text>}

        <Animated.View entering={FadeIn.duration(320).delay(80)} style={[styles.stats, { borderColor: c.border }]}>
          <Stat n={moments.length} label="moments" />
          <Stat n={stories.length} label="stories" />
          <Stat n={people.length} label="pessoas" />
          <Stat n={places} label="lugares" />
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title="Editar perfil" onPress={() => router.push('/edit-profile')} />
          </View>
          <View style={{ flex: 1 }}>
            <OutlineButton title="Compartilhar" onPress={share} />
          </View>
        </View>

        {people.length > 0 && (
          <>
            <Label style={{ marginTop: 28, marginBottom: 12 }}>Suas pessoas</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {ranked.map((p) => (
                <PressableScale key={p.id} onPress={() => router.push(`/person/${p.id}`)} style={{ alignItems: 'center' }}>
                  <PersonAvatar person={p} size={56} />
                  <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 12, marginTop: 6 }}>{p.name}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          </>
        )}

        <Label style={{ marginTop: 28, marginBottom: 12 }}>Moments</Label>
        <View style={styles.grid}>
          {sorted.map((m, i) => (
            <Animated.View key={m.id} entering={FadeIn.duration(260).delay(Math.min(i, 9) * 30)}>
              <PressableScale scaleTo={0.96} onPress={() => router.push(`/moment/${m.id}`)}>
                {m.photos[0] ? (
                  <Image source={{ uri: photoUri(m.photos[0]) }} style={{ width: tile, height: tile * 1.25 }} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.textTile, { width: tile, height: tile * 1.25, backgroundColor: c.surface }]}>
                    <Text style={heading(13, c.text)} numberOfLines={4}>{m.title}</Text>
                  </View>
                )}
              </PressableScale>
            </Animated.View>
          ))}
        </View>
        {!moments.length && <Text style={body(14, c.muted)}>Seus moments aparecem aqui.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  const c = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={display(22, c.text)}>{n}</Text>
      <Text style={monoText(c.muted, 10.5)}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  stats: { flexDirection: 'row', paddingVertical: 16, marginVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderRadius: 12, overflow: 'hidden' },
  textTile: { padding: 10, justifyContent: 'flex-end' },
});
