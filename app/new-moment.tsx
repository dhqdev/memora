import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commentMoment, suggestTitle } from '@/ai';
import { Chip, Label, PrimaryButton, monoText } from '@/components/ui';
import { persistPhoto } from '@/photos';
import { uid, useStore } from '@/store';
import { body, display, F, radius, useTheme } from '@/theme';
import { FREE_COMMENTS, Moment, Place } from '@/types';

export default function NewMoment() {
  const c = useTheme();
  const store = useStore();
  const { stories, profile, addMoment, updateMoment, updateProfile, upsertPerson } = store;
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [place, setPlace] = useState<Place | undefined>();
  const [locating, setLocating] = useState(false);
  const [storyId, setStoryId] = useState<string | undefined>(stories[0]?.id);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 4 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 4));
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled) setPhotos((p) => [...p, res.assets[0].uri].slice(0, 4));
  }

  async function addLocation() {
    if (place) return setPlace(undefined);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      const name = geo?.name || geo?.street || geo?.district || geo?.city || 'Aqui';
      setPlace({ name, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    setSaving(true);
    const mentions = [...new Set([...text.matchAll(/@([\p{L}\d_]+)/gu)].map((m) => m[1]))];
    const people = mentions.map((n) => upsertPerson(n));
    const finalTitle = title.trim() || (await suggestTitle(text));
    const saved = await Promise.all(photos.map(persistPhoto));
    const willComment = profile.plus || profile.commentsUsed < FREE_COMMENTS;
    const moment: Moment = {
      id: uid(),
      title: finalTitle,
      text: text.trim(),
      photos: saved,
      people: people.map((p) => p.id),
      place,
      date: new Date().toISOString(),
      storyId,
      commentPending: willComment,
    };
    addMoment(moment);
    if (profile.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();

    // A Lumi comenta em segundo plano (10 grátis, ilimitado no Memora+).
    if (willComment) {
      const comment = await commentMoment(moment, profile, people.map((p) => p.name));
      updateMoment(moment.id, { companionComment: comment, commentPending: false, commentAt: new Date().toISOString() });
      updateProfile({ commentsUsed: profile.commentsUsed + 1 });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: c.muted, fontSize: 15, fontFamily: F.medium }}>Cancelar</Text>
          </Pressable>
          <Label>Novo moment</Label>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={monoText(c.muted, 11)}>
            — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título (a Lumi sugere se ficar vazio)"
            placeholderTextColor={c.muted}
            style={[display(26, c.text), styles.title]}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escreva uma linha. Marque amigos com @nome"
            placeholderTextColor={c.muted}
            multiline
            autoFocus
            style={[body(16, c.text), styles.body]}
          />

          <ScrollView horizontal style={{ marginVertical: 12 }}>
            {photos.map((uri) => (
              <Pressable key={uri} onLongPress={() => setPhotos((p) => p.filter((x) => x !== uri))}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip icon="camera" label="Câmera" onPress={takePhoto} />
            <Chip icon="image" label="Galeria" onPress={pickPhoto} />
            <Chip icon="pin" label={locating ? 'Localizando…' : place ? place.name : 'Lugar'} active={!!place} onPress={addLocation} />
          </View>

          {stories.length > 0 && (
            <>
              <Label style={{ marginTop: 18, marginBottom: 10 }}>Story</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {stories.map((s) => (
                  <Chip key={s.id} label={`${s.category} · ${s.year}`} active={storyId === s.id} onPress={() => setStoryId(storyId === s.id ? undefined : s.id)} />
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={{ padding: 20 }}>
          {saving ? (
            <ActivityIndicator color={c.text} />
          ) : (
            <PrimaryButton title="Salvar moment" disabled={!text.trim() && !photos.length} onPress={save} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { marginTop: 10, paddingVertical: 0 },
  body: { minHeight: 100, marginTop: 10, textAlignVertical: 'top' },
  photo: { width: 104, height: 128, borderRadius: radius.sm, marginRight: 8 },
});
