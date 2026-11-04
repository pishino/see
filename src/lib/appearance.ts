/** Appearance: dark by default; light is a choice in Settings; "match my device" follows the OS. */
export type Appearance = 'dark' | 'light' | 'system';
const KEY = 'see.appearance';

export function readAppearance(): Appearance {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'system' || v === 'dark') return v;
  } catch {
    /* storage blocked: the default */
  }
  return 'dark';
}

export function setAppearance(a: Appearance) {
  document.documentElement.setAttribute('data-theme', a);
  try {
    localStorage.setItem(KEY, a);
  } catch {
    /* lasts this visit */
  }
}
