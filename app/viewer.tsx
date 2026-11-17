import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { popIn } from '@/components/motion';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { heading, mono } from '@/theme';

/**
 * Foto em tela cheia, por cima de tudo (abre com fade).
 * Deslize para o lado entre as fotos; no iPhone, pinça para dar zoom.
 * Um toque esconde/mostra os controles.
 */
export default function Viewer() {
  const { id, i } = useLocalSearchParams<{ id: string; i?: string }>();
  const { moments } = useStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<ScrollViewInstance>(null);
  const m = moments.find((x) => x.id === id);
  const start = Math.max(0, Math.min(Number(i ?? 0) || 0, (m?.photos.length ?? 1) - 1));
  const [page, setPage] = useState(start);
  const [chrome, setChrome] = useState(true);

  const chromeStyle = useAnimatedStyle(() => ({ opacity: withTiming(chrome ? 1 : 0, { duration: 180 }) }), [chrome]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (!m) return null;
  const date = new Date(m.date);

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden={!chrome} animated />
      <Animated.View entering={popIn(0, 320)} style={StyleSheet.absoluteFill}>
        <ScrollView
          ref={list}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={() => {
            if (start) list.current?.scrollTo({ x: start * width, animated: false });
          }}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {m.photos.map((p) => (
            <ScrollView
              key={p}
              style={{ width, height }}
              contentContainerStyle={{ width, height }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Pressable style={{ width, height }} onPress={() => setChrome((v) => !v)}>
                <Image source={{ uri: photoUri(p) }} style={{ width, height }} contentFit="contain" transition={200} />
              </Pressable>
            </ScrollView>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View pointerEvents={chrome ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, chromeStyle]}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.count}>{m.photos.length > 1 ? `${page + 1} / ${m.photos.length}` : ''}</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Fechar" style={styles.close}>
            <Icon name="close" size={20} color="#F2EFE6" />
          </Pressable>
        </View>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
          <Text style={styles.date}>
            {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {m.place ? `  ·  ${m.place.name}` : ''}
          </Text>
          <Text style={[heading(20, '#F2EFE6'), { marginTop: 4 }]} numberOfLines={2}>
            {m.title}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,8,8,0.97)' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  count: { fontFamily: mono, fontSize: 12, color: '#F2EFE6', opacity: 0.8 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(242,239,230,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 40, backgroundColor: 'rgba(8,8,8,0.35)' },
  date: { fontFamily: mono, fontSize: 11, color: '#F2EFE6', opacity: 0.7 },
});
