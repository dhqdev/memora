import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Label } from './ui';

/** Topo das telas internas: voltar · etiqueta mono · ação opcional. */
export function ScreenHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <IconButton icon="back" label="Voltar" onPress={() => router.back()} />
      <Label>{label}</Label>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
});
