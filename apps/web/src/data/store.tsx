import { validState, type State, type StorageAdapter } from '@see/core';
import { notePending, setSaveFailed } from './pending';

/*
 * The web keeps your lists in localStorage, as a per-browser convenience until there is a server.
 * The store itself (StoreProvider, useStore) lives in @see/core/react and is shared with the native apps.
 */
export const LISTS_KEY = 'see.lists.v2';
const KEY = LISTS_KEY;
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
    // a change that arrived from another window is not this window's change
    if (sync.incoming) sync.incoming = false;
    else {
      notePending(last ?? read(), state);
      markLocal(last, state);
    }
    last = state;
    write();
  },
};

export { StoreProvider, useStore } from '@see/core/react';

/** When this window last changed each list: a change from another window inside a few seconds is a clash. */
export const lastLocal = new Map<string, number>();
function markLocal(prev: State | null, next: State) {
  if (!prev) return;
  const now = Date.now();
  for (const L of next.lists) {
    const P = prev.lists.find((x) => x.id === L.id);
    if (!P || JSON.stringify(P.items) !== JSON.stringify(L.items)) lastLocal.set(L.id, now);
  }
}

// a save that fails (storage full or blocked) retries on its own every 5 s; Retry now does it at once
let retry = 0;
function write(): boolean {
  if (!last) return true;
  try {
    localStorage.setItem(KEY, JSON.stringify(last));
    setSaveFailed(false);
    window.clearTimeout(retry);
    return true;
  } catch {
    setSaveFailed(true);
    window.clearTimeout(retry);
    retry = window.setTimeout(write, 5000);
    return false;
  }
}
export const retrySave = write;

/** Set just before loading another window's state, so it isn't counted as this window's change. */
export const sync = { incoming: false };
