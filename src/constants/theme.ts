/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0E0E12',
    background: '#F4F4F7',
    /** Raised surfaces: the composer and note cards. */
    surface: '#FFFFFF',
    backgroundElement: '#EBEBF0',
    backgroundSelected: '#E0E0E7',
    textSecondary: '#6B6B76',
    textTertiary: '#9D9DA8',
    border: '#E3E3EA',
    tint: '#3B5BFF',
    /** Low-emphasis accent wash for badges, focus rings and icon wells. */
    tintSoft: '#E6EAFF',
    tintText: '#FFFFFF',
    danger: '#E5484D',
    shadow: 'rgba(26, 26, 64, 0.07)',
  },
  dark: {
    text: '#F3F3F6',
    background: '#0A0A0D',
    surface: '#16161B',
    backgroundElement: '#1E1E24',
    backgroundSelected: '#2A2A32',
    textSecondary: '#9B9BA6',
    textTertiary: '#64646E',
    border: '#25252C',
    tint: '#8193FF',
    tintSoft: '#1C2045',
    tintText: '#0A0A14',
    danger: '#FF6369',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
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

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
