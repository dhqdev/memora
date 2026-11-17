import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/store';
import { dark, useTheme } from '@/theme';

function Root() {
  const { ready } = useStore();
  const c = useTheme();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: dark.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={dark.text} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={c === dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-moment" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="lumi" options={{ presentation: 'modal' }} />
        <Stack.Screen name="moment/[id]" />
        <Stack.Screen name="story/[id]" />
        <Stack.Screen name="person/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
