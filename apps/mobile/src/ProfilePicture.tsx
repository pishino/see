import Svg, { Path, Rect } from 'react-native-svg';
import { PICTURE_LAYERS } from '@see/brand';
import { useSettings } from '@see/core/react';

function rgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

/** Your picture: four tones of your colour on the 24-cell grid, as on the web. */
export function ProfilePicture({ size = 34, colour }: { size?: number; colour?: string }) {
  const mine = useSettings().settings.colour;
  const c = colour ?? mine;
  const ink = '#0B0F0E';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel="Your picture">
      <Rect width={24} height={24} fill={mix(ink, c, 0.16)} />
      <Path d={PICTURE_LAYERS.r1} fill={mix(ink, c, 0.42)} />
      <Path d={PICTURE_LAYERS.r2} fill={c} />
      <Path d={PICTURE_LAYERS.r3} fill={mix(c, '#FFFFFF', 0.55)} />
    </Svg>
  );
}
