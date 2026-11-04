import { Link } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { CategoryTag, PlusBox } from '../../brand/marks';
import { MCELL, tagOf } from '../../brand/type';
import { useStore } from '../../data/store';
import { KIND_PL, kindOf, type List } from '../../data/seed';
import { usePhone } from '../../lib/useMediaQuery';

export function listSub(L: List) {
  const k = kindOf(L);
  const n = L.items.filter(Boolean).length;
  const kind = k && k !== 'mixed' ? ` ${KIND_PL[k].toLowerCase()}` : '';
  const people = L.people.length ? ` · you and ${L.people.length} ${L.people.length === 1 ? 'other' : 'others'}` : '';
  return `Top ${L.n}${kind} · ${n} ranked${people}`;
}

/** Charts home: what you pinned, then your categories. */
export function Home({ onNewCategory }: { onNewCategory: () => void }) {
  const store = useStore();
  const phone = usePhone();
  const pinned = store.lists.filter((L) => L.pinned);

  return (
    <div className="home">
      {pinned.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: phone ? 10 : 30 }}>
          <h2 className={phone ? 'visually-hidden' : 't-label'}>Pinned</h2>
          <div className="home__grid2" style={phone ? { gap: 10 } : undefined}>
            {pinned.map((L) => {
              const catName = store.categories.find((c) => c.id === L.cat)?.name ?? L.cat;
              const T = tagOf(catName);
              return (
                <Link key={L.id} to={`/app/l/${L.id}`} className="pin-card" aria-label={`Open ${L.name}`}>
                  <span className="pin-card__top">
                    <CategoryTag name={catName} height={T.h * MCELL} decorative />
                    {phone && <Icon name="pin" size={16} color="var(--see-text-2)" />}
                  </span>
                  <span className="t-title">{L.name}</span>
                  <span className="t-meta" style={{ color: 'var(--see-text-2)' }}>
                    {listSub(L)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: phone ? 4 : 30, paddingTop: phone ? 14 : 0 }}>
        <div className="home__head" style={phone ? { paddingTop: 0, paddingBottom: 4 } : undefined}>
          <h2 className="t-label">Your categories</h2>
          <button type="button" className="bb" onClick={onNewCategory} aria-label="New category" style={{ width: 48, height: 40, marginRight: -10 }}>
            <PlusBox height={phone ? 24 : 26} />
          </button>
        </div>
        <div className={phone ? undefined : 'home__grid3'}>
          {store.categories.map((c) => {
            const n = store.listsIn(c.id).length;
            const sub = n ? `${n} ${n === 1 ? 'list' : 'lists'}` : 'Empty';
            const T = tagOf(c.name);
            const to = `/app/c/${encodeURIComponent(c.id)}`;
            return phone ? (
              <Link key={c.id} to={to} className="cat-row rowbtn" aria-label={`Open ${c.name.toLowerCase()}`}>
                <CategoryTag name={c.name} height={T.h * MCELL * 1.25} decorative style={{ maxWidth: 250 }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className="t-meta" style={{ color: 'var(--see-text)' }}>
                    {sub}
                  </span>
                  <Icon name="chev" size={16} color="var(--see-text-4)" />
                </span>
              </Link>
            ) : (
              <Link key={c.id} to={to} className="cat-card" aria-label={`Open ${c.name.toLowerCase()}`}>
                <CategoryTag name={c.name} height={T.h * MCELL * 1.25} decorative style={{ maxWidth: '100%' }} />
                <span className="t-meta" style={{ color: 'var(--see-text)' }}>
                  {sub}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
