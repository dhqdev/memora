import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LumiFab } from '@/components/Lumi';
import { IconButton } from '@/components/ui';
import { useStore } from '@/store';
import { display, F, useTheme } from '@/theme';

/** Cabeçalho minimalista: marca + três botões redondos + abas em texto. */
function TopBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, backgroundColor: c.bg, paddingHorizontal: 20 }}>
      <View style={styles.row}>
        <Text style={display(26, c.text)}>Memora</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="search" label="Perguntar à Lumi" onPress={() => router.push('/lumi')} />
          <IconButton icon="menu" label="Ajustes" onPress={() => router.push('/settings')} />
          <IconButton icon="plus" filled label="Novo moment" onPress={() => router.push('/new-moment')} />
        </View>
      </View>
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              hitSlop={8}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigateToTab(route.key);
              }}
            >
              <Text
                style={{
                  color: focused ? c.text : c.muted,
                  fontFamily: focused ? F.semibold : F.regular,
                  fontSize: 14,
                }}
              >
                {label}
              </Text>
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
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
          animation: 'fade',
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
  tabs: { flexDirection: 'row', gap: 20, marginTop: 14, paddingBottom: 10 },
});
