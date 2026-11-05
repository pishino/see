import { useSyncExternalStore } from 'react';
import { slotsOf, type State } from '@see/core';

/*
 * Changes made while offline (V3ProblemStates C2/C3): the move happens at once, the row says WAITING until it syncs,
 * and back online one toast counts what synced. Until there is a server, "synced" means the connection came back.
 */
let waiting = new Map<string, Set<string>>();
let changes = 0;
let snap = { waiting, changes };
const subs = new Set<() => void>();
const emit = () => {
  snap = { waiting, changes };
  subs.forEach((f) => f());
};

/** Called with each state about to be saved, and the state saved before it. */
export function notePending(prev: State | null, next: State) {
  if (typeof navigator === 'undefined' || navigator.onLine || !prev || prev === next) return;
  const w = new Map(waiting);
  for (const L of next.lists) {
    const before = prev.lists.find((p) => p.id === L.id);
    const was = before ? slotsOf(before) : [];
    const set = new Set(w.get(L.id));
    slotsOf(L).forEach((x, i) => x && x !== was[i] && set.add(x));
    if (set.size) w.set(L.id, set);
  }
  waiting = w;
  changes += 1;
  emit();
}

/** Back online: everything waiting has synced. Returns how many changes that was. */
export function flushPending(): number {
  const n = changes;
  waiting = new Map();
  changes = 0;
  emit();
  return n;
}

export function usePending() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => snap,
  );
}
