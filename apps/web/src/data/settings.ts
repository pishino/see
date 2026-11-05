import { DEFAULT_SETTINGS, withDefaults, type Settings } from '@see/core';
import type { SettingsStorage } from '@see/core/react';

/* Settings on the web: this browser's localStorage. The provider is shared (@see/core/react). */
const KEY = 'see.settings.v1';

export const webSettingsStorage: SettingsStorage = {
  load() {
    try {
      const s = localStorage.getItem(KEY);
      if (s) return JSON.parse(s) as unknown;
      // carry over the appearance chosen before Settings existed
      const old = localStorage.getItem('see.appearance');
      if (old) return { appearance: old === 'light' ? 'Light' : old === 'system' ? 'Match device' : 'Dark' };
    } catch {
      /* blocked storage: defaults */
    }
    return null;
  },
  save(settings: Settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* lasts this visit */
    }
  },
};

/** Apply what Settings changes about the whole page: appearance, motion, focus rings, text size. */
export function applyToDocument(s: Settings) {
  const el = document.documentElement;
  el.dataset.theme = s.appearance === 'Light' ? 'light' : s.appearance === 'Flare' ? 'flare' : s.appearance === 'Match device' ? 'system' : 'dark';
  el.dataset.motion = s.reduceMotion ? 'reduce' : '';
  el.dataset.rings = s.rings ? 'always' : '';
  el.dataset.text = s.text === 'Default' ? '' : s.text.toLowerCase();
}

/** Before the first paint, so the page never flashes the wrong theme. */
export function applySavedSettings() {
  applyToDocument(withDefaults(webSettingsStorage.load() as Settings | null) ?? DEFAULT_SETTINGS);
}
