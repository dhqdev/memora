import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { photoUri } from '../photos';
import { useTheme } from '../theme';
import { EdgeFade } from './motion';

const ITEM_W = 92;
const ITEM_H = 120;
const GAP = 22;
/** px por segundo: devagar, de "vitrine" — dá pra olhar cada foto. */
const SPEED = 18;
const TILT = [-4, 3, -2, 4, -3, 2];

/**
 * Letreiro de fotos do mês: as fotos se repetem até encher a faixa e andam
 * devagar para a esquerda, em degraus e levemente tortas (como fotos coladas).
 * Para quando a aba sai de foco e respeita "Reduzir movimento".
 */
export function PhotoMarquee({ photos, height = 200 }: { photos: string[]; height?: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const x = useSharedValue(0);

  // repete as fotos até ter pelo menos 6 (uma foto só vira uma fileira dela)
  const base = useMemo(
    () => (photos.length ? Array.from({ length: Math.max(6, photos.length) }, (_, k) => photos[k % photos.length]) : []),
    [photos],
  );
  const span = base.length * (ITEM_W + GAP);

  useFocusEffect(
    useCallback(() => {
      if (reduce || !span) return;
      x.value = 0;
      x.value = withRepeat(withTiming(-span, { duration: (span / SPEED) * 1000, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(x);
    }, [reduce, span, x]),
  );

  const track = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  if (!base.length) return null;
  // duas voltas lado a lado: quando a primeira sai, a segunda está no lugar dela
  const loop = [...base, ...base];

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[styles.track, { width: loop.length * (ITEM_W + GAP) + 20 }, track]}>
        {loop.map((p, k) => (
          <Image
            key={k}
            source={{ uri: photoUri(p) }}
            contentFit="cover"
            transition={300}
            style={[
              styles.item,
              {
                marginTop: k % 2 ? 46 : 6,
                transform: [{ rotate: `${TILT[k % TILT.length]}deg` }],
                borderColor: c.mode === 'dark' ? 'rgba(242,239,230,0.9)' : '#FFFFFF',
              },
            ]}
          />
        ))}
      </Animated.View>
      <EdgeFade color={c.bg} side="left" width={28} />
      <EdgeFade color={c.bg} side="right" width={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', marginHorizontal: -20 },
  track: { flexDirection: 'row', paddingLeft: 20 },
  item: { width: ITEM_W, height: ITEM_H, borderRadius: 12, marginRight: GAP, borderWidth: 2.5 },
});
