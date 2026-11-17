import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { photoUri } from '../photos';
import { Person } from '../types';
import { Avatar } from './ui';

/** Bolinha da pessoa: o rosto dela (quando já tem) ou a inicial num tom pastel. */
export function PersonAvatar({ person, size = 56 }: { person: Pick<Person, 'name' | 'photo'>; size?: number }) {
  return (
    <Avatar name={person.name} size={size}>
      {person.photo ? <Image source={{ uri: photoUri(person.photo) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : undefined}
    </Avatar>
  );
}

/** Recorte de um rosto, redondo. */
export function FaceBubble({ crop, size = 56, ring }: { crop: string; size?: number; ring?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: ring ? 2 : 0, borderColor: ring }}>
      <Image source={{ uri: photoUri(crop) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
    </View>
  );
}
