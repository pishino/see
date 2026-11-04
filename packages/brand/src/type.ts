/*
 * See's display type, as vector paths.
 *
 * Ported from the design canvas (v3.6, "no pixels in primitives"): the wordmark, the + box, category tags and
 * the masthead lockup are all built from one glyph table on a 28-row cap height. Every function returns SVG path
 * data in "cells"; callers pick the scale (px per cell) when they draw it.
 */
import { GLYPHS, SEE_MARK, SEE_GRID, PLUS_GRID, BOX_FRAMES, type Glyph } from './glyphs';

/** Rows in a cap height, and the gap between stacked lines. */
export const P_ROWS = 28;
export const P_GAP = 7;
const P_K = 1.4;
const kk = (v: number) => Math.round(v * P_K);

/** px per cell for the masthead and the tags drawn at its size (0.6 px a cell before the 1.4 step). */
export const MCELL = 0.6 / P_K;

/** The see bitmap is drawn on the fine grid itself; the plus is doubled onto it. */
export const SEE2 = { w: SEE_GRID.w, h: SEE_GRID.h >= 2 * P_ROWS ? SEE_GRID.h : SEE_GRID.h * 2 };
const PLUS2 = { w: PLUS_GRID.w * 2, h: PLUS_GRID.h * 2 };

export const MW = kk(500);
const TAG_Y = kk(48);
const PLUS_X = SEE2.w + kk(8);
const PLUS_Y = kk(6);
const TAG_PY = kk(5);
const TAG_R = P_ROWS + 2 * TAG_PY;
const TAG_SL = kk(8);
const TAG_PX = kk(8);
const TAG_MAXW = kk(375);
const INLINE_GAP = kk(10);
const INLINE_TAGW = kk(250);

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Move and scale path data (M, L, Q and C commands with absolute coordinates). */
export function transformPath(d: string, dx: number, dy: number, sx = 1, sy = sx): string {
  return String(d || '').replace(/([MLQC])([^MLQCZ]*)/g, (_m, c: string, nums: string) => {
    const a = nums.trim().split(/[\s,]+/);
    const o: number[] = [];
    for (let i = 0; i + 1 < a.length; i += 2) o.push(r2(+a[i] * sx + dx), r2(+a[i + 1] * sy + dy));
    return c + o.join(' ');
  });
}

/** Upper-case, strip accents and swap anything the face lacks for a space. */
function norm(text: string): string {
  let t = String(text ?? '');
  try {
    t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch {
    /* older engines: keep as is */
  }
  t = t.toUpperCase();
  let o = '';
  for (const c of t) o += GLYPHS[c] ? c : ' ';
  return o;
}

function eachGlyph(t: string, fn: (g: Glyph, x: number) => void) {
  let x = 0;
  let first = true;
  for (const ch of t) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    if (first && g[2]) {
      x = -g[0];
      first = false;
    }
    if (g[2]) fn(g, x + g[0]);
    x += g[1];
  }
}

function widthOf(t: string): number {
  let end = 0;
  eachGlyph(t, (g, gx) => {
    end = gx + g[2];
  });
  return Math.ceil(end);
}

function fit(text: string, maxW: number): string {
  let t = norm(text);
  if (maxW && widthOf(t) > maxW) {
    while (t.length > 1 && widthOf(t + '…') > maxW) t = t.slice(0, -1);
    t = t.replace(/\s+$/, '') + '…';
  }
  return t;
}

export interface TypePath {
  d: string;
  w: number;
  h: number;
}

const lineCache = new Map<string, TypePath>();

/** One line of display type. `maxW` (cells) trims with an ellipsis. */
export function typeLine(text: string, maxW = 0): TypePath {
  const key = `${text}|${maxW}`;
  const hit = lineCache.get(key);
  if (hit) return hit;
  const t = fit(text, maxW);
  let d = '';
  let end = 0;
  eachGlyph(t, (g, gx) => {
    d += transformPath(g[3], gx, 0, 1, 1);
    end = gx + g[2];
  });
  const res = { d, w: Math.max(1, Math.ceil(end)), h: P_ROWS };
  lineCache.set(key, res);
  return res;
}

/** Several lines of display type in one block, wrapped at `maxW` cells. */
export function typeBlock(text: string, maxW: number, maxLines = 0): TypePath & { lines: number } {
  const words = norm(text)
    .split(/\s+/)
    .filter((w) => w.length);
  let lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (!cur || widthOf(trial) <= maxW) cur = trial;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length) lines = [''];
  if (maxLines && lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    keep[maxLines - 1] = `${keep[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`;
    lines = keep;
  }
  let w = 1;
  let d = '';
  lines.forEach((l, i) => {
    const r = typeLine(l, maxW);
    w = Math.max(w, r.w);
    d += transformPath(r.d, 0, i * (P_ROWS + P_GAP));
  });
  return { d, w, h: lines.length * P_ROWS + (lines.length - 1) * P_GAP, lines: lines.length };
}

/** The slanted solid every tag, chip and button shares, drawn so a label knocks out of it. */
function solid(x: number, y: number, w: number, h: number, sl: number): string {
  return `M${r2(x + sl)} ${r2(y)}L${r2(x)} ${r2(y + h)}L${r2(x + w - sl)} ${r2(y + h)}L${r2(x + w)} ${r2(y)}Z`;
}

export interface Tag extends TypePath {
  /** Path of the solid alone, without the label. */
  solidD: string;
  sl: number;
}

const tagCache = new Map<string, Tag>();

/** A category tag: the label knocked out of a slanted box. `inline` uses the narrower one-line measure. */
export function tagOf(name: string, inline = false): Tag {
  const key = `${inline ? 'i' : 's'}|${name}`;
  const hit = tagCache.get(key);
  if (hit) return hit;
  const L = typeBlock(name, inline ? INLINE_TAGW : TAG_MAXW, 2);
  const h = L.h + TAG_PY * 2;
  const sl = Math.round((TAG_SL * h) / TAG_R);
  const w = Math.ceil(L.w + TAG_PX * 2 + sl);
  const lx = TAG_PX + (sl >> 1);
  const solidD = solid(0, 0, w, h, sl);
  const t = { d: solidD + transformPath(L.d, lx, TAG_PY), solidD, w, h, sl };
  tagCache.set(key, t);
  return t;
}

let seeD = '';
/** The see wordmark on the masthead's grid (SEE2.w × SEE2.h cells). */
export function seePath(): string {
  if (!seeD) {
    const k = SEE2.h / SEE_MARK.h;
    seeD = transformPath(SEE_MARK.d, Math.max(0, (SEE2.w - SEE_MARK.w * k) / 2), 0, k, k);
  }
  return seeD;
}

/** The bare plus beside see (see+). */
function plusBeside(): string {
  const W = PLUS2.w;
  const t = W * 0.3;
  const cx = PLUS_X + PLUS2.w / 2;
  const cy = PLUS_Y + PLUS2.h / 2;
  const a = W / 2;
  const b = t / 2;
  const p = [
    [-b, -a], [b, -a], [b, -b], [a, -b], [a, b], [b, b],
    [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b],
  ];
  return 'M' + p.map((q) => `${r2(cx + q[0])} ${r2(cy + q[1])}`).join('L') + 'Z';
}

/**
 * The masthead: see with its category tag, stacked (tag under see) or inline (tag beside it).
 * With no category it is see+.
 */
export function lockup(cat: string, inline = false): TypePath {
  if (!cat) return { d: seePath() + plusBeside(), w: PLUS_X + PLUS2.w, h: SEE2.h };
  const T = tagOf(cat, inline);
  const tx = inline ? SEE2.w + INLINE_GAP : 0;
  const ty = inline ? Math.max(0, SEE2.h - T.h) : TAG_Y;
  return {
    d: seePath() + transformPath(T.d, tx, ty),
    w: Math.max(SEE2.w, tx + T.w),
    h: Math.max(SEE2.h, ty + T.h),
  };
}

/** The + box (38 × 28): frame 0 is the plus, 5 is the check. */
export const BOX_W = 38;
export const BOX_H = 28;
export function boxFrame(i: number): string {
  return BOX_FRAMES[Math.max(0, Math.min(BOX_FRAMES.length - 1, i))];
}
