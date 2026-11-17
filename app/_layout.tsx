import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/store';
import { light, useTheme } from '@/theme';

function Root() {
  const { ready } = useStore();
  const c = useTheme();
  const [fontsLoaded] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  // Fundo creme liso enquanto carrega: emenda com o splash, sem "piscar".
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: light.bg }} />;

  return (
    <>
      <StatusBar style={c.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
          animationDuration: 320,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="new-moment" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="lumi" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
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
