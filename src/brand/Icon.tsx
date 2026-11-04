import type { CSSProperties } from 'react';
import { ICON_PATHS } from './glyphs';

export type IconName = keyof typeof ICON_PATHS;

/** The 12-unit icon set. Decorative by default; pass `label` when the icon carries meaning on its own. */
export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  label,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  label?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flexShrink: 0, ...style }}
      className={className}
    >
      <path d={ICON_PATHS[name]} fill={color} />
    </svg>
  );
}
