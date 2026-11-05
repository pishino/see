import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { aboutOf, addToList, clock, isVideo, kickerOf, kindOf, makerLine, moreLikeIt, nextInList, notHereLine, playWord, sourceName, sourceUrl, sourcesOf, whereItRanks, type Entry } from '@see/core';
import { useSettings } from '@see/core/react';
import { artFor, paint } from '../../brand/art';
import { Icon } from '../../brand/Icon';
import { LOGOS } from '../../brand/logos';
import { PlusBox } from '../../brand/marks';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePhone } from '../../lib/useMediaQuery';
import { silent, usePlayer } from './player';
import { MakerLink } from './PersonLink';
import { BuyLine } from '../../components/Ads';
import './player.css';


/** The entry's picture, drawn at the size it is shown. */
export function Picture({ xid, className }: { xid: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => paint(cv, artFor(xid));
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [xid]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export function PlayGlyph({ playing, size = 16, color = 'var(--see-on-flare)' }: { playing: boolean; size?: number; color?: string }) {
  return <Icon name={playing ? 'pause' : 'play'} size={size} color={color} />;
}

function Progress({ className }: { className?: string }) {
  const p = usePlayer();
  const pct = p.duration ? (p.t / p.duration) * 100 : 0;
  return (
    <div className={`pl-prog ${className ?? ''}`}>
      <span className="pl-time">{clock(p.t)}</span>
      <input
        type="range"
        min={0}
        max={p.duration}
        step={1}
        value={Math.floor(p.t)}
        aria-label="Where it is"
        aria-valuetext={`${clock(p.t)} of ${clock(p.duration)}`}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => p.seek(Number(e.target.value))}
      />
      <span className="pl-time">{clock(p.duration)}</span>
    </div>
  );
}

/** Add to a list: lists that rank this kind of thing first. */
function AddMenu({ x, onDone }: { x: Entry; onDone: () => void }) {
  const store = useStore();
  const toast = useToast();
  const fits = store.lists.filter((L) => !L.items.includes(x.id)).sort((a, b) => Number(kindOf(b) === x.k) - Number(kindOf(a) === x.k));
  return (
    <div role="menu" className="menu pl-addmenu">
      {fits.slice(0, 6).map((L) => (
        <button
          key={L.id}
          type="button"
          role="menuitem"
          onClick={() => {
            const r = addToList(L, x.id);
            if (!('already' in r)) {
              store.replaceList(r.list);
              toast(r.below ? `Below the line on ${L.name}` : `${x.t} in at No. ${r.at + 1} on ${L.name}`);
            }
            onDone();
          }}
        >
          <PlusBox height={14} />
          {L.name}
        </button>
      ))}
      {fits.length === 0 && <span className="t-meta" style={{ padding: '10px 16px' }}>On every list already</span>}
    </div>
  );
}

/**
 * The sheet: the picture, and beside it (or under it, on phones) the details, rank first.
 * While it plays and nothing moves, the details step back after 3 s and the controls after 5 s.
 */
export function PlayerSheet() {
  const p = usePlayer();
  const store = useStore();
  const toast = useToast();
  const { settings } = useSettings();
  const phone = usePhone();
  const [tab, setTab] = useState<'about' | 'play' | 'more'>('about');
  const [adding, setAdding] = useState(false);
  const [idle, setIdle] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const restT = useRef<number[]>([]);
  const overDetails = useRef(false);
  const x = p.entry;

  // when nothing moves: details step back at 3 s, the controls at 5 s; any movement brings both back
  const wake = () => {
    setIdle(0);
    restT.current.forEach(window.clearTimeout);
    if (phone || !p.playing) return;
    restT.current = [
      window.setTimeout(() => !overDetails.current && setIdle(1), 3000),
      window.setTimeout(() => !overDetails.current && setIdle(2), 5000),
    ];
  };
  useEffect(() => {
    wake();
    return () => restT.current.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.playing, p.xid, phone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.setView('mini');
      else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        p.toggle();
      }
      wake();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    setTab('about');
    setSource(null);
  }, [p.xid]);

  if (!x) return null;
  const places = whereItRanks(x.id, store.lists);
  const best = places[0];
  const sources = sourcesOf(x, settings.playOrder);
  const from = source ?? sources[0];
  const word = playWord(x);
  const more = moreLikeIt(x);
  const next = p.listId ? nextInList(store.list(p.listId), x.id) : null;

  return (
    <div className="pl" role="dialog" aria-modal="true" aria-label={`${x.t}: player`} data-idle={idle} onPointerMove={wake}>
      <div className="pl-pic">
        <Picture xid={x.id} className="pl-art" />
        <div className="pl-shade" aria-hidden="true" />
        <div className="pl-ctrl">
          <button type="button" className="icon-btn pl-top-l" onClick={() => p.setView('mini')} aria-label="Minimise: keeps playing">
            <Icon name="down" size={20} color="#F4F5F2" />
          </button>
          <button type="button" className="pl-bigplay" onClick={p.toggle} aria-label={p.playing ? 'Pause' : word.verb}>
            <PlayGlyph playing={p.playing} size={phone ? 18 : 22} />
          </button>
          <Progress className="pl-prog--pic" />
          {!isVideo(x) && !x.notHere && (
            <span className="pl-audio" aria-hidden="true">
              {word.what} · {from}
            </span>
          )}
          {x.notHere && (
            <div className="pl-nothere" role="status">
              <span className="t-label">Preview · {sourceName(x.notHere)}</span>
              <b>{notHereLine(x)}</b>
              <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {next && (
                  <button type="button" className="btn btn--sm" onClick={() => p.play(next, { listId: p.listId })}>
                    Play No. {(places.find((pl) => pl.listId === p.listId)?.rank ?? 0) + 1}
                  </button>
                )}
                <a className="btn btn--sm btn--quiet" href={sourceUrl(x, sourceName(x.notHere))} target="_blank" rel="noreferrer">
                  Open on {sourceName(x.notHere)}
                </a>
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="pl-det"
        onPointerEnter={() => {
          overDetails.current = true;
          setIdle(0);
        }}
        onPointerLeave={() => {
          overDetails.current = false;
          wake();
        }}
      >
        <div className="pl-top-r">
          <button
            type="button"
            className="icon-btn"
            aria-label="Share"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}${import.meta.env.BASE_URL}open?link=see://entry/${x.id}`).catch(() => {});
              toast('Link copied');
            }}
          >
            <Icon name="share" size={18} color="var(--see-text-2)" />
          </button>
          <button type="button" className="icon-btn" aria-label="Close the player" onClick={p.close}>
            <Icon name="close" size={18} color="var(--see-text)" />
          </button>
        </div>

        <div className="pl-rank">
          {best ? (
            <>
              <span className="pl-n" aria-hidden="true">
                {best.rank}
              </span>
              <span>
                <b>
                  No. {best.rank} in {best.name}
                </b>
                <span className="t-meta">
                  on {places.length} of your {places.length === 1 ? 'list' : 'lists'}
                </span>
              </span>
            </>
          ) : (
            <span>
              <b>Not on your lists yet</b>
              <span className="t-meta">Add puts it in the first open place</span>
            </span>
          )}
        </div>

        <span className="t-label">{kickerOf(x)}</span>
        <h1 className="t-hero pl-title">{x.t}</h1>
        <span className="t-meta" style={{ whiteSpace: 'normal' }}>
          <MakerLine x={x} />
        </span>

        <div className="pl-acts">
          {!silent(x.id) && (
            <button type="button" className="btn btn--sm" onClick={p.toggle}>
              <PlayGlyph playing={p.playing} size={12} />
              {p.playing ? 'Pause' : 'Play'}
            </button>
          )}
          <span style={{ position: 'relative' }}>
            <button type="button" className="btn btn--sm btn--quiet" aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
              <PlusBox height={14} />
              Add
            </button>
            {adding && <AddMenu x={x} onDone={() => setAdding(false)} />}
          </span>
        </div>

        <div role="tablist" aria-label="About this" className="pl-tabs">
          {(
            [
              ['about', 'About'],
              ['play', isVideo(x) ? 'Watch' : 'Listen'],
              ['more', 'More'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'about' && (
          <div className="pl-body" role="tabpanel">
            <p>{aboutOf(x)}</p>
            <BuyLine xid={x.id} />
            <h2 className="t-label">{word.what}</h2>
            <button type="button" className="pl-line" onClick={p.toggle}>
              <Icon name="play" size={10} color="var(--see-accent)" />
              <span>{word.what}</span>
              <span className="t-meta">
                {clock(p.duration)} · {from}
              </span>
            </button>
            {places.length > 0 && (
              <>
                <h2 className="t-label">Where it ranks</h2>
                {places.map((pl) => (
                  <Link key={pl.listId} to={`/app/l/${pl.listId}`} className="pl-line" onClick={() => p.setView('mini')}>
                    <b className="t-rank" style={{ color: 'var(--see-accent-text)', fontSize: 12 }}>
                      No. {pl.rank}
                    </b>
                    <span>Your list · {pl.name}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'play' && (
          <div className="pl-body" role="tabpanel">
            <p className="t-meta" style={{ whiteSpace: 'normal' }}>
              It plays from its source; See never hosts it. The first one that has it wins (Settings › Playback).
            </p>
            {sources.map((n) => (
              <button
                key={n}
                type="button"
                className="pl-line"
                aria-pressed={from === n}
                onClick={() => {
                  setSource(n);
                  toast(`Plays from ${n}`);
                }}
              >
                {LOGOS[n] ? <img src={LOGOS[n]} alt="" width={16} height={16} style={{ objectFit: 'contain' }} /> : <span className="pl-slot" aria-hidden="true" />}
                <span>{n}</span>
                <span className="t-meta">{from === n ? 'Playing from here' : 'Play from here'}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'more' && (
          <div className="pl-body" role="tabpanel">
            {more.map((y) => (
              <button key={y.id} type="button" className="pl-line pl-more" onClick={() => p.play(y.id, { listId: null })}>
                <Picture xid={y.id} className="pl-thumb" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                    {y.t}
                  </b>
                  <span className="t-meta">{makerLine(y)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Minimised: a card bottom right on wide screens, a bar above the tabs on phones. It keeps playing.
 * A video adds its picture on top of the bar, 16:9, so you keep ranking while it plays; click it (or ↗) to grow.
 */
export function MiniPlayer() {
  const p = usePlayer();
  const phone = usePhone();
  const x = p.entry;
  if (!x) return null;
  const pct = p.duration ? (p.t / p.duration) * 100 : 0;
  const pic = isVideo(x) && !phone;
  return (
    <div className="pl-dock" role="region" aria-label={`Now playing: ${x.t}${x.m ? ` by ${x.m}` : ''}, ${clock(p.t)} of ${clock(p.duration)}`}>
      {pic && (
        <button type="button" className="pl-dock__pic" onClick={() => p.setView('sheet')} aria-label={`Make ${x.t} bigger`}>
          <Picture xid={x.id} className="pl-dock__img" />
          <span className="pl-dock__grow" aria-hidden="true">
            ↗
          </span>
        </button>
      )}
      <div className="pl-mini">
        <button type="button" className="pl-mini__open" onClick={() => p.setView('sheet')} aria-label={`Open ${x.t}`}>
          {!pic && <Picture xid={x.id} className="pl-mini__art" />}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, paddingLeft: pic ? 14 : 0 }}>
            <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
              {x.t}
            </b>
            <span className="t-meta">{makerLine(x)}</span>
          </span>
        </button>
        <button type="button" className="icon-btn" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}>
          <PlayGlyph playing={p.playing} size={16} color="var(--see-text)" />
        </button>
        <button type="button" className="icon-btn" onClick={p.close} aria-label="Stop and close">
          <Icon name="close" size={14} color="var(--see-text-3)" />
        </button>
        <span className="pl-mini__bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}

/** The line under the title, with the maker's name as a link to their page. */
function MakerLine({ x }: { x: Entry }) {
  const line = makerLine(x);
  const at = x.m ? line.indexOf(x.m) : -1;
  if (at < 0 || x.own) return <>{line}</>;
  return (
    <>
      {line.slice(0, at)}
      <MakerLink name={x.m} />
      {line.slice(at + x.m.length)}
    </>
  );
}
