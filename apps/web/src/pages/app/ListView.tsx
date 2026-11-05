import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/Button';
import { PlusCta } from '../../components/controls';
import { ShareSheet } from '../share/ShareSheet';
import { PeopleSheet } from './Pages';
import { MakerLink } from './PersonLink';
import './safety.css';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { PlusBox } from '../../brand/marks';
import { PlusField } from '../../brand/PlusField';
import { ReadChip } from '../../components/controls';
import { useToast } from '../../components/Toast';
import { usePending } from '../../data/pending';
import { useStore } from '../../data/store';
import { readName, ACCESS_SAYS, INVITES, accessOf, joinInvite, BY_ID, COLS, KIND_PL, PEOPLE, PERIODS, belowTheLine, goneLine, kindFor, kindOf, makerOf, moveEntry, moveOf, pad2, placeAt, removeAt, search, slotsOf, titleOf, type Entry, type Kind, type List } from '@see/core';
import { usePhone } from '../../lib/useMediaQuery';
import { usePlayer } from './player';

const ROW = 56;
const MOVE_INK = { up: 'var(--see-up)', down: 'var(--see-flare-soft)', same: 'var(--see-text-off)', new: 'var(--see-text-2)', none: 'var(--see-text-off)' };

export function Avatars({ handles, size = 22 }: { handles: string[]; size?: number }) {
  if (!handles.length) return null;
  return (
    <span className="avs" aria-label={`With ${handles.map((h) => PEOPLE[h] ?? h).join(', ')}`} role="img">
      {handles.slice(0, 3).map((h, i) => (
        <span key={h} style={{ marginLeft: i ? -4 : 0, display: 'flex' }}>
          <Avatar handle={h} size={size} />
        </span>
      ))}
    </span>
  );
}

/** Title size steps with the name's length, so it fits the width. */
function titleSize(name: string, phone: boolean) {
  const n = name.length;
  if (phone) return n <= 12 ? 40 : n <= 20 ? 32 : 26;
  return n <= 16 ? 64 : n <= 26 ? 52 : 40;
}

/** A list: ranked rows, then the open slots you fill by typing. Every change saves. */
export function ListView({ onNewList }: { onNewList: () => void }) {
  const { id = '' } = useParams();
  const store = useStore();
  const L = store.list(id);
  if (!L) return <NoList id={id} />;
  return <ListBody key={L.id} L={L} onNewList={onNewList} />;
}

function ListBody({ L, onNewList }: { L: List; onNewList: () => void }) {
  const store = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const phone = usePhone();
  const siblings = store.listsIn(L.cat);
  const kind = kindOf(L);
  const cols = kind && kind !== 'mixed' ? COLS[kind] : [['By', 'm'] as [string, 'm' | 'a']];
  const slots = useMemo(() => slotsOf(L), [L]);
  const filled = slots.filter(Boolean).length;
  const firstOpen = slots.indexOf(null);
  const [focus, setFocus] = useState(0);
  const player = usePlayer();
  const waiting = usePending().waiting.get(L.id);
  const [menu, setMenu] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  // the full table, then with the album dropped, then with the maker folded into the title's second line
  const gridOf = (n: number) => `48px 56px minmax(0, 1.3fr) ${Array.from({ length: n }, () => 'minmax(0, 1fr) ').join('')}48px 40px`;
  const gridVars = { '--grid': gridOf(cols.length), '--grid-1': gridOf(Math.min(1, cols.length)), '--grid-0': gridOf(0) } as Record<string, string>;

  // ---- reorder: drag the grip, or arrow keys on it ----
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const dragRef = useRef<{ from: number; y0: number } | null>(null);
  const target = drag ? Math.max(0, Math.min(filled - 1, drag.from + Math.round(drag.dy / ROW))) : -1;

  const moveItem = (from: number, to: number) => {
    const next = moveEntry(L, from, to);
    if (next === L) return;
    store.replaceList(next);
    setFocus(to);
    toast(`${titleOf(slots[from])} to No. ${to + 1}`, () => store.replaceList(L));
  };

  const onGripDown = (e: ReactPointerEvent, ix: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { from: ix, y0: e.clientY };
    setDrag({ from: ix, dy: 0 });
  };
  const onGripMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    setDrag({ from: dragRef.current.from, dy: e.clientY - dragRef.current.y0 });
  };
  const onGripUp = () => {
    if (drag && dragRef.current) moveItem(drag.from, target);
    dragRef.current = null;
    setDrag(null);
  };
  const onGripKey = (e: ReactKeyboardEvent, ix: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveItem(ix, ix - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveItem(ix, ix + 1);
    }
  };

  const add = (ix: number, x: Entry) => {
    const r = placeAt(L, ix, x.id);
    if ('already' in r) {
      toast(`Already on ${L.name}`);
      return;
    }
    store.replaceList(r.list);
    toast(`${x.t} in at No. ${ix + 1}`);
  };
  const remove = (ix: number) => {
    store.replaceList(removeAt(L, ix));
    toast(`${titleOf(slots[ix])} off the list`, () => store.replaceList(L));
  };

  return (
    <>
      <div role="tablist" aria-label="Lists in this category" className="tabs no-scrollbar">
        {siblings.map((s) => (
          <Link key={s.id} to={`/app/l/${s.id}`} role="tab" className="tab" aria-selected={s.id === L.id}>
            {s.name}
          </Link>
        ))}
        <button type="button" className="bb" onClick={onNewList} aria-label="New list in this category" style={{ height: phone ? 38 : 42, width: 36, flexShrink: 0 }}>
          <PlusBox height={18} />
        </button>
      </div>

      <div className="hdr lv-hdr">
        <PlusField cell={phone ? 6 : 8} plusPx={phone ? 44 : 64} />
        <div className="hdr__shade" />
        <div className="hdr__in">
          <TitleField L={L} size={titleSize(L.name, phone)} />
          <div className="lv-bar">
            <div>
              {L.chips && (
                <>
                  <ReadChip pressed={sizeOpen} onClick={() => setSizeOpen((o) => !o)} label={`Size: top ${L.n}. Anything from 5 to 50`}>
                    Top {L.n}
                  </ReadChip>
                  <ReadChip label={`Time frame: ${PERIODS[L.per].toLowerCase()}`}>{PERIODS[L.per]}</ReadChip>
                  {kind && (
                    <span className="read-chip" style={{ background: 'transparent', color: 'var(--see-text-3)', cursor: 'default', padding: '0 6px' }}>
                      {kind === 'mixed' ? 'Mixed' : KIND_PL[kind]}
                    </span>
                  )}
                </>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              {L.poll && <span className="poll-chip" style={{ height: 24, fontSize: 11.5, padding: '0 8px' }}>Poll</span>}
              <button type="button" onClick={() => setPeopleOpen(true)} aria-label={`People on ${L.name}: ${L.people.length}. Open`} style={{ border: 0, background: 'transparent', padding: 4, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--see-text-3)' }}>
                <Avatars handles={L.people} />
                {L.people.length === 0 && <span className="t-meta">Put people on it</span>}
              </button>
              <button type="button" className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="List actions" aria-haspopup="menu" aria-expanded={menu} style={{ width: 44, height: 44 }}>
                <Icon name="dots" size={22} color="var(--see-text-2)" />
              </button>
              {menu && (
                <div role="menu" className="menu" style={{ right: 0, top: 48 }} onMouseLeave={() => setMenu(false)}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      store.togglePin(L.id);
                      setMenu(false);
                      toast(L.pinned ? 'Unpinned' : 'Pinned to Charts');
                    }}
                  >
                    <Icon name="pin" size={16} /> {L.pinned ? 'Unpin' : 'Pin to Charts'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      setSharing(true);
                    }}
                  >
                    <Icon name="share" size={16} /> Share…
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSizeOpen(true);
                      setMenu(false);
                    }}
                  >
                    <Icon name="list" size={16} /> Size: top {L.n}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      store.replaceList({ ...L, poll: !L.poll });
                      setMenu(false);
                      toast(L.poll ? 'Not a poll any more' : `${L.name} is a poll: people vote, your list stays yours`);
                    }}
                  >
                    <Icon name="poll" size={16} /> {L.poll ? 'Stop the poll' : 'Make it a poll'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      setPeopleOpen(true);
                    }}
                  >
                    <Icon name="person" size={16} /> Invite people
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    style={{ color: 'var(--see-flare-soft)' }}
                    onClick={() => {
                      const kept = L;
                      setMenu(false);
                      store.dispatch({ type: 'removeList', id: L.id });
                      navigate('/app');
                      toast(`${kept.name} deleted`, () => store.dispatch({ type: 'addList', list: kept }));
                    }}
                  >
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          {sizeOpen && (
            <div className="chip-row" role="group" aria-label="Size" style={{ animation: 'see-rise 200ms var(--see-ease) both' }}>
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="choice"
                  aria-pressed={L.n === n}
                  onClick={() => {
                    const cut = belowTheLine({ ...L, n });
                    store.setSize(L.id, n);
                    setSizeOpen(false);
                    toast(cut ? `Top ${n}: ${cut} below the line` : `Top ${n}`);
                  }}
                >
                  Top {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lv-cols" style={gridVars} aria-hidden="true">
        {['No.', 'Move', kind === 'artist' || kind === 'director' || kind === 'athlete' ? 'Name' : 'Title', ...cols.map((c) => c[0]), '', ''].map((h, i) => (
          <span key={i} className={`t-label${i >= 3 && i < 3 + cols.length ? ` lv-c${i - 2}` : ''}`}>
            {h}
          </span>
        ))}
      </div>

      <div role="list" aria-label={`${L.name}, top ${L.n}`}>
        {slots.map((xid, ix) => {
          if (!xid) {
            return <Slot key={`slot-${ix}`} ix={ix} first={ix === firstOpen} kind={kind} ownKind={kindFor(L, store.categories.find((c) => c.id === L.cat)?.name)} taken={L.items} onPick={(x) => add(ix, x)} />;
          }
          const x = BY_ID[xid];
          const mv = moveOf(L, xid, ix);
          const isDrag = drag?.from === ix;
          const isPlaying = player.xid === xid && player.playing;
          const rink = ix === focus ? 'var(--see-accent-text)' : ix < 3 ? 'var(--see-text)' : 'var(--see-text-4)';
          return (
            <div
              key={xid}
              role="listitem"
              className="lv-row"
              data-focus={ix === focus && !drag}
              data-playing={isPlaying}
              data-dragging={isDrag}
              data-gone={x.gone ? true : undefined}
              data-over={!!drag && !isDrag && ix === target && target < drag.from}
              style={{
                ...gridVars,
                animationDelay: `${Math.min(ix, 12) * 22}ms`,
                transform: isDrag ? `translateY(${drag!.dy}px)` : undefined,
                transition: isDrag ? 'none' : undefined,
              }}
            >
              <span className="t-rank lv-rank" style={{ color: rink }}>
                {pad2(ix + 1)}
              </span>
              {waiting?.has(xid) ? (
                <span className="t-move lv-wait" aria-label="Waiting to sync">
                  WAITING
                </span>
              ) : (
                <span className="t-move" aria-label={mv.aria} style={{ color: MOVE_INK[mv.tone] }}>
                  {mv.t}
                </span>
              )}
              <button
                type="button"
                className="lv-name"
                onClick={() => {
                  setFocus(ix);
                  player.play(xid, { listId: L.id, view: 'sheet' });
                }}
                aria-label={`No. ${ix + 1}, ${x.t}${x.m && !x.own ? ` by ${x.m}` : ''}, ${mv.aria}. Opens details.`}
              >
                <span className="t-row">{x.t}</span>
                <span className="t-meta lv-second">{makerOf(x)}</span>
              </button>
              {cols.map(([, key], ci) => (
                <span key={ci} className={`t-meta lv-cell lv-c${ci + 1}`}>
                  {key === 'm' && x.own ? 'Your own' : key === 'm' && x.k === 'artist' ? 'Artist' : key === 'm' && x.m ? <MakerLink name={x.m} /> : x[key]}
                </span>
              ))}
              <button
                type="button"
                className="icon-btn lv-play"
                aria-pressed={isPlaying}
                aria-label={x.gone ? `Play is off: ${goneLine(x)}` : x.own ? `${x.t} is your own: nothing to play yet` : `${isPlaying ? 'Pause' : 'Play'} ${x.t}`}
                disabled={!!x.gone || !!x.own || !!x.notHere}
                onClick={() => (player.xid === xid ? player.toggle() : player.play(xid, { listId: L.id, view: 'mini' }))}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? 'var(--see-accent)' : 'var(--see-text-2)'} />
              </button>
              <button
                type="button"
                className="lv-grip"
                aria-label={`Drag ${x.t}. Space to lift, arrows to move. Delete takes it off.`}
                onPointerDown={(e) => onGripDown(e, ix)}
                onPointerMove={onGripMove}
                onPointerUp={onGripUp}
                onPointerCancel={onGripUp}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') remove(ix);
                  else onGripKey(e, ix);
                }}
              >
                <Icon name="grip" size={20} />
              </button>
              {x.gone && (
                <span className="lv-gone">
                  <span>{goneLine(x, ix + 1)}</span>
                  <Link to={`/app/find?q=${encodeURIComponent(x.m)}`}>Find another</Link>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {sharing && <ShareSheet L={L} onClose={() => setSharing(false)} />}
      {peopleOpen && <PeopleSheet L={L} onClose={() => setPeopleOpen(false)} />}
      <div className="lv-foot">
        <i aria-hidden="true" />
        <span className="t-foot" style={{ fontSize: 11 }}>
          {filled} of {L.n} · saved as you go
        </span>
      </div>
    </>
  );
}

/** An open place: type to find it, pick from what See suggests. */
function Slot({ ix, first, kind, ownKind, taken, onPick }: { ix: number; first: boolean; kind: ReturnType<typeof kindOf>; ownKind: Kind; taken: (string | null)[]; onPick: (x: Entry) => void }) {
  const store = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(q, kind).filter((x) => !taken.includes(x.id)).slice(0, 6), [q, kind, taken]);
  const wrap = useRef<HTMLLabelElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);
  const pick = (x: Entry) => {
    onPick(x);
    setQ('');
    setOpen(false);
  };
  // nothing matches: rank it as your own (search never ends at "no")
  const addOwn = () => pick(store.addOwn(q, ownKind));
  const id = `slot-sugs-${ix}`;
  return (
    <label ref={wrap} className="lv-slot" data-first={first} role="listitem">
      <span className="t-rank lv-rank" style={{ color: first ? 'var(--see-accent-soft)' : 'var(--see-slot)' }}>
        {pad2(ix + 1)}
      </span>
      <input
        type="text"
        value={q}
        placeholder={first ? `Type to find No. ${ix + 1}` : `No. ${ix + 1} is open`}
        aria-label={`Find something for No. ${ix + 1}`}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && !results.length && q.trim().length > 1) {
            e.preventDefault();
            addOwn();
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      <span style={{ display: 'flex', justifyContent: 'center' }}>
        <Icon name="search" size={12} color="var(--see-text-4)" />
      </span>
      {open && results.length === 0 && q.trim().length > 1 && (
        <div className="lv-sugs" id={id} role="listbox" aria-label="Suggestions">
          <button type="button" role="option" aria-selected className="lv-sug" data-active onPointerDown={(e) => e.preventDefault()} onClick={addOwn}>
            <span className="t-row" style={{ fontSize: 14, fontWeight: 800 }}>
              Add “{q.trim()}”
            </span>
            <span className="t-meta">Nothing matches. Rank it as your own; you can link a source later.</span>
          </button>
        </div>
      )}
      {open && results.length > 0 && (
        <div className="lv-sugs" id={id} role="listbox" aria-label="Suggestions">
          {results.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className="lv-sug"
              data-active={i === active}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(x)}
            >
              <span className="t-row" style={{ fontSize: 14, textTransform: 'uppercase', fontWeight: 800 }}>
                {x.t}
              </span>
              <span className="t-meta">
                {makerOf(x)} · {x.y}
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

/** Why a list can't be opened (V3ProblemStates A2, A3): who removed it and when, or whose it is and the one way in. */
function NoList({ id }: { id: string }) {
  const toast = useToast();
  const [asked, setAsked] = useState(false);
  const a = accessOf(id);
  if (a?.k === 'gone') {
    return (
      <div className="ps-full">
        <h1 className="t-hero" style={{ fontSize: 44 }}>
          This list is gone
        </h1>
        <p className="dlg-p">{ACCESS_SAYS.gone(a.list)}</p>
        <ButtonLink to="/app">Back to your charts</ButtonLink>
        <span className="t-meta">Link: see.app/{a.list.by}/{a.id}</span>
      </div>
    );
  }
  if (a?.k === 'private') {
    return (
      <div className="ps-full">
        <h1 className="t-hero" style={{ fontSize: 44 }}>
          This list is private
        </h1>
        <p className="dlg-p">{ACCESS_SAYS.private(a.list)}</p>
        {asked ? (
          <p className="dlg-p" role="status">
            Asked. @{a.list.owner} will see your request; nothing else about the list is shown until they say yes.
          </p>
        ) : (
          <span style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={() => {
                setAsked(true);
                toast(`Request sent to @${a.list.owner}`);
              }}
            >
              Ask to join
            </Button>
            <ButtonLink to="/app" variant="quiet">
              Not now
            </ButtonLink>
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="ps-full">
      <h1 className="t-hero" style={{ fontSize: 44 }}>
        This list isn’t here
      </h1>
      <p className="dlg-p">It may have been deleted, or the link is wrong. Your lists are fine.</p>
      <ButtonLink to="/app">Back to Charts</ButtonLink>
    </div>
  );
}

/** An invite to a list (see://join/…): join it with one +, or, if it expired, ask for a new one (A4). */
export function JoinView() {
  const { code = '' } = useParams();
  const store = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [asked, setAsked] = useState(false);
  const inv = INVITES[code];
  if (!inv) {
    return (
      <div className="ps-full">
        <h1 className="t-hero" style={{ fontSize: 44 }}>
          This invite isn’t here
        </h1>
        <p className="dlg-p">The link may be cut short. Ask whoever sent it for a new one.</p>
        <ButtonLink to="/app">Back to Charts</ButtonLink>
      </div>
    );
  }
  if (inv.expired) {
    return (
      <div className="ps-full">
        <h1 className="t-hero" style={{ fontSize: 44 }}>
          This invite expired
        </h1>
        <p className="dlg-p">{ACCESS_SAYS.expired(inv)}</p>
        {asked ? (
          <p className="dlg-p" role="status">
            Asked. When @{inv.from} sends a new one, it opens here.
          </p>
        ) : (
          <Button
            onClick={() => {
              setAsked(true);
              toast(`Asked @${inv.from} for a new invite`);
            }}
          >
            Ask @{inv.from} again
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="ps-full">
      <span className="t-label">Invite · {inv.sent}</span>
      <h1 className="t-hero" style={{ fontSize: 44 }}>
        {inv.list.name}
      </h1>
      <p className="dlg-p">{ACCESS_SAYS.invite(inv)}</p>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {inv.list.items.slice(0, 3).map((x, i) => (
          <li key={x} className="t-row-sm">
            <span className="t-rank" style={{ color: i === 0 ? 'var(--see-accent)' : 'var(--see-text-3)', marginRight: 12 }}>
              {pad2(i + 1)}
            </span>
            {titleOf(x)}
          </li>
        ))}
      </ol>
      <PlusCta
        big
        label="Join this list"
        onClick={() => {
          const r = joinInvite(inv, store.lists);
          if (r.fresh) store.dispatch({ type: 'addList', list: r.list });
          toast(r.fresh ? `You’re on ${inv.list.name} with @${inv.from}` : `You’re already on ${inv.list.name}`);
          navigate(`/app/l/${r.list.id}`);
        }}
      />
    </div>
  );
}

/**
 * A list's name is a button (V3ListsLive): tap it and it becomes the field, same size, same place. As you type, the
 * line under it says what the name now reads as; Enter saves (and moves the list if it now belongs somewhere else,
 * with Undo), Esc puts it back.
 */
function TitleField({ L, size }: { L: List; size: number }) {
  const store = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(L.name);
  const cats = store.categories.map((c) => c.id);
  const read = readName(name, cats);
  const moves = !!read && read.cat !== L.cat;
  const save = () => {
    const n = name.trim();
    setEditing(false);
    if (!n || n === L.name) return setName(L.name);
    const before = { name: L.name, cat: L.cat };
    store.rename(L.id, n);
    if (moves && read) {
      store.dispatch({ type: 'moveList', id: L.id, cat: read.cat });
      toast(`Moved to ${read.cat}`, () => {
        store.rename(L.id, before.name);
        store.dispatch({ type: 'moveList', id: L.id, cat: before.cat });
      });
    } else toast('Renamed');
  };
  if (!editing) {
    return (
      <h1 className="t-hero lv-title" style={{ fontSize: size }}>
        <button type="button" onClick={() => (setName(L.name), setEditing(true))} aria-label={`${L.name}. Rename`} style={{ all: 'unset', cursor: 'text' }}>
          {L.name}
        </button>
      </h1>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        className="t-hero lv-title"
        value={name}
        autoFocus
        aria-label="List name"
        onChange={(e) => setName(e.target.value.slice(0, 60))}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setName(L.name);
            setEditing(false);
          }
        }}
        style={{ fontSize: size, background: 'transparent', border: 0, borderBottom: '2px solid var(--see-accent)', color: 'var(--see-text)', width: '100%', padding: 0 }}
      />
      <span className="t-meta" style={{ whiteSpace: 'normal' }} role="status">
        {moves && read ? `Reads as ${read.cat} (“${read.word}”). Saving moves it there.` : read ? `Reads as ${read.cat}. It stays here.` : 'See can’t tell where this goes, so it stays here.'} Enter saves · Esc cancels
      </span>
    </div>
  );
}
