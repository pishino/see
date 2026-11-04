import { avatarOf } from '@see/brand';

export { avatarOf, hashOf } from '@see/brand';

export function Avatar({ handle, size = 36, ring = true }: { handle: string; size?: number; ring?: boolean }) {
  const a = avatarOf(handle);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: 'var(--see-surface-2)',
        boxShadow: ring ? '0 0 0 2px var(--see-bg)' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size - 6} height={size - 6} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <path d={a.d} fill={a.c} />
      </svg>
    </span>
  );
}
