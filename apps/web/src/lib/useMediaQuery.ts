import { useSyncExternalStore } from 'react';

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

/** The layout switch the prototypes use: phones get the bottom bar and sheets; wider screens the side bar. */
export function usePhone() {
  return useMediaQuery('(max-width: 760px)');
}
