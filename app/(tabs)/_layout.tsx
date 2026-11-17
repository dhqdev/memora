import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LumiFab } from '@/components/Lumi';
import { SquareButton } from '@/components/ui';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

/** Cabeçalho "Memora" + botões + abas em texto no topo (estilo do OhMy). */
function TopBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8, backgroundColor: c.bg, paddingHorizontal: 20 }}>
      <View style={styles.row}>
        <Text style={[styles.brand, { color: c.text }]}>Memora</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SquareButton icon="⌕" label="Perguntar à Lumi" onPress={() => router.push('/lumi')} />
          <SquareButton icon="☰" label="Ajustes" onPress={() => router.push('/settings')} />
          <SquareButton icon="+" filled label="Novo moment" onPress={() => router.push('/new-moment')} />
        </View>
      </View>
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigateToTab(route.key);
              }}
              style={[styles.tab, focused && { borderBottomColor: c.text }]}
            >
              <Text style={{ color: focused ? c.text : c.muted, fontSize: 18 }}>{label}</Text>
            </Pressable>
          );
        })}
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
        screenOptions={{ headerShown: false, tabBarPosition: 'top', sceneStyle: { backgroundColor: c.bg } }}
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
  brand: { fontSize: 38, fontWeight: '600', letterSpacing: -1 },
  tabs: { flexDirection: 'row', gap: 22, marginTop: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
});
