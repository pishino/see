import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../brand/Icon';
import { Plus12, CHECK_12, PLUS_12 } from '../brand/marks';

/** Read-as chip: TOP 10, ALL TIME, SONGS. Pressed shows the flare edge. */
export function ReadChip({
  pressed,
  onClick,
  disabled,
  children,
  label,
}: {
  pressed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button type="button" className="read-chip" aria-pressed={pressed} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

/** Switch: 44 × 24, the thumb parallel to the track. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

/** Field (3A): the arrow sits inside, cut parallel to the field's corner. */
export function Field({
  label,
  onSubmit,
  error,
  goLabel = 'Continue',
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> & {
  label: string;
  onSubmit?: (value: string) => void;
  error?: boolean;
  goLabel?: string;
}) {
  const [value, setValue] = useState(String(input.defaultValue ?? ''));
  const v = input.value !== undefined ? String(input.value) : value;
  return (
    <form
      className="field"
      data-ready={v.trim().length > 0}
      data-error={error || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(v);
      }}
    >
      <input
        aria-label={label}
        {...input}
        value={v}
        onChange={(e) => {
          setValue(e.target.value);
          input.onChange?.(e);
        }}
      />
      <button type="submit" className="field__go" aria-label={goLabel}>
        <Icon name="arrow" size={13} color="var(--see-on-flare)" />
      </button>
    </form>
  );
}

/**
 * The + call to action, everywhere: a box, and near it, its words.
 * On touch the first tap opens it; the second acts.
 */
export function PlusCta({
  label,
  onClick,
  big,
  done,
  className,
}: {
  label: string;
  onClick: () => void;
  big?: boolean;
  done?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={['pc', big && 'pc--big', className].filter(Boolean).join(' ')}
      data-open={open}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch' && !open) {
          e.preventDefault();
          setOpen(true);
          window.setTimeout(() => setOpen(false), 3200);
        }
      }}
      onClick={() => {
        if (open || !matchMedia('(hover: none)').matches) {
          setOpen(false);
          onClick();
        }
      }}
    >
      <span className="pc__in">
        <svg width={big ? 18 : 14} height={big ? 18 : 14} viewBox="0 0 12 12" aria-hidden="true">
          <path d={done ? CHECK_12 : PLUS_12} fill="currentColor" />
        </svg>
        <span className="pc__label">{label}</span>
      </span>
    </button>
  );
}

export { Plus12 };
