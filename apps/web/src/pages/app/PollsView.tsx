import { useState } from 'react';
import { PlusBox } from '../../brand/marks';
import { useStore } from '../../data/store';
import { BY_ID, POLLS, type List } from '@see/core';

interface Card {
  id: string;
  k: string;
  q: string;
  n: number;
  /** label and share of the vote (results show after you vote) */
  o: [string, number][];
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
  const cat = category || store.categories[0]?.id || 'MUSIC';
  const catName = store.categories.find((c) => c.id === cat)?.name ?? cat;
  const cards: Card[] = [
    ...store.listsIn(cat).filter((L) => L.poll).map((L) => fromList(L, catName)),
    ...POLLS.filter((p) => p.cat === cat).map((p) => ({ id: p.id, k: `Poll · ${catName}`, q: p.q, n: p.n, o: p.o })),
  ];
  const [votes, setVotes] = useState<Record<string, number>>({});

  return (
    <div className="polls">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="t-label" style={{ color: 'var(--see-violet-text)' }}>
          Polls in {catName.toLowerCase()}
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
      <div className="home__grid2" style={{ alignItems: 'start' }}>
        {cards.map((p) => {
          const mine = votes[p.id];
          const voted = mine !== undefined;
          return (
            <section key={p.id} className="poll-card" aria-label={p.q}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
                  {p.k}
                </span>
                <span className="t-foot">{(p.n + (voted ? 1 : 0)).toLocaleString('en')} voted</span>
              </div>
              <h2 className="poll-q">{p.q}</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {p.o.map(([label, share], i) => (
                  <button
                    key={label}
                    type="button"
                    className="poll-opt pb"
                    aria-pressed={mine === i}
                    onClick={() => setVotes((v) => ({ ...v, [p.id]: i }))}
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
              <span className="t-foot">{voted ? 'Your vote is in. Change it any time.' : 'Results after you vote'}</span>
            </section>
          );
        })}
      </div>
    </div>
  );
}
