import { createContext, useContext } from 'react';
import type { SettingsPage } from './Settings';

/* Where you are on the phone: a tab, and a stack of pages over it. Android's back pops one. */
export type Tab = 'charts' | 'polls' | 'find' | 'you';
export type Route = { k: 'list'; id: string } | { k: 'cat'; id: string } | { k: 'settings'; page: SettingsPage } | { k: 'activity' } | { k: 'person'; h: string };

export interface Nav {
  push: (r: Route) => void;
  pop: () => void;
  tab: (t: Tab) => void;
  create: (name?: string, cat?: string) => void;
  say: (t: string) => void;
  signOut: () => void;
}

export const NavCtx = createContext<Nav | null>(null);
export function useNav(): Nav {
  const n = useContext(NavCtx);
  if (!n) throw new Error('useNav outside the shell');
  return n;
}
