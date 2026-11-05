import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../../brand/Icon';
import { CategoryTag, Lockup, PlusBox } from '../../brand/marks';
import { ProfilePicture } from '../../brand/ProfilePicture';
import { tagOf } from '@see/brand';
import { useStore } from '../../data/store';
import type { Shell } from '@see/tokens';
import { useUi } from './ui';

const KEY = 'see.side.open';

/** Your choice, if you made one with the tab or "[": 'open' or 'fold'. */
function readChoice(): 'open' | 'fold' | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'open' || v === 'fold' ? v : null;
  } catch {
    return null;
  }
}

/**
 * The side bar (C): it folds, it does not jump. From 1280 it starts open (288); from 840 to 1279 it starts as the
 * 84 px rail: the + box, the three icons and the categories standing on end. Folded, it peeks open over the page
 * when the pointer comes near. The tab on its edge (or "[") opens or folds it, and See remembers.
 */
export function SideBar({ category, onCreate, shell }: { category: string; onCreate: () => void; shell: Shell }) {
  const store = useStore();
  const navigate = useNavigate();
  const loc = useLocation();
  const [choice, setChoice] = useState(readChoice);
  // C, chosen: folded by default at every width; the pin (or "[") keeps it open
  const pinned = choice === 'open';
  void shell;
  const [peek, setPeek] = useState(false);
  const [youOpen, setYouOpen] = useState(false);
  const peekT = useRef(0);
  const mode = pinned ? 'open' : peek ? 'peek' : 'rail';
  const listId = useMatch('/app/l/:id')?.params.id;
  const ui = useUi();
  // with many categories the folded tags scroll; the column fades, and +N says how many are below
  const cats = useRef<HTMLDivElement>(null);
  const [below, setBelow] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const measure = () => {
    const el = cats.current;
    if (!el) return;
    const bottom = el.getBoundingClientRect().bottom;
    setBelow([...el.querySelectorAll('.side-vtag')].filter((t) => t.getBoundingClientRect().top > bottom - 8).length);
    setScrolled(el.scrollTop > 4);
  };
  useEffect(() => {
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (cats.current && ro) ro.observe(cats.current);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.categories.length, mode]);

  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const toggle = () => {
    const next = pinnedRef.current ? 'fold' : 'open';
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* the choice lasts this visit only */
    }
    setPeek(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === '[' && !/INPUT|TEXTAREA/.test(t?.tagName ?? '') && !t?.isContentEditable) toggle();
      if (e.key === 'Escape') setYouOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setYouOpen(false), [loc.pathname]);

  const nav: [string, string, IconName, boolean][] = [
    ['/app', 'Charts', 'eq', loc.pathname === '/app' || loc.pathname.startsWith('/app/l/') || loc.pathname.startsWith('/app/c/')],
    ['/app/polls', 'Polls', 'poll', loc.pathname.startsWith('/app/polls')],
    ['/app/find', 'Find', 'search', loc.pathname.startsWith('/app/find')],
  ];
  const catName = store.categories.find((c) => c.id === category)?.name ?? '';

  return (
    <aside
      id="side-nav"
      className="side"
      data-mode={mode}
      aria-label="Side bar"
      onPointerMove={(e) => {
        // rest on the bar for a beat and it opens over the page; moving (or scrolling) never opens it
        if (pinned || peek || e.pointerType === 'touch') return;
        window.clearTimeout(peekT.current);
        peekT.current = window.setTimeout(() => setPeek(true), 450);
      }}
      onPointerLeave={() => {
        window.clearTimeout(peekT.current);
        setPeek(false);
      }}
    >
      <button
        type="button"
        className="side-tab"
        onClick={toggle}
        aria-expanded={pinned}
        aria-controls="side-nav"
        aria-keyshortcuts="["
        aria-label={pinned ? 'Let the side bar fold' : 'Keep the side bar open'}
        title={`${pinned ? 'Let the side bar fold' : 'Keep the side bar open'} ( [ )`}
      >
        <Icon name="chev" size={14} />
      </button>

      <div className="side-mast">
        <div className="side-railbox rl-show">
          <Link to="/app" className="bb" aria-label="See: charts" style={{ padding: '6px 0' }}>
            <PlusBox height={30} />
          </Link>
        </div>
        <Link to="/app" className="rl-hide" aria-label={catName ? 'see: back to everything' : 'see+: home'}>
          <Lockup category={catName} inline />
        </Link>
      </div>

      <nav aria-label="Main" className="side-nav">
        {nav.map(([to, label, icon, cur]) => (
          <Link key={to} to={to} className="side-link pb" aria-current={cur ? 'page' : undefined} aria-label={label} title={label}>
            <Icon name={icon} size={22} color={cur ? 'var(--see-text)' : 'var(--see-text-3)'} />
            <span className="lbl rl-hide">{label}</span>
          </Link>
        ))}
      </nav>

      <div
        className="side-cats no-scrollbar"
        ref={cats}
        onScroll={measure}
        data-faded-top={scrolled || undefined}
        data-faded-bottom={below > 0 || undefined}
      >
        <div className="side-cats__head rl-hide">
          <span className="t-label">Categories</span>
          <button type="button" className="bb fadeh" onClick={onCreate} aria-label="New category" style={{ opacity: 0.5, width: 44, height: 32 }}>
            <PlusBox height={22} />
          </button>
        </div>

        {/* folded: the categories stand on end */}
        <div className="rl-show" role="group" aria-label="Categories" style={{ flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {store.categories.map((c) => {
            const T = tagOf(c.name);
            const thick = 22;
            return (
              <Link key={c.id} to={`/app/c/${encodeURIComponent(c.id)}`} className="side-vtag" aria-label={`Open ${c.name.toLowerCase()}`} aria-current={c.id === category ? 'true' : undefined} title={c.name}>
                <span style={{ width: thick, height: (T.w * thick) / T.h }}>
                  <CategoryTag name={c.name} height={thick} decorative />
                </span>
              </Link>
            );
          })}
          <button type="button" className="side-vtag" onClick={onCreate} aria-label="New category">
            <PlusBox height={22} />
          </button>
          {below > 0 && mode === 'rail' && (
            <button
              type="button"
              className="side-more"
              onClick={() => cats.current?.scrollBy({ top: cats.current.clientHeight * 0.8, behavior: 'smooth' })}
              aria-label={`${below} more ${below === 1 ? 'category' : 'categories'} below`}
            >
              +{below}
            </button>
          )}
        </div>

        {store.categories.map((c) => {
          const on = c.id === category;
          const lists = store.listsIn(c.id);
          return (
            <div key={c.id} className="rl-hide" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="side-cat">
                <Link
                  to={`/app/c/${encodeURIComponent(c.id)}`}
                  className="side-cat__tag pb"
                  aria-label={`Open ${c.name.toLowerCase()}`}
                  style={{ opacity: on || !category ? 1 : 0.5 }}
                >
                  <CategoryTag name={c.name} height={32} decorative style={{ maxWidth: 200 }} />
                </Link>
                <button type="button" className="bb side-cat__new" onClick={onCreate} aria-label={`New list in ${c.name.toLowerCase()}`}>
                  <PlusBox height={18} />
                </button>
              </div>
              {on &&
                lists.map((L) => (
                  <NavLink key={L.id} to={`/app/l/${L.id}`} className="side-list pb" aria-current={L.id === listId ? 'page' : undefined}>
                    <span className="name">{L.name}</span>
                    {L.poll && <span className="poll">Poll</span>}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </div>

      <div className="side-foot">
        {youOpen && (
          <div role="menu" className="menu" style={{ left: 16, bottom: 84, width: 240 }}>
            <button type="button" role="menuitem" onClick={() => navigate('/app/you')}>
              Your profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setYouOpen(false);
                ui.openActivity();
              }}
            >
              Activity{ui.unread ? ` · ${ui.unread} new` : ''}
            </button>
            <button type="button" role="menuitem" onClick={() => navigate('/app/settings/profile')}>
              Settings
            </button>
            <hr />
            <button type="button" role="menuitem" onClick={() => navigate('/login')} style={{ color: 'var(--see-text-2)' }}>
              Sign out
            </button>
          </div>
        )}
        <button
          type="button"
          className="side-you pb"
          onClick={() => setYouOpen((o) => !o)}
          aria-expanded={youOpen}
          aria-haspopup="menu"
          aria-current={/^\/app\/(you|settings|activity)/.test(loc.pathname) ? 'page' : undefined}
          aria-label="You: profile and settings"
          title="You"
        >
          <ProfilePicture size={34} />
          <span className="rl-hide" style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>You</span>
            <span className="t-foot">@joey</span>
          </span>
        </button>
        <button type="button" className="bb side-create" onClick={onCreate} aria-label="Make something new: a list, a category or a poll." aria-haspopup="dialog">
          <PlusBox height={30} />
        </button>
      </div>
    </aside>
  );
}
