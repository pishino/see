import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'quiet' | 'ink';
type Size = 'sm' | 'md' | 'lg';

function cls(variant: Variant, size: Size, extra?: string) {
  return ['btn', variant !== 'primary' && `btn--${variant}`, size !== 'md' && `btn--${size}`, extra].filter(Boolean).join(' ');
}

/** The slanted button. Primary is the one action on a screen; quiet is the second (Settings, Compare, Done). */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button type={type} className={cls(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/** The same button as a link, for actions that go somewhere. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={cls(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
