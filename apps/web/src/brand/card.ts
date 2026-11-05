/*
 * A card that opens See (V3IntCards): a picture of the chart for places that can only show an image and a link
 * (X, Threads, Bluesky, Messages, WhatsApp, stories). The frame is No. 1's own artwork; See draws the words on it.
 * 1200 × 630, the size link previews and posts use.
 */
import { SEE_MARK, art, artFor } from '@see/brand';

export interface CardRow {
  t: string;
  m: string;
}

export function drawListCard(cv: HTMLCanvasElement, c: { name: string; kicker: string; rows: CardRow[]; firstId?: string; poll?: boolean }) {
  const W = 1200;
  const H = 630;
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  if (!x) return;
  const accent = c.poll ? '#7C6BFF' : '#FF4A1C';
  x.fillStyle = '#0B0F0E';
  x.fillRect(0, 0, W, H);
  // the frame is No. 1's own picture, on the right, held back so the words read
  if (c.firstId) art(x, artFor(c.firstId), 560, 0, 640, H);
  x.fillStyle = 'rgba(11,15,14,0.55)';
  x.fillRect(560, 0, 640, H);
  x.fillStyle = '#0B0F0E';
  x.fillRect(0, 0, 640, H);
  // the + box, then see
  const k = 34 / SEE_MARK.h;
  x.save();
  x.translate(64, 56);
  x.scale(k, k);
  x.fillStyle = accent;
  x.fill(new Path2D(SEE_MARK.d));
  x.restore();
  x.fillStyle = '#9AA39F';
  x.font = '600 22px "Instrument Sans", sans-serif';
  x.fillText(c.kicker.toUpperCase(), 64, 150);
  x.fillStyle = '#F4F5F2';
  x.font = '900 64px Archivo, sans-serif';
  const words = c.name.toUpperCase().split(' ');
  let line = '';
  let y = 222;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (x.measureText(next).width > 980 && line) {
      x.fillText(line, 64, y);
      line = w;
      y += 66;
    } else line = next;
  }
  x.fillText(line, 64, y);
  y += 70;
  c.rows.slice(0, 3).forEach((r, i) => {
    x.fillStyle = i === 0 ? accent : '#F4F5F2';
    x.font = '800 34px Archivo, sans-serif';
    x.fillText(String(i + 1).padStart(2, '0'), 64, y + i * 64);
    x.fillStyle = '#F4F5F2';
    x.font = '800 32px Archivo, sans-serif';
    x.fillText(r.t.toUpperCase().slice(0, 30), 140, y + i * 64);
    x.fillStyle = '#9AA39F';
    x.font = '400 22px "Instrument Sans", sans-serif';
    x.fillText(r.m.slice(0, 40), 140, y + i * 64 + 26);
  });
  x.fillStyle = accent;
  x.beginPath();
  x.moveTo(64 + 10, 556);
  x.lineTo(300, 556);
  x.lineTo(290, 600);
  x.lineTo(64, 600);
  x.closePath();
  x.fill();
  x.fillStyle = '#0B0F0E';
  x.font = '800 22px Archivo, sans-serif';
  x.fillText(c.poll ? 'VOTE IN SEE' : 'RANK YOURS', 92, 586);
  x.fillStyle = '#9AA39F';
  x.font = '400 20px "Instrument Sans", sans-serif';
  x.fillText(c.poll ? 'see.app · results after you vote' : 'see.app · a locked chart', 330, 586);
}
