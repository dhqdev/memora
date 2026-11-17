import { TextStyle, useColorScheme } from 'react-native';
import { useStore } from './store';

/**
 * Paleta do Memora: papel creme, tinta quase preta e um amarelo de destaque.
 * Segue o tema do sistema por padrão (o escuro é o "rosto" principal do app).
 */
export const light = {
  mode: 'light' as 'light' | 'dark',
  bg: '#F2EFE6',
  surface: '#E9E5D9',
  card: '#FAF8F2',
  chip: '#DCD7C9',
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
  bg: '#121212',
  surface: '#1C1C1B',
  card: '#222221',
  chip: '#4A4A47',
  text: '#F2EFE6',
  muted: '#9B978C',
  border: '#33332F',
  accent: '#F5D565',
  accentText: '#141413',
  invert: '#F2EFE6',
  invertText: '#121212',
  mention: '#BBD3FF',
};

export type Palette = typeof light;

export function useTheme(): Palette {
  const system = useColorScheme();
  const { profile } = useStore();
  const mode = profile.theme === 'system' ? system ?? 'dark' : profile.theme;
  return mode === 'dark' ? dark : light;
}

/** Fontes carregadas em app/_layout.tsx (Google Fonts, licença OFL). */
export const F = {
  regular: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
  heavy: 'InterTight_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
  pixel: 'PixelifySans_400Regular',
};

export const mono = F.mono;

/** Título grande: peso médio, levemente apertado (jeito Apple). */
export const display = (size: number, color: string): TextStyle => ({
  fontFamily: F.medium,
  fontSize: size,
  lineHeight: Math.round(size * 1.12),
  letterSpacing: -size * 0.025,
  color,
});

/** Título de item (moment, story, ajuste). */
export const heading = (size: number, color: string): TextStyle => ({
  fontFamily: F.medium,
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

/**
 * Movimento (princípios de UX): rápido e com "slow in / slow out".
 * Ações frequentes (trocar de aba, tocar em botão) animam menos ou nada.
 */
export const motion = { instant: 0, fast: 160, base: 240, slow: 380 };
/** Curva padrão: sai rápido e chega devagar. */
export const EASE_OUT = [0.2, 0, 0, 1] as const;
