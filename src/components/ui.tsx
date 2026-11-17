import React, { useEffect } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { F, heading, highlightFor, mono, radius, useTheme } from '../theme';
import { Icon, IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable que encolhe de leve no toque e volta com mola. */
export function PressableScale({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style'> & { scaleTo?: number; style?: StyleProp<ViewStyle> }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        s.value = withTiming(scaleTo, { duration: 110 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 14, stiffness: 320 });
        onPressOut?.(e);
      }}
      style={[style, anim]}
    />
  );
}

/** Botão redondo de ícone (topo das telas). `filled` = preto cheio, como o +. */
export function IconButton({
  icon,
  onPress,
  filled,
  label,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  filled?: boolean;
  label: string;
  size?: number;
}) {
  const c = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      scaleTo={0.9}
      style={[
        styles.icon,
        { width: size, height: size, borderRadius: size / 2 },
        filled ? { backgroundColor: c.invert } : { borderColor: c.border, borderWidth: StyleSheet.hairlineWidth * 2 },
      ]}
    >
      <Icon name={icon} size={filled ? 20 : 18} color={filled ? c.invertText : c.text} />
    </PressableScale>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: IconName;
}) {
  const c = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.primary, { backgroundColor: c.invert, opacity: disabled ? 0.35 : 1 }, style]}
    >
      {icon ? <Icon name={icon} size={20} color={c.invertText} /> : null}
      {title ? <Text style={[styles.primaryText, { color: c.invertText }]}>{title}</Text> : null}
    </PressableScale>
  );
}

export function OutlineButton({ title, onPress }: { title: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={[styles.outline, { borderColor: c.text }]}>
      <Text style={[styles.primaryText, { color: c.text, fontSize: 15 }]}>{title}</Text>
    </PressableScale>
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
            <Text style={{ color: active ? c.invertText : c.text, fontSize: 15, fontFamily: F.medium }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const c = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        { borderColor: active ? c.invert : c.border, backgroundColor: active ? c.invert : 'transparent' },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={active ? c.invertText : c.text} /> : null}
      <Text style={{ color: active ? c.invertText : c.text, fontSize: 14, fontFamily: F.medium }}>{label}</Text>
    </PressableScale>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={heading(18, c.text)}>{title}</Text>
      {subtitle ? <Text style={[monoText(c.muted, 12), { marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}

/** Etiqueta mono em caixa alta: "MOMENT", "STORY", "PESSOAS"... */
export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  return <Text style={[monoText(c.muted, 11), { letterSpacing: 1.2, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export const monoText = (color: string, size = 13): TextStyle => ({ color, fontFamily: mono, fontSize: size });

/** Texto com @menções destacadas em marca-texto colorido. */
export function MentionText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const parts = text.split(/(@[\p{L}\d_]+)/u);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ backgroundColor: highlightFor(p.slice(1)), color: '#141413' }}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

/** Avatar redondo: foto, ou inicial sobre um tom pastel fixo por nome. */
export function Avatar({ name, size = 56, children }: { name: string; size?: number; children?: React.ReactNode }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: highlightFor(name),
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children ?? (
        <Text style={{ fontFamily: F.semibold, fontSize: size * 0.4, color: '#141413' }}>{name[0]?.toUpperCase()}</Text>
      )}
    </View>
  );
}

/** Três pontinhos pulsando dentro do balão preto: a Lumi está escrevendo. */
export function TypingBubble() {
  return (
    <View style={styles.typing} accessibilityLabel="A Lumi está escrevendo">
      {[0, 1, 2].map((i) => (
        <TypingDot key={i} delay={i * 150} />
      ))}
    </View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 320 }), withTiming(0.25, { duration: 320 })), -1),
    );
  }, [delay, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: (1 - o.value) * 2 }] }));
  return <Animated.View style={[styles.dot, anim]} />;
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center' },
  primary: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { fontSize: 16, fontFamily: F.semibold, letterSpacing: -0.2 },
  outline: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  typing: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#141413',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 3,
  },
  dot: { width: 6, height: 6, backgroundColor: '#F2EFE6' },
});
