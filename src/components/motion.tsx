import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, Keyframe } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { EASE_OUT } from '../theme';

/**
 * Peças de movimento reaproveitadas pelas telas.
 * Regra da casa: o que o usuário faz toda hora anima pouco; o que ele vê
 * uma vez (abrir um moment, uma foto, um story) ganha uma entrada com corpo.
 */

/** Entra crescendo de leve (92% → 100%) e aparecendo: fotos, capas, cartões. */
export const popIn = (delay = 0, duration = 420) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.92 }, { translateY: 12 }] },
    100: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }], easing: Easing.bezier(...EASE_OUT) },
  })
    .duration(duration)
    .delay(delay);

/** Sobe de leve e aparece — títulos e blocos de texto, em cascata. */
export const riseIn = (delay = 0, duration = 460) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 18 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.bezier(...EASE_OUT) },
  })
    .duration(duration)
    .delay(delay);

/**
 * Esmaece a borda de uma faixa (carrossel, letreiro de fotos, colagem)
 * para a cor do fundo, sem precisar de expo-linear-gradient.
 */
export function EdgeFade({
  color,
  side,
  width = 36,
}: {
  color: string;
  side: 'left' | 'right' | 'bottom';
  /** largura (ou altura, no 'bottom') do degradê */
  width?: number;
}) {
  const id = `fade-${side}`;
  const v = side === 'bottom';
  // o degradê vai da borda (cor cheia) para dentro (transparente)
  const from = side === 'left' ? ['0', '0'] : side === 'right' ? ['1', '0'] : ['0', '1'];
  const to = side === 'left' ? ['1', '0'] : side === 'right' ? ['0', '0'] : ['0', '0'];
  return (
    <View
      pointerEvents="none"
      style={[styles.edge, v ? { left: 0, right: 0, bottom: 0, height: width } : { top: 0, bottom: 0, width, [side]: 0 }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute' },
});
