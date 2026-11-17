import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { SquareButton, monoText } from './ui';

export function ScreenHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <SquareButton icon="←" label="Voltar" onPress={() => router.back()} />
      <Text style={monoText(c.muted, 12)}>{label}</Text>
      <View style={{ minWidth: 58, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
});
