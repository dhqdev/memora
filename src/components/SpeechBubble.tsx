import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useStore } from '../store';
import { F, useTheme } from '../theme';

const BLIP = require('../../assets/sounds/lumi-blip.wav');

/**
 * Balão de fala da Lumi: texto em fonte pixel aparecendo palavra por palavra,
 * com um "pio" baixinho (Ajustes > Voz da Lumi) e vibração leve
 * (Ajustes > Vibração da Lumi) a cada palavra. O som respeita o modo silencioso.
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
  const c = useTheme();
  const words = text.split(' ');
  const voice = useAudioPlayer(BLIP);
  const prefs = useRef(profile);
  prefs.current = profile;
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
      if (prefs.current.haptics) Haptics.selectionAsync().catch(() => {});
      if (prefs.current.voice && i % 2 === 1) {
        try {
          voice.volume = 0.35;
          voice.seekTo(0);
          voice.play();
        } catch {}
      }
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
    <Animated.View entering={instant ? undefined : FadeInUp.duration(260)} style={[styles.bubble, { backgroundColor: c.mode === 'dark' ? '#242423' : '#141413' }]}>
      <Text style={styles.text}>
        {words.slice(0, count).join(' ')}
        <Text style={styles.ghost}>{count < words.length ? ' ' + words.slice(count).join(' ') : ''}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 2, maxWidth: '100%' },
  text: { color: '#F2EFE6', fontFamily: F.pixel, fontSize: 15, lineHeight: 21, letterSpacing: 0.2 },
  ghost: { color: 'transparent' },
});
