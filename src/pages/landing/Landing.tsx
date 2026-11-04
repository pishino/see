import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryTag, PLUS_12, CHECK_12, Wordmark } from '../../brand/marks';
import { useToast } from '../../components/Toast';
import { usePhone } from '../../lib/useMediaQuery';
import { ITEMS, buildWall, paint, type ArtKind } from './art';
import { FLAGS } from './flags';
import './landing.css';

import spotify from '../../assets/logos/spotify.png';
import youtube from '../../assets/logos/youtube.png';
import netflix from '../../assets/logos/netflix.png';
import letterboxd from '../../assets/logos/letterboxd.png';
import imdb from '../../assets/logos/imdb.png';
import deezer from '../../assets/logos/deezer.png';
import discord from '../../assets/logos/discord.png';
import reddit from '../../assets/logos/reddit.png';
import instagram from '../../assets/logos/instagram.png';
import xLogo from '../../assets/logos/x.png';
import tiktok from '../../assets/logos/tiktok.png';
import snapchat from '../../assets/logos/snapchat.png';
import messages from '../../assets/logos/messages.png';
import embed from '../../assets/logos/embed.png';

const WORDS = ['MUSIC', 'FILMS', 'SHOWS', 'BOOKS', 'PODCASTS', 'GAMES', 'TEAMS', 'ARTISTS', 'ANYTHING'];
const KIND: Record<string, ArtKind> = { MUSIC: 'ALBUM', FILMS: 'FILM', SHOWS: 'SHOW', BOOKS: 'BOOK', PODCASTS: 'POD', GAMES: 'GAME', TEAMS: 'MATCH', ARTISTS: 'ARTIST' };
const TAGW: Record<ArtKind, string> = { ALBUM: 'MUSIC', FILM: 'FILMS', SHOW: 'SHOWS', BOOK: 'BOOKS', POD: 'PODCASTS', GAME: 'GAMES', MATCH: 'TEAMS', ARTIST: 'ARTISTS' };
const STEP = 120;
const STILL = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Logos on the strip, as supplied. White marks are reversed on the dark ground. */
const STRIP: [string, string, boolean][] = [
  ['Spotify', spotify, false], ['YouTube', youtube, false], ['Netflix', netflix, false], ['Letterboxd', letterboxd, false],
  ['IMDb', imdb, true], ['Deezer', deezer, false], ['Discord', discord, false], ['Reddit', reddit, false],
  ['Instagram', instagram, true], ['X', xLogo, true], ['TikTok', tiktok, true], ['Snapchat', snapchat, false], ['Messages', messages, true],
];

const PIX = {
  gold: 'M0 0h2v1h-2zM3 0h2v1h-2zM6 0h2v1h-2zM0 1h2v1h-2zM3 1h2v1h-2zM6 1h2v1h-2zM0 2h1v1h-1zM2 2h4v1h-4zM7 2h1v1h-1zM3 3h2v1h-2zM0 4h1v1h-1zM3 4h2v1h-2zM7 4h1v1h-1zM0 5h2v1h-2zM6 5h2v1h-2zM3 6h2v1h-2zM0 7h2v1h-2zM3 7h2v1h-2zM6 7h2v1h-2z',
  tunde: 'M0 0h8v1h-8zM0 1h8v1h-8zM0 2h3v1h-3zM5 2h3v1h-3zM0 3h1v1h-1zM2 3h4v1h-4zM7 3h1v1h-1zM3 4h2v1h-2zM0 5h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM7 5h1v1h-1zM0 7h8v1h-8z',
  kemi: 'M0 0h2v1h-2zM3 0h2v1h-2zM6 0h2v1h-2zM0 1h2v1h-2zM3 1h2v1h-2zM6 1h2v1h-2zM1 2h1v1h-1zM3 2h2v1h-2zM6 2h1v1h-1zM0 3h1v1h-1zM3 3h2v1h-2zM7 3h1v1h-1zM3 4h2v1h-2zM1 5h2v1h-2zM5 5h2v1h-2zM0 6h3v1h-3zM5 6h3v1h-3zM0 7h8v1h-8z',
};

function Pix({ d, color, size }: { d: string; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden="true" shapeRendering="crispEdges" style={{ background: 'var(--see-surface-2)', flexShrink: 0 }}>
      <path d={d} fill={color} />
    </svg>
  );
}

function Plus({ size, color = 'currentColor', check }: { size: number; color?: string; check?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d={check ? CHECK_12 : PLUS_12} fill={color} />
    </svg>
  );
}

/** A small + box for section labels and the + call to action. */
function MiniBox({ h = 11 }: { h?: number }) {
  return (
    <svg width={(h * 38) / 28} height={h} viewBox="0 0 38 28" aria-hidden="true">
      <path d="M4.5 0L38 0L33.5 28L0 28ZM17.5 5.5L17.5 12.5L10.5 12.5L10.5 15.5L17.5 15.5L17.5 22.5L20.5 22.5L20.5 15.5L27.5 15.5L27.5 12.5L20.5 12.5L20.5 5.5Z" fill="var(--see-flare)" />
    </svg>
  );
}

function Flag({ name, width }: { name: string; width: number }) {
  const inner = FLAGS.find((f) => f[0] === name)?.[1] ?? FLAGS[0][1];
  const id = `fl-${name}-${width}`;
  return (
    <svg width={width} height={(width * 28) / 38} viewBox="0 0 38 28" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d="M4.5 0L38 0L33.5 28L0 28Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {/* static flag drawings from the design's own data */}
        <svg x="0" y="0" width="38" height="28" viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: inner }} />
      </g>
    </svg>
  );
}

/** A canvas that paints one item's art at its own size. */
function Art({ i, className, framed }: { i: number; className?: string; framed?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const it = ITEMS[i % ITEMS.length];
    const draw = () => paint(cv, it, framed);
    draw();
    document.fonts?.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [i, framed]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/* ================================================================ the hero box */

type Wall = ReturnType<typeof buildWall>;

/**
 * The + box: it opens onto what people rank. Each word looks at one tile on the wall behind it; ANYTHING drifts;
 * pointing at it (a tap on phones) lets you look around, and its tag names what is under it.
 */
function HeroBox({ word, mode, desk, onHover }: { word: string; mode: 'word' | 'drift'; desk: boolean; onHover: (on: boolean) => void }) {
  const BH = desk ? 126 : 62;
  const PW = Math.round((BH * 38) / 28);
  const WIN = Math.round((BH * 16) / 9);
  const ANY = Math.round(BH * 2.6);
  const [wall, setWall] = useState<Wall | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dr = useRef({ cx: 0, oy: 0, row: 1, vel: 0, dir: 1, target: 0 });
  const pointer = useRef<number | null>(null);
  const [driftTag, setDriftTag] = useState('');
  const boxRef = useRef<HTMLSpanElement>(null);

  // the wall is drawn once the faces are in (book covers set their own type)
  useEffect(() => {
    let alive = true;
    const make = () => alive && setWall(buildWall(BH, desk ? 5200 : 3000, desk ? 1.5 : 2));
    if (document.fonts?.load) document.fonts.load('italic 400 20px Newsreader').then(make, make);
    else make();
    return () => {
      alive = false;
    };
  }, [BH, desk]);

  const views = useMemo(() => {
    const v: Record<string, { cx: number; oy: number }> = {};
    if (!wall) return v;
    WORDS.forEach((w, i) => {
      if (!KIND[w]) return;
      let c = wall.tiles.filter((t) => t.it.k === KIND[w] && Math.round(t.y) === wall.rowH && t.x > 500 && t.x < wall.w - 900);
      if (!c.length) c = wall.tiles.filter((t) => t.it.k === KIND[w] && t.x > 300);
      const t = c[i % c.length] ?? wall.tiles[0];
      v[w] = { cx: t.x + t.w / 2, oy: t.y };
    });
    return v;
  }, [wall]);

  const show = mode === 'drift' ? 'DRIFT' : word;
  const width = show === '+' ? PW : show === 'ANYTHING' ? ANY : WIN;

  const draw = useCallback(
    (cx: number, oy: number, w: number) => {
      const c = cv.current;
      if (!c || !wall) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const sc = wall.cv.width / wall.w;
      const left = Math.max(0, Math.min(wall.w - ANY, cx - w / 2));
      const top = Math.max(0, Math.min(wall.h - BH, oy));
      ctx.drawImage(wall.cv, left * sc, top * sc, ANY * sc, BH * sc, 0, 0, c.width, c.height);
    },
    [wall, ANY, BH],
  );

  // a still word: draw its tile once
  useEffect(() => {
    if (!wall || show === '+' || show === 'ANYTHING' || show === 'DRIFT') return;
    const v = views[show];
    if (!v) return;
    dr.current.cx = v.cx;
    dr.current.oy = v.oy;
    dr.current.row = Math.round(v.oy / wall.rowH);
    draw(v.cx, v.oy, WIN);
  }, [wall, show, views, draw, WIN]);

  // ANYTHING and DRIFT: a frame loop while the window looks at the moving wall
  useEffect(() => {
    if (!wall || (show !== 'ANYTHING' && show !== 'DRIFT')) return;
    const d = dr.current;
    if (!d.cx) {
      const v = views.MUSIC;
      d.cx = v?.cx ?? 1200;
      d.oy = v?.oy ?? wall.rowH;
    }
    let raf = 0;
    let last = performance.now();
    let lastTag = '';
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let vt = 0;
      if (show === 'DRIFT' && pointer.current !== null && desk) {
        vt = Math.max(-1, Math.min(1, pointer.current / 220)) * 560;
      } else if (show === 'ANYTHING' || (show === 'DRIFT' && !desk)) {
        vt = (show === 'DRIFT' ? 260 : 120) * d.dir;
      }
      if (STILL) vt = 0;
      d.vel += (vt - d.vel) * Math.min(1, dt * 3.2);
      d.cx += d.vel * dt;
      if (d.cx < 700) {
        d.cx = 700;
        d.vel = Math.abs(d.vel);
        d.dir = 1;
      }
      if (d.cx > wall.w - 700) {
        d.cx = wall.w - 700;
        d.vel = -Math.abs(d.vel);
        d.dir = -1;
      }
      d.oy += (d.row * wall.rowH - d.oy) * Math.min(1, dt * 5);
      const y = Math.round(d.oy / wall.rowH) * wall.rowH;
      const tile = wall.tiles.find((t) => Math.round(t.y) === Math.round(y) && d.cx >= t.x - 6 && d.cx < t.x + t.w);
      // when the pointer rests, settle on the tile under it
      if (show === 'DRIFT' && tile && Math.abs(vt) < 30) d.cx += (tile.x + tile.w / 2 - d.cx) * Math.min(1, dt * 3.6);
      draw(d.cx, d.oy, show === 'ANYTHING' ? ANY : WIN);
      if (show === 'DRIFT' && tile && TAGW[tile.it.k] !== lastTag) {
        lastTag = TAGW[tile.it.k];
        setDriftTag(lastTag);
      }
      if (!STILL) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [wall, show, views, draw, desk, ANY, WIN]);

  const tag = show === '+' ? '' : show === 'DRIFT' ? driftTag : show;

  return (
    <span
      ref={boxRef}
      className="lp-box"
      style={{ width }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(true)}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        pointer.current = null;
        onHover(false);
      }}
      onPointerMove={(e) => {
        const r = boxRef.current?.getBoundingClientRect();
        if (!r) return;
        pointer.current = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        dr.current.row = Math.max(0, Math.min(2, 1 + Math.round(dy / (BH * 0.8))));
      }}
      onClick={() => !desk && onHover(true)}
    >
      {show === '+' ? (
        <span className="lp-box__plus">
          <Plus size={Math.round((BH * 17) / 28)} />
        </span>
      ) : (
        <span className="lp-win" key={`win-${show}`}>
          <canvas ref={cv} width={ANY * 2} height={BH * 2} style={{ width: ANY, height: BH }} aria-hidden="true" />
        </span>
      )}
      {tag && (
        <span className="lp-tag" key={`tag-${tag}`}>
          {tag}
        </span>
      )}
    </span>
  );
}

/* ================================================================ the vignettes */

/** A list that reorders itself: a row climbs, glows, shows how far it moved. */
function ListVignette({
  head,
  right,
  rows,
  moves,
  square,
  events,
  footer,
  ppl,
}: {
  head: string;
  right: ReactNode;
  rows: { i: number; t: string; s: string }[];
  moves: [number, number][];
  square?: boolean;
  events?: string[];
  footer?: string;
  ppl?: boolean;
}) {
  const phone = usePhone();
  const H = phone ? 46 : 52;
  const [order, setOrder] = useState(rows.map((_, i) => i));
  const [hot, setHot] = useState<{ ri: number; d: number } | null>(null);
  const [ev, setEv] = useState(footer ?? '');
  const [evOn, setEvOn] = useState(true);
  useEffect(() => {
    if (STILL) return;
    let mi = 0;
    const ts: number[] = [];
    const iv = window.setInterval(() => {
      const [from, to] = moves[mi % moves.length];
      setOrder((o) => {
        const n = o.slice();
        const ri = n[from - 1];
        n.splice(from - 1, 1);
        n.splice(to - 1, 0, ri);
        setHot({ ri, d: from - to });
        return n;
      });
      if (events) {
        const text = events[mi % events.length];
        setEvOn(false);
        ts.push(window.setTimeout(() => {
          setEv(text);
          setEvOn(true);
        }, 300));
      }
      mi++;
      ts.push(window.setTimeout(() => setHot(null), 1600));
    }, 3200);
    return () => {
      window.clearInterval(iv);
      ts.forEach(window.clearTimeout);
    };
  }, [moves, events]);

  return (
    <div className={`vg vg-list${ppl ? ' vg-ppl' : ''}`}>
      <div className="vl-h">
        <span className="t-label" style={{ fontSize: 11 }}>
          {head}
        </span>
        {right}
      </div>
      <div className="vl-rows">
        {rows.map((r, ri) => {
          const pos = order.indexOf(ri);
          const isHot = hot?.ri === ri;
          return (
            <div key={ri} className="vl-r" data-top={pos === 0} data-hot={isHot} style={{ transform: `translateY(${pos * H}px)` }}>
              <span className="vl-n">{(pos < 9 ? '0' : '') + (pos + 1)}</span>
              <Art i={r.i} className={`vl-a${square ? ' sq' : ''}`} />
              <span className="vl-t">
                <b>{r.t}</b>
                <span>{r.s}</span>
              </span>
              <span className="vl-m">{isHot ? `▲${hot!.d}` : ''}</span>
            </div>
          );
        })}
      </div>
      {footer !== undefined && (
        <div className="vq-ev">
          <span className="vq-dot" />
          <span className="vq-tx" style={{ opacity: evOn ? 1 : 0 }}>
            {ev}
          </span>
        </div>
      )}
    </div>
  );
}

/** It plays while you rank: the rank steps back first, then the controls; a pointer brings both back. */
function PlayVignette() {
  const [f, setF] = useState(0);
  const last = useRef(performance.now());
  const hover = useRef(false);
  useEffect(() => {
    if (STILL) return;
    const iv = window.setInterval(() => {
      let t = performance.now() - last.current;
      if (t > 9000 && !hover.current) {
        last.current = performance.now();
        t = 0;
      }
      setF(hover.current ? 0 : t > 4400 ? 2 : t > 2600 ? 1 : 0);
    }, 200);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <div
      className="vg vg-play"
      data-f={f}
      onPointerMove={() => {
        last.current = performance.now();
      }}
      onPointerEnter={() => {
        hover.current = true;
      }}
      onPointerLeave={() => {
        hover.current = false;
      }}
    >
      <Art i={0} className="vp-art" />
      <div className="vp-shade" />
      <div className="vp-side">
        <span className="vp-n">3</span>
        <span className="vp-r">
          <b>No. 3 in See</b>
          <span>on 2,431 lists</span>
        </span>
      </div>
      <div className="vp-bar">
        <span className="vp-pl">
          <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.4L10.6 6L3 10.6Z" fill="#0B0F0E" />
          </svg>
        </span>
        <span className="vp-t">
          <b>The Last Ferry to Lekki</b>
          <span className="vp-pr">
            <i />
          </span>
        </span>
      </div>
    </div>
  );
}

/** Paste a link: it is typed, read, and the list fills. */
function LinkVignette() {
  const url = 'playlist.example/summer-in-lagos';
  const [n, setN] = useState(STILL ? url.length : 0);
  const [load, setLoad] = useState(false);
  const [rowsIn, setRowsIn] = useState(STILL ? 3 : 0);
  const [done, setDone] = useState(STILL);
  useEffect(() => {
    if (STILL) return;
    const ts: number[] = [];
    let iv = 0;
    const run = () => {
      setN(0);
      setLoad(false);
      setRowsIn(0);
      setDone(false);
      let i = 0;
      iv = window.setInterval(() => {
        i++;
        setN(i);
        if (i >= url.length) {
          window.clearInterval(iv);
          setLoad(true);
          ts.push(window.setTimeout(() => {
            setLoad(false);
            [1, 2, 3].forEach((k) => ts.push(window.setTimeout(() => setRowsIn(k), (k - 1) * 260)));
            ts.push(window.setTimeout(() => setDone(true), 3 * 260));
            ts.push(window.setTimeout(run, 5200));
          }, 1800));
        }
      }, 55);
    };
    run();
    return () => {
      window.clearInterval(iv);
      ts.forEach(window.clearTimeout);
    };
  }, []);
  const rows: [number, string, string][] = [
    [2, 'Paper Moons', 'Sade Lune'],
    [7, 'Ember', 'Ola Dara'],
    [16, 'Slow Burn FM', 'Kayode B.'],
  ];
  return (
    <div className="vg vg-link" data-load={load} data-done={done}>
      <div className="vk-f">
        <span className="vk-u">{url.slice(0, n)}</span>
        <span className="vk-c" />
        <span className="vk-go">
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 9h10.2l-4-4L10.6 3.6 17 10l-6.4 6.4-1.4-1.4 4-4H3z" fill="#0B0F0E" />
          </svg>
        </span>
      </div>
      <div className="vk-rows">
        {rows.map(([i, t, s], k) => (
          <div key={t} className="vk-r" data-in={rowsIn > k}>
            <Art i={i} className="vk-a" />
            <span>
              <b>{t}</b>
              <span className="t-meta">{s}</span>
            </span>
          </div>
        ))}
      </div>
      <span className="vk-s">Filled 3 of 10</span>
    </div>
  );
}

function FollowCta() {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className="pc" aria-pressed={on} aria-label={on ? 'Following' : 'Follow'} onClick={() => setOn((v) => !v)}>
      <span className="pc__in" style={on ? { background: 'var(--see-surface-2)', color: 'var(--see-flare)' } : undefined}>
        <Plus size={14} check={on} />
        <span className="pc__label" style={on ? { color: 'var(--see-text)' } : undefined}>
          {on ? 'Following' : 'Follow'}
        </span>
      </span>
    </button>
  );
}

function YouVignette() {
  return (
    <div className="vg vg-you">
      <div className="vy-top">
        <Pix d={PIX.tunde} color="#7FD18B" size={52} />
        <span className="vy-n">
          <b>TUNDE</b>
          <span className="t-meta">@tunde · 9 lists</span>
        </span>
        <FollowCta />
      </div>
      <div className="vy-tags">
        {(
          [
            ['MUSIC', '4 lists'],
            ['FILMS', '3 lists'],
            ['BOOKS', '2 lists'],
          ] as const
        ).map(([c, n]) => (
          <span key={c} className="vy-t">
            <CategoryTag name={c} height={13} color="var(--see-flare)" />
            <span className="t-meta">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================ the page */

const NEWS: [string, string, string][] = [
  ['Oct 28', 'MUSIC', 'Paper Moons by Sade Lune climbs to No. 1 in Albums of the year'],
  ['Oct 27', 'FILMS', 'The Last Ferry to Lekki holds No. 1 for a third week'],
  ['Oct 26', 'BOOKS', 'A Map Made of Salt comes in at No. 4'],
  ['Oct 24', 'GAMES', 'Okada Rush is on 733 new lists'],
  ['Oct 22', 'TEAMS', 'Derby Day, 3–2 tops Matches of the season'],
];

const MOVED: [number, string, string][] = [
  [0, 'No. 1', 'Films of 2025'],
  [2, 'No. 1', 'Albums of the year'],
  [1, 'No. 4', 'Books to start'],
  [8, 'No. 2', 'Games of 2025'],
  [4, 'No. 1', 'Matches of the season'],
  [3, 'No. 3', 'Shows to start'],
];

const INTEGRATIONS: [string, string, boolean, string][] = [
  ['Discord', discord, false, 'Rank in your server'],
  ['Reddit', reddit, false, 'Post a live list to a thread'],
  ['Your site', embed, true, 'A list on your site that keeps up'],
  ['Instagram', instagram, true, 'Share a card of your top 10'],
  ['Spotify', spotify, false, 'Fill a list from a playlist'],
  ['YouTube', youtube, false, 'Fill from a playlist or a channel'],
  ['Letterboxd', letterboxd, false, 'Fill from your watchlist'],
  ['Messages', messages, true, 'Send a list. It opens in See.'],
];

const COOKIE_KEY = 'see.cookies';

function SectionHead({ k, title }: { k: string; title: string }) {
  return (
    <div className="lo-sh">
      <span className="lo-k">
        <MiniBox />
        <span>{k}</span>
      </span>
      <h2 className="lo-h2">{title}</h2>
    </div>
  );
}

/** The landing: RANK [+]; scroll and the box opens onto what people rank; then what See does, in Devin's order. */
export default function Landing() {
  const navigate = useNavigate();
  const toast = useToast();
  const phone = usePhone();
  const desk = !phone;
  const hero = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  const [past, setPast] = useState(false);
  const [idle, setIdle] = useState(false);
  const [scrollWord, setScrollWord] = useState('+');
  const [hoverBox, setHoverBox] = useState(false);
  const [hoverCta, setHoverCta] = useState(false);
  const [country, setCountry] = useState('Nigeria');
  const [menu, setMenu] = useState(false);
  const [cookie, setCookie] = useState<'hidden' | 'open' | 'min' | 'gone'>('hidden');
  const flooding = useRef(false);

  // the page comes in; cookies ask once, then fold to a tab
  useEffect(() => {
    const t1 = window.setTimeout(() => setOn(true), 60);
    let decided = false;
    try {
      decided = !!localStorage.getItem(COOKIE_KEY);
    } catch {
      /* ask */
    }
    const ts: number[] = [];
    if (!decided) {
      ts.push(window.setTimeout(() => setCookie('open'), 1400));
      ts.push(window.setTimeout(() => setCookie((c) => (c === 'open' ? 'min' : c)), 11400));
    }
    // warm the sign-up screen so the flood lands on it
    import('../auth/SignUp');
    return () => {
      window.clearTimeout(t1);
      ts.forEach(window.clearTimeout);
    };
  }, []);

  // scroll: the words first, then the page
  useEffect(() => {
    let idleT = 0;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(idleT);
      idleT = window.setTimeout(() => setIdle(true), 5000);
    };
    const onScroll = () => {
      const top = hero.current?.getBoundingClientRect().top ?? 0;
      const n = Math.floor(-top / STEP);
      setScrollWord(n <= 0 ? '+' : WORDS[Math.min(n, WORDS.length) - 1]);
      setPast(-top > (desk ? 620 : 560) + WORDS.length * STEP);
      wake();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
      window.clearTimeout(idleT);
    };
  }, [desk]);

  // a tap on a phone looks around for a moment
  useEffect(() => {
    if (!hoverBox || desk) return;
    const t = window.setTimeout(() => setHoverBox(false), 2600);
    return () => window.clearTimeout(t);
  }, [hoverBox, desk]);

  const word = hoverCta ? 'ANYTHING' : idle ? '+' : scrollWord;
  const mode = hoverBox ? 'drift' : 'word';

  /** The flood: from whichever button was pressed, flare fills the screen, and sign up stands on it. */
  const flood = (from: HTMLElement | null, to: string) => {
    if (flooding.current) return;
    flooding.current = true;
    const r = from?.getBoundingClientRect();
    if (!r || STILL || !document.body.animate) {
      navigate(to);
      return;
    }
    const el = document.createElement('div');
    el.className = 'lp-flood';
    Object.assign(el.style, { left: '0px', top: '0px', width: '100vw', height: '100vh' });
    document.body.appendChild(el);
    const a = { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' };
    const b = { left: '0px', top: '0px', width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, clipPath: 'polygon(0px 0, 100% 0, calc(100% - 0px) 100%, 0 100%)' };
    const an = el.animate([a, b], { duration: 620, easing: 'cubic-bezier(.7,0,.2,1)' });
    an.onfinish = () => {
      window.scrollTo(0, 0);
      navigate(to);
      window.setTimeout(() => el.remove(), 400);
    };
  };

  const decideCookies = (v: string, text: string) => {
    try {
      localStorage.setItem(COOKIE_KEY, v);
    } catch {
      /* asks again next visit */
    }
    setCookie('gone');
    toast(text);
  };

  return (
    <div className="lp" data-on={on} data-past={past} data-idle={idle && !menu}>
      <div className="lp-tex" aria-hidden="true" />

      <button type="button" className="lp-mk" aria-label="see: back to the top" onClick={() => window.scrollTo({ top: 0, behavior: STILL ? 'auto' : 'smooth' })}>
        <Wordmark height={29.12} color="var(--see-on-flare)" />
      </button>

      <header className="lp-hd">
        <span className="lp-hd__r">
          <button type="button" className="lp-in" onClick={(e) => flood(e.currentTarget, '/login')}>
            Log in
          </button>
          <button type="button" className="pc" aria-label="Start ranking" onClick={(e) => flood(e.currentTarget.querySelector('.pc__in'), '/signup')}>
            <span className="pc__in">
              <Plus size={14} />
              <span className="pc__label">Start ranking</span>
            </span>
          </button>
        </span>
      </header>

      <button
        type="button"
        className="lp-flag"
        aria-label={`Ranking in ${country}. Change country`}
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((m) => !m)}
      >
        <Flag name={country} width={desk ? 52 : 42} />
      </button>
      {menu && (
        <div className="lp-menu" role="menu">
          {FLAGS.map(([name]) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="lp-mi"
              onClick={() => {
                setCountry(name);
                setMenu(false);
                toast(name);
              }}
            >
              <Flag name={name} width={28} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}

      <main>
        <section className="lp-hero" ref={hero} aria-label="Rank anything">
          <div className="lp-stage">
            <h1 className="lp-h1" aria-label="Rank anything">
              <span className="lp-rank" aria-hidden="true">
                RANK
              </span>
              <HeroBox word={word} mode={mode} desk={desk} onHover={setHoverBox} />
            </h1>
            <p className="lp-sub">Lists of anything, in your order.</p>
            <button
              type="button"
              className="lp-cta"
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverCta(true)}
              onPointerLeave={() => setHoverCta(false)}
              onClick={(e) => flood(e.currentTarget, '/signup')}
            >
              <span className="lp-cbox">
                <Plus size={11} />
              </span>
              Start ranking
            </button>
            <div className="lp-cue" aria-hidden="true" />
          </div>
        </section>

        <section className="lo-s lo-strip" aria-label="Fills from and shares to">
          <span className="lo-k">Fills from and shares to</span>
          <div className="lo-mq">
            <div className="lo-mqi">
              {[...STRIP, ...STRIP].map(([name, src, inv], i) => (
                <span key={i} className="lo-lg" aria-hidden={i >= STRIP.length || undefined}>
                  <img src={src} alt={i < STRIP.length ? name : ''} className={inv ? 'lo-inv' : undefined} />
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="lo-s">
          <SectionHead k="What it does" title="Your order, for everything" />
          <div className="lo-cards">
            <div className="lo-c w7">
              <div className="lo-cm">
                <ListVignette
                  head="Films of 2025"
                  right={<span className="t-meta">Yours · top 10</span>}
                  rows={[
                    { i: 0, t: 'The Last Ferry to Lekki', s: 'Film · 2025' },
                    { i: 6, t: 'Third Mainland, 4am', s: 'Film · 2025' },
                    { i: 9, t: 'Dry Season Static', s: 'Film · 2025' },
                    { i: 13, t: 'Gold Coast Rain', s: 'Film · 2025' },
                    { i: 3, t: 'Estate Wars', s: 'Show · 2024' },
                  ]}
                  moves={[
                    [3, 1],
                    [4, 2],
                    [1, 3],
                    [2, 4],
                  ]}
                />
              </div>
              <div className="lo-ct">
                <h3>Rank anything</h3>
                <p>Films, songs, books, teams. Put them in your order.</p>
              </div>
            </div>
            <div className="lo-c w5">
              <div className="lo-cm">
                <PlayVignette />
              </div>
              <div className="lo-ct">
                <h3>It plays while you rank</h3>
                <p>Previews open beside your list, then step back.</p>
              </div>
            </div>
            <div className="lo-c w4">
              <div className="lo-cm">
                <LinkVignette />
              </div>
              <div className="lo-ct">
                <h3>Paste a link. It fills.</h3>
                <p>A playlist, a watchlist or a chart.</p>
              </div>
            </div>
            <div className="lo-c w4">
              <div className="lo-cm">
                <ListVignette
                  ppl
                  square
                  head="Summer in Lagos"
                  right={
                    <span style={{ display: 'flex', gap: 4 }}>
                      <Pix d={PIX.gold} color="#F2C14E" size={26} />
                      <Pix d={PIX.tunde} color="#7FD18B" size={26} />
                      <Pix d={PIX.kemi} color="#7FD18B" size={26} />
                    </span>
                  }
                  rows={[
                    { i: 2, t: 'Paper Moons', s: 'Sade Lune' },
                    { i: 7, t: 'Ember', s: 'Ola Dara' },
                    { i: 16, t: 'Slow Burn FM', s: 'Kayode B.' },
                  ]}
                  moves={[
                    [2, 1],
                    [3, 2],
                    [1, 3],
                  ]}
                  footer="Three of you on this list"
                  events={['@ada moved Ember to No. 1', '@kemi moved Slow Burn FM to No. 2', '@tunde moved Paper Moons to No. 3']}
                />
              </div>
              <div className="lo-ct">
                <h3>Rank with your people</h3>
                <p>Share a list. Everyone can move it.</p>
              </div>
            </div>
            <div className="lo-c w4">
              <div className="lo-cm">
                <YouVignette />
              </div>
              <div className="lo-ct">
                <h3>Your page</h3>
                <p>Every list, by category. Follow anyone.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="lo-s">
          <SectionHead k="How it works" title="From a title to your No. 1" />
          <div className="lo-steps">
            <div className="lo-rl" aria-hidden="true">
              <i />
            </div>
            {(
              [
                ['01', 'Name it', 'Type a title. See suggests the category and the year.'],
                ['02', 'Fill it', 'Search, paste a link, or add as you go.'],
                ['03', 'Order it', 'Drag things into place. No one ranks for you.'],
                ['04', 'Share it', 'A page, a card or a live embed.'],
              ] as const
            ).map(([n, h, p]) => (
              <div key={n} className="lo-st">
                <span className="lo-sn" aria-hidden="true">
                  {n}
                </span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lo-s">
          <SectionHead k="Integrations" title="Take it anywhere" />
          <div className="lo-ig">
            {INTEGRATIONS.map(([name, src, inv, line]) => (
              <div key={name} className="lo-it">
                <span className="lo-il">
                  <img src={src} alt="" className={inv ? 'lo-inv' : undefined} />
                </span>
                <b>{name}</b>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lo-s">
          <SectionHead k="This week on See" title="What moved" />
          <div className="lo-cvs">
            {MOVED.map(([i, n, list]) => (
              <div key={list} className="lo-cv1">
                <Art i={i} className="lo-cva" framed />
                <span className="lo-cn">{n}</span>
                <span className="t-meta">{list}</span>
              </div>
            ))}
          </div>
          <div className="lo-news">
            {NEWS.map(([d, c, t]) => (
              <div key={t} className="lo-n">
                <span className="lo-nd">{d}</span>
                <span className="lo-nk">
                  <CategoryTag name={c} height={12} color="var(--see-flare)" />
                </span>
                <span className="lo-nt">{t}</span>
                <button type="button" className="lo-no" style={{ border: 0, background: 'transparent', padding: 0 }} onClick={(e) => flood(e.currentTarget, '/signup')}>
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="lo-s">
          <SectionHead k="Privacy" title="Yours alone" />
          <div className="lo-bs">
            <span className="lo-b">Private until you share</span>
            <span className="lo-b">No one ranks for you</span>
            <span className="lo-b">Leave in one step</span>
          </div>
          <div className="lo-pcs">
            <div className="lo-pc">
              <h3>Your lists</h3>
              <ul>
                <li>Only people you add can move them.</li>
                <li>Block anyone. They aren’t told.</li>
                <li>Your page shows only what you choose.</li>
              </ul>
            </div>
            <div className="lo-pc">
              <h3>Your account</h3>
              <ul>
                <li>Sign in with a code. No password.</li>
                <li>Export everything, any time.</li>
                <li>Delete in one step, with 14 days to undo.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="lo-s lo-end" aria-label="Start ranking">
          <p className="lo-eh" aria-hidden="true">
            <span>RANK</span>
            <span className="lo-ebox">
              <Plus size={desk ? 58 : 32} />
            </span>
          </p>
          <p className="lo-sub">Lists of anything, in your order.</p>
          <button type="button" className="pc pc--big" aria-label="Start ranking" onClick={(e) => flood(e.currentTarget.querySelector('.pc__in'), '/signup')}>
            <span className="pc__in">
              <Plus size={18} />
              <span className="pc__label">Start ranking</span>
            </span>
          </button>
        </section>
      </main>

      <footer className="lo-ft">
        <Wordmark height={26} color="var(--see-flare)" />
        <span className="lo-fl">
          <span>Help</span>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Cookies</span>
        </span>
        <span className="lo-fc">
          <Flag name={country} width={22} />
          {country}
        </span>
        <span className="t-meta">© 2026 See</span>
      </footer>

      {(cookie === 'open' || cookie === 'min') && (
        <div className="lp-ck" role="region" aria-label="Cookies">
          {cookie === 'min' ? (
            <button type="button" className="lp-ck__tab" onClick={() => setCookie('open')}>
              Cookies
            </button>
          ) : (
            <div className="lp-ck__body">
              <p>
                <b>Cookies.</b> Only what See needs to work, unless you allow more.
              </p>
              <div className="lp-ck__a">
                <button type="button" className="lp-ck__y" onClick={() => decideCookies('all', 'All cookies on')}>
                  Allow
                </button>
                <button type="button" className="lp-ck__n" onClick={() => decideCookies('need', 'Only what See needs')}>
                  Only needed
                </button>
                <button type="button" className="lp-ck__c" onClick={() => decideCookies('need', 'Only what See needs, for now')}>
                  Choose
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

