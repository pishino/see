import { validState, type State, type StorageAdapter } from '@see/core';
import { notePending } from './pending';

/*
 * The web keeps your lists in localStorage, as a per-browser convenience until there is a server.
 * The store itself (StoreProvider, useStore) lives in @see/core/react and is shared with the native apps.
 */
const KEY = 'see.lists.v2';
let last: State | null = null;

function read(): State | null {
  try {
    const s = localStorage.getItem(KEY);
    const v: unknown = s ? JSON.parse(s) : null;
    return validState(v) ? v : null;
  } catch {
    return null; // private window or blocked storage: start from the seed
  }
}

export const webStorage: StorageAdapter = {
  load: read,
  save(state: State) {
    notePending(last ?? read(), state);
    last = state;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: lists still work for this visit */
    }
  },
};

export { StoreProvider, useStore } from '@see/core/react';
