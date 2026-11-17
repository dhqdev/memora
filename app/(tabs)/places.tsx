import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

export default function PlacesTab() {
  const c = useTheme();
  const { moments } = useStore();
  const withPlace = useMemo(() => moments.filter((m) => m.place), [moments]);

  if (!withPlace.length) {
    return (
      <View style={styles.empty}>
        <LumiFace size={90} mood="thinking" />
        <View style={{ marginTop: 18 }}>
          <SpeechBubble text="Quando você salvar um moment com localização, ele aparece aqui no mapa." />
        </View>
      </View>
    );
  }

  const first = withPlace[0].place!;
  return (
    <MapView
      style={{ flex: 1 }}
      userInterfaceStyle={c.bg === '#121212' ? 'dark' : 'light'}
      initialRegion={{ latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
    >
      {withPlace.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.place!.latitude, longitude: m.place!.longitude }}
          onCalloutPress={() => router.push(`/moment/${m.id}`)}
          title={m.title}
          description={m.place!.name}
        >
          {m.photos[0] ? (
            <Image source={{ uri: m.photos[0] }} style={styles.pin} contentFit="cover" />
          ) : (
            <View style={[styles.pin, { backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }]}>
              <Text>✦</Text>
            </View>
          )}
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pin: { width: 48, height: 60, borderRadius: 8, borderWidth: 2, borderColor: '#F2EFE6' },
});
