import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useMatch } from 'react-router-dom';
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
  const polls = loc.pathname.startsWith('/app/polls');
  const cat = useCurrentCategory();
  const [creating, setCreating] = useState(false);

  // a fresh page starts at the top
  useEffect(() => {
    document.querySelector('.app-scroll')?.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const store = useStore();
  const catName = store.categories.find((c) => c.id === cat)?.name ?? '';

  return (
    <div className="app" data-accent={polls ? 'violet' : undefined} data-shell={shell} data-short={short || undefined}>
      {!phone && <SideBar category={cat} shell={shell} onCreate={() => setCreating(true)} />}
      <main className="app-main">
        {phone && <PhoneMasthead category={catName} inline={short} home={loc.pathname === '/app' || loc.pathname === '/app/'} polls={polls} />}
        <div className="app-scroll no-scrollbar">
          <div className="app-page">
          <Routes>
            <Route index element={<Home onNewCategory={() => setCreating(true)} />} />
            <Route path="c/:cat" element={<CategoryView onNewList={() => setCreating(true)} />} />
            <Route path="l/:id" element={<ListView onNewList={() => setCreating(true)} />} />
            <Route path="polls" element={<PollsView category={cat} onNew={() => setCreating(true)} />} />
            <Route path="find" element={<FindView />} />
            <Route path="you" element={<YouView />} />
          </Routes>
          </div>
        </div>
        {!phone && <FindPill />}
        {phone && <BottomNav onCreate={() => setCreating(true)} />}
      </main>
      {creating && <CreateDrawer defaultCategory={cat} onClose={() => setCreating(false)} />}
    </div>
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
      <NavLink to="/app/you">
        <Icon name="person" size={22} />
        <span>You</span>
      </NavLink>
    </nav>
  );
}
