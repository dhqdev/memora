import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { photoUri } from '../photos';
import { mono, useTheme } from '../theme';

/**
 * Fotos do moment em páginas (deslize para o lado), com pontinhos que
 * esticam na foto atual. Toque abre a foto em tela cheia.
 */
export function PhotoCarousel({
  photos,
  width,
  height,
  onOpen,
}: {
  photos: string[];
  width: number;
  height: number;
  onOpen: (index: number) => void;
}) {
  const c = useTheme();
  const [page, setPage] = useState(0);
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  return (
    <View>
      <View style={[styles.frame, { width, height }]}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          scrollEnabled={photos.length > 1}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((p, i) => (
            <Pressable key={p} onPress={() => onOpen(i)} accessibilityLabel={`Abrir foto ${i + 1}`}>
              <Image source={{ uri: photoUri(p) }} style={{ width, height }} contentFit="cover" transition={250} />
            </Pressable>
          ))}
        </Animated.ScrollView>
        {photos.length > 1 && (
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>
              {page + 1}/{photos.length}
            </Text>
          </View>
        )}
      </View>
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <Dot key={p} i={i} x={x} width={width} color={c.text} />
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ i, x, width, color }: { i: number; x: SharedValue<number>; width: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(x.value / width, [i - 1, i, i + 1], [0, 1, 0], Extrapolation.CLAMP);
    return { width: 6 + t * 14, opacity: 0.3 + t * 0.7 };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  frame: { borderRadius: 20, overflow: 'hidden' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(20,20,19,0.62)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  counterText: { fontFamily: mono, fontSize: 11, color: '#F2EFE6' },
});
