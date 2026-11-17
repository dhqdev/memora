import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { monoText } from '@/components/ui';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

export default function PersonPage() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, moments, updatePerson } = useStore();
  const p = people.find((x) => x.id === id);
  if (!p) return null;
  const shared = moments.filter((m) => m.people.includes(p.id));

  async function setPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) updatePerson(p!.id, { photo: res.assets[0].uri });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader label="PESSOA" />
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <Pressable onPress={setPhoto} style={[styles.avatar, { backgroundColor: c.card, borderColor: c.border }]}>
          {p.photo ? (
            <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={{ color: c.text, fontSize: 48 }}>{p.name[0]?.toUpperCase()}</Text>
          )}
        </Pressable>
        <Text style={{ color: c.text, fontSize: 30, fontWeight: '500', marginTop: 12 }}>{p.name}</Text>
        <Text style={monoText(c.muted)}>
          {shared.length} moment{shared.length === 1 ? '' : 's'} juntos
        </Text>

        <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
          {shared.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
              {m.photos[0] && <Image source={{ uri: m.photos[0] }} style={styles.thumb} />}
              <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>{m.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
});
