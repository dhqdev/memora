import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar, PressableScale, monoText } from '@/components/ui';
import { persistPhoto, photoUri } from '@/photos';
import { useStore } from '@/store';
import { display, heading, radius, useTheme } from '@/theme';

export default function PersonPage() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, moments, updatePerson } = useStore();
  const p = people.find((x) => x.id === id);
  if (!p) return null;
  const shared = moments.filter((m) => m.people.includes(p.id));

  async function setPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) updatePerson(p!.id, { photo: await persistPhoto(res.assets[0].uri) });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader label="Pessoa" />
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <Animated.View entering={FadeInDown.duration(380)} style={{ alignItems: 'center' }}>
          <PressableScale onPress={setPhoto} accessibilityLabel="Trocar foto">
            <Avatar name={p.name} size={112}>
              {p.photo ? <Image source={{ uri: photoUri(p.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
            </Avatar>
          </PressableScale>
          <Text style={[display(30, c.text), { marginTop: 14 }]}>{p.name}</Text>
        </Animated.View>
        <Text style={monoText(c.muted, 11)}>
          {shared.length} moment{shared.length === 1 ? '' : 's'} juntos
        </Text>

        <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
          {shared.map((m) => (
            <PressableScale key={m.id} scaleTo={0.98} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
              {m.photos[0] && <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} />}
              <Text style={[heading(15, c.text), { flex: 1 }]}>{m.title}</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
});
