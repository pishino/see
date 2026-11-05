import { useEffect, useRef, useState } from 'react';
import { titleOf, validState, type List, type State } from '@see/core';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LISTS_KEY, lastLocal, retrySave, sync, useStore } from '../../data/store';
import { usePending } from '../../data/pending';
import { Dialog } from './PersonView';

/*
 * Many hands, one list (V3ProblemStates 7, Sync), between the windows of this browser until there is a server:
 * another window's change arrives here at once. If both changed the same list within a few seconds, only the rows
 * that clash are shown side by side, with two plain choices; nobody's move is silently thrown away.
 */
const RESOLVED = 'see.lists.resolved';
const CLASH_MS = 8000;

export function TabSync() {
  const store = useStore();
  const toast = useToast();
  const latest = useRef(store);
  latest.current = store;
  const [clash, setClash] = useState<{ mine: List; theirs: List; incoming: State } | null>(null);
  const { saveFailed } = usePending();

  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== LISTS_KEY || !e.newValue) return;
      let v: unknown;
      try {
        v = JSON.parse(e.newValue);
      } catch {
        return;
      }
      if (!validState(v)) return;
      const cur = latest.current;
      if (JSON.stringify({ l: v.lists, c: v.categories }) === JSON.stringify({ l: cur.lists, c: cur.categories })) return;
      const now = Date.now();
      let resolved: { id: string; at: number } | null = null;
      try {
        resolved = JSON.parse(localStorage.getItem(RESOLVED) ?? 'null');
      } catch {
        /* nothing settled */
      }
      const hit = v.lists.find((T) => {
        const M = cur.lists.find((x) => x.id === T.id);
        return M && JSON.stringify(M.items) !== JSON.stringify(T.items) && now - (lastLocal.get(T.id) ?? 0) < CLASH_MS;
      });
      if (hit && !(resolved && resolved.id === hit.id && now - resolved.at < 3000)) {
        setClash({ mine: cur.lists.find((x) => x.id === hit.id)!, theirs: hit, incoming: v });
        return;
      }
      if (hit) toast(`The other window settled ${hit.name}`);
      sync.incoming = true;
      cur.dispatch({ type: 'load', state: v });
    };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, [toast]);

  const settle = (keepMine: boolean) => {
    if (!clash) return;
    const { mine, theirs, incoming } = clash;
    try {
      localStorage.setItem(RESOLVED, JSON.stringify({ id: mine.id, at: Date.now() }));
    } catch {
      /* the other window will ask too */
    }
    lastLocal.delete(mine.id);
    store.dispatch({ type: 'load', state: { ...incoming, lists: incoming.lists.map((L) => (L.id === mine.id ? (keepMine ? mine : theirs) : L)) } });
    toast(keepMine ? 'Kept your order. The other window shows it now.' : 'Using the other window’s order.');
    setClash(null);
  };

  const rows = clash
    ? clash.mine.items
        .map((x, i) => [i, x, clash.theirs.items[i]] as const)
        .filter(([, a, b]) => a !== b)
        .slice(0, 6)
    : [];

  return (
    <>
      {saveFailed && (
        <div className="ps-banner" role="status" style={{ ['--bar' as string]: 'var(--see-flare-soft)', position: 'fixed', left: '50%', bottom: 24, translate: '-50% 0', zIndex: 80, maxWidth: 'calc(100% - 32px)' }}>
          <span>Couldn’t save that move yet. It keeps its place, and saving tries again on its own.</span>
          <Button size="sm" variant="quiet" onClick={() => (retrySave() ? toast('Saved') : toast('Still couldn’t save. Trying again on its own.'))}>
            Retry now
          </Button>
        </div>
      )}
      {clash && (
        <Dialog label="This list changed in another window" onClose={() => settle(true)}>
          <span className="t-label">{clash.mine.name}</span>
          <h2 className="t-hero dlg-h">You and another window moved the same rows at once</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: '6px 12px', fontSize: 13.5 }}>
            <span />
            <b className="t-label">Yours</b>
            <b className="t-label">The other window’s</b>
            {rows.map(([i, a, b]) => (
              <Row key={i} n={i + 1} a={titleOf(a)} b={titleOf(b)} />
            ))}
          </div>
          <p className="dlg-p t-meta" style={{ whiteSpace: 'normal' }}>
            Whichever you pick, the other window shows it with a note.
          </p>
          <div className="dlg-acts">
            <Button variant="quiet" size="sm" onClick={() => settle(false)}>
              Use the other
            </Button>
            <Button size="sm" onClick={() => settle(true)}>
              Keep mine
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

function Row({ n, a, b }: { n: number; a: string; b: string }) {
  return (
    <>
      <span className="t-rank" style={{ color: 'var(--see-text-3)' }}>
        {String(n).padStart(2, '0')}
      </span>
      <span style={{ fontWeight: 600 }}>{a || '—'}</span>
      <span style={{ fontWeight: 600, color: 'var(--see-text-2)' }}>{b || '—'}</span>
    </>
  );
}
