/*
 * Painting the brand's art on the web: into a canvas (paint) and the landing's drifting wall (buildWall).
 * The art itself lives in @see/brand, shared with the phones.
 */
import { ASPECT, ITEMS, art, type ArtItem } from '@see/brand';

export { ASPECT, ITEMS, art, artFor, type ArtItem, type ArtKind } from '@see/brand';

/** Paint one item into a canvas at its display size (2x for sharpness). `framed` centres a book on the card. */
export function paint(cv: HTMLCanvasElement, it: ArtItem, framed = false) {
  const w = cv.offsetWidth || 64;
  const h = cv.offsetHeight || 36;
  const d = 2;
  cv.width = Math.round(w * d);
  cv.height = Math.round(h * d);
  const c = cv.getContext('2d');
  if (!c) return;
  c.scale(d, d);
  if (framed) {
    const aw = it.k === 'BOOK' ? h * 0.66 : w;
    c.fillStyle = '#141A18';
    c.fillRect(0, 0, w, h);
    art(c, it, (w - aw) / 2, 0, aw, h);
  } else art(c, it, 0, 0, w, h);
}

export interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  it: ArtItem;
}

/** The wall behind the box: three rows of tiles drawn once, wide enough to drift across. */
export function buildWall(th: number, width: number, scale: number) {
  const gap = Math.max(3, Math.round(th * 0.05));
  const rows = 3;
  const cv = document.createElement('canvas');
  const tiles: Tile[] = [];
  const hh = rows * (th + gap);
  cv.width = Math.round(width * scale);
  cv.height = Math.round(hh * scale);
  const c = cv.getContext('2d')!;
  c.scale(scale, scale);
  c.fillStyle = '#0B0F0E';
  c.fillRect(0, 0, width, hh);
  let y = 0;
  for (let r = 0; r < rows; r++) {
    let x = -((r * 97) % 180);
    let k = (r * 7) % ITEMS.length;
    while (x < width) {
      const it = ITEMS[k % ITEMS.length];
      const tw = Math.round(th * ASPECT[it.k]);
      if (x + tw > 0) {
        art(c, it, x, y, tw, th);
        tiles.push({ x, y, w: tw, h: th, it });
      }
      x += tw + gap;
      k++;
    }
    y += th + gap;
  }
  return { cv, w: width, h: hh, tiles, rowH: th + gap };
}

