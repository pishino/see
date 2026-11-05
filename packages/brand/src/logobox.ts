/*
 * The logo motion C (V3LogoBox): see cut out of the flare box squeezes to a stroke, the stroke stands up as the +'s
 * upright and the crossbar snaps out, while the box shrinks to the icon, in eight frames of 55 ms. Holes, never ink on
 * top: draw `box + holes` with fill-rule evenodd. Platform-free, so the native launch screens draw the same frames.
 */
import { SEE_MARK } from './glyphs';

export const LOGOBOX = { viewBox: '0 0 300 140', steps: 8, beat: 55, hold: 520, out: 380 } as const;

const KS = 4.5 / 28;
const CX = 150;
const CY = 70;
const HW = 100;
const HI = 72;
const SH = 56;
const PADX = 24;
const WW = (SEE_MARK.w * SH) / SEE_MARK.h + 2 * PADX + KS * HW;
const WI = (38 / 28) * HI;
const PA = (17 / 28) * HI;
const PT = (3 / 28) * HI;

const r2 = (v: number) => Math.round(v * 100) / 100;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sm = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const back = (t: number) => 1 + 2.9 * Math.pow(t - 1, 3) + 1.9 * Math.pow(t - 1, 2);

function vtr(d: string, dx: number, dy: number, sx: number, sy: number): string {
  return d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, c: string, nums: string) => {
    const a = nums.trim().split(/[\s,]+/).filter(Boolean);
    const o: number[] = [];
    for (let i = 0; i + 1 < a.length; i += 2) o.push(r2(+a[i] * sx + dx), r2(+a[i + 1] * sy + dy));
    return c + o.join(' ');
  });
}
function para(cx: number, cy: number, w: number, h: number) {
  const s = KS * h;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  return `M${r2(x0 + s)} ${r2(y0)}L${r2(x0 + w)} ${r2(y0)}L${r2(x0 + w - s)} ${r2(y0 + h)}L${r2(x0)} ${r2(y0 + h)}Z`;
}
function rect(cx: number, cy: number, w: number, h: number) {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  return `M${r2(x0)} ${r2(y0)}L${r2(x0 + w)} ${r2(y0)}L${r2(x0 + w)} ${r2(y0 + h)}L${r2(x0)} ${r2(y0 + h)}Z`;
}
function seeAt(sx: number, sy: number) {
  const k = SH / SEE_MARK.h;
  return vtr(SEE_MARK.d, CX - (SEE_MARK.w / 2) * k * sx, CY - (SEE_MARK.h / 2) * k * sy, k * sx, k * sy);
}
function plus(cross: number) {
  return rect(CX, CY, PT, PA) + (cross > 0.001 ? rect(CX, CY, PT + (PA - PT) * cross, PT) : '');
}

/** Frame at t (0 = see in the box, 1 = the + box). `stepped` snaps to C's eight frames. */
export function logoBoxFrame(t: number, stepped = true): { box: string; holes: string } {
  if (stepped) t = Math.round(t * (LOGOBOX.steps - 1)) / (LOGOBOX.steps - 1);
  const e = ease(t);
  const h = HW + (HI - HW) * e;
  const w = WW + (WI - WW) * e;
  let holes: string;
  if (t < 0.5) {
    const q = sm(0, 0.5, t);
    const k = SH / SEE_MARK.h;
    holes = seeAt(1 + (PT / (SEE_MARK.w * k) - 1) * q, 1 + (PA / SH - 1) * q);
  } else {
    holes = plus(back(sm(0.5, 1, t)));
  }
  return { box: para(CX, CY, w, h), holes };
}
