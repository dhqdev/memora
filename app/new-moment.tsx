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
import { commentMoment, fallbackTitle, suggestTitle } from '@/ai';
import { canComment, extractMentions } from '@/rules';
import { Chip, Label, PrimaryButton, monoText } from '@/components/ui';
import { persistPhoto } from '@/photos';
import { uid, useStore } from '@/store';
import { body, display, F, radius, useTheme } from '@/theme';
import { FREE_COMMENTS, Moment, Place } from '@/types';

export default function NewMoment() {
  const c = useTheme();
  const store = useStore();
  const { stories, profile, addMoment, updateMoment, countComment, upsertPerson } = store;
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [place, setPlace] = useState<Place | undefined>();
  const [locating, setLocating] = useState(false);
  const [storyId, setStoryId] = useState<string | undefined>(stories[0]?.id);
  const [saving, setSaving] = useState(false);

  // aberto por link direto não tem tela pra voltar: cai na lista de moments
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

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
    const people = extractMentions(text).map((n) => upsertPerson(n));
    const typedTitle = title.trim();
    const saved = await Promise.all(photos.map(persistPhoto));
    const willComment = canComment(profile);
    const moment: Moment = {
      id: uid(),
      // salva na hora (limite de Doherty: nada de esperar a IA pra fechar a tela)
      title: typedTitle || fallbackTitle(text),
      text: text.trim(),
      photos: saved,
      people: people.map((p) => p.id),
      place,
      date: new Date().toISOString(),
      storyId,
      commentPending: willComment,
    };
    addMoment(moment);
    // conta já ao salvar: dois moments seguidos não passam do limite grátis
    if (willComment) countComment();
    if (profile.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    close();

    // Em segundo plano: a Lumi sugere o título (se ficou vazio) e comenta
    // (10 comentários no grátis, ilimitado no Memora+).
    if (!typedTitle && text.trim()) {
      suggestTitle(text).then((t) => t && updateMoment(moment.id, { title: t }));
    }
    if (willComment) {
      const comment = await commentMoment(moment, profile, people.map((p) => p.name));
      updateMoment(moment.id, { companionComment: comment, commentPending: false, commentAt: new Date().toISOString() });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable onPress={close}>
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
            placeholder="Título (opcional)"
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
