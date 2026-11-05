import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BY_ID, type Entry } from './seed';
import { durationOf, nextInList } from './details';
import { useSettings, useStore } from './react';

/*
 * The player's state, shared by the web and the phones (V3Player, decided): one thing plays at a time. It opens as the sheet (rank first, then the details)
 * or minimised (a card bottom right on wide screens, a bar above the tabs on phones) and keeps playing either way.
 * See never hosts media: a preview plays from its source; this build runs the clock without the source's stream.
 */

export type PlayerView = 'sheet' | 'mini';

interface PlayerState {
  xid: string | null;
  listId: string | null;
  view: PlayerView;
  playing: boolean;
  t: number;
}

export interface Player extends PlayerState {
  entry: Entry | null;
  duration: number;
  /** Open an entry: in the sheet, or straight into the mini player. Starts playing. */
  play: (xid: string, opts?: { listId?: string | null; view?: PlayerView; autoplay?: boolean }) => void;
  toggle: () => void;
  seek: (t: number) => void;
  view: PlayerView;
  setView: (v: PlayerView) => void;
  close: () => void;
}

const Ctx = createContext<Player | null>(null);
const IDLE: PlayerState = { xid: null, listId: null, view: 'mini', playing: false, t: 0 };

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<PlayerState>(IDLE);
  const store = useStore();
  const { settings } = useSettings();
  const entry = s.xid ? BY_ID[s.xid] ?? null : null;
  const duration = entry ? durationOf(entry) : 0;
  const latest = useRef({ store, settings, s, duration });
  latest.current = { store, settings, s, duration };

  // the clock: a quarter second at a time while playing; at the end, the next in the list if autoplay is on
  useEffect(() => {
    if (!s.playing || !s.xid) return;
    const iv = setInterval(() => {
      const { s: cur, duration: d, store: st, settings: set } = latest.current;
      if (cur.t + 0.25 < d) {
        setS((x) => ({ ...x, t: x.t + 0.25 }));
        return;
      }
      const next = set.autoplay && cur.listId ? nextInList(st.list(cur.listId), cur.xid!) : null;
      setS((x) => (next ? { ...x, xid: next, t: 0 } : { ...x, t: d, playing: false }));
    }, 250);
    return () => clearInterval(iv);
  }, [s.playing, s.xid]);

  const play = useCallback<Player['play']>((xid, opts = {}) => {
    setS((x) => ({
      xid,
      listId: opts.listId === undefined ? (x.xid === xid ? x.listId : null) : opts.listId,
      view: opts.view ?? 'sheet',
      // removed at its source, or your own with no source yet: the details still open, but nothing plays
      playing: BY_ID[xid]?.gone || BY_ID[xid]?.own ? false : (opts.autoplay ?? true),
      t: x.xid === xid ? x.t : 0,
    }));
  }, []);

  const value = useMemo<Player>(
    () => ({
      ...s,
      entry,
      duration,
      play,
      toggle: () => setS((x) => (BY_ID[x.xid!]?.gone || BY_ID[x.xid!]?.own ? x : x.t >= durationOf(BY_ID[x.xid!]) ? { ...x, t: 0, playing: true } : { ...x, playing: !x.playing })),
      seek: (t) => setS((x) => ({ ...x, t: Math.max(0, Math.min(duration, t)) })),
      setView: (view) => setS((x) => ({ ...x, view })),
      close: () => setS(IDLE),
    }),
    [s, entry, duration, play],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): Player {
  const p = useContext(Ctx);
  if (!p) throw new Error('usePlayer outside PlayerProvider');
  return p;
}
