import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { heading, useTheme } from '../theme';
import { IconButton, Label } from './ui';

/**
 * Topo das telas internas: voltar · etiqueta mono · ação opcional.
 *
 * Com `scrollY` + `title`, o topo acompanha a rolagem: quando o título grande
 * da página sai de cena, a etiqueta ("MOMENT") dá lugar ao próprio título e
 * aparece um fio embaixo — o mesmo truque dos títulos grandes do iOS.
 */
export function ScreenHeader({
  label,
  right,
  title,
  scrollY,
  threshold = 140,
}: {
  label: string;
  right?: React.ReactNode;
  title?: string;
  scrollY?: SharedValue<number>;
  threshold?: number;
}) {
  const c = useTheme();
  const still = useSharedValue(0);
  const y = scrollY ?? still;

  const labelStyle = useAnimatedStyle(() => ({
    opacity: title ? interpolate(y.value, [threshold - 50, threshold - 10], [1, 0], Extrapolation.CLAMP) : 1,
  }));
  const titleStyle = useAnimatedStyle(() => {
    const t = interpolate(y.value, [threshold - 20, threshold + 20], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 8 }] };
  });
  const lineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 24], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.row, { backgroundColor: c.bg }]}>
      <IconButton icon="back" label="Voltar" onPress={() => router.back()} />
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={labelStyle}>
          <Label>{label}</Label>
        </Animated.View>
        {!!title && (
          <Animated.View style={[StyleSheet.absoluteFill, styles.titleWrap, titleStyle]}>
            <Text style={heading(16, c.text)} numberOfLines={1}>
              {title}
            </Text>
          </Animated.View>
        )}
      </View>
      <View style={styles.right}>{right}</View>
      <Animated.View style={[styles.line, { backgroundColor: c.border }, lineStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8, zIndex: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12, minHeight: 24 },
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  right: { minWidth: 58, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  line: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
});
