import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Glass } from '@/components/Glass';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { IconButton, PressableScale, monoText } from '@/components/ui';
import { MONTHS_SHORT } from '@/format';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { heading, radius, useTheme } from '@/theme';
import { Moment } from '@/types';

const CARD_W = 248;
const GAP = 10;

/**
 * Mapa dos moments: cada lugar vira um "pin" com a foto do moment.
 * Embaixo, um carrossel de vidro; ao deslizar, o mapa voa até o lugar.
 */
export default function PlacesTab() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { moments } = useStore();
  const map = useRef<MapView>(null);
  const list = useRef<ScrollViewInstance>(null);
  const [active, setActive] = useState(0);
  const withPlace = useMemo(
    () => moments.filter((m) => m.place).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [moments],
  );

  const fitAll = () => {
    const coords = withPlace.map((m) => ({ latitude: m.place!.latitude, longitude: m.place!.longitude }));
    if (coords.length > 1) {
      map.current?.fitToCoordinates(coords, { edgePadding: { top: 80, right: 60, bottom: 220, left: 60 }, animated: true });
    }
  };

  useEffect(() => {
    const t = setTimeout(fitAll, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withPlace.length]);

  function focus(i: number, scrollCards = false) {
    const m = withPlace[i];
    if (!m) return;
    setActive(i);
    map.current?.animateToRegion(
      { latitude: m.place!.latitude, longitude: m.place!.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      380,
    );
    if (scrollCards) list.current?.scrollTo({ x: i * (CARD_W + GAP), animated: true });
  }

  if (!withPlace.length) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
        <LumiFace size={88} mood="thinking" />
        <View style={{ marginTop: 18 }}>
          <SpeechBubble text="Quando você salvar um moment com lugar, ele aparece aqui no mapa." />
        </View>
      </Animated.View>
    );
  }

  const first = withPlace[0].place!;
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle={c.mode}
        showsPointsOfInterests={false}
        initialRegion={{ latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        {withPlace.map((m, i) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.place!.latitude, longitude: m.place!.longitude }}
            onPress={() => focus(i, true)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <Pin moment={m} active={i === active} />
          </Marker>
        ))}
      </MapView>

      <View style={styles.locate}>
        <IconButton icon="locate" label="Ver todos os lugares" onPress={fitAll} />
      </View>

      <Animated.View entering={FadeInDown.duration(320)} style={styles.carousel}>
        <ScrollView
          ref={list}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: GAP, paddingRight: width - CARD_W - 20 }}
          onMomentumScrollEnd={(e) => focus(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP)))}
        >
          {withPlace.map((m, i) => {
            const d = new Date(m.date);
            return (
              <PressableScale key={m.id} scaleTo={0.97} onPress={() => (i === active ? router.push(`/moment/${m.id}`) : focus(i, true))}>
                <Glass style={[styles.card, { borderColor: i === active ? c.text : 'transparent' }]}>
                  {m.photos[0] ? (
                    <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: c.accent }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={heading(15, c.text)} numberOfLines={1}>{m.title}</Text>
                    <Text style={[monoText(c.muted, 10.5), { marginTop: 3 }]} numberOfLines={1}>
                      {m.place!.name}
                    </Text>
                    <Text style={[monoText(c.muted, 10.5), { marginTop: 2 }]}>
                      {d.getDate()} {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
                    </Text>
                  </View>
                </Glass>
              </PressableScale>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** Pin com a foto do moment, moldura clara e um biquinho apontando o lugar. */
function Pin({ moment, active }: { moment: Moment; active: boolean }) {
  const size = active ? 58 : 46;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.pin, { width: size, height: size * 1.2 }]}>
        {moment.photos[0] ? (
          <Image source={{ uri: photoUri(moment.photos[0]) }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F5D565' }]} />
        )}
      </View>
      <View style={styles.beak} />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pin: { borderRadius: 10, borderWidth: 2.5, borderColor: '#F2EFE6', overflow: 'hidden', backgroundColor: '#F2EFE6' },
  beak: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F2EFE6',
    marginTop: -1,
  },
  locate: { position: 'absolute', top: 14, right: 20 },
  carousel: { position: 'absolute', left: 0, right: 0, bottom: 112 },
  card: {
    width: CARD_W,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
});
