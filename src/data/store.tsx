import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SEED_CATEGORIES, seedLists, type Category, type List } from './seed';

/*
 * Lists are saved as you go. This build keeps them in memory and, as a per-browser convenience, in localStorage;
 * a real backend replaces `load` and `save`.
 */
const KEY = 'see.lists.v2';

interface Saved {
  lists: List[];
  categories: Category[];
}

function load(): Saved {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const v = JSON.parse(s) as Saved;
      if (Array.isArray(v.lists) && Array.isArray(v.categories)) return v;
    }
  } catch {
    /* private window or blocked storage: start from the seed */
  }
  return { lists: seedLists(), categories: SEED_CATEGORIES.slice() };
}

interface Store extends Saved {
  list: (id: string) => List | undefined;
  listsIn: (cat: string) => List[];
  setItems: (id: string, items: (string | null)[]) => void;
  setSize: (id: string, n: number) => void;
  togglePin: (id: string) => void;
  addCategory: (name: string) => Category;
  addList: (cat: string, name: string) => List;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: lists still work for this visit */
    }
  }, [state]);

  const patchList = useCallback((id: string, fn: (L: List) => List) => {
    setState((s) => ({ ...s, lists: s.lists.map((L) => (L.id === id ? fn(L) : L)) }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      list: (id) => state.lists.find((L) => L.id === id),
      listsIn: (cat) => state.lists.filter((L) => L.cat === cat),
      setItems: (id, items) => patchList(id, (L) => ({ ...L, items })),
      setSize: (id, n) => patchList(id, (L) => ({ ...L, n, items: L.items.slice(0, n) })),
      togglePin: (id) => patchList(id, (L) => ({ ...L, pinned: !L.pinned })),
      addCategory: (name) => {
        const c = { id: name.toUpperCase(), name: name.toUpperCase() };
        setState((s) => (s.categories.some((x) => x.id === c.id) ? s : { ...s, categories: [...s.categories, c] }));
        return c;
      },
      addList: (cat, name) => {
        const L: List = { id: `u${Date.now().toString(36)}`, cat, name, n: 10, per: 0, items: [], prev: [], pinned: false, people: [], poll: false, chips: false };
        setState((s) => ({ ...s, lists: [...s.lists, L] }));
        return L;
      },
      reset: () => setState({ lists: seedLists(), categories: SEED_CATEGORIES.slice() }),
    }),
    [state, patchList],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
