import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { PixelifySans_400Regular } from '@expo-google-fonts/pixelify-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncReminders } from '@/reminders';
import { StoreProvider, useStore } from '@/store';
import { dark, light, useTheme } from '@/theme';

function Root() {
  const { ready, profile, moments } = useStore();
  const c = useTheme();
  const scheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    PixelifySans_400Regular,
  });

  // Lembrete da noite: reagenda ao abrir, ao mudar o ajuste e a cada moment novo/apagado.
  useEffect(() => {
    if (ready && Platform.OS !== 'web') syncReminders(profile.reminder, profile.name, moments);
  }, [ready, profile.reminder, profile.name, moments]);

  // Fundo liso enquanto carrega: emenda com o splash, sem "piscar".
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: scheme === 'light' ? light.bg : dark.bg }} />;

  return (
    <>
      <StatusBar style={c.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
          animationDuration: 280,
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
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
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
