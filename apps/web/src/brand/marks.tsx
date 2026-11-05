import type { CSSProperties } from 'react';
import { SEE_MARK } from '@see/brand';
import { BOX_H, BOX_W, MCELL, boxFrame, lockup, tagOf, typeLine } from '@see/brand';

const r2 = (v: number) => Math.round(v * 100) / 100;

interface MarkProps {
  /** Fill. Defaults to the current accent. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/** The see wordmark. Vector, as supplied. */
export function Wordmark({ height = 28, color = 'var(--see-accent)', className, style }: MarkProps & { height?: number }) {
  const w = (SEE_MARK.w / SEE_MARK.h) * height;
  return (
    <svg
      width={r2(w)}
      height={height}
      viewBox={`0 0 ${SEE_MARK.w} ${SEE_MARK.h}`}
      role="img"
      aria-label="see"
      className={className}
      style={style}
    >
      <path d={SEE_MARK.d} fill={color} />
    </svg>
  );
}

/**
 * The masthead: see with its category tag, stacked or inline; see+ with no category.
 * `cell` is px per cell (the masthead's own size is MCELL).
 */
export function Lockup({
  category = '',
  inline = false,
  cell = MCELL,
  color = 'var(--see-accent)',
  className,
  style,
}: MarkProps & { category?: string; inline?: boolean; cell?: number }) {
  const L = lockup(category, inline);
  const label = category ? `see ${category.toLowerCase()}` : 'see+';
  return (
    <svg
      width={r2(L.w * cell)}
      height={r2(L.h * cell)}
      viewBox={`0 0 ${L.w} ${L.h}`}
      role="img"
      aria-label={label}
      className={className}
      style={style}
    >
      <path d={L.d} fill={color} fillRule="nonzero" />
    </svg>
  );
}

/** A category tag: its name knocked out of the slanted box. Sized by height in px. */
export function CategoryTag({
  name,
  height = 22,
  color = 'var(--see-accent)',
  inline = false,
  className,
  style,
  decorative = false,
}: MarkProps & { name: string; height?: number; inline?: boolean; decorative?: boolean }) {
  const T = tagOf(name, inline);
  const k = height / T.h;
  return (
    <svg
      width={r2(T.w * k)}
      height={height}
      viewBox={`0 0 ${T.w} ${T.h}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={className}
      style={style}
    >
      <path d={T.d} fill={color} />
    </svg>
  );
}

/** The + box: the icon, the Create button and the toast's tick. Frame 0 is the plus, 5 the check. */
export function PlusBox({
  height = 28,
  frame = 0,
  color = 'var(--see-accent)',
  className,
  style,
}: MarkProps & { height?: number; frame?: number }) {
  return (
    <svg
      width={r2((height * BOX_W) / BOX_H)}
      height={height}
      viewBox={`0 0 ${BOX_W} ${BOX_H}`}
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={boxFrame(frame)} fill={color} />
    </svg>
  );
}

/** A line of the display face drawn as vector (for the few places type is the brand, not text). */
export function DisplayLine({
  text,
  height = 28,
  color = 'var(--see-text)',
  className,
  style,
}: MarkProps & { text: string; height?: number }) {
  const L = typeLine(text);
  const k = height / L.h;
  return (
    <svg width={r2(L.w * k)} height={height} viewBox={`0 0 ${L.w} ${L.h}`} role="img" aria-label={text} className={className} style={style}>
      <path d={L.d} fill={color} />
    </svg>
  );
}

/** The plain 12-unit plus, for knocking out of boxes. */
export const PLUS_12 = 'M7 0L7 5L12 5L12 7L7 7L7 12L5 12L5 7L0 7L0 5L5 5L5 0Z';
export const CHECK_12 = 'M4.6 10.2L0.8 6.4L2.2 5L4.6 7.4L9.8 2.2L11.2 3.6Z';

export function Plus12({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d={PLUS_12} fill={color} />
    </svg>
  );
}
