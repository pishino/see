/*
 * The store for React: the same provider and hook on the web and in React Native. Each platform passes its own
 * StorageAdapter.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { newCategory, newList, reduce, seedState, validState, type Action, type State, type StorageAdapter } from './store';
import type { Category, List } from './seed';
import { DEFAULT_SETTINGS, withDefaults, type Settings } from './settings';

export interface Store extends State {
  dispatch: (a: Action) => void;
  list: (id: string) => List | undefined;
  listsIn: (cat: string) => List[];
  setItems: (id: string, items: (string | null)[]) => void;
  replaceList: (list: List) => void;
  setSize: (id: string, n: number) => void;
  rename: (id: string, name: string) => void;
  togglePin: (id: string) => void;
  addCategory: (name: string) => Category;
  addList: (cat: string, name: string, n?: number) => List;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ storage, children }: { storage: StorageAdapter; children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, () => {
    // a synchronous adapter (the web's) loads before the first paint; an async one (native) loads after it
    const v = storage.load();
    return !(v instanceof Promise) && validState(v) ? v : seedState();
  });
  const loaded = useRef(false);

  useEffect(() => {
    const v = storage.load();
    if (v instanceof Promise) {
      v.then((s) => {
        if (validState(s)) dispatch({ type: 'load', state: s });
        loaded.current = true;
      });
    } else loaded.current = true;
  }, [storage]);

  useEffect(() => {
    if (loaded.current) void storage.save(state);
  }, [state, storage]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      dispatch,
      list: (id) => state.lists.find((L) => L.id === id),
      listsIn: (cat) => state.lists.filter((L) => L.cat === cat),
      setItems: (id, items) => dispatch({ type: 'setItems', id, items }),
      replaceList: (list) => dispatch({ type: 'replaceList', list }),
      setSize: (id, n) => dispatch({ type: 'setSize', id, n }),
      rename: (id, name) => dispatch({ type: 'rename', id, name }),
      togglePin: (id) => dispatch({ type: 'togglePin', id }),
      addCategory: (name) => {
        const c = newCategory(name);
        dispatch({ type: 'addCategory', category: c });
        return c;
      },
      addList: (cat, name, n) => {
        const L = newList(cat, name, n);
        dispatch({ type: 'addList', list: L });
        return L;
      },
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/* ---------------------------------------------------------------- settings */

export interface SettingsStorage {
  load(): unknown | Promise<unknown>;
  save(settings: Settings): void | Promise<void>;
}

interface SettingsCtx {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

const SetCtx = createContext<SettingsCtx | null>(null);

/** Settings save as you make them. The same provider on every platform; each passes its own storage. */
export function SettingsProvider({ storage, children }: { storage: SettingsStorage; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const v = storage.load();
    return v instanceof Promise ? DEFAULT_SETTINGS : withDefaults(v);
  });
  const ready = useRef(false);
  useEffect(() => {
    const v = storage.load();
    if (v instanceof Promise) {
      v.then((x) => {
        setSettings(withDefaults(x));
        ready.current = true;
      });
    } else ready.current = true;
  }, [storage]);
  useEffect(() => {
    if (ready.current) void storage.save(settings);
  }, [settings, storage]);
  const value = useMemo<SettingsCtx>(
    () => ({
      settings,
      set: (key, value) => setSettings((s) => ({ ...s, [key]: value })),
      reset: () => setSettings(DEFAULT_SETTINGS),
    }),
    [settings],
  );
  return <SetCtx.Provider value={value}>{children}</SetCtx.Provider>;
}

export function useSettings(): SettingsCtx {
  const s = useContext(SetCtx);
  if (!s) throw new Error('useSettings outside SettingsProvider');
  return s;
}
