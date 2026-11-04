import { useSyncExternalStore } from 'react';
import { breakpoint, type Shell } from '@see/tokens';

/** Subscribe to a media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Five widths, three shells (V3Responsive): the bottom bar under 840, the rail to 1280, the side bar after.
 * Same app at every width: nothing is hidden, only folded.
 */
export function useShell(): Shell {
  const rail = useMediaQuery(`(min-width: ${breakpoint.tablet}px)`);
  const side = useMediaQuery(`(min-width: ${breakpoint.desktop}px)`);
  return side ? 'side' : rail ? 'rail' : 'bottom';
}

/** Phones and wide phones: the bottom bar, the masthead row, sheets from the bottom. */
export function usePhone() {
  return useShell() === 'bottom';
}

/** A phone on its side (under 500 tall): the masthead folds to one line and the bar drops to 56. */
export function useShort() {
  return useMediaQuery(`(max-height: ${breakpoint.short - 1}px) and (max-width: ${breakpoint.tablet - 1}px)`);
}
