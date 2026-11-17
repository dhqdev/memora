import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

/**
 * Liquid Glass da Apple (iOS 26+) via expo-glass-effect.
 * No iOS antigo cai para um desfoque de verdade (expo-blur) com o mesmo
 * cinza dos "tiles"; no Android e na web, um bloco translúcido com a mesma forma
 * (desfoque no Android custa caro e quase não aparece sobre fundo liso).
 */
const HAS_GLASS = (() => {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

export function Glass({
  style,
  children,
  interactive,
  tint,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  interactive?: boolean;
  tint?: string;
}) {
  const c = useTheme();
  const veil = c.mode === 'dark' ? 'rgba(92,92,88,0.72)' : 'rgba(20,20,19,0.08)';

  if (HAS_GLASS) {
    return (
      <GlassView
        style={[{ overflow: 'hidden' }, style]}
        glassEffectStyle="regular"
        isInteractive={interactive}
        tintColor={tint}
        colorScheme={c.mode}
      >
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={40} tint={c.mode} style={[{ overflow: 'hidden' }, style]}>
        {/* o véu cinza por cima do desfoque deixa o tile com a mesma cor do vidro */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? veil, opacity: 0.82 }]} />
        {children}
      </BlurView>
    );
  }

  return <View style={[{ backgroundColor: tint ?? veil }, style]}>{children}</View>;
}
