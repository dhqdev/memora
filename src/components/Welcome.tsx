import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { body, F, hero, mono, useTheme } from '../theme';
import { LumiFace } from './Lumi';
import { EdgeFade, riseIn } from './motion';
import { Label, PrimaryButton } from './ui';

/**
 * Primeira tela do app, antes da conversa com a Lumi — o "topo do site":
 * etiqueta mono, manchete enorme, uma frase e dois celulares tortos
 * flutuando com telas do Memora (desenhadas aqui mesmo, sem imagem).
 */
export function Welcome({ onStart }: { onStart: () => void }) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(54, Math.round(width * 0.135));
  const phoneW = Math.min(212, Math.round(width * 0.5));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.stage}>
        <Floating delay={0} amplitude={6} style={{ position: 'absolute', left: width * 0.07, top: 34, transform: [{ rotate: '-7deg' }] }}>
          <Animated.View entering={riseIn(120, 700)}>
            <Phone width={phoneW}>
              <FeedScreen />
            </Phone>
          </Animated.View>
        </Floating>
        <Floating delay={900} amplitude={8} style={{ position: 'absolute', right: width * 0.06, top: 12, transform: [{ rotate: '6deg' }] }}>
          <Animated.View entering={riseIn(260, 700)}>
            <Phone width={phoneW}>
              <MomentScreen />
            </Phone>
          </Animated.View>
        </Floating>
        <EdgeFade color={c.bg} side="bottom" width={90} />
      </View>

      <View style={styles.copy}>
        <Animated.View entering={riseIn(380)}>
          <Label>Sua vida, um moment de cada vez</Label>
        </Animated.View>
        <Animated.Text entering={riseIn(460)} style={[hero(size, c.text), { marginTop: 14 }]}>
          O diário que responde.
        </Animated.Text>
        <Animated.Text entering={riseIn(540)} style={[body(16.5, c.muted), { marginTop: 14 }]}>
          Salve um moment em segundos. A Lumi, sua melhor amiga de bolso, reage e transforma seus moments em stories que você
          vai querer reler.
        </Animated.Text>
        <Animated.View entering={riseIn(640)} style={{ marginTop: 26 }}>
          <PrimaryButton title="Começar" trailing="arrow" onPress={onStart} />
          <Text style={[styles.fine, { color: c.muted }]}>Tudo fica no seu aparelho. Sem anúncios.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

/** Flutua devagar para cima e para baixo (para de vez com "Reduzir movimento"). */
function Floating({
  children,
  delay,
  amplitude,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  amplitude: number;
  style: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    const half = { duration: 2600, easing: Easing.inOut(Easing.quad) };
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-amplitude, half), withTiming(0, half)), -1));
  }, [reduce, delay, amplitude, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={style}>
      <Animated.View style={anim}>{children}</Animated.View>
    </View>
  );
}

/** Moldura de celular: papel creme dentro de um aro grafite. */
function Phone({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <View style={[styles.phone, { width, height: Math.round(width * 1.96), borderRadius: width * 0.16 }]}>
      <View style={[styles.screen, { borderRadius: width * 0.13 }]}>
        <View style={styles.island} />
        {children}
      </View>
    </View>
  );
}

const INK = '#141413';
const PAPER = '#F2EFE6';
const MUTED = '#8E8A80';

/** Tela de Moments em miniatura. */
function FeedScreen() {
  return (
    <View style={styles.inner}>
      <View style={styles.miniTop}>
        <Text style={styles.miniBrand}>Memora</Text>
        <View style={styles.miniPlus}>
          <Text style={{ color: PAPER, fontSize: 11, lineHeight: 13 }}>+</Text>
        </View>
      </View>
      <View style={styles.miniTabs}>
        {['Moments', 'Stories', 'Calendário'].map((t, i) => (
          <Text key={t} style={[styles.miniTab, i === 0 && { color: INK, textDecorationLine: 'underline' }]}>
            {t}
          </Text>
        ))}
      </View>

      <View style={styles.miniItem}>
        <View style={{ width: 18 }}>
          <Text style={styles.miniDay}>20</Text>
          <Text style={styles.miniMono}>out</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniTitle}>Primeiro café do outono</Text>
          <Text style={styles.miniText}>Latte de abóbora, óbvio</Text>
          <MockPhoto kind="sunset" style={{ width: '78%', aspectRatio: 0.86, marginTop: 5 }} />
          <View style={styles.miniPill}>
            <Text style={styles.miniMono}>Story · Dia a dia</Text>
          </View>
        </View>
      </View>

      <View style={styles.miniItem}>
        <View style={{ width: 18 }}>
          <Text style={styles.miniDay}>12</Text>
          <Text style={styles.miniMono}>out</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniTitle}>Piquenique com a Mari</Text>
          <Text style={styles.miniText}>
            Com <Text style={{ backgroundColor: '#C8E6B0' }}>@Mari</Text> depois da aula
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 5 }}>
            <MockPhoto kind="park" style={{ flex: 1, aspectRatio: 0.8 }} />
            <MockPhoto kind="night" style={{ flex: 1, aspectRatio: 0.8 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Um moment aberto em miniatura, com o balão da Lumi. */
function MomentScreen() {
  return (
    <View style={styles.inner}>
      <View style={styles.miniTop}>
        <View style={styles.miniBack}>
          <Text style={{ color: INK, fontSize: 9 }}>←</Text>
        </View>
        <Text style={styles.miniMono}>MOMENT</Text>
        <Text style={{ color: INK, fontSize: 10 }}>···</Text>
      </View>
      <Text style={[styles.miniMono, { marginTop: 12 }]}>— 20 de outubro de 2026</Text>
      <Text style={styles.miniHead}>Primeiro café do outono</Text>
      <Text style={[styles.miniText, { marginTop: 3 }]}>O primeiro latte de abóbora da estação, óbvio.</Text>
      <MockPhoto kind="sunset" style={{ width: '46%', aspectRatio: 0.82, marginTop: 8 }} />
      <View style={styles.miniRow}>
        <Text style={styles.miniMono}>Onde</Text>
        <Text style={styles.miniValue}>Café da Esquina</Text>
      </View>
      <View style={styles.miniRow}>
        <Text style={styles.miniMono}>Story</Text>
        <Text style={styles.miniValue}>Dia a dia · 2026</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.miniBubble}>
        <Text style={styles.miniPixel}>Latte de abóbora no 1º dia de outono? Você não perde tempo.</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <LumiFace size={30} mood="excited" />
      </View>
    </View>
  );
}

/** "Foto" desenhada: pôr do sol, parque ou noite — só formas e degradê. */
function MockPhoto({ kind, style }: { kind: 'sunset' | 'park' | 'night'; style: StyleProp<ViewStyle> }) {
  const g = {
    sunset: ['#F9C897', '#E0795C'],
    park: ['#D7EBC4', '#7FB069'],
    night: ['#5B6CD9', '#22225A'],
  }[kind];
  return (
    <View style={[{ borderRadius: 5, overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`sky-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={g[0]} />
            <Stop offset="1" stopColor={g[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="120" fill={`url(#sky-${kind})`} />
        {kind === 'sunset' && (
          <>
            <Circle cx="62" cy="58" r="18" fill="#FFF3D6" opacity={0.9} />
            <Path d="M0 84 Q30 74 55 82 T100 78 V120 H0 Z" fill="#7A3B2E" opacity={0.85} />
            <Path d="M22 98 h22 v14 a6 6 0 0 1 -6 6 h-10 a6 6 0 0 1 -6 -6 z M44 102 h5 a4 4 0 0 1 0 8 h-5" fill={PAPER} />
          </>
        )}
        {kind === 'park' && (
          <>
            <Circle cx="28" cy="58" r="20" fill="#4E8A43" />
            <Circle cx="70" cy="48" r="24" fill="#5E9B4F" />
            <Rect x="26" y="70" width="4" height="22" fill="#5A4031" />
            <Rect x="68" y="66" width="4" height="26" fill="#5A4031" />
            <Path d="M0 92 Q50 84 100 92 V120 H0 Z" fill="#9CC77F" />
            <Rect x="38" y="98" width="26" height="10" rx="2" fill="#F7C6D0" />
          </>
        )}
        {kind === 'night' && (
          <>
            <Circle cx="70" cy="30" r="9" fill="#F5D565" />
            <Circle cx="20" cy="22" r="1.4" fill={PAPER} />
            <Circle cx="38" cy="40" r="1" fill={PAPER} />
            <Circle cx="86" cy="58" r="1.2" fill={PAPER} />
            <Path d="M0 90 L18 70 L30 82 L48 60 L66 84 L80 72 L100 90 V120 H0 Z" fill="#141433" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden' },
  copy: { paddingHorizontal: 24, paddingBottom: 12 },
  fine: { fontFamily: mono, fontSize: 11, textAlign: 'center', marginTop: 12 },
  phone: {
    backgroundColor: '#2A2A28',
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  screen: { flex: 1, backgroundColor: PAPER, overflow: 'hidden' },
  island: { alignSelf: 'center', width: '30%', height: 9, borderRadius: 5, backgroundColor: INK, marginTop: 7 },
  inner: { flex: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12 },
  miniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniBrand: { fontFamily: F.bold, fontSize: 14, letterSpacing: -0.6, color: INK },
  miniPlus: { width: 16, height: 16, borderRadius: 8, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  miniBack: { width: 16, height: 16, borderRadius: 8, borderWidth: 0.8, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  miniTabs: { flexDirection: 'row', gap: 7, marginTop: 7, marginBottom: 9 },
  miniTab: { fontFamily: F.medium, fontSize: 7.5, color: MUTED },
  miniItem: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  miniDay: { fontFamily: F.medium, fontSize: 11, color: INK, letterSpacing: -0.3 },
  miniMono: { fontFamily: mono, fontSize: 6, color: MUTED },
  miniTitle: { fontFamily: F.medium, fontSize: 8.5, color: INK },
  miniHead: { fontFamily: F.medium, fontSize: 14, color: INK, letterSpacing: -0.4, marginTop: 4 },
  miniText: { fontFamily: F.regular, fontSize: 6.5, color: INK, opacity: 0.85, marginTop: 1 },
  miniPill: { alignSelf: 'flex-start', borderWidth: 0.6, borderColor: '#BDB8AA', borderRadius: 99, paddingHorizontal: 4, paddingVertical: 1, marginTop: 4 },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 0.5,
    borderColor: '#D8D3C5',
    marginTop: 4,
  },
  miniValue: { fontFamily: F.medium, fontSize: 7, color: INK },
  miniBubble: { backgroundColor: INK, borderRadius: 1, paddingHorizontal: 6, paddingVertical: 5 },
  miniPixel: { fontFamily: F.pixel, fontSize: 7.5, lineHeight: 10, color: PAPER },
});
