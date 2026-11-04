/*
 * Profile pictures: a figure, dithered on a 24-cell grid in the person's colour, never twins.
 * Pixels stay only where they are the subject: the Plus field and people's pictures.
 */
const AV_COLORS = ['#FF4A1C', '#7C6BFF', '#3FC1C9', '#F2C14E', '#7FD18B', '#F4F5F2', '#E86A92'];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const cache = new Map<string, { d: string; c: string }>();

export function avatarOf(handle: string) {
  const hit = cache.get(handle);
  if (hit) return hit;
  const h = hashOf(handle);
  const r = (k: number) => ((h >>> (k * 3)) & 7) / 7;
  const hx = 12 + (r(1) - 0.5) * 3;
  const hy = 9.5 + (r(2) - 0.5) * 1.6;
  const hr = 5.4 + r(3) * 1.2;
  const hair = Math.floor(r(4) * 4);
  const sw = 10 + r(5) * 2.5;
  const tilt = (r(6) - 0.5) * 0.3;
  const rot = h % 4;
  let d = '';
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      let i = 0.1 + 0.06 * (y / 24);
      if (((x - 12) / sw) ** 2 + ((y - 25.5) / 9.5) ** 2 <= 1) i = 0.36 + (0.24 * (12 - x)) / sw;
      if (Math.abs(x - hx) < 1.8 && y > hy + hr - 1 && y < hy + hr + 4) i = 0.5;
      const dx = x - hx;
      const dy = y - hy;
      const dd = dx * dx + dy * dy;
      if (dd <= hr * hr) {
        i = 0.82 - (0.32 * (dx + hr)) / (2 * hr) + (tilt * dy) / hr;
        if (hair === 0 && dy < -hr * 0.35) i = 0.25;
        if (hair === 1 && (dy < -hr * 0.2 || (dy < hr * 0.3 && Math.abs(dx) > hr * 0.72))) i = 0.25;
        if (hair === 3 && dy < -hr * 0.55) i = 0.3;
      }
      if (hair === 2 && dd > hr * hr && dd <= (hr + 2.2) * (hr + 2.2) && dy < hr * 0.4) i = 0.28;
      const bx = (x + rot) % 4;
      const by = (y + (rot >> 1)) % 4;
      const t = (BAYER4[by * 4 + bx] + 0.5) / 16;
      if (i > t) d += `M${r2(x / 3)} ${r2(y / 3)}h0.334v0.334h-0.334z`;
    }
  }
  const res = { d, c: AV_COLORS[h % AV_COLORS.length] };
  cache.set(handle, res);
  return res;
}

export function Avatar({ handle, size = 36, ring = true }: { handle: string; size?: number; ring?: boolean }) {
  const a = avatarOf(handle);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: 'var(--see-surface-2)',
        boxShadow: ring ? '0 0 0 2px var(--see-bg)' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size - 6} height={size - 6} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <path d={a.d} fill={a.c} />
      </svg>
    </span>
  );
}
