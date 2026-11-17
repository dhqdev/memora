import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { mono, radius, useTheme } from '../theme';

/** Botão quadrado com círculo interno — o estilo dos botões do topo. */
export function SquareButton({
  icon,
  onPress,
  filled,
  label,
}: {
  icon: string;
  onPress: () => void;
  filled?: boolean;
  label: string;
}) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={[styles.square, { backgroundColor: c.chip }]}>
      <View
        style={[
          styles.circle,
          filled ? { backgroundColor: c.invert } : { borderColor: c.border, borderWidth: 1.5 },
        ]}
      >
        <Text style={{ color: filled ? c.invertText : c.text, fontSize: filled ? 26 : 18, fontWeight: '400' }}>{icon}</Text>
      </View>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: c.invert, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.primaryText, { color: c.invertText }]}>{title}</Text>
    </Pressable>
  );
}

export function OutlineButton({ title, onPress }: { title: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.outline, { borderColor: c.text }]}>
      <Text style={[styles.primaryText, { color: c.text, fontSize: 17 }]}>{title}</Text>
    </Pressable>
  );
}

/** Seletor em pílula (Ligada / Desligada, Ele / Ela / Neutro...). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={[styles.segment, { borderColor: c.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: c.invert }]}
          >
            <Text style={{ color: active ? c.invertText : c.text, fontSize: 17, fontWeight: '500' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? c.invert : c.border, backgroundColor: active ? c.invert : 'transparent' },
      ]}
    >
      <Text style={{ color: active ? c.invertText : c.text, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '500' }}>{title}</Text>
      {subtitle ? <Text style={[monoText(c.muted), { marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export const monoText = (color: string, size = 13): TextStyle => ({ color, fontFamily: mono, fontSize: size });

const styles = StyleSheet.create({
  square: { width: 58, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primary: { height: 60, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryText: { fontSize: 19, fontWeight: '500' },
  outline: { height: 54, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.pill, padding: 5 },
  segmentItem: { flex: 1, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1.5, marginRight: 8, marginBottom: 8 },
});
