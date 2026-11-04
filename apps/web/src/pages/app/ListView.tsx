import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { PlusBox } from '../../brand/marks';
import { PlusField } from '../../brand/PlusField';
import { ReadChip } from '../../components/controls';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { BY_ID, COLS, KIND_PL, PEOPLE, PERIODS, belowTheLine, kindOf, makerOf, moveEntry, moveOf, pad2, placeAt, removeAt, search, slotsOf, titleOf, type Entry, type List } from '@see/core';
import { usePhone } from '../../lib/useMediaQuery';

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
  if (!L) return <Navigate to="/app" replace />;
  return <ListBody key={L.id} L={L} onNewList={onNewList} />;
}

function ListBody({ L, onNewList }: { L: List; onNewList: () => void }) {
  const store = useStore();
  const toast = useToast();
  const phone = usePhone();
  const siblings = store.listsIn(L.cat);
  const kind = kindOf(L);
  const cols = kind && kind !== 'mixed' ? COLS[kind] : [['By', 'm'] as [string, 'm' | 'a']];
  const slots = useMemo(() => slotsOf(L), [L]);
  const filled = slots.filter(Boolean).length;
  const firstOpen = slots.indexOf(null);
  const [focus, setFocus] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
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
          <h1 className="t-hero lv-title" style={{ fontSize: titleSize(L.name, phone) }}>
            {L.name}
          </h1>
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
              <Avatars handles={L.people} />
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
                      navigator.clipboard?.writeText(`${location.origin}/app/l/${L.id}`).catch(() => {});
                      setMenu(false);
                      toast('Link copied');
                    }}
                  >
                    <Icon name="share" size={16} /> Share
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
            return <Slot key={`slot-${ix}`} ix={ix} first={ix === firstOpen} kind={kind} taken={L.items} onPick={(x) => add(ix, x)} />;
          }
          const x = BY_ID[xid];
          const mv = moveOf(L, xid, ix);
          const isDrag = drag?.from === ix;
          const isPlaying = playing === xid;
          const rink = ix === focus ? 'var(--see-accent-text)' : ix < 3 ? 'var(--see-text)' : 'var(--see-text-4)';
          return (
            <div
              key={xid}
              role="listitem"
              className="lv-row"
              data-focus={ix === focus && !drag}
              data-playing={isPlaying}
              data-dragging={isDrag}
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
              <span className="t-move" aria-label={mv.aria} style={{ color: MOVE_INK[mv.tone] }}>
                {mv.t}
              </span>
              <button type="button" className="lv-name" onClick={() => setFocus(ix)} aria-label={`No. ${ix + 1}: ${x.t}, ${makerOf(x)}`}>
                <span className="t-row">{x.t}</span>
                <span className="t-meta lv-second">{makerOf(x)}</span>
              </button>
              {cols.map(([, key], ci) => (
                <span key={ci} className={`t-meta lv-cell lv-c${ci + 1}`}>
                  {key === 'm' && x.k === 'artist' ? 'Artist' : x[key]}
                </span>
              ))}
              <button
                type="button"
                className="icon-btn lv-play"
                aria-pressed={isPlaying}
                aria-label={`${isPlaying ? 'Pause' : 'Play'} ${x.t}`}
                onClick={() => setPlaying(isPlaying ? null : xid)}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? 'var(--see-accent)' : 'var(--see-text-2)'} />
              </button>
              <button
                type="button"
                className="lv-grip"
                aria-label={`Move ${x.t}: drag, or use the arrow keys. Delete takes it off`}
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
            </div>
          );
        })}
      </div>

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
function Slot({ ix, first, kind, taken, onPick }: { ix: number; first: boolean; kind: ReturnType<typeof kindOf>; taken: (string | null)[]; onPick: (x: Entry) => void }) {
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
