import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { SEED_ACTIVITY, type ActivityItem } from '@see/core';

/*
 * What any screen in the app can open: Create, and Activity (a panel from the right on wide screens, its own page
 * on phones). Activity's unread count clears when you open it.
 */
const SEEN_KEY = 'see.activity.seen';

interface Ui {
  openCreate: () => void;
  openActivity: () => void;
  activity: ActivityItem[];
  unread: number;
  markSeen: () => void;
}

const Ctx = createContext<Ui | null>(null);

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function UiProvider({ onCreate, onActivity, children }: { onCreate: () => void; onActivity: () => void; children: ReactNode }) {
  const [seen, setSeen] = useState(readSeen);
  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* this visit only */
    }
  }, []);
  const value = useMemo<Ui>(() => {
    const activity = seen ? SEED_ACTIVITY.map((a) => ({ ...a, unread: false })) : SEED_ACTIVITY;
    return { openCreate: onCreate, openActivity: onActivity, activity, unread: activity.filter((a) => a.unread).length, markSeen };
  }, [seen, onCreate, onActivity, markSeen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): Ui {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUi outside UiProvider');
  return u;
}
