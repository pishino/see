import { useEffect, useRef, useState, type CSSProperties } from 'react';

/*
 * The Plus field: See's background, behind every header. Plus signs drift in bands on the icon's slant and stay
 * grey; the pointer draws the brand + out of them in the accent. Reduced motion holds a still frame.
 */

type Theme = 'flare' | 'violet';

const THEMES: Record<Theme, { ramp: string[]; hot: string; warm: string }> = {
  flare: { ramp: ['#0C100F', '#0C1110', '#0E1211', '#101413', '#131817'], hot: '#23150F', warm: '#231B17' },
  violet: { ramp: ['#0C1010', '#0C1011', '#0E1113', '#101316', '#15181C'], hot: '#161826', warm: '#1C1F26' },
};

function rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function pack(c: [number, number, number]) {
  return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
}

interface Opts {
  theme: Theme;
  cell: number;
  /** the ground; by default the page's own (--see-bg) */
  bg?: string;
  calm: number;
  plusPx: number;
}

function mixHex(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** The tones for the current theme: the design's dark ramp, or one mixed from a light ground. */
function tones(o: Opts) {
  const css = getComputedStyle(document.documentElement);
  const bg = (o.bg ?? css.getPropertyValue('--see-bg').trim()) || '#0B0F0E';
  const light = rgb(bg).reduce((a, b) => a + b, 0) > 384;
  if (!light) return { bg, ...THEMES[o.theme] };
  const ink = css.getPropertyValue('--see-text').trim() || '#0B0F0E';
  const acc = o.theme === 'violet' ? '#7C6BFF' : '#FF4A1C';
  return {
    bg,
    ramp: [0.015, 0.03, 0.05, 0.07, 0.09].map((t) => mixHex(bg, ink, t)),
    hot: mixHex(bg, acc, 0.28),
    warm: mixHex(bg, acc, 0.16),
  };
}

function start(cv: HTMLCanvasElement, o: Opts) {
  const th = tones(o);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d');
  if (!ctx) return () => {};
  const RAMP = th.ramp.map((h) => pack(rgb(h)));
  const WARM = pack(rgb(th.warm));
  const HOT = pack(rgb(th.hot));
  const BG = pack(rgb(th.bg));
  let W = 0;
  let H = 0;
  let img: ImageData | null = null;
  let buf: Uint32Array | null = null;
  let gw = 0;
  let gh = 0;
  let cpx = o.cell;
  let LV: [number, number][] = [];
  let px = -1e4;
  let py = -1e4;
  let energy = 0;
  const rings: { x: number; y: number; t: number }[] = [];
  let lastX = -1e4;
  let lastY = -1e4;
  const t0 = performance.now();
  let raf = 0;
  let alive = true;
  let seen = true;

  function levels(c: number) {
    const b = Math.max(1, Math.round(c / 4));
    LV = [[b, b], [Math.max(b + 1, Math.round(c * 0.5)), b], [Math.round(c * 0.75), b], [Math.round(c * 0.75), b], [c, b]];
  }
  function size() {
    const r = cv.getBoundingClientRect();
    const lw = cv.clientWidth || r.width;
    const lh = cv.clientHeight || r.height;
    const k = lw ? Math.min(1, (r.width / lw) * (window.devicePixelRatio || 1)) : 1;
    const w = Math.max(1, Math.round(lw * k));
    const h = Math.max(1, Math.round(lh * k));
    if (w === W && h === H) return;
    W = cv.width = w;
    H = cv.height = h;
    img = ctx!.createImageData(W, H);
    buf = new Uint32Array(img.data.buffer);
    cpx = Math.max(2, Math.round(o.cell * k));
    levels(cpx);
    gw = Math.ceil(W / cpx);
    gh = Math.ceil(H / cpx);
  }
  function plusD(dx: number, dy: number, L: number, tt: number) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const d1 = Math.max(ax - tt, ay - L);
    const d2 = Math.max(ay - tt, ax - L);
    return Math.min(d1, d2);
  }
  function stamp(cx: number, cy: number, lv: number, col: number) {
    const [a, b] = LV[lv];
    const c = cpx;
    const x0 = cx * c + ((c - a) >> 1);
    const y0 = cy * c + ((c - b) >> 1);
    const bx = cx * c + ((c - b) >> 1);
    const by = cy * c + ((c - a) >> 1);
    for (let y = y0; y < y0 + b && y < H; y++) for (let x = x0, i = y * W; x < x0 + a && x < W; x++) buf![i + x] = col;
    for (let y = by; y < by + a && y < H; y++) for (let x = bx, i = y * W; x < bx + b && x < W; x++) buf![i + x] = col;
  }
  function frame() {
    if (!alive) return;
    size();
    if (!buf || !img) return;
    const t = still ? 0 : ((performance.now() - t0) / 1000) * 1;
    buf.fill(BG);
    const PL = Math.max(4, Math.round(o.plusPx / o.cell));
    const PT = Math.max(1, Math.round(PL * 0.2));
    const pgx = Math.floor(px / cpx);
    const pgy = Math.floor(py / cpx);
    const pon = px > -1e3;
    const base = 0.66 + energy * 0.4;
    energy *= 0.95;
    for (let k = rings.length - 1; k >= 0; k--) if (t - rings[k].t > 2.4 || still) rings.splice(k, 1);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const u = gx + gy * 0.157;
        let v = Math.sin(u * 0.42 - t * 0.9) * 0.55 + Math.sin(u * 0.13 + t * 0.32) * 0.3 + Math.sin(gy * 0.05 - t * 0.2) * 0.15;
        v = (v + 1) / 2;
        v = v * v;
        let sw = 0;
        if (pon) {
          const d = plusD(gx - pgx, gy - pgy, PL, PT);
          sw = d <= 0 ? base : d < 1.6 ? base * (1 - d / 1.6) * 0.75 : 0;
        }
        for (const ring of rings) {
          const age = t - ring.t;
          const gr = age * 10;
          let q = plusD(gx - ring.x, gy - ring.y, PL + gr, PT + gr * 0.2);
          q = Math.abs(q);
          sw += Math.exp((-q * q) / 0.7) * 0.5 * (1 - age / 2.4);
        }
        v = v * 0.78 - o.calm * 0.25;
        let lv: number;
        let col: number;
        if (sw > 0.82) [lv, col] = [4, HOT];
        else if (sw > 0.6) [lv, col] = [3, HOT];
        else if (sw > 0.42) [lv, col] = [3, WARM];
        else {
          v += sw * 0.9;
          if (v < 0.12) [lv, col] = [0, RAMP[0]];
          else if (v < 0.3) [lv, col] = [0, RAMP[1]];
          else if (v < 0.5) [lv, col] = [1, RAMP[2]];
          else if (v < 0.7) [lv, col] = [2, RAMP[3]];
          else [lv, col] = [2, RAMP[4]];
        }
        stamp(gx, gy, lv, col);
      }
    }
    ctx!.putImageData(img, 0, 0);
    raf = !still && seen ? requestAnimationFrame(frame) : 0;
  }
  function onMove(e: PointerEvent) {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (H / r.height);
    if (x < 0 || y < 0 || x > W || y > H) {
      if (px > -1e3) {
        px = py = -1e4;
        if (!raf) raf = requestAnimationFrame(frame);
      }
      return;
    }
    const dd = Math.abs(x - lastX) + Math.abs(y - lastY);
    px = x;
    py = y;
    energy = Math.min(1, energy + Math.min(0.25, dd / 200));
    if (dd > cpx * 9) {
      lastX = x;
      lastY = y;
      rings.push({ x: Math.floor(x / cpx), y: Math.floor(y / cpx), t: still ? 0 : (performance.now() - t0) / 1000 });
      if (rings.length > 5) rings.shift();
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  const io = new IntersectionObserver((es) => {
    seen = es[0].isIntersecting;
    if (seen && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(cv);
  raf = requestAnimationFrame(frame);
  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    io.disconnect();
  };
}

/** Re-render when the page's theme changes (data-theme on <html>, or the device's scheme). */
function useThemeKey() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const bump = () => setKey((k) => k + 1);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', bump);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', bump);
    };
  }, []);
  return key;
}

export function PlusField({
  theme = 'flare',
  cell = 8,
  bg,
  calm = 0.15,
  plusPx = 64,
  style,
}: Partial<Opts> & { style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const themeKey = useThemeKey();
  useEffect(() => {
    if (!ref.current) return;
    return start(ref.current, { theme, cell, bg, calm, plusPx });
  }, [theme, cell, bg, calm, plusPx, themeKey]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', background: bg ?? 'var(--see-bg)', ...style }}
    />
  );
}
