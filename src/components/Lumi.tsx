import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type Mood = 'happy' | 'excited' | 'thinking' | 'sleepy';

/**
 * Lumi — a companheira do Memora. Um "bolinho de luz" com uma estrelinha na cabeça.
 * Desenho original, feito em SVG para trocar de expressão sem assets.
 */
export function LumiFace({ size = 64, mood = 'happy' }: { size?: number; mood?: Mood }) {
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
      {mood === 'sleepy' ? (
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

/** Botão flutuante da Lumi (canto inferior direito), igual ao buddy do OhMy. */
export function LumiFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fab} accessibilityLabel="Conversar com a Lumi">
      <View style={styles.shadow}>
        <LumiFace size={64} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, bottom: 36 },
  shadow: {
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
