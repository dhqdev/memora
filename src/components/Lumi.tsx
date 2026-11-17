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
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { PressableScale } from './ui';

export type Mood = 'happy' | 'excited' | 'thinking' | 'sleepy';

/**
 * Lumi — a companheira do Memora. Um "bolinho de luz" com uma estrelinha na cabeça.
 * Desenho original, feito em SVG para trocar de expressão sem assets.
 */
export function LumiFace({ size = 64, mood = 'happy', blink = false }: { size?: number; mood?: Mood; blink?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill="#F2EFE6" stroke="#121212" strokeWidth="3" />
      {/* corpo */}
      <Path d="M22 78 C18 46 30 28 50 28 C70 28 82 46 78 78 Z" fill="#F5D565" stroke="#121212" strokeWidth="3" />
      {/* estrelinha */}
      <Path d="M50 10 L53 19 L62 19 L55 25 L58 34 L50 28 L42 34 L45 25 L38 19 L47 19 Z" fill="#121212" />
      {/* bochechas */}
      <Ellipse cx="34" cy="60" rx="5" ry="3" fill="#F19C79" opacity={0.7} />
      <Ellipse cx="66" cy="60" rx="5" ry="3" fill="#F19C79" opacity={0.7} />
      {/* olhos */}
      {mood === 'sleepy' || blink ? (
        <>
          <Path d="M35 52 L45 52" stroke="#121212" strokeWidth="3" strokeLinecap="round" />
          <Path d="M55 52 L65 52" stroke="#121212" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : mood === 'excited' ? (
        <>
          <Circle cx="40" cy="51" r="5" fill="#121212" />
          <Circle cx="60" cy="51" r="5" fill="#121212" />
          <Circle cx="42" cy="49" r="1.6" fill="#fff" />
          <Circle cx="62" cy="49" r="1.6" fill="#fff" />
        </>
      ) : mood === 'thinking' ? (
        <>
          <Circle cx="40" cy="50" r="3.5" fill="#121212" />
          <Path d="M55 51 Q60 46 65 51" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path d="M35 53 Q40 47 45 53" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M55 53 Q60 47 65 53" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* boca */}
      {mood === 'thinking' ? (
        <Path d="M45 66 L55 66" stroke="#121212" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <Path d="M43 64 Q50 71 57 64" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
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
          <LumiFace size={62} blink={blink} />
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, bottom: 34 },
  shadow: {
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
