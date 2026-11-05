import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, matchPath, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { Lockup, PlusBox } from '../../brand/marks';
import { PlusField } from '../../brand/PlusField';
import { useShell, useShort } from '../../lib/useMediaQuery';
import { useStore } from '../../data/store';
import { SideBar } from './SideBar';
import { Home } from './Home';
import { CategoryView } from './CategoryView';
import { ListView } from './ListView';
import { PollsView } from './PollsView';
import { FindPill, FindView } from './Find';
import { YouView } from './YouView';
import { SettingsView } from './SettingsView';
import { ActivityList, ActivityView } from './ActivityView';
import { UiProvider } from './ui';
import { PlayerProvider, usePlayer } from './player';
import { MiniPlayer, PlayerSheet } from './PlayerView';
import { PersonDrawer, PersonView } from './PersonView';
import { overOf } from './PersonLink';
import { flushPending, usePending } from '../../data/pending';
import { useOnline } from '../../lib/useOnline';
import { useToast } from '../../components/Toast';
import { useRef } from 'react';
import { CreateDrawer } from './CreateDrawer';
import './app.css';

/** The category the page is in, from the route: a category page, or the category of the open list. */
function useCurrentCategory(): string {
  const store = useStore();
  const cat = useMatch('/app/c/:cat')?.params.cat;
  const lid = useMatch('/app/l/:id')?.params.id;
  if (cat) return decodeURIComponent(cat);
  if (lid) return store.list(lid)?.cat ?? '';
  return '';
}

export default function AppShell() {
  const shell = useShell();
  const phone = shell === 'bottom';
  const short = useShort();
  const loc = useLocation();
  // a person opened from a page opens over it on wide screens; the page under it keeps its place
  const over = phone ? undefined : overOf(loc.state);
  const page = over ?? loc;
  const overHandle = over ? matchPath('/app/u/:handle', loc.pathname)?.params.handle : undefined;
  const polls = page.pathname.startsWith('/app/polls');
  const cat = useCurrentCategory();
  const [creating, setCreating] = useState<string | false>(false);
  const [activity, setActivity] = useState(false);
  const navigate = useNavigate();
  const openCreate = useCallback((name?: string) => setCreating(typeof name === 'string' ? name : ''), []);
  const newBlank = useCallback(() => setCreating(''), []);
  // offline: a quiet banner, never a wall; back online, one toast
  const online = useOnline();
  const toast = useToast();
  const wasOnline = useRef(online);
  const pending = usePending();
  useEffect(() => {
    if (online && !wasOnline.current) {
      const n = flushPending();
      toast(n ? `Back online · ${n} ${n === 1 ? 'change' : 'changes'} synced` : 'Back online');
    }
    wasOnline.current = online;
  }, [online, toast]);
  // the first change made offline says where it lives for now
  useEffect(() => {
    if (pending.changes === 1) toast('Saved on this device. It syncs when you’re back.');
  }, [pending.changes, toast]);
  // Activity: a panel from the right over whatever you were doing; on phones, its own page
  const openActivity = useCallback(() => (phone ? navigate('/app/activity') : setActivity(true)), [phone, navigate]);
  useEffect(() => setActivity(false), [loc.pathname]);

  // a fresh page starts at the top
  useEffect(() => {
    document.querySelector('.app-scroll')?.scrollTo({ top: 0 });
  }, [page.pathname]);

  const store = useStore();
  const catName = store.categories.find((c) => c.id === cat)?.name ?? '';

  return (
    <UiProvider onCreate={openCreate} onActivity={openActivity}>
    <PlayerProvider>
    <div className="app" data-accent={polls ? 'violet' : undefined} data-shell={shell} data-short={short || undefined}>
      {!phone && <SideBar category={cat} shell={shell} onCreate={newBlank} />}
      <main className="app-main">
        {phone && <PhoneMasthead category={catName} inline={short} home={page.pathname === '/app' || page.pathname === '/app/'} polls={polls} />}
        {!online && (
          <div className="ps-banner" role="status">
            You’re offline. Every list you’ve opened still opens, ranks and plays what’s saved; changes stay on this device until you’re back.
          </div>
        )}
        <div className="app-scroll no-scrollbar">
          <div className="app-page">
          <Routes location={page}>
            <Route index element={<Home onNewCategory={openCreate} />} />
            <Route path="c/:cat" element={<CategoryView onNewList={newBlank} />} />
            <Route path="l/:id" element={<ListView onNewList={newBlank} />} />
            <Route path="polls" element={<PollsView category={cat} onNew={openCreate} />} />
            <Route path="find" element={<FindView />} />
            <Route path="you" element={<YouView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="settings/:section" element={<SettingsView />} />
            <Route path="activity" element={<ActivityView />} />
            <Route path="u/:handle" element={<PersonView />} />
          </Routes>
          </div>
        </div>
        {!phone && <FindPill />}
        {phone && <BottomNav onCreate={newBlank} />}
      </main>
      {creating !== false && <CreateDrawer defaultCategory={cat} initialName={creating} onClose={() => setCreating(false)} />}
      {activity && <ActivityDrawer onClose={() => setActivity(false)} />}
      {overHandle && <PersonDrawer handle={overHandle} onClose={() => navigate(-1)} />}
      <PlayerLayer />
    </div>
    </PlayerProvider>
    </UiProvider>
  );
}

/** The player: the sheet over everything, or minimised; nothing when nothing plays. */
function PlayerLayer() {
  const p = usePlayer();
  if (!p.xid) return null;
  return p.view === 'sheet' ? <PlayerSheet /> : <MiniPlayer />;
}

/** Wide screens: Activity is a panel from the right; close it and you are back. */
function ActivityDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="act-title" className="drawer" style={{ width: 440 }}>
        <div className="drawer__head">
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="t-label" style={{ fontSize: 9.5 }}>
              You
            </span>
            <h2 id="act-title" className="t-hero" style={{ fontSize: 30 }}>
              Activity
            </h2>
          </span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close Activity" autoFocus>
            <Icon name="close" size={20} color="var(--see-text)" />
          </button>
        </div>
        <div className="drawer__body" style={{ gap: 0, paddingTop: 0 }}>
          <ActivityList onGo={onClose} />
        </div>
      </div>
    </>
  );
}

/** Phones: the masthead sits above the page (see+ on home; see and its category tag). On its side, one line. */
function PhoneMasthead({ category, home, polls, inline }: { category: string; home: boolean; polls: boolean; inline: boolean }) {
  return (
    <header className="mast">
      {(home || polls) && (
        <div className="mast__field" aria-hidden="true">
          <PlusField cell={6} calm={0.2} plusPx={44} theme={polls ? 'violet' : 'flare'} />
        </div>
      )}
      <Link to="/app" aria-label={category ? 'see: back to everything' : 'see+: home'} style={{ display: 'block' }}>
        <Lockup category={category} inline={inline} />
      </Link>
    </header>
  );
}

function BottomNav({ onCreate }: { onCreate: () => void }) {
  const loc = useLocation();
  const charts = loc.pathname === '/app' || loc.pathname.startsWith('/app/l/') || loc.pathname.startsWith('/app/c/');
  return (
    <nav className="bottom-nav" aria-label="Main">
      <Link to="/app" aria-current={charts ? 'page' : undefined}>
        <Icon name="eq" size={22} />
        <span>Charts</span>
      </Link>
      <NavLink to="/app/polls">
        <Icon name="poll" size={22} />
        <span>Polls</span>
      </NavLink>
      <button type="button" onClick={onCreate} aria-label="Create: a category, a list or a poll" aria-haspopup="dialog">
        <PlusBox height={35} />
      </button>
      <NavLink to="/app/find">
        <Icon name="search" size={22} />
        <span>Find</span>
      </NavLink>
      <Link to="/app/you" aria-current={/^\/app\/(you|settings|activity)/.test(loc.pathname) ? 'page' : undefined}>
        <Icon name="person" size={22} />
        <span>You</span>
      </Link>
    </nav>
  );
}
