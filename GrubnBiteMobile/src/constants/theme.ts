/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E2024',
    background: '#FFFDF9',
    backgroundElement: '#F4EEE7',
    backgroundSelected: '#FFE1D5',
    textSecondary: '#6E6A66',
  },
  dark: {
    text: '#FFFDF9',
    background: '#1E2024',
    backgroundElement: '#2A2D31',
    backgroundSelected: '#69352A',
    textSecondary: '#C8C0B9',
  },
} as const;

export const FoodColors = {
  tomato: '#FF704B',
  tomatoDark: '#C84A32',
  ink: '#F7F2EC',
  muted: '#A9A19A',
  oat: '#101214',
  cream: '#1B1F22',
  peach: '#3A211C',
  mint: '#183829',
  green: '#65C58A',
  line: '#303438',
  surface: '#1B1F22',
  onDark: '#F7F2EC',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
