import { Platform, useColorScheme } from 'react-native';
import { useStore } from './store';

export const dark = {
  bg: '#121212',
  surface: '#1C1C1B',
  card: '#2A2A28',
  chip: '#4A4A47',
  text: '#F2EFE6',
  muted: '#9B978C',
  border: '#2F2F2D',
  accent: '#F5D565',
  accentText: '#1A1A1A',
  invert: '#F2EFE6',
  invertText: '#121212',
  mention: '#BBD3FF',
};

export const light: typeof dark = {
  bg: '#F6F3EA',
  surface: '#EDE9DD',
  card: '#FFFFFF',
  chip: '#DCD7C9',
  text: '#161616',
  muted: '#6E6A60',
  border: '#DDD8CB',
  accent: '#F5D565',
  accentText: '#1A1A1A',
  invert: '#161616',
  invertText: '#F6F3EA',
  mention: '#2D5BD8',
};

export type Palette = typeof dark;

export function useTheme(): Palette {
  const system = useColorScheme();
  const { profile } = useStore();
  const mode = profile.theme === 'system' ? system ?? 'dark' : profile.theme;
  return mode === 'light' ? light : dark;
}

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const radius = { sm: 10, md: 18, lg: 28, pill: 999 };
