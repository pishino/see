import { PICTURE_LAYERS, photoLayers } from '@see/brand';
import { useSettings } from '@see/core/react';

function hex(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

/** Your picture: four tones of your colour on the 24-cell grid. */
export function ProfilePicture({ size = 34, colour, label = 'Your picture' }: { size?: number; colour?: string; label?: string }) {
  const { settings } = useSettings();
  const L = settings.photo && !colour ? photoLayers(settings.photo) : PICTURE_LAYERS;
  colour = colour ?? settings.colour;
  const ink = '#0B0F0E';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
      <rect width="24" height="24" fill={mix(ink, colour, 0.16)} />
      <path d={L.r1} fill={mix(ink, colour, 0.42)} />
      <path d={L.r2} fill={colour} />
      <path d={L.r3} fill={mix(colour, '#FFFFFF', 0.55)} />
    </svg>
  );
}
