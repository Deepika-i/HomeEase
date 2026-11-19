import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#B85D32',
    secondary: '#E9A66F',
    text: '#392D28',
    background: '#FFF1E5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F5DFCE',
    textSecondary: '#8C756A',
    border: '#EAD8C9',
  },
  dark: {
    primary: '#E9A66F',
    secondary: '#B85D32',
    text: '#FFF1E5',
    background: '#211A17',
    backgroundElement: '#392D28',
    backgroundSelected: '#514037',
    textSecondary: '#C8B2A5',
    border: '#59473D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light &
  keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const MaxContentWidth = 800;