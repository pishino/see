import { PICTURE_LAYERS } from '@see/brand';

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
export function ProfilePicture({ size = 34, colour = '#FF4A1C', label = 'Your picture' }: { size?: number; colour?: string; label?: string }) {
  const ink = '#0B0F0E';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
      <rect width="24" height="24" fill={mix(ink, colour, 0.16)} />
      <path d={PICTURE_LAYERS.r1} fill={mix(ink, colour, 0.42)} />
      <path d={PICTURE_LAYERS.r2} fill={colour} />
      <path d={PICTURE_LAYERS.r3} fill={mix(colour, '#FFFFFF', 0.55)} />
    </svg>
  );
}
