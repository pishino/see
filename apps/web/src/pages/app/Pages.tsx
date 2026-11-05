import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BY_ID, PEOPLE, personOf, makerOf, makerPage, pad2, panelChart, panelLocked, seedPanel, slotsOf, theirList, titleOf, type List } from '@see/core';
import { useSettings } from '@see/core/react';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { CategoryTag } from '../../brand/marks';
import { Button } from '../../components/Button';
import { PlusCta } from '../../components/controls';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { Dialog } from './PersonView';
import { MakerLink, PersonLink } from './PersonLink';
import { usePlayer } from './player';
import './you.css';

/** A page that opens over where you were (wide screens): from the right, 460 wide; Close goes back. */
export function OverDrawer({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('.dlg') && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={label} className="drawer" style={{ width: 460 }}>
        <div className="drawer__head">
          <span className="t-label">{label}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="close" size={20} color="var(--see-text)" />
          </button>
        </div>
        <div className="drawer__body" style={{ paddingTop: 8 }}>
          {children}
        </div>
      </div>
    </>
  );
}

/** An artist's or a director's page (V3Objects): Follow, where they sit on your lists, what they made, who they're ranked next to. */
export function MakerPage({ name, inDrawer = false }: { name: string; inDrawer?: boolean }) {
  const store = useStore();
  const { settings, set } = useSettings();
  const player = usePlayer();
  const p = makerPage(name, store.lists);
  if (!p) return inDrawer ? <p className="dlg-p">See doesn’t have a page for {name} yet.</p> : <Navigate to="/app" replace />;
  const key = `m:${name}`;
  const following = settings.following.includes(key);
  return (
    <div className={inDrawer ? 'yp yp--over' : 'yp'}>
      <span className="t-label">{p.role}</span>
      <h1 className="t-hero" style={{ fontSize: inDrawer ? 30 : 40 }}>
        {p.name}
      </h1>
      <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <PlusCta label={following ? 'Following' : 'Follow'} done={following} onClick={() => set('following', following ? settings.following.filter((x) => x !== key) : [...settings.following, key])} />
        <span className="t-meta">
          {p.yours.length} in your lists · {p.made.reduce((n, g) => n + g.items.length, 0)} in See
        </span>
      </span>
      {p.yours.length > 0 && (
        <section className="yp-cat" aria-label="In your lists">
          <span className="t-label">In your lists</span>
          {p.yours.map((y) => (
            <Link key={`${y.listId}-${y.x.id}`} to={`/app/l/${y.listId}`} className="yp-person" style={{ color: 'inherit', textDecoration: 'none' }}>
              <b className="t-rank" style={{ color: y.rank === 1 ? 'var(--see-accent-text)' : undefined, width: 54 }}>
                No. {y.rank}
              </b>
              <span className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                {y.x.t}
              </span>
              <span className="t-meta">{y.list}</span>
            </Link>
          ))}
        </section>
      )}
      {p.made.map((g) => (
        <section key={g.kind} className="yp-cat" aria-label={g.kind}>
          <span className="t-label">{g.kind}s</span>
          {g.items.map((x) => (
            <button key={x.id} type="button" className="yp-person" onClick={() => player.play(x.id, { listId: null, view: 'sheet' })} style={{ border: 0, borderBottom: '1px solid var(--see-surface-1)', background: 'transparent', color: 'inherit', textAlign: 'left' }}>
              <span className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                {x.t}
              </span>
              <span className="t-meta">
                {g.kind}
                {x.y ? ` · ${x.y}` : ''}
              </span>
            </button>
          ))}
        </section>
      ))}
      {p.related.length > 0 && (
        <section className="yp-cat" aria-label="Related in See">
          <span className="t-label">Related in See</span>
          <div className="yp-chips">
            {p.related.map((m) => (
              <MakerLink key={m} name={m} className="yp-chip name-link" />
            ))}
          </div>
        </section>
      )}
      <section className="yp-cat" aria-label="About">
        <span className="t-label">About</span>
        <p className="dlg-p">{p.about}</p>
        <span style={{ display: 'flex', gap: 14 }}>
          <a className="name-link" href={`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer">
            Wikipedia
          </a>
          <a className="name-link" href={`https://www.google.com/search?q=${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer">
            Google
          </a>
        </span>
      </section>
    </div>
  );
}

export function MakerView() {
  const { name = '' } = useParams();
  return <MakerPage name={decodeURIComponent(name)} />;
}

/** The people on a list (V3GroupWeb): anyone on it can rank, reorder and take things off it. */
export function PeopleSheet({ L, onClose }: { L: List; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const known = Object.keys(PEOPLE).filter((h) => !L.people.includes(h) && h.includes(q.replace(/^@/, '').toLowerCase()));
  const put = (people: string[], said: string) => {
    store.replaceList({ ...L, people });
    toast(said);
  };
  return (
    <Dialog label={`People on ${L.name}`} onClose={onClose}>
      <span className="t-label">People · {L.name}</span>
      <h2 className="t-hero dlg-h">Rank it together</h2>
      <p className="dlg-p">People on a list can rank, reorder and take things off it. Moves are the list’s, not one person’s.</p>
      <div className="yp-person" style={{ borderBottom: '1px solid var(--see-surface-2)' }}>
        <span className="t-row-sm">You</span>
        <span className="t-meta">made it</span>
      </div>
      {L.people.map((h) => (
        <div key={h} className="yp-person" style={{ borderBottom: '1px solid var(--see-surface-2)' }}>
          <Avatar handle={h} size={26} ring={false} />
          <PersonLink handle={h} className="t-row-sm name-link" style={{ color: 'inherit' }} onClick={onClose}>
            @{h}
          </PersonLink>
          <span className="t-meta" style={{ flex: 1 }}>
            {PEOPLE[h]}
          </span>
          <Button size="sm" variant="quiet" onClick={() => put(L.people.filter((x) => x !== h), `@${h} is off ${L.name}`)}>
            Take off
          </Button>
        </div>
      ))}
      <input className="st-input" placeholder="Put someone on: @handle" aria-label="Put someone on" value={q} onChange={(e) => setQ(e.target.value.slice(0, 24))} />
      {q && (
        <div className="yp-chips">
          {known.slice(0, 6).map((h) => (
            <button key={h} type="button" className="yp-chip" onClick={() => (put([...L.people, h], `@${h} is on ${L.name}: they can rank it with you`), setQ(''))}>
              @{h} <span>{PEOPLE[h]}</span>
            </button>
          ))}
          {known.length === 0 && <span className="t-meta">Nobody by that name yet.</span>}
        </div>
      )}
      <div className="dlg-acts">
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}

/** Someone else's list, as it is (V3ListsLive): read-only, their order so far, then the next open place. */
export function TheirListView() {
  const { handle = '', name = '' } = useParams();
  const store = useStore();
  const { settings, set } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const n = decodeURIComponent(name);
  const cat = (PEOPLE[handle] && personCat(handle, n)) || 'MUSIC';
  const L = theirList(handle, n, cat);
  const slots = slotsOf(L);
  const filled = slots.filter(Boolean).length;
  const key = `${handle}/${n}`;
  const saved = (settings.savedLists ?? []).includes(key);
  return (
    <div className="yp">
      <CategoryTag name={cat} height={16} />
      <h1 className="t-hero" style={{ fontSize: 40 }}>
        {n}
      </h1>
      <span className="t-meta">
        <PersonLink handle={handle} className="name-link" style={{ color: 'inherit' }}>
          @{handle}
        </PersonLink>
        ’s list · {filled} of {L.n} · they’re still on it
      </span>
      <div>
        {slots.slice(0, filled + 1).map((xid, i) => (
          <div key={i} className="yp-person">
            <b className="t-rank" style={{ width: 30, color: i === 0 ? 'var(--see-accent-text)' : undefined }}>
              {pad2(i + 1)}
            </b>
            {xid ? (
              <>
                <span className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                  {titleOf(xid)}
                </span>
                <span className="t-meta">{makerOf(BY_ID[xid])}</span>
              </>
            ) : (
              <span className="t-meta">No. {i + 1} is next</span>
            )}
          </div>
        ))}
      </div>
      <span style={{ display: 'flex', gap: 8 }}>
        <Button
          size="sm"
          variant={saved ? 'quiet' : 'primary'}
          onClick={() => {
            set('savedLists', saved ? (settings.savedLists ?? []).filter((x) => x !== key) : [...(settings.savedLists ?? []), key]);
            toast(saved ? 'Not saved any more' : `Saved: it keeps up as @${handle} ranks`);
          }}
        >
          {saved ? 'Saved' : 'Save it'}
        </Button>
        <Button
          size="sm"
          variant="quiet"
          onClick={() => {
            if (!store.categories.some((c) => c.id === cat)) store.addCategory(cat);
            const mine = store.addList(cat, n, L.n);
            toast(`${n} is yours to rank`);
            navigate(`/app/l/${mine.id}`);
          }}
        >
          Make your own
        </Button>
      </span>
      <span className="t-meta" style={{ whiteSpace: 'normal' }}>
        Read-only. Save it to keep up as they rank; Make your own starts yours with the same name.
      </span>
    </div>
  );
}

/** Which of their categories a list of theirs is in, from their page. */
const personCat = (handle: string, name: string) => personOf(handle)?.lists.find(([, names]) => names.includes(name))?.[0];

/** A panel (V3GroupWeb): everyone locks a ballot, and the chart is only ever the sum. */
export function PanelView() {
  const toast = useToast();
  const [p, setP] = useState(seedPanel);
  const [mine, setMine] = useState<string[]>([]);
  const chart = panelChart(p);
  const locked = !!p.ballots.you;
  const pool = [...new Set(Object.values(p.ballots).flat())].filter((id) => !mine.includes(id));
  return (
    <div className="yp" style={{ maxWidth: 1100 }}>
      <span className="t-label">Panel · {p.members.length} members · locks {p.deadline}</span>
      <h1 className="t-hero" style={{ fontSize: 40 }}>
        {p.name}
      </h1>
      <p className="dlg-p">A set of judges whose ballots add up to one chart. Each member’s locked ballot gives No. 1 ten points and No. 10 one; the chart is the sum, highest first. Nobody edits anyone else’s ballot.</p>
      <div className="yp-grid">
        <section className="yp-col" aria-label={p.list}>
          <span className="t-label">
            {p.list} · combined from {Object.keys(p.ballots).length} locked ballots
          </span>
          {chart.map((r, i) => (
            <div key={r.id} className="yp-person">
              <b className="t-rank" style={{ width: 30, color: i === 0 ? 'var(--see-accent-text)' : undefined }}>
                {pad2(i + 1)}
              </b>
              <span className="t-move" style={{ width: 38, color: r.move.startsWith('▲') ? 'var(--see-up)' : r.move.startsWith('▼') ? 'var(--see-flare-soft)' : 'var(--see-text-3)' }}>
                {r.move}
              </span>
              <span className="t-row-sm" style={{ textTransform: 'uppercase', flex: 1 }}>
                {titleOf(r.id)}
              </span>
              <span className="t-meta">{r.points} pts</span>
            </div>
          ))}
          <span className="t-meta">{panelLocked(p) ? 'Locked: every member has locked.' : `Open until ${p.deadline}, or when every member has locked.`}</span>
        </section>
        <section className="yp-col" aria-label="Ballots">
          <span className="t-label">Ballots</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.members.length}, minmax(0, 1fr))`, gap: 4 }}>
            {p.members.map((m) => (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                {m === 'you' ? <span className="t-label">You</span> : <Avatar handle={m} size={22} ring={false} />}
                {chart.map((r) => {
                  const at = (p.ballots[m] ?? []).indexOf(r.id);
                  return <i key={r.id} title={at >= 0 ? `No. ${at + 1} for ${m}` : undefined} style={{ width: '100%', height: 14, background: at === 0 ? 'var(--see-flare)' : at >= 0 && at < 3 ? 'var(--see-surface-2)' : at >= 0 ? 'var(--see-surface-1)' : 'transparent', boxShadow: at >= 0 && at < 3 ? 'inset 0 -2px 0 var(--see-text-3)' : undefined }} />;
                })}
              </div>
            ))}
          </div>
          <span className="t-meta" style={{ whiteSpace: 'normal' }}>
            A flare cell is that member’s No. 1; a raised cell is their top three.
          </span>
          {!locked ? (
            <>
              <span className="t-label" style={{ paddingTop: 10 }}>
                Your ballot · {mine.length} of {p.n}
              </span>
              <div className="yp-chips">
                {mine.map((id, i) => (
                  <button key={id} type="button" className="yp-chip" onClick={() => setMine(mine.filter((x) => x !== id))} aria-label={`No. ${i + 1}: ${titleOf(id)}. Take it back`}>
                    {pad2(i + 1)} {titleOf(id)}
                  </button>
                ))}
              </div>
              <div className="yp-chips">
                {pool.slice(0, 14).map((id) => (
                  <button key={id} type="button" className="yp-chip" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--see-rule)' }} onClick={() => mine.length < p.n && setMine([...mine, id])}>
                    {titleOf(id)}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                disabled={mine.length < 3}
                style={{ alignSelf: 'flex-start' }}
                onClick={() => {
                  setP({ ...p, ballots: { ...p.ballots, you: mine } });
                  toast('Your ballot is locked. The chart is the sum.');
                }}
              >
                Lock my ballot
              </Button>
            </>
          ) : (
            <span className="t-meta">Your ballot is locked.</span>
          )}
        </section>
      </div>
      <span className="t-meta">Members make lists and polls in the panel’s name. Followers see everything, rank their own copy and vote in panel polls.</span>
      <Link to="/app/you" className="name-link" style={{ alignSelf: 'flex-start' }}>
        Back to You
      </Link>
    </div>
  );
}
