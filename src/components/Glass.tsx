import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

/**
 * Liquid Glass da Apple (iOS 26+) via expo-glass-effect.
 * Onde não existe (Android, iOS antigo, web), cai para um bloco cinza
 * translúcido com a mesma forma — o visual dos "tiles" do app.
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
  return <View style={[{ backgroundColor: c.mode === 'dark' ? 'rgba(92,92,88,0.72)' : 'rgba(20,20,19,0.08)' }, style]}>{children}</View>;
}
