import { useEffect, useMemo, useRef, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { PlusBox } from '../../brand/marks';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { KIND_WORD, kindOf, search, type Entry, type List } from '../../data/seed';

function useAddTo() {
  const store = useStore();
  const toast = useToast();
  return (L: List | undefined, x: Entry) => {
    if (!L) {
      toast(`${x.t}: open a list to add it`);
      return;
    }
    if (L.items.includes(x.id)) {
      toast(`Already on ${L.name}`);
      return;
    }
    const slots = Array.from({ length: L.n }, (_, i) => L.items[i] ?? null);
    const i = slots.indexOf(null);
    if (i < 0) {
      store.setItems(L.id, [...L.items, x.id]);
      toast(`Below the line on ${L.name}`);
      return;
    }
    slots[i] = x.id;
    store.setItems(L.id, slots);
    toast(`${x.t} in at No. ${i + 1}`);
  };
}

function Result({ x, onAdd }: { x: Entry; onAdd: () => void }) {
  return (
    <div className="find__item">
      <span className="find__thumb" aria-hidden="true" />
      <span className="find__text">
        <span className="t-row">{x.t}</span>
        <span className="t-meta">
          {KIND_WORD[x.k]} · {x.m} · {x.y}
        </span>
      </span>
      <button type="button" className="bb" onClick={onAdd} aria-label={`Add ${x.t}`} style={{ width: 44, height: 44 }}>
        <PlusBox height={20} />
      </button>
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
  const results = useMemo(() => search(q, L ? kindOf(L) : ''), [q, L]);
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
  const [q, setQ] = useState('');
  const results = useMemo(() => search(q), [q]);
  const store = useStore();
  const addTo = useAddTo();
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
      </div>
      <span className="t-foot">{target ? `+ adds to ${target.name}` : ''}</span>
    </div>
  );
}
