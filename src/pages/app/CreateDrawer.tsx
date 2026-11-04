import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../brand/Icon';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { SIZE_STOPS } from '../../data/seed';

/** How See reads a name: the words that point at a category. */
function suggestCategory(name: string, cats: string[]): string | null {
  const n = name.toUpperCase();
  const rules: [RegExp, string[]][] = [
    [/SONG|ALBUM|ARTIST|VIDEO|MUSIC|AFRO|RAP|JAZZ|POP|TRACK|PLAYLIST/, ['MUSIC']],
    [/FILM|MOVIE|CINEMA|DIRECTOR|HORROR/, ['MOVIES', 'FILMS']],
    [/\bTV\b|SHOW|SERIES|ANIME|SEASON/, ['TV', 'SHOWS']],
    [/BOOK|NOVEL|READ/, ['BOOKS']],
    [/GAME/, ['GAMES']],
    [/TEAM|CLUB|PLAYER|MATCH|LEAGUE|FOOTBALL/, ['TEAMS', 'SPORTS']],
  ];
  for (const [re, ids] of rules) {
    if (re.test(n)) return ids.find((id) => cats.includes(id)) ?? ids[0];
  }
  return null;
}

/** Create: name the list first; See suggests the category. A drawer from the right; a sheet on phones. */
export function CreateDrawer({ defaultCategory, onClose }: { defaultCategory: string; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [cat, setCat] = useState<string | null>(defaultCategory || null);
  const [touched, setTouched] = useState(false);
  const [size, setSize] = useState(10);
  const input = useRef<HTMLInputElement>(null);
  const cats = store.categories.map((c) => c.id);
  const suggested = useMemo(() => suggestCategory(name, cats), [name, cats]);
  const chosen = touched ? cat : (suggested ?? cat);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const options = chosen && !cats.includes(chosen) ? [...cats, chosen] : cats;
  const ready = name.trim().length > 0 && !!chosen;

  const create = () => {
    if (!ready || !chosen) return;
    if (!cats.includes(chosen)) store.addCategory(chosen);
    const L = store.addList(chosen, name.trim());
    if (size !== 10) store.setSize(L.id, size);
    toast(`${L.name} is saved`);
    onClose();
    navigate(`/app/l/${L.id}`);
  };

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="create-title" className="drawer">
        <div className="drawer__head">
          <h2 id="create-title" className="t-label">
            New list
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} color="var(--see-text)" />
          </button>
        </div>
        <form
          className="drawer__body"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="t-label">Name it</span>
            <input ref={input} className="create-name" value={name} placeholder="Albums of 2026" onChange={(e) => setName(e.target.value)} maxLength={60} />
            <span className="t-foot">{suggested && !touched ? `See reads it as ${suggested.toLowerCase()}.` : 'See suggests the category as you type.'}</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="t-label" id="cat-l">
              Category
            </span>
            <div className="chip-row" role="group" aria-labelledby="cat-l">
              {options.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="choice"
                  aria-pressed={chosen === c}
                  onClick={() => {
                    setTouched(true);
                    setCat(c);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="t-label" id="size-l">
              Size
            </span>
            <div className="chip-row" role="group" aria-labelledby="size-l">
              {SIZE_STOPS.map((n) => (
                <button key={n} type="button" className="choice" aria-pressed={size === n} onClick={() => setSize(n)}>
                  Top {n}
                </button>
              ))}
            </div>
          </div>
        </form>
        <div className="drawer__foot">
          <span className="t-meta">{ready ? `Top ${size} · ${chosen!.toLowerCase()}` : 'Name it to start'}</span>
          <Button onClick={create} disabled={!ready}>
            Create
          </Button>
        </div>
      </div>
    </>
  );
}
