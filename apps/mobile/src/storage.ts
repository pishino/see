import AsyncStorage from '@react-native-async-storage/async-storage';
import { validState, type State, type StorageAdapter } from '@see/core';
import type { SettingsStorage } from '@see/core/react';

/*
 * The phone keeps your lists and settings in AsyncStorage, under the same keys as the web's localStorage. Both
 * providers in @see/core/react accept an async load: they show the seed for a moment, then your saved state.
 */
const LISTS = 'see.lists.v2';
const SETTINGS = 'see.settings.v1';

async function read(key: string): Promise<unknown> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export const nativeStorage: StorageAdapter = {
  load: async () => {
    const v = await read(LISTS);
    return validState(v) ? (v as State) : null;
  },
  save: (state) => AsyncStorage.setItem(LISTS, JSON.stringify(state)).catch(() => {}),
};

export const nativeSettings: SettingsStorage = {
  load: () => read(SETTINGS),
  save: (s) => AsyncStorage.setItem(SETTINGS, JSON.stringify(s)).catch(() => {}),
};
