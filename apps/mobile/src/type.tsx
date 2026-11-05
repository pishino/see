/*
 * The brand's two faces on the phone (V3Handoff type): Archivo for display (700, 800, 900), Instrument Sans for
 * body (400, 600). Custom fonts don't pick a file by weight on Android, so Txt maps the weight to the family.
 */
import { Text, StyleSheet, type TextProps } from 'react-native';
import { useFonts } from 'expo-font';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';

export function useBrandFonts(): boolean {
  const [ok, err] = useFonts({ Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black, InstrumentSans_400Regular, InstrumentSans_600SemiBold });
  return ok || !!err; // no fonts: the system faces, rather than a blank screen
}

function familyFor(weight: string | number | undefined): string {
  const w = Number(weight ?? 400);
  if (w >= 900) return 'Archivo_900Black';
  if (w >= 800) return 'Archivo_800ExtraBold';
  if (w >= 700) return 'Archivo_700Bold';
  if (w >= 600) return 'InstrumentSans_600SemiBold';
  return 'InstrumentSans_400Regular';
}

/** Text in the brand faces: the weight in the style chooses the face. */
export function Txt({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  return <Text {...rest} style={[flat, { fontFamily: familyFor(flat.fontWeight), fontWeight: 'normal' }]} />;
}
