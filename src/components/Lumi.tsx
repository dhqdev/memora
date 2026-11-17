import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { lumiSvg, type Mood } from './lumiArt';
import { PressableScale } from './ui';

export type { Mood } from './lumiArt';

const cache = new Map<string, string>();
const xmlFor = (m: Mood, blink: boolean) => {
  const key = blink ? `${m}:blink` : m;
  if (!cache.has(key)) cache.set(key, lumiSvg(m, blink));
  return cache.get(key)!;
};

/**
 * Lumi — a companheira do Memora. Retrato em traço preto e branco (mangá),
 * desenho original. `blink` fecha os olhos por um instante.
 */
export function LumiFace({ size = 64, mood = 'happy', blink = false }: { size?: number; mood?: Mood; blink?: boolean }) {
  return <SvgXml xml={xmlFor(mood, blink)} width={size} height={size} />;
}

/** Botão flutuante da Lumi: flutua devagar e pisca de vez em quando. */
export function LumiFab({ onPress }: { onPress: () => void }) {
  const y = useSharedValue(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3800);
    return () => clearInterval(id);
  }, [y]);

  const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View entering={ZoomIn.springify().damping(14).delay(250)} style={styles.fab}>
      <Animated.View style={float}>
        <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel="Conversar com a Lumi" style={styles.shadow}>
          <LumiFace size={64} mood="excited" blink={blink} />
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 18, bottom: 34 },
  shadow: {
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
