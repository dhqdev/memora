import { TextStyle, useColorScheme } from 'react-native';
import { useStore } from './store';

/**
 * Paleta do Memora. O claro (creme + preto) é o padrão: papel, tinta e um
 * amarelo de destaque. O escuro é o mesmo sistema invertido.
 */
export const light = {
  mode: 'light' as 'light' | 'dark',
  bg: '#F2EFE6',
  surface: '#E9E5D9',
  card: '#FAF8F2',
  chip: '#E2DDCF',
  text: '#141413',
  muted: '#7A766C',
  border: '#D8D3C5',
  accent: '#F5D565',
  accentText: '#141413',
  invert: '#141413',
  invertText: '#F2EFE6',
  mention: '#2D5BD8',
};

export const dark: typeof light = {
  mode: 'dark',
  bg: '#121211',
  surface: '#1C1C1A',
  card: '#242422',
  chip: '#2E2E2B',
  text: '#F2EFE6',
  muted: '#9B978C',
  border: '#2F2F2C',
  accent: '#F5D565',
  accentText: '#141413',
  invert: '#F2EFE6',
  invertText: '#121211',
  mention: '#BBD3FF',
};

export type Palette = typeof light;

export function useTheme(): Palette {
  const system = useColorScheme();
  const { profile } = useStore();
  const mode = profile.theme === 'system' ? system ?? 'light' : profile.theme;
  return mode === 'dark' ? dark : light;
}

/** Fontes carregadas em app/_layout.tsx (Google Fonts, licença OFL). */
export const F = {
  regular: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
  heavy: 'InterTight_800ExtraBold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const mono = F.mono;

/** Título grande, pesado e apertado — o "grito" das telas. */
export const display = (size: number, color: string): TextStyle => ({
  fontFamily: F.heavy,
  fontSize: size,
  lineHeight: Math.round(size * 1.08),
  letterSpacing: -size * 0.035,
  color,
});

/** Título de item (moment, story, ajuste). */
export const heading = (size: number, color: string): TextStyle => ({
  fontFamily: F.semibold,
  fontSize: size,
  letterSpacing: -size * 0.015,
  color,
});

/** Texto corrido. */
export const body = (size: number, color: string): TextStyle => ({
  fontFamily: F.regular,
  fontSize: size,
  lineHeight: Math.round(size * 1.45),
  color,
});

/** Marca-texto das @menções e avatares sem foto. */
const HIGHLIGHTS = ['#F5D565', '#BBD3FF', '#D9C8FF', '#C8E6B0', '#F7C6D0', '#F9C897'];
export function highlightFor(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HIGHLIGHTS[h % HIGHLIGHTS.length];
}

export const radius = { xs: 4, sm: 8, md: 16, lg: 22, pill: 999 };

/** Durações das animações, em ms. */
export const motion = { fast: 160, base: 280, slow: 420 };
