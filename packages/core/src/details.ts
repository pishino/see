/*
 * What the player's sheet says about an entry (V3Player): the rank first, then the kind, the title, who made it,
 * where it ranks in your lists, where it plays from, and more like it. Platform-free, so the native apps' player
 * says the same things.
 */
import { hashOf } from '@see/brand';
import { BY_ID, CATALOG, KIND_WORD, type Entry, type List } from './seed';
import { slotsOf } from './model';

const SOURCE: Record<string, string> = {
  sp: 'Spotify',
  am: 'Apple Music',
  yt: 'YouTube',
  lb: 'Letterboxd',
  nf: 'Netflix',
  pv: 'Prime Video',
  fm: 'FotMob',
  es: 'ESPN',
};

/** Removed at its source: it keeps its place on your list; play is off (V3ProblemStates, inline line). */
export function goneLine(x: Entry, rank?: number): string | null {
  if (!x.gone) return null;
  return `Removed from ${SOURCE[x.gone] ?? x.gone}.${rank ? ` It keeps No. ${rank};` : ''} play is off.`;
}

/** A preview that can't play where you are (V3ProblemStates S5): said in one line where the picture would be. */
export function notHereLine(x: Entry): string | null {
  return x.notHere ? 'This preview isn’t available in your country.' : null;
}

/** The entry on its source's own site, for "Open on YouTube" and the like. */
export function sourceUrl(x: Entry, source: string): string {
  const q = encodeURIComponent(`${x.t} ${x.m}`.trim());
  switch (source) {
    case 'YouTube':
      return `https://www.youtube.com/results?search_query=${q}`;
    case 'Spotify':
      return `https://open.spotify.com/search/${q}`;
    case 'Apple Music':
      return `https://music.apple.com/search?term=${q}`;
    case 'Netflix':
      return `https://www.netflix.com/search?q=${q}`;
    case 'Letterboxd':
      return `https://letterboxd.com/search/${q}/`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

/** The name of the source a key stands for (yt → YouTube). */
export function sourceName(key: string): string {
  return SOURCE[key] ?? key;
}

/** "MUSIC VIDEO · 2023 · AFROBEATS" */
export function kickerOf(x: Entry): string {
  return [KIND_WORD[x.k], x.y, x.g].filter(Boolean).join(' · ');
}

/** The line under the title: who made it, and what it is from. */
export function makerLine(x: Entry): string {
  if (x.own) return 'Your own · no source yet';
  switch (x.k) {
    case 'film':
      return `Directed by ${x.m}`;
    case 'show':
      return x.m ? `On ${x.m}` : '';
    case 'director':
      return x.a ? `Known for ${x.a}` : '';
    case 'artist':
      return x.a ? `Top song: ${x.a}` : '';
    case 'team':
    case 'athlete':
      return x.m;
    case 'album':
      return `By ${x.m}`;
    default:
      return `By ${x.m}${x.a && x.a !== x.t ? ` · from ${x.a}` : ''}`;
  }
}

/** What playing it means for this kind: a video, a song, a trailer, highlights. */
export function playWord(x: Entry): { verb: string; what: string } {
  switch (x.k) {
    case 'video':
      return { verb: 'Play video', what: 'Music video' };
    case 'film':
    case 'show':
    case 'director':
      return { verb: 'Watch trailer', what: 'Official trailer' };
    case 'album':
      return { verb: 'Play title track', what: 'Title track' };
    case 'artist':
      return { verb: 'Play top song', what: 'Top song' };
    case 'team':
      return { verb: 'Last match', what: 'Highlights' };
    case 'athlete':
      return { verb: 'Highlights', what: 'Highlights' };
    default:
      return { verb: 'Play', what: 'Preview' };
  }
}

/** Is there a picture to watch, or only sound? */
export function isVideo(x: Entry): boolean {
  return x.k === 'video' || x.k === 'film' || x.k === 'show' || x.k === 'director' || x.k === 'team' || x.k === 'athlete';
}

/** How long the preview runs, in seconds: the same every time for the same entry. */
export function durationOf(x: Entry): number {
  const h = hashOf(x.id);
  if (x.k === 'film' || x.k === 'show' || x.k === 'director') return 120 + (h % 40);
  if (x.k === 'video') return 180 + (h % 60);
  if (x.k === 'team' || x.k === 'athlete') return 90 + (h % 60);
  return 150 + (h % 90);
}

export function clock(s: number): string {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Where it plays from, in the order Settings › Playback gives (the first one that has it wins). */
export function sourcesOf(x: Entry, order: string[] = []): string[] {
  const names = x.src.map((s) => SOURCE[s] ?? s);
  const rank = (n: string) => {
    const i = order.indexOf(n);
    return i < 0 ? order.length + names.indexOf(n) : i;
  };
  return names.slice().sort((a, b) => rank(a) - rank(b));
}

export interface Placing {
  listId: string;
  name: string;
  /** 1-based */
  rank: number;
}

/** Where it ranks in your lists, best first. */
export function whereItRanks(xid: string, lists: List[]): Placing[] {
  const out: Placing[] = [];
  for (const L of lists) {
    const i = slotsOf(L).indexOf(xid);
    if (i >= 0) out.push({ listId: L.id, name: L.name, rank: i + 1 });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

/** A plain description from what See knows; no invented facts. */
export function aboutOf(x: Entry): string {
  if (x.own) return 'Your own item. See doesn’t have it yet, so nothing plays; you can link a source later.';
  const kind = KIND_WORD[x.k].toLowerCase();
  switch (x.k) {
    case 'film':
      return `A ${x.y} ${x.g ? `${x.g.toLowerCase()} ` : ''}film directed by ${x.m}.`;
    case 'show':
      return `A ${x.g ? `${x.g.toLowerCase()} ` : ''}show${x.m ? ` on ${x.m}` : ''}, from ${x.y}.`;
    case 'artist':
      return `${x.t}${x.g ? `, ${x.g}` : ''}.${x.a ? ` Their top song on See is ${x.a}.` : ''}`;
    case 'album':
      return `An album by ${x.m}, from ${x.y}${x.g ? `. ${x.g}` : ''}.`;
    default:
      return `A ${kind} by ${x.m}${x.a && x.a !== x.t ? `, from ${x.a}` : ''}, ${x.y}${x.g ? `. ${x.g}` : ''}.`;
  }
}

/** More like it: the same maker first, then the same genre and kind. */
export function moreLikeIt(x: Entry, n = 5): Entry[] {
  const same = (y: Entry) => y.id !== x.id && y.t !== x.t;
  const byMaker = CATALOG.filter((y) => same(y) && y.k === x.k && y.m === x.m);
  const byGenre = CATALOG.filter((y) => same(y) && y.k === x.k && y.g === x.g && y.m !== x.m);
  const rest = CATALOG.filter((y) => same(y) && y.k === x.k && !byMaker.includes(y) && !byGenre.includes(y));
  return [...byMaker, ...byGenre, ...rest].slice(0, n);
}

/** The next entry to play in a list after this one (autoplay), or null at the end. */
export function nextInList(L: List | undefined, xid: string): string | null {
  if (!L) return null;
  const slots = slotsOf(L);
  const i = slots.indexOf(xid);
  for (let j = i + 1; j < slots.length; j++) if (slots[j] && BY_ID[slots[j]!]) return slots[j];
  return null;
}

function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[n];
}

/** Search never ends at "no": the nearest real title or name, when one is close. */
export function didYouMean(q: string): Entry | null {
  const s = q.trim().toLowerCase();
  if (s.length < 3) return null;
  let best: Entry | null = null;
  let bestD = Infinity;
  for (const x of CATALOG) {
    for (const cand of [x.t, x.m]) {
      const c = cand.toLowerCase();
      const dd = distance(s, c.slice(0, Math.max(s.length, Math.min(c.length, s.length + 2))));
      if (dd < bestD) {
        bestD = dd;
        best = x;
      }
    }
  }
  return bestD <= Math.max(2, Math.floor(s.length / 4)) ? best : null;
}
