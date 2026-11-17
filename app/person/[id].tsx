import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FaceBubble, PersonAvatar } from '@/components/PersonAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Label, OutlineButton, PressableScale, monoText } from '@/components/ui';
import { rankPeople } from '@/faces/logic';
import { persistPhoto, photoUri } from '@/photos';
import { useStore } from '@/store';
import { display, F, heading, radius, useTheme } from '@/theme';
import { Face } from '@/types';

export default function PersonPage() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, moments, faces, updatePerson, setFaceOwner, mergePeople } = useStore();
  const [merging, setMerging] = useState(false);
  const p = people.find((x) => x.id === id);
  if (!p) return null;
  const shared = moments.filter((m) => m.people.includes(p.id));
  const mine = faces.filter((f) => f.status === 'person' && f.personId === p.id);
  const others = rankPeople(people, moments, faces).filter((x) => x.id !== p.id);

  async function setPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) updatePerson(p!.id, { photo: await persistPhoto(res.assets[0].uri) });
  }

  const faceMenu = (f: Face) =>
    Alert.alert(p.name, undefined, [
      { text: 'Usar como foto', onPress: () => updatePerson(p.id, { photo: f.crop }) },
      { text: `Não é ${p.name}`, style: 'destructive', onPress: () => setFaceOwner(f.id, 'new') },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  const mergeInto = (into: { id: string; name: string }) =>
    Alert.alert(`Juntar com ${into.name}?`, `"${p.name}" e "${into.name}" viram uma pessoa só, com todos os moments e rostos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Juntar',
        onPress: () => {
          mergePeople(p.id, into.id);
          router.replace(`/person/${into.id}`);
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader label="Pessoa" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(380)} style={{ alignItems: 'center' }}>
          <PressableScale onPress={setPhoto} accessibilityLabel="Trocar foto">
            <PersonAvatar person={p} size={112} />
          </PressableScale>
          <Text style={[display(30, c.text), { marginTop: 14 }]}>{p.name}</Text>
          <Text style={monoText(c.muted, 11)}>
            {shared.length} moment{shared.length === 1 ? '' : 's'} juntos
            {mine.length ? ` · ${mine.length} foto${mine.length === 1 ? '' : 's'}` : ''}
          </Text>
        </Animated.View>

        {mine.length > 0 && (
          <Animated.View entering={FadeIn.duration(300).delay(120)}>
            <Label style={{ marginTop: 28, marginBottom: 12 }}>Nas fotos</Label>
            <View style={styles.faces}>
              {mine.map((f) => (
                <PressableScale key={f.id} scaleTo={0.92} onPress={() => faceMenu(f)} accessibilityLabel={`Rosto de ${p.name}`}>
                  <FaceBubble crop={f.crop} size={58} ring={p.photo === f.crop ? c.text : undefined} />
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        )}

        <Label style={{ marginTop: 28, marginBottom: 4 }}>Moments</Label>
        {shared.map((m) => (
          <PressableScale key={m.id} scaleTo={0.98} onPress={() => router.push(`/moment/${m.id}`)} style={[styles.row, { borderColor: c.border }]}>
            {m.photos[0] ? <Image source={{ uri: photoUri(m.photos[0]) }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: c.card }]} />}
            <Text style={[heading(15, c.text), { flex: 1 }]} numberOfLines={1}>
              {m.title}
            </Text>
          </PressableScale>
        ))}

        {others.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <OutlineButton title={merging ? 'Cancelar' : 'É a mesma pessoa que…'} onPress={() => setMerging((x) => !x)} />
            {merging && (
              <Animated.View entering={FadeInDown.duration(220)} style={styles.mergeList}>
                {others.map((o) => (
                  <PressableScale key={o.id} scaleTo={0.94} onPress={() => mergeInto(o)} style={[styles.chip, { borderColor: c.border }]}>
                    <PersonAvatar person={o} size={28} />
                    <Text style={{ color: c.text, fontFamily: F.medium, fontSize: 14 }}>{o.name}</Text>
                  </PressableScale>
                ))}
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  mergeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 5, paddingRight: 14, height: 40, borderRadius: 20, borderWidth: 1 },
});
