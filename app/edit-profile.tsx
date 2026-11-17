import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Label, PrimaryButton } from '@/components/ui';
import { persistPhoto, photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, F, radius, useTheme } from '@/theme';

const cleanHandle = (s: string) => s.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '').slice(0, 24);

export default function EditProfile() {
  const c = useTheme();
  const { profile, updateProfile } = useStore();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [photo, setPhoto] = useState(profile.photo);
  const [picked, setPicked] = useState<string | undefined>();

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setPicked(res.assets[0].uri);
  }

  async function save() {
    const finalPhoto = picked ? await persistPhoto(picked) : photo;
    updateProfile({ name: name.trim(), handle: cleanHandle(handle), bio: bio.trim(), photo: finalPhoto });
    router.back();
  }

  const input = [styles.input, { backgroundColor: c.surface, color: c.text }];
  const shown = picked ?? (photo ? photoUri(photo) : undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={{ color: c.muted, fontFamily: F.medium, fontSize: 15 }}>Cancelar</Text>
          </Pressable>
          <Label>Editar perfil</Label>
          <View style={{ width: 64 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={pick} style={{ alignItems: 'center', marginBottom: 24 }}>
            <Avatar name={name || 'M'} size={104}>
              {shown ? <Image source={{ uri: shown }} style={StyleSheet.absoluteFill} /> : undefined}
            </Avatar>
            <Text style={[body(14, c.text), { marginTop: 10, textDecorationLine: 'underline' }]}>Trocar foto</Text>
          </Pressable>

          <Label style={{ marginBottom: 8 }}>Nome</Label>
          <TextInput value={name} onChangeText={setName} placeholder="Como a Lumi te chama" placeholderTextColor={c.muted} style={input} />

          <Label style={{ marginTop: 18, marginBottom: 8 }}>Usuário</Label>
          <TextInput
            value={handle ? '@' + handle : ''}
            onChangeText={(t) => setHandle(cleanHandle(t))}
            placeholder="@seunome"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={input}
          />

          <Label style={{ marginTop: 18, marginBottom: 8 }}>Bio</Label>
          <TextInput
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 150))}
            placeholder="Uma linha sobre você"
            placeholderTextColor={c.muted}
            multiline
            style={[input, { height: 96, paddingTop: 14, textAlignVertical: 'top' }]}
          />
          <Text style={[body(12, c.muted), { textAlign: 'right', marginTop: 4 }]}>{bio.length}/150</Text>
        </ScrollView>
        <View style={{ padding: 20 }}>
          <PrimaryButton title="Salvar" onPress={save} disabled={!name.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  input: { minHeight: 50, borderRadius: radius.md, paddingHorizontal: 16, fontSize: 16, fontFamily: F.regular },
});
