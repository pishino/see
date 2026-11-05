import { useColorScheme } from 'react-native';
import { useSettings } from '@see/core/react';
import { colors, type ColorRole } from '@see/tokens';

export type C = Record<ColorRole, string>;

/** The colour roles for Settings › Appearance (Dark, Light, or Match device). */
export function useColors(): { c: C; dark: boolean } {
  const { settings } = useSettings();
  const device = useColorScheme();
  const dark = settings.appearance === 'Match device' ? device !== 'light' : settings.appearance !== 'Light';
  return { c: colors(dark ? 'dark' : 'light'), dark };
}
