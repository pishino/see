/*
 * See design tokens for code: React Native reads colours and sizes from here; the web reads tokens.css.
 * Both come from tokens.json.
 */
import raw from '../tokens.json';

export type Scheme = 'dark' | 'light';
export type ColorRole = keyof typeof raw.color;
export type Shell = 'bottom' | 'rail' | 'side';

export const tokens = raw;

/** Every colour role for one scheme. */
export function colors(scheme: Scheme): Record<ColorRole, string> {
  const out = {} as Record<ColorRole, string>;
  for (const k of Object.keys(raw.color) as ColorRole[]) out[k] = raw.color[k][scheme];
  return out;
}

export const font = raw.font;
export const type = raw.type;
export const shape = raw.shape;
export const motion = raw.motion;
export const size = raw.size;
export const layer = raw.layer;
export const space = raw.space;
export const breakpoint = raw.breakpoint;

/**
 * Five widths, three shells (V3Responsive): the bottom bar under 840, the rail to 1280, the side bar after.
 * Phones held on their side (under 500 tall) keep the bottom bar, folded to 56.
 */
export function shellFor(width: number): Shell {
  if (width < breakpoint.tablet) return 'bottom';
  if (width < breakpoint.desktop) return 'rail';
  return 'side';
}

/** Gutters: 20 on phones, 40 from 600, 56 from 840. */
export function gutterFor(width: number): number {
  if (width < breakpoint['phone-wide']) return size['gutter-phone'];
  if (width < breakpoint.tablet) return size['gutter-tablet'];
  return size['gutter-desktop'];
}
