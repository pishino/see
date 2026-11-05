/*
 * Your lists and categories as one state, changed only by actions. Platform-free: the web keeps it in
 * localStorage, the native apps in their own storage, through a StorageAdapter. A server replaces the adapter.
 */
import { SEED_CATEGORIES, registerOwn, seedLists, type Category, type Entry, type List } from './seed';
import { resize } from './model';
import { withoutPerson } from './people';

export interface State {
  lists: List[];
  categories: Category[];
  /** your own items, made when See didn't have something */
  own?: Entry[];
}

export type Action =
  | { type: 'setItems'; id: string; items: (string | null)[] }
  | { type: 'replaceList'; list: List }
  | { type: 'setSize'; id: string; n: number }
  | { type: 'rename'; id: string; name: string }
  | { type: 'togglePin'; id: string }
  | { type: 'addCategory'; category: Category }
  | { type: 'addList'; list: List }
  | { type: 'removeList'; id: string }
  | { type: 'removePerson'; handle: string }
  | { type: 'addOwn'; entry: Entry }
  | { type: 'addFound'; entries: Entry[] }
  | { type: 'load'; state: State }
  | { type: 'reset' };

export function seedState(): State {
  return { lists: seedLists(), categories: SEED_CATEGORIES.slice() };
}

function patch(s: State, id: string, fn: (L: List) => List): State {
  return { ...s, lists: s.lists.map((L) => (L.id === id ? fn(L) : L)) };
}

export function reduce(s: State, a: Action): State {
  switch (a.type) {
    case 'setItems':
      return patch(s, a.id, (L) => ({ ...L, items: a.items }));
    case 'replaceList':
      return patch(s, a.list.id, () => a.list);
    case 'setSize':
      return patch(s, a.id, (L) => resize(L, a.n));
    case 'rename':
      return patch(s, a.id, (L) => ({ ...L, name: a.name.trim() || L.name }));
    case 'togglePin':
      return patch(s, a.id, (L) => ({ ...L, pinned: !L.pinned }));
    case 'addCategory':
      return s.categories.some((c) => c.id === a.category.id) ? s : { ...s, categories: [...s.categories, a.category] };
    case 'addList':
      return { ...s, lists: [...s.lists, a.list] };
    case 'removeList':
      return { ...s, lists: s.lists.filter((L) => L.id !== a.id) };
    case 'removePerson':
      return { ...s, lists: withoutPerson(s.lists, a.handle) };
    case 'addFound': {
      // what a connected service filled: it joins the catalogue on this device, once
      const have = new Set((s.own ?? []).map((x) => x.id));
      const fresh = a.entries.filter((x) => !have.has(x.id));
      registerOwn(fresh);
      return fresh.length ? { ...s, own: [...(s.own ?? []), ...fresh] } : s;
    }
    case 'addOwn':
      registerOwn([a.entry]);
      return { ...s, own: [...(s.own ?? []), a.entry] };
    case 'load':
      registerOwn(a.state.own);
      return a.state;
    case 'reset':
      return seedState();
  }
}

/** A new, empty list: named first; See suggests its category. */
export function newList(cat: string, name: string, n = 10): List {
  return {
    id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    cat,
    name: name.trim(),
    n,
    per: 0,
    items: [],
    prev: [],
    pinned: false,
    people: [],
    poll: false,
    chips: false,
  };
}

export function newCategory(name: string): Category {
  const id = name.trim().toUpperCase();
  return { id, name: id };
}

/** Where a platform keeps the state. `load` may be async (React Native's AsyncStorage is). */
export interface StorageAdapter {
  load(): State | null | Promise<State | null>;
  save(state: State): void | Promise<void>;
}

/** Accept only a well-formed saved state; anything else falls back to the seed. */
export function validState(v: unknown): v is State {
  const s = v as State;
  return !!s && Array.isArray(s.lists) && Array.isArray(s.categories);
}
