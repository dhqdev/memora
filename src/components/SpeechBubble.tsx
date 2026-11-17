import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.bubble}>
      <Text style={styles.text}>
        {words.slice(0, count).join(' ')}
        <Text style={styles.ghost}>{count < words.length ? ' ' + words.slice(count).join(' ') : ''}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { backgroundColor: '#161616', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 4, maxWidth: '100%' },
  text: { color: '#F2EFE6', fontFamily: mono, fontSize: 14, lineHeight: 21 },
  ghost: { color: 'transparent' },
});
