/**
 * Tasarım sistemi: "yumuşak, minimal, baloncuk" — açık + koyu palet.
 * Hiçbir ekranda sabit renk yazılmaz; her şey useTheme() üzerinden gelir.
 */
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  bg: string;
  surface: string;
  frame: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  hairline: string;
  progressTrack: string;
  accent: string;
  accentSoft: string;
  accentOnSoft: string;
  onAccent: string;
}

export const lightColors: ThemeColors = {
  bg: '#F6F2EA',
  surface: '#FFFFFF',
  frame: '#EDE8DF',
  textPrimary: '#2B2722',
  textSecondary: '#9A9387',
  textTertiary: '#A8A093',
  hairline: 'rgba(0,0,0,0.06)',
  progressTrack: '#ECE6DB',
  accent: '#EC7E63',
  accentSoft: '#FBE7DF',
  accentOnSoft: '#B0522F',
  onAccent: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  bg: '#1A1815',
  surface: '#262119',
  frame: '#100F0D',
  textPrimary: '#F0EBE2',
  textSecondary: '#A39B8E',
  textTertiary: '#8C857A',
  hairline: 'rgba(255,255,255,0.06)',
  progressTrack: 'rgba(255,255,255,0.08)',
  accent: '#EC8568',
  accentSoft: 'rgba(236,133,104,0.16)',
  accentOnSoft: '#EC8568',
  onAccent: '#1A1815',
};

export const radius = {
  bubble: 20,
  button: 15,
  pill: 10,
  sm: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gap: 11, // kartlar arası dikey boşluk
} as const;

export const font = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
} as const;

export type Scheme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: Scheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = 'gamepm.theme.mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(MODE_KEY, m);
  }, []);

  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      mode,
      setMode,
      ready,
    }),
    [scheme, mode, setMode, ready],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
