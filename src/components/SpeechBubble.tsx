import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useStore } from '../store';
import { mono } from '../theme';

/**
 * Balão de fala da Lumi: texto em fonte mono aparecendo palavra por palavra,
 * com vibração leve a cada palavra (desliga em Ajustes > Vibração da Lumi).
 */
export function SpeechBubble({
  text,
  onDone,
  speed = 55,
  instant = false,
}: {
  text: string;
  onDone?: () => void;
  speed?: number;
  instant?: boolean;
}) {
  const { profile } = useStore();
  const words = text.split(' ');
  const [count, setCount] = useState(instant ? words.length : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    if (instant) {
      setCount(words.length);
      onDone?.();
      return;
    }
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (profile.haptics) Haptics.selectionAsync().catch(() => {});
      if (i >= words.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Animated.View entering={instant ? undefined : FadeInUp.duration(260)} style={styles.bubble}>
      <Text style={styles.text}>
        {words.slice(0, count).join(' ')}
        <Text style={styles.ghost}>{count < words.length ? ' ' + words.slice(count).join(' ') : ''}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: { backgroundColor: '#141413', paddingVertical: 11, paddingHorizontal: 13, borderRadius: 3, maxWidth: '100%' },
  text: { color: '#F2EFE6', fontFamily: mono, fontSize: 12.5, lineHeight: 19 },
  ghost: { color: 'transparent' },
});
