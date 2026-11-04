import { Link, Navigate, useParams } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { PlusBox } from '../../brand/marks';
import { PlusField } from '../../brand/PlusField';
import { useStore } from '../../data/store';
import { BY_ID, KIND_PL, PERIODS, kindOf, pad2 } from '@see/core';
import { usePhone } from '../../lib/useMediaQuery';
import { Avatars } from './ListView';

/** A category: its lists as cards, each with its top three. */
export function CategoryView({ onNewList }: { onNewList: () => void }) {
  const { cat = '' } = useParams();
  const store = useStore();
  const phone = usePhone();
  const c = store.categories.find((x) => x.id === decodeURIComponent(cat));
  if (!c) return <Navigate to="/app" replace />;
  const lists = store.listsIn(c.id);
  const name = c.name.charAt(0) + c.name.slice(1).toLowerCase();

  return (
    <>
      <div className="hdr cat-hdr">
        <PlusField cell={phone ? 6 : 8} plusPx={phone ? 44 : 64} />
        <div className="hdr__shade" />
        <div className="hdr__in">
          <span className="t-label" style={{ color: 'var(--see-text)' }}>
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </span>
          <button type="button" className="bb" onClick={onNewList} aria-label="New list in this category" style={{ width: 48, height: 40 }}>
            <PlusBox height={phone ? 24 : 26} />
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div style={{ padding: '24px var(--gutter) 60px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <h2 className="t-hero" style={{ fontSize: 48 }}>
            No lists yet
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--see-text-3)', maxWidth: 460 }}>
            {name} is ready. Make its first list: name it, pick a size, choose its time frame.
          </p>
          <button type="button" className="bb" onClick={onNewList} aria-label="New list">
            <PlusBox height={40} />
          </button>
        </div>
      ) : (
        <div className="cat-cards">
          {lists.map((L, i) => {
            const k = kindOf(L);
            const top = L.items
              .map((x, ix) => ({ x, ix }))
              .filter((e) => e.x)
              .slice(0, 3);
            return (
              <Link key={L.id} to={`/app/l/${L.id}`} className="list-card" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }} aria-label={`Open ${L.name}`}>
                <span className="list-card__row" style={{ alignItems: 'flex-start' }}>
                  <span className="t-title" style={{ fontSize: 22 }}>
                    {L.name}
                  </span>
                  {L.pinned && <Icon name="pin" size={16} color="var(--see-text-2)" />}
                </span>
                <span className="list-card__row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-meta">
                      Top {L.n}
                      {k && k !== 'mixed' ? ` · ${KIND_PL[k].toLowerCase()}` : ''} · {PERIODS[L.per].toLowerCase()}
                    </span>
                    {L.poll && <span className="poll-chip">Poll</span>}
                  </span>
                  <Avatars handles={L.people} size={20} />
                </span>
                {top.length > 0 ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {top.map(({ x, ix }) => {
                      const it = BY_ID[x!];
                      return (
                        <span key={x} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span className="t-rank" style={{ width: 22, fontSize: 12.5, color: ix === 0 ? 'var(--see-accent-text)' : 'var(--see-text-4)' }}>
                            {pad2(ix + 1)}
                          </span>
                          <span className="t-row-sm">{it.t}</span>
                          <span className="t-foot">{it.k === 'artist' ? '' : it.m}</span>
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span className="t-foot">Empty. Open it to find No. 1.</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
