import { Image } from 'expo-image';
import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LumiFab } from '@/components/Lumi';
import { Avatar, IconButton } from '@/components/ui';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { EASE_OUT, F, useTheme } from '@/theme';

/**
 * Cabeçalho: marca + tiles de vidro (perfil, ajustes, novo moment) e as abas
 * em texto com um sublinhado que desliza até a aba ativa.
 * Trocar de aba é a ação mais frequente: a tela troca na hora, só o traço anda.
 */
function TopBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useTheme();
  const { profile } = useStore();
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState<{ x: number; w: number }[]>([]);
  const x = useSharedValue(0);
  const w = useSharedValue(0);

  useEffect(() => {
    const l = layouts[state.index];
    if (!l) return;
    const cfg = { duration: 220, easing: Easing.bezier(...EASE_OUT) };
    x.value = w.value === 0 ? l.x : withTiming(l.x, cfg);
    w.value = w.value === 0 ? l.w : withTiming(l.w, cfg);
  }, [state.index, layouts, x, w]);

  const underline = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: w.value }));

  return (
    <View style={{ paddingTop: insets.top + 10, backgroundColor: c.bg, paddingHorizontal: 20 }}>
      <View style={styles.row}>
        <Text style={[styles.brand, { color: c.text }]}>Memora</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton label="Seu perfil" onPress={() => router.push('/profile')}>
            <Avatar name={profile.name || 'M'} size={38}>
              {profile.photo ? <Image source={{ uri: photoUri(profile.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
            </Avatar>
          </IconButton>
          <IconButton icon="sliders" label="Ajustes" onPress={() => router.push('/settings')} />
          <IconButton icon="plus" filled label="Novo moment" onPress={() => router.push('/new-moment')} />
        </View>
      </View>
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              onLayout={(e) => {
                const { x: lx, width } = e.nativeEvent.layout;
                setLayouts((prev) => {
                  const next = [...prev];
                  next[index] = { x: lx, w: width };
                  return next;
                });
              }}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigateToTab(route.key);
              }}
              style={styles.tab}
            >
              <Text style={{ color: focused ? c.text : c.muted, fontFamily: F.medium, fontSize: 16 }}>{label}</Text>
            </Pressable>
          );
        })}
        <Animated.View style={[styles.underline, { backgroundColor: c.text }, underline]} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const c = useTheme();
  const { profile } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Tabs
        tabBar={(props) => <TopBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
          animation: 'none',
          sceneStyle: { backgroundColor: c.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Moments' }} />
        <Tabs.Screen name="stories" options={{ title: 'Stories' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendário' }} />
        <Tabs.Screen name="places" options={{ title: 'Lugares' }} />
      </Tabs>
      {profile.showBuddy && <LumiFab onPress={() => router.push('/lumi')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: F.semibold, fontSize: 34, letterSpacing: -1 },
  tabs: { flexDirection: 'row', gap: 20, marginTop: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingBottom: 10 },
  underline: { position: 'absolute', left: 0, bottom: -StyleSheet.hairlineWidth, height: 1.5 },
});
