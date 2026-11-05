import { useEffect, useMemo, useRef, useState } from 'react';
import { useMatch, useSearchParams } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { PlusBox } from '../../brand/marks';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePlayer } from './player';
import { KIND_WORD, addToList, didYouMean, kindFor, kindOf, search, type Entry, type List } from '@see/core';

function useAddTo() {
  const store = useStore();
  const toast = useToast();
  return (L: List | undefined, x: Entry) => {
    if (!L) {
      toast(`${x.t}: open a list to add it`);
      return;
    }
    const r = addToList(L, x.id);
    if ('already' in r) {
      toast(`Already on ${L.name}`);
      return;
    }
    store.replaceList(r.list);
    toast(r.below ? `Below the line on ${L.name}` : `${x.t} in at No. ${r.at + 1}`);
  };
}

/** Nothing matches: add what was typed as your own item, onto the list in view. */
function useAddOwn() {
  const store = useStore();
  const toast = useToast();
  const addTo = useAddTo();
  return (L: List | undefined, q: string) => {
    if (!L) {
      toast('Open a list to add your own');
      return;
    }
    const cat = store.categories.find((c) => c.id === L.cat)?.name;
    addTo(L, store.addOwn(q, kindFor(L, cat)));
  };
}

function Result({ x, onAdd }: { x: Entry; onAdd: () => void }) {
  const player = usePlayer();
  return (
    <div className="find__item">
      <span className="find__thumb" aria-hidden="true" />
      <button type="button" className="find__text" style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left', color: 'inherit' }} onClick={() => player.play(x.id, { listId: null, view: 'sheet' })} aria-label={`Open ${x.t}`}>
        <span className="t-row">{x.t}</span>
        <span className="t-meta">
          {KIND_WORD[x.k]} · {x.m} · {x.y}
        </span>
      </button>
      <button type="button" className="bb" onClick={onAdd} aria-label={`Add ${x.t}`} style={{ width: 44, height: 44 }}>
        <PlusBox height={20} />
      </button>
    </div>
  );
}

/** Nothing matched: says what was searched, offers the nearest real match, and how to go on. */
function NoMatch({ q, onPick, onOwn }: { q: string; onPick: (x: Entry) => void; onOwn: () => void }) {
  const near = didYouMean(q);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px 12px' }}>
      <b style={{ fontSize: 14 }}>Nothing matches “{q}”</b>
      <span className="t-meta" style={{ whiteSpace: 'normal' }}>
        Check the spelling, or add it as your own item. You can link a source later.
      </span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button size="sm" onClick={onOwn}>
          Add “{q.trim()}”
        </Button>
        {near && (
          <button type="button" className="choice" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--see-font-body)', fontWeight: 600 }} onClick={() => onPick(near)}>
            Did you mean {near.t} · {near.m}?
          </button>
        )}
      </span>
    </div>
  );
}

/** Desktop: the corner pill. Its field sits on the floor; results rise above it. */
export function FindPill() {
  const store = useStore();
  const lid = useMatch('/app/l/:id')?.params.id;
  const L = lid ? store.list(lid) : undefined;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const addTo = useAddTo();
  const addOwn = useAddOwn();
  // nothing typed yet: what your connected services found comes first
  const results = useMemo(() => {
    if (q.trim()) return search(q, L ? kindOf(L) : '');
    const k = L ? kindOf(L) : '';
    const found = (store.own ?? []).filter((x) => x.src.length && (!k || k === 'mixed' || x.k === k)).slice(-6).reverse();
    return [...found, ...search('', k)].slice(0, 6);
  }, [q, L, store.own]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div className="find" data-open={open} ref={ref}>
      {open && (
        <div className="find__results" role="region" aria-label="Results">
          {results.map((x) => (
            <Result key={x.id} x={x} onAdd={() => addTo(L, x)} />
          ))}
          {q.trim() && results.length === 0 && (
            <NoMatch
              q={q}
              onPick={(x) => setQ(x.t)}
              onOwn={() => {
                addOwn(L, q);
                setQ('');
              }}
            />
          )}
          <span className="t-foot" style={{ paddingTop: 4 }}>
            <b style={{ color: 'var(--see-text)', fontWeight: 600 }}>{q ? 'Results' : 'Ideas'}</b> · + {L ? `adds to ${L.name}` : 'picks a list for it'}
          </span>
        </div>
      )}
      <div className="find__pill">
        <Icon name="search" size={20} color="var(--see-text-3)" />
        <input
          type="text"
          role="searchbox"
          value={q}
          placeholder={L ? `Find something for ${L.name}` : 'Find songs, films, people'}
          aria-label={L ? `Find something for ${L.name}` : 'Find songs, films, people'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {open && (
          <button
            type="button"
            className="icon-btn find__x"
            aria-label="Close Find"
            onClick={() => {
              setQ('');
              setOpen(false);
            }}
          >
            <Icon name="close" size={18} color="var(--see-text)" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Phones: Find is its own tab. */
export function FindView() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const results = useMemo(() => search(q), [q]);
  const store = useStore();
  const addTo = useAddTo();
  const addOwn = useAddOwn();
  const target = store.lists.find((L) => L.pinned);
  return (
    <div style={{ padding: '8px var(--gutter) 120px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <div className="find__pill" style={{ borderColor: 'var(--see-accent)' }}>
        <Icon name="search" size={20} color="var(--see-text-3)" />
        <input type="text" role="searchbox" value={q} autoFocus placeholder="Find songs, films, people" aria-label="Find songs, films, people" onChange={(e) => setQ(e.target.value)} />
      </div>
      <div role="region" aria-label="Results">
        {results.map((x) => (
          <Result key={x.id} x={x} onAdd={() => addTo(target, x)} />
        ))}
        {q.trim() && results.length === 0 && (
          <NoMatch
            q={q}
            onPick={(x) => setQ(x.t)}
            onOwn={() => {
              addOwn(target, q);
              setQ('');
            }}
          />
        )}
      </div>
      <span className="t-foot">{target ? `+ adds to ${target.name}` : ''}</span>
    </div>
  );
}
