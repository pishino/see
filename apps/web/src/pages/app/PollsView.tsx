import { useEffect, useMemo, useState } from 'react';
import {
  BY_ID,
  ENDS,
  MAKE_STEPS,
  MODES,
  POLL_EMPTY,
  POLL_MIN,
  POLL_SEED,
  POLL_TABS,
  PICK_RUN,
  VOTE_SAYS,
  WHO,
  endingOf,
  freshGame,
  gameOf,
  itemsFromList,
  leftOf,
  newPoll,
  pairOf,
  pasteItems,
  pickSide,
  pollCard,
  pollGroups,
  votePause,
  type Game,
  type Mode,
  type PollDef,
  type PollTab,
} from '@see/core';
import { useSettings } from '@see/core/react';
import { PlusBox } from '../../brand/marks';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePhone } from '../../lib/useMediaQuery';
import './polls.css';

/*
 * Polls, the whole way through (V3PollsApp, decided): your polls on the left (always, on desktop), making one with
 * as many items as you like, playing two at a time until one is left, the winner filling the screen, what everyone
 * picked, the results, and straight on to the next. A poll never moves anyone's chart.
 */
const TONES = ['#191C2B', '#1E1A2E', '#17202A', '#211A26'];

export function PollsView({ onNew }: { category?: string; onNew?: (name?: string) => void }) {
  void onNew;
  const store = useStore();
  const phone = usePhone();
  const all = useMemo(() => [...listPolls(store.lists), ...POLL_SEED, ...(store.polls ?? [])], [store.lists, store.polls]);
  const games = store.games ?? {};
  const groups = pollGroups(all, games);
  const [tab, setTab] = useState<PollTab>('play');
  const [view, setView] = useState<'home' | 'make' | 'play'>('home');
  const [pid, setPid] = useState<string | null>(null);
  const p = all.find((x) => x.id === pid) ?? null;

  const open = (x: PollDef) => {
    setPid(x.id);
    setView('play');
  };
  const next = () => {
    const candidates = all.filter((x) => x.id !== pid && !x.closed && !gameOf(x, games).done);
    if (candidates[0]) open(candidates[0]);
    else {
      setPid(null);
      setView('home');
    }
  };

  return (
    <div className="pv" data-view={view}>
      <aside className="pv-side" aria-label="Your polls">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="t-label" style={{ color: 'var(--see-violet-text)' }}>
            Your polls
          </h1>
          <button type="button" className="bb" onClick={() => setView('make')} aria-label="Make a poll" style={{ width: 48, height: 40, marginRight: -10 }}>
            <PlusBox height={26} color="var(--see-violet)" />
          </button>
        </div>
        <div role="tablist" aria-label="Your polls" className="pv-tabs">
          {POLL_TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="pv-tab" onClick={() => setTab(k)}>
              {label}
              <span>{groups[k].length}</span>
            </button>
          ))}
        </div>
        {groups[tab].map((x) => {
          const c = pollCard(x, gameOf(x, games));
          return (
            <button key={x.id} type="button" className="pv-card" aria-current={x.id === pid && view === 'play'} onClick={() => open(x)} aria-label={`${x.q}, ${c.act}`}>
              <span className="pv-kick">
                <span>{c.kick}</span>
                <span style={{ color: 'var(--see-text-3)' }}>{c.ends}</span>
              </span>
              <b>{c.q}</b>
              <span className="t-meta">{c.meta}</span>
              <span className="pv-act">{c.act}</span>
            </button>
          );
        })}
        {groups[tab].length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            <span className="t-meta" style={{ whiteSpace: 'normal' }}>
              {POLL_EMPTY[tab]}
            </span>
            <Button size="sm" onClick={() => setView('make')} style={{ alignSelf: 'flex-start' }}>
              Make a poll
            </Button>
          </div>
        )}
      </aside>

      <main className="pv-main" aria-live="polite">
        {view === 'make' ? (
          <MakePoll
            onCancel={() => setView('home')}
            onMade={(x) => {
              store.dispatch({ type: 'addPoll', poll: x });
              setTab('made');
              open(x);
            }}
          />
        ) : view === 'play' && p ? (
          <PlayPoll key={p.id} p={p} game={gameOf(p, games)} others={all.filter((x) => x.id !== p.id)} games={games} onOpen={open} onNext={next} onBack={() => setView('home')} phone={phone} />
        ) : (
          <div className="pv-step" style={{ paddingTop: 80 }}>
            <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
              Polls
            </span>
            <h2 className="pv-q">Pick one on the left, or make your own</h2>
            <p className="dlg-p">Put in as many as you like. Everyone picks between two until one is left.</p>
            <Button onClick={() => setView('make')} style={{ alignSelf: 'flex-start' }}>
              Make a poll
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

/** Any list made into a poll (its menu › Make it a poll) plays like the rest: its items, by you. */
function listPolls(lists: import('@see/core').List[]): PollDef[] {
  return lists
    .filter((L) => L.poll)
    .map((L) => ({
      id: `list-${L.id}`,
      q: `${L.name}: what’s No. 1?`,
      cat: L.cat,
      mode: 'stay' as Mode,
      by: 'you',
      ends: 'Open',
      items: itemsFromList(L, (id) => BY_ID[id] && { t: BY_ID[id].t, m: BY_ID[id].m }),
    }))
    .filter((p) => p.items.length >= POLL_MIN);
}

function PlayPoll({ p, game, others, games, onOpen, onNext, onBack, phone }: { p: PollDef; game: Game; others: PollDef[]; games: Record<string, Game>; onOpen: (x: PollDef) => void; onNext: () => void; onBack: () => void; phone: boolean }) {
  const store = useStore();
  const { settings } = useSettings();
  const toast = useToast();
  const n = p.items.length;
  const [hist, setHist] = useState<Game[]>([]);
  const [phase, setPhase] = useState(game.done || p.closed ? 4 : 0);
  const [hide, setHide] = useState(false);
  const [wside, setWside] = useState<'a' | 'b'>('a');
  // too many tries (O2): a fast run of picks pauses for a moment
  const [times, setTimes] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const wait = game.done ? 0 : votePause(times, now, PICK_RUN);
  useEffect(() => {
    if (!wait) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [wait]);

  const save = (g: Game | null) => store.dispatch({ type: 'saveGame', id: p.id, game: g });
  const ending = () => {
    if (settings.reduceMotion) return setPhase(4);
    setPhase(1);
    window.setTimeout(() => setPhase(2), 750);
    window.setTimeout(() => setPhase(3), 1600);
    window.setTimeout(() => setPhase(4), 2700);
  };
  const pick = (side: 'a' | 'b') => {
    if (game.done || p.closed) return;
    const t = Date.now();
    if (votePause(times, t, PICK_RUN)) return;
    setTimes((ts) => [...ts.slice(-40), t]);
    setNow(t);
    const g = pickSide(game, side);
    setHist((h) => [...h, game]);
    save(g);
    if (g.done) {
      setWside(side);
      ending();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') pick('a');
      else if (e.key === 'ArrowRight') pick('b');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const done = game.done;
  const unplayedClosed = p.closed && !done;
  let pr = pairOf(game);
  if (done) {
    const lastOut = game.out.length ? game.out[game.out.length - 1] : null;
    pr = wside === 'a' ? [game.winner, lastOut] : [lastOut, game.winner];
  }
  const e = endingOf(p, game);
  const left = leftOf(game, n);
  const half = (side: 'a' | 'b', k: number) => {
    const i = side === 'a' ? pr[0] : pr[1];
    const it = i === null || i === undefined ? ['', ''] : p.items[i];
    const isWin = done && side === wside;
    const kick = done ? (isWin ? `Your winner · of ${n}` : '') : game.mode === 'stay' ? (side === 'a' ? (game.out.length ? 'Stays' : 'First') : 'New') : `Round ${game.roundNo}`;
    return (
      <button
        type="button"
        className="pv-half"
        disabled={done || !!unplayedClosed || wait > 0}
        onClick={() => pick(side)}
        aria-label={it[0] ? `Pick ${it[0]}` : undefined}
        style={{ background: isWin && phase >= 1 ? '#191C2B' : TONES[k % TONES.length], flexGrow: done ? (isWin ? 1 : 0) : 1, opacity: done && !isWin ? 0 : wait ? 0.45 : 1, padding: done && !isWin ? 0 : undefined, ['--spine' as string]: isWin ? 'var(--see-violet)' : 'transparent' }}
      >
        <small>{kick}</small>
        <b>{it[0]}</b>
        {it[1] && <span>{it[1]}</span>}
      </button>
    );
  };

  return (
    <>
      <div className="pv-head">
        {phone && (
          <button type="button" className="pv-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
            Your polls
          </button>
        )}
        <span className="pv-kick">
          <span>
            {p.cat} · {p.mode === 'stay' ? 'One stays' : 'In pairs'}
          </span>
          <span style={{ color: 'var(--see-text-3)' }}>{done || p.closed ? 'Done' : `${left} left`}</span>
        </span>
        <h2 className="pv-q">{p.q}</h2>
      </div>
      <div className="pv-prog" aria-hidden="true">
        <i style={{ width: `${Math.round((done ? 1 : (n - left) / Math.max(1, n - 1)) * 100)}%` }} />
      </div>
      {wait > 0 && (
        <p className="pv-pause" role="status">
          {VOTE_SAYS(wait)}
        </p>
      )}
      <div className="pv-duel">
        {unplayedClosed ? (
          <div className="pv-step">
            <p className="dlg-p">This poll is closed. Here’s how it ended.</p>
          </div>
        ) : (
          <>
            {half('a', 0)}
            {half('b', 1)}
            {!done && <span className="pv-or">OR</span>}
          </>
        )}
        {done && phase >= 3 && phase < 4 && (
          <div className="pv-crowd">
            <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
              Everyone so far
            </span>
            <b style={{ fontSize: 16 }}>{e.crowd}</b>
            <span style={{ fontSize: 13, color: 'var(--see-text-2)' }}>{e.match}</span>
          </div>
        )}
        {(done || unplayedClosed) && phase >= 4 && !hide && (
          <section className="pv-results" aria-label="Results">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-label">Results</span>
              {!unplayedClosed && (
                <button type="button" className="pv-link" onClick={() => setHide(true)}>
                  Hide
                </button>
              )}
            </div>
            {done && (
              <div>
                <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
                  Everyone so far
                </span>
                <div style={{ fontWeight: 700, fontSize: 16, paddingTop: 4 }}>{e.crowd}</div>
                <div className="t-meta">{e.match}</div>
              </div>
            )}
            <span className="t-label">Everyone’s top 5 · {e.people}</span>
            {e.top.map((r) => (
              <div key={r.i} className="pv-bar" style={{ fontWeight: r.you ? 700 : 600 }}>
                <span className="t-rank">{r.n}.</span>
                <span>{r.t}</span>
                <span style={{ textAlign: 'right', color: 'var(--see-text-2)' }}>{r.pct}%</span>
                <span />
                <i style={{ width: `${r.w}%`, background: r.you ? 'var(--see-violet)' : '#4A4775' }} />
              </div>
            ))}
            {e.mine.length > 0 && (
              <>
                <span className="t-label" style={{ paddingTop: 6 }}>
                  Your top 3
                </span>
                {e.mine.map((r) => (
                  <div key={r.n} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span className="t-rank" style={{ color: r.n === 1 ? 'var(--see-violet-text)' : undefined }}>
                      {r.n}
                    </span>
                    <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                      {r.t}
                    </b>
                    <span className="t-meta">{r.note}</span>
                  </div>
                ))}
              </>
            )}
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
              <Button size="sm" onClick={onNext}>
                Next poll
              </Button>
              {!p.closed && (
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    save(freshGame(p, String(Date.now() % 97)));
                    setHist([]);
                    setPhase(0);
                    setHide(false);
                  }}
                >
                  Play again
                </Button>
              )}
              <Button
                size="sm"
                variant="quiet"
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}${import.meta.env.BASE_URL}app/polls`).catch(() => {});
                  toast('Link to Polls copied');
                }}
              >
                Share
              </Button>
            </span>
            <span className="t-label" style={{ paddingTop: 10 }}>
              Your other polls
            </span>
            {others.slice(0, 4).map((x) => {
              const gx = gameOf(x, games);
              return (
                <button key={x.id} type="button" className="pv-card" onClick={() => onOpen(x)}>
                  <span className="pv-kick">
                    <span>
                      {x.cat}
                      {x.by === 'you' ? ' · yours' : ''}
                    </span>
                  </span>
                  <b style={{ fontSize: 14 }}>{x.q}</b>
                  <span className="pv-act">{gx.done || x.closed ? 'See results' : gx.out.length ? 'Keep going' : 'Play'}</span>
                </button>
              );
            })}
          </section>
        )}
        {done && phase >= 4 && hide && (
          <button type="button" className="pv-link" onClick={() => setHide(false)} style={{ position: 'absolute', right: 24, bottom: 18, zIndex: 7 }}>
            See results
          </button>
        )}
      </div>
      {!done && !unplayedClosed && (
        <div className="pv-controls">
          <button
            type="button"
            className="pv-link"
            disabled={!hist.length}
            onClick={() => {
              const prev = hist[hist.length - 1];
              if (!prev) return;
              save(prev);
              setHist((h) => h.slice(0, -1));
            }}
          >
            Undo
          </button>
          <button type="button" className="pv-link" onClick={() => pick(Math.random() < 0.5 ? 'a' : 'b')}>
            Can’t choose
          </button>
          <span className="t-meta">{phone ? 'Tap the one you pick' : 'Or press ← and →'}</span>
        </div>
      )}
    </>
  );
}

/** Making a poll: ask it, fill it (at least three; type, paste, or fill it from a list), set it, start it. */
function MakePoll({ onCancel, onMade }: { onCancel: () => void; onMade: (p: PollDef) => void }) {
  const store = useStore();
  const [step, setStep] = useState(1);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(store.categories[0]?.id ?? 'MUSIC');
  const [items, setItems] = useState<[string, string][]>([]);
  const [add, setAdd] = useState('');
  const [paste, setPaste] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('stay');
  const [who, setWho] = useState<string>('Everyone');
  const [ends, setEnds] = useState<string>('In 3 days');
  const ok = step === 1 ? q.trim().length > 2 : step === 2 ? items.length >= POLL_MIN : true;
  const put = (xs: [string, string][]) => setItems((cur) => [...cur, ...xs.filter(([t]) => t && !cur.some(([u]) => u.toLowerCase() === t.toLowerCase()))]);
  const go = () => {
    if (!ok) return;
    if (step < 3) return setStep(step + 1);
    onMade(newPoll({ q, cat, items, mode, who, ends }));
  };
  return (
    <div className="pv-step">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-label" style={{ color: 'var(--see-violet-text)' }}>
          New poll · {MAKE_STEPS[step - 1]} · step {step} of 3
        </span>
        <button type="button" className="pv-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <span style={{ display: 'flex', gap: 6 }} aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} style={{ width: i === step ? 22 : 10, height: 4, background: i <= step ? 'var(--see-violet)' : 'var(--see-surface-2)' }} />
        ))}
      </span>

      {step === 1 && (
        <>
          <label className="t-label" htmlFor="pq">
            What are you asking?
          </label>
          <input id="pq" className="pv-field" value={q} autoFocus placeholder="Best Afrobeats song of the decade?" onChange={(e) => setQ(e.target.value.slice(0, 80))} onKeyDown={(e) => e.key === 'Enter' && go()} />
          <span className="t-label">Where it goes</span>
          <div className="pv-chips">
            {store.categories.map((c) => (
              <button key={c.id} type="button" className="pv-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <span className="t-label">
            What’s in it? · {items.length} in it · at least {POLL_MIN}
          </span>
          <input
            className="pv-field"
            value={add}
            autoFocus
            placeholder="Type one and press Enter"
            onChange={(e) => setAdd(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (add.trim()) put(pasteItems(add));
              setAdd('');
            }}
          />
          <div className="pv-chips">
            {items.map(([t, by], i) => (
              <button key={t} type="button" className="pv-chip" onClick={() => setItems(items.filter((_, k) => k !== i))} aria-label={`Take out ${t}`}>
                {t}
                {by ? ` · ${by}` : ''} ✕
              </button>
            ))}
          </div>
          {paste === null ? (
            <button type="button" className="pv-link" onClick={() => setPaste('')} style={{ alignSelf: 'flex-start' }}>
              Paste a list
            </button>
          ) : (
            <>
              <textarea className="sh-code" value={paste} autoFocus placeholder={'One per line, like:\nJollof rice\nFried rice'} onChange={(e) => setPaste(e.target.value)} aria-label="Paste a list" />
              <Button
                size="sm"
                variant="quiet"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => {
                  put(pasteItems(paste));
                  setPaste(null);
                }}
              >
                Add them
              </Button>
            </>
          )}
          <span className="t-label">Or fill it from</span>
          <div className="pv-chips">
            {store.lists.map((L) => (
              <button key={L.id} type="button" className="pv-chip" onClick={() => put(itemsFromList(L, (id) => BY_ID[id] && { t: BY_ID[id].t, m: BY_ID[id].m }))}>
                {L.name} · {L.items.filter(Boolean).length}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <span className="t-label">How it’s played</span>
          {MODES.map(([m, name, text]) => (
            <button key={m} type="button" className="pv-mode" aria-pressed={mode === m} onClick={() => setMode(m)}>
              <b style={{ fontFamily: 'var(--see-font-display)', fontWeight: 800 }}>{name}</b>
              <span className="t-meta" style={{ whiteSpace: 'normal' }}>
                {text}
              </span>
            </button>
          ))}
          <span className="t-label">Who can play</span>
          <div className="pv-chips">
            {WHO.map((x) => (
              <button key={x} type="button" className="pv-chip" aria-pressed={who === x} onClick={() => setWho(x)}>
                {x}
              </button>
            ))}
          </div>
          <span className="t-label">It ends</span>
          <div className="pv-chips">
            {ENDS.map((x) => (
              <button key={x} type="button" className="pv-chip" aria-pressed={ends === x} onClick={() => setEnds(x)}>
                {x}
              </button>
            ))}
          </div>
        </>
      )}

      <span style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        {step > 1 && (
          <Button size="sm" variant="quiet" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        <Button size="sm" onClick={go} disabled={!ok}>
          {step === 3 ? 'Start it' : 'Next'}
        </Button>
      </span>
    </div>
  );
}
