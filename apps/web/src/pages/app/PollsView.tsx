import { useEffect, useState } from 'react';
import { PlusBox } from '../../brand/marks';
import { Button } from '../../components/Button';
import { useStore } from '../../data/store';
import { usePlayer } from './player';
import './safety.css';
import { BY_ID, CATALOG, POLLS, VOTE_SAYS, votePause, type List } from '@see/core';

interface Card {
  id: string;
  k: string;
  q: string;
  n: number;
  /** label and share of the vote (results show after you vote) */
  o: [string, number][];
  closed?: string;
  voted?: number;
}

function fromList(L: List, cat: string): Card {
  const opts = L.items.filter(Boolean).slice(0, 4) as string[];
  const shares = [38, 27, 21, 14];
  return {
    id: `list-${L.id}`,
    k: `From your list · ${cat}`,
    q: `${L.name}: what’s No. 1?`,
    n: 46,
    o: opts.map((x, i) => [BY_ID[x].k === 'album' ? BY_ID[x].t : BY_ID[x].t, shares[i] ?? 10]),
  };
}

/** Polls: the whole app turns violet. Results show after you vote. */
export function PollsView({ category, onNew }: { category: string; onNew: (name?: string) => void }) {
  const store = useStore();
  // from a category, its polls; from the tab, all of them
  const cats = category ? [category] : store.categories.map((c) => c.id);
  const nameOf = (id: string) => store.categories.find((c) => c.id === id)?.name ?? id;
  const cards: Card[] = cats.flatMap((cat) => [
    ...store.listsIn(cat).filter((L) => L.poll).map((L) => fromList(L, nameOf(cat))),
    ...POLLS.filter((p) => p.cat === cat).map((p) => ({ id: p.id, k: `Poll · ${nameOf(cat)}`, q: p.q, n: p.n, o: p.o, closed: p.closed, voted: p.voted })),
  ]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const player = usePlayer();
  // too many tries (O2): a fast run of votes pauses for a moment; the countdown is the whole instruction
  const [times, setTimes] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const wait = votePause(times, now);
  useEffect(() => {
    if (!wait) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [wait]);
  const vote = (id: string, i: number) => {
    const t = Date.now();
    if (votePause(times, t)) return;
    setTimes((ts) => [...ts.slice(-20), t]);
    setNow(t);
    setVotes((v) => ({ ...v, [id]: i }));
  };

  return (
    <div className="polls">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="t-label" style={{ color: 'var(--see-violet-text)' }}>
          {category ? `Polls in ${nameOf(category).toLowerCase()}` : 'All polls'}
        </h1>
        <button type="button" className="bb" onClick={() => onNew()} aria-label="New poll" style={{ width: 48, height: 40, marginRight: -10 }}>
          <PlusBox height={26} color="var(--see-violet)" />
        </button>
      </div>
      {cards.length === 0 && (
        <div className="ps-state">
          <h2 className="t-title" style={{ fontSize: 24 }}>
            No polls yet
          </h2>
          <p className="st-sub" style={{ fontSize: 14 }}>
            Any list can become a poll: open its menu and choose Make it a poll. People vote; your list stays yours.
          </p>
        </div>
      )}
      {wait > 0 && (
        <div className="ps-banner" role="status" style={{ margin: 0, ['--bar' as string]: 'var(--see-violet)' }}>
          {VOTE_SAYS(wait)}
        </div>
      )}
      <div className="home__grid2" style={{ alignItems: 'start' }}>
        {cards.map((p) => {
          // a closed poll still gives the ending: the result, your own vote, and the way to the winner
          const mine = p.closed ? p.voted : votes[p.id];
          const voted = mine !== undefined || !!p.closed;
          const winner = p.closed ? p.o.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
          const winnerId = winner ? CATALOG.find((x) => x.t === winner[0])?.id : undefined;
          return (
            <section key={p.id} className="poll-card" aria-label={p.q}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
                  {p.k}
                </span>
                <span className="t-foot">{(p.n + (voted && !p.closed ? 1 : 0)).toLocaleString('en')} voted</span>
              </div>
              {p.closed && <p className="st-sub" style={{ fontSize: 13 }}>This poll is closed. Here’s how it ended.</p>}
              <h2 className="poll-q">{p.q}</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {p.o.map(([label, share], i) => (
                  <button
                    key={label}
                    type="button"
                    className="poll-opt pb"
                    aria-pressed={mine === i}
                    disabled={!!p.closed || wait > 0}
                    style={wait > 0 && !p.closed ? { opacity: 0.45 } : undefined}
                    onClick={() => vote(p.id, i)}
                  >
                    <span className="poll-opt__bar" style={{ width: voted ? `${share}%` : 0 }} />
                    <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="poll-opt__box" aria-hidden="true" />
                      <span className="t-row-sm" style={{ fontSize: 14, color: mine === i ? 'var(--see-violet-text)' : 'var(--see-text)' }}>
                        {label}
                      </span>
                    </span>
                    {voted && (
                      <span className="t-rank" style={{ position: 'relative', fontSize: 13, color: 'var(--see-text-2)' }}>
                        {share}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {p.closed ? (
                <>
                  <span className="t-foot" style={{ whiteSpace: 'normal' }}>
                    Voting closed on {p.closed}.
                    {mine !== undefined ? ` You voted ${p.o[mine][0]}, with ${p.o[mine][1]}% of people.` : ''}
                  </span>
                  {winnerId && (
                    <Button size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => player.play(winnerId, { listId: null, view: 'sheet' })}>
                      See the winner
                    </Button>
                  )}
                </>
              ) : (
                <span className="t-foot">{voted ? 'Your vote is in. Change it any time.' : 'Results after you vote'}</span>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
