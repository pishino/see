/*
 * Flat-tone art for the landing: shapes only, no gradients, no people. Each item draws its own cover from a
 * palette and a seeded random, so a title always looks the same. Ported from the landing board.
 */

export type ArtKind = 'FILM' | 'BOOK' | 'ALBUM' | 'SHOW' | 'MATCH' | 'GAME' | 'POD' | 'ARTIST';

export interface ArtItem {
  k: ArtKind;
  t: string;
  by?: string;
  a: string;
  p: number;
  n: string;
}

export const ITEMS: ArtItem[] = [
  { k: 'FILM', t: 'The Last Ferry to Lekki', a: 'sea', p: 0, n: '2,431' },
  { k: 'BOOK', t: 'A Map Made of Salt', by: 'Ifeyinwa Orji', a: 'book', p: 1, n: '1,108' },
  { k: 'ALBUM', t: 'Paper Moons', by: 'Sade Lune', a: 'moons', p: 2, n: '3,902' },
  { k: 'SHOW', t: 'Estate Wars', a: 'city', p: 3, n: '1,877' },
  { k: 'MATCH', t: 'Derby Day, 3–2', a: 'pitch', p: 4, n: '964' },
  { k: 'BOOK', t: 'Ninety Days in Kano', by: 'Musa Danjuma', a: 'book2', p: 5, n: '842' },
  { k: 'FILM', t: 'Third Mainland, 4am', a: 'bridge', p: 6, n: '2,060' },
  { k: 'ALBUM', t: 'Ember', by: 'Ola Dara', a: 'ember', p: 7, n: '5,214' },
  { k: 'GAME', t: 'Okada Rush', a: 'game', p: 8, n: '733' },
  { k: 'FILM', t: 'Dry Season Static', a: 'dunes', p: 9, n: '1,390' },
  { k: 'BOOK', t: 'The Brass Choir', by: 'Temi Adeyemo', a: 'book3', p: 10, n: '1,526' },
  { k: 'SHOW', t: 'Mama Put', a: 'room', p: 11, n: '2,288' },
  { k: 'ALBUM', t: 'Highlife Static', by: 'The Abuja Seven', a: 'grid', p: 12, n: '1,045' },
  { k: 'FILM', t: 'Gold Coast Rain', a: 'road', p: 13, n: '1,712' },
  { k: 'BOOK', t: 'What the River Kept', by: 'Amara Eze', a: 'book4', p: 14, n: '2,994' },
  { k: 'MATCH', t: 'The Final, Extra Time', a: 'pitch2', p: 15, n: '3,310' },
  { k: 'ALBUM', t: 'Slow Burn FM', by: 'Kayode B.', a: 'stage', p: 16, n: '2,167' },
  { k: 'SHOW', t: 'Night Desk', a: 'city2', p: 17, n: '908' },
  { k: 'POD', t: 'Second Opinion', by: 'Weekly', a: 'grid', p: 14, n: '1,204' },
  { k: 'ARTIST', t: 'Ola Dara', by: 'Artist', a: 'stage', p: 3, n: '4,410' },
  { k: 'POD', t: 'Danfo Diaries', by: 'Daily', a: 'ember', p: 16, n: '861' },
  { k: 'ARTIST', t: 'The Abuja Seven', by: 'Band', a: 'moons', p: 9, n: '2,017' },
];

const PAL = [
  ['#13223A', '#E08A3C', '#1F4E5A', '#F2D3A0'], ['#E9DCC2', '#9C3D24', '#1E2B24', '#C98A2B'], ['#2B1E3F', '#E6C46A', '#7B5EA7', '#F1E6D0'], ['#101820', '#F2B544', '#2D4A5A', '#8FA9B5'],
  ['#2F6B3B', '#E9F0E1', '#25562F', '#F4F5F2'], ['#C98A2B', '#1E1A16', '#F1E2C4', '#7A3B1E'], ['#0E1B2C', '#6F8FB3', '#E7B04B', '#22374F'], ['#3A1410', '#FF8A4C', '#C5401E', '#F6D2B8'],
  ['#1D3B4A', '#F2C14E', '#E8505B', '#F4F1E8'], ['#E3C08A', '#B5652F', '#7E3F1E', '#F5E6C8'], ['#1E3A34', '#D9B45A', '#F2E8D0', '#8C6A2E'], ['#5A2A36', '#F0C8A0', '#2C1B1F', '#D9785A'],
  ['#F2EBDD', '#1F2A44', '#C9472B', '#E3B23C'], ['#22303A', '#9FB4C0', '#E2A64A', '#3B4C58'], ['#2E4A3E', '#E8D8B8', '#C26A3A', '#1A2A24'], ['#1F5130', '#E9F0E1', '#173E25', '#FFD25A'],
  ['#20142E', '#FF7A59', '#F5C04A', '#4D3170'], ['#0F1A24', '#E9EEF2', '#3E5E78', '#F2B544'],
];

export const ASPECT: Record<ArtKind, number> = { FILM: 16 / 9, SHOW: 16 / 9, MATCH: 16 / 9, GAME: 4 / 3, ALBUM: 1, BOOK: 2 / 3, POD: 1, ARTIST: 1 };

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

type C = CanvasRenderingContext2D;
function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}
function circ(c: C, x: number, y: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function poly(c: C, pts: number[], f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fill();
}

export function art(c: C, it: ArtItem, x: number, y: number, w: number, h: number) {
  const P = PAL[it.p % PAL.length];
  const r = rng(it.p * 97 + 13);
  let i: number;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  rect(c, x, y, w, h, P[0]);
  if (it.a === 'sea') {
    circ(c, x + w * 0.68, y + h * 0.42, h * 0.2, P[1]);
    rect(c, x, y + h * 0.55, w, h * 0.45, P[2]);
    for (i = 0; i < 5; i++) rect(c, x + w * (0.1 + r() * 0.7), y + h * (0.6 + i * 0.07), w * 0.18, h * 0.012, P[3]);
    poly(c, [x + w * 0.2, y + h * 0.55, x + w * 0.36, y + h * 0.55, x + w * 0.33, y + h * 0.6, x + w * 0.23, y + h * 0.6], '#0B0F0E');
    rect(c, x + w * 0.27, y + h * 0.45, w * 0.01, h * 0.1, '#0B0F0E');
  } else if (it.a === 'city' || it.a === 'city2') {
    circ(c, x + w * 0.8, y + h * 0.2, h * 0.08, P[3]);
    let bx = x;
    while (bx < x + w) {
      const bw = w * (0.06 + r() * 0.08);
      const bh = h * (0.3 + r() * 0.5);
      rect(c, bx, y + h - bh, bw - 3, bh, P[2]);
      for (let wy = y + h - bh + 8; wy < y + h - 6; wy += 12) for (let wx = bx + 5; wx < bx + bw - 8; wx += 9) if (r() > 0.55) rect(c, wx, wy, 4, 5, P[1]);
      bx += bw;
    }
  } else if (it.a === 'pitch' || it.a === 'pitch2') {
    for (i = 0; i < 8; i++) if (i % 2) rect(c, x + (i * w) / 8, y, w / 8, h, P[2]);
    c.strokeStyle = P[1];
    c.lineWidth = Math.max(2, h * 0.012);
    c.strokeRect(x + w * 0.06, y + h * 0.1, w * 0.88, h * 0.8);
    c.beginPath();
    c.moveTo(x + w / 2, y + h * 0.1);
    c.lineTo(x + w / 2, y + h * 0.9);
    c.stroke();
    c.beginPath();
    c.arc(x + w / 2, y + h / 2, h * 0.16, 0, Math.PI * 2);
    c.stroke();
    circ(c, x + w * (0.3 + r() * 0.4), y + h * (0.3 + r() * 0.4), h * 0.035, P[3]);
  } else if (it.a === 'bridge') {
    circ(c, x + w * 0.2, y + h * 0.25, h * 0.06, P[3]);
    rect(c, x, y + h * 0.62, w, h * 0.38, P[2]);
    c.strokeStyle = P[1];
    c.lineWidth = h * 0.025;
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(x + w * (0.12 + i * 0.26), y + h * 0.62, w * 0.13, Math.PI, 0);
      c.stroke();
    }
    rect(c, x, y + h * 0.48, w, h * 0.04, P[1]);
    for (i = 0; i < 9; i++) rect(c, x + r() * w, y + h * (0.7 + r() * 0.25), w * 0.06, 2, P[1]);
  } else if (it.a === 'dunes') {
    circ(c, x + w * 0.5, y + h * 0.45, h * 0.3, P[3]);
    poly(c, [x, y + h * 0.7, x + w * 0.35, y + h * 0.5, x + w * 0.7, y + h * 0.72, x + w, y + h * 0.58, x + w, y + h, x, y + h], P[1]);
    poly(c, [x, y + h * 0.85, x + w * 0.5, y + h * 0.7, x + w, y + h * 0.9, x + w, y + h, x, y + h], P[2]);
  } else if (it.a === 'road') {
    rect(c, x, y + h * 0.5, w, h * 0.5, P[2]);
    poly(c, [x + w * 0.46, y + h * 0.5, x + w * 0.54, y + h * 0.5, x + w * 0.9, y + h, x + w * 0.1, y + h], P[3]);
    for (i = 0; i < 4; i++) rect(c, x + w * 0.495, y + h * (0.55 + i * 0.12), w * 0.01, h * 0.05, P[1]);
    for (i = 0; i < 26; i++) rect(c, x + r() * w, y + r() * h * 0.5, 1.5, h * 0.06, P[1]);
  } else if (it.a === 'room') {
    rect(c, x + w * 0.58, y + h * 0.12, w * 0.3, h * 0.42, P[1]);
    rect(c, x + w * 0.725, y + h * 0.12, 3, h * 0.42, P[0]);
    rect(c, x, y + h * 0.72, w, h * 0.28, P[2]);
    rect(c, x + w * 0.12, y + h * 0.55, w * 0.38, h * 0.05, P[3]);
    circ(c, x + w * 0.2, y + h * 0.5, h * 0.05, P[1]);
    circ(c, x + w * 0.36, y + h * 0.5, h * 0.06, P[3]);
  } else if (it.a === 'game') {
    for (i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if (r() > 0.45) rect(c, x + w * (0.08 + i * 0.145), y + h * (0.12 + j * 0.2), w * 0.12, h * 0.16, P[1 + ((i + j) % 3)]);
  } else if (it.a === 'moons') {
    for (i = 0; i < 3; i++) {
      circ(c, x + w * (0.28 + i * 0.22), y + h * 0.45, h * 0.18, P[1 + (i % 2)]);
      circ(c, x + w * (0.31 + i * 0.22), y + h * 0.43, h * 0.15, P[0]);
    }
  } else if (it.a === 'ember') {
    for (i = 5; i > 0; i--) circ(c, x + w * 0.5, y + h * 0.58, h * 0.09 * i, i % 2 ? P[2] : P[1]);
  } else if (it.a === 'grid') {
    for (i = 0; i < 5; i++) for (let j = 0; j < 5; j++) circ(c, x + w * (0.18 + i * 0.16), y + h * (0.16 + j * 0.14), h * 0.045, (i + j) % 3 ? P[1] : P[2]);
  } else if (it.a === 'stage') {
    for (i = 0; i < 4; i++) poly(c, [x + w * (0.2 + i * 0.2), y, x + w * (0.12 + i * 0.2), y + h * 0.75, x + w * (0.3 + i * 0.2), y + h * 0.75], i % 2 ? P[1] : P[2]);
    rect(c, x, y + h * 0.75, w, h * 0.25, P[3]);
  } else {
    // book covers: a motif, and the type is the cover
    if (it.a === 'book') {
      circ(c, x + w * 0.5, y + h * 0.4, w * 0.3, P[1]);
      rect(c, x, y + h * 0.4, w, h * 0.04, P[2]);
    } else if (it.a === 'book2') {
      for (i = 0; i < 6; i++) rect(c, x, y + h * (0.1 + i * 0.09), w * (0.3 + r() * 0.6), h * 0.05, i % 2 ? P[1] : P[3]);
    } else if (it.a === 'book3') {
      poly(c, [x + w * 0.2, y + h * 0.62, x + w * 0.5, y + h * 0.12, x + w * 0.8, y + h * 0.62], P[1]);
      rect(c, x + w * 0.42, y + h * 0.4, w * 0.16, h * 0.22, P[0]);
    } else {
      c.strokeStyle = P[1];
      c.lineWidth = w * 0.03;
      for (i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(x, y + h * (0.2 + i * 0.08));
        c.bezierCurveTo(x + w * 0.3, y + h * (0.12 + i * 0.08), x + w * 0.7, y + h * (0.3 + i * 0.08), x + w, y + h * (0.2 + i * 0.08));
        c.stroke();
      }
    }
    c.fillStyle = P[3] === P[0] ? '#F4F5F2' : P[3];
    c.textBaseline = 'alphabetic';
    const fs = Math.round(w * 0.13);
    c.font = `italic 400 ${fs}px Newsreader, Georgia, serif`;
    const words = it.t.split(' ');
    let line = '';
    const ly = y + h * 0.72;
    const lines: string[] = [];
    words.forEach((wd) => {
      const tr = line ? `${line} ${wd}` : wd;
      if (c.measureText(tr).width > w * 0.8 && line) {
        lines.push(line);
        line = wd;
      } else line = tr;
    });
    lines.push(line);
    lines.slice(0, 3).forEach((l, k) => c.fillText(l, x + w * 0.1, ly + k * fs * 1.05));
    c.font = `600 ${Math.round(w * 0.06)}px "Instrument Sans", sans-serif`;
    c.fillText(String(it.by || '').toUpperCase(), x + w * 0.1, y + h * 0.93);
  }
  c.restore();
}

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
  rect(c, 0, 0, width, hh, '#0B0F0E');
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

/** A picture for any catalogue entry: one of the flat-tone scenes, the same every time for the same id. */
const SCENES = ITEMS.filter((it) => it.k !== 'BOOK');
export function artFor(id: string): ArtItem {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return SCENES[(h >>> 0) % SCENES.length];
}
