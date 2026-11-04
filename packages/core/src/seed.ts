/*
 * Seed content, as in the prototypes (DeskApp / PixelPhone): three categories, seven lists, a catalogue to fill them
 * from, three polls and the people you rank with.
 */
import raw from './catalog.json';
import { hashOf } from '@see/brand';

export type Kind = 'video' | 'song' | 'album' | 'artist' | 'film' | 'director' | 'show' | 'team' | 'athlete';

export interface Entry {
  id: string;
  /** title */
  t: string;
  /** maker: artist, director, network, league */
  m: string;
  /** album, known for, top song */
  a: string;
  k: Kind;
  tags: string;
  src: string[];
  y: string;
  g: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface List {
  id: string;
  cat: string;
  name: string;
  /** size: 5 to 50 */
  n: number;
  /** what the move column compares against: 0 last week, 1 last month, 2 your last visit */
  per: number;
  items: (string | null)[];
  prev: string[];
  pinned: boolean;
  people: string[];
  poll: boolean;
  /** shows its read-as chips (size, time frame, kind) under the title */
  chips: boolean;
}

export interface Poll {
  id: string;
  cat: string;
  q: string;
  n: number;
  o: [string, number][];
}

interface RawList {
  id: string;
  cat: string;
  name: string;
  cnt: number;
  per: number;
  items: string[];
  pinned: boolean;
  people: string[];
  poll: boolean;
  chips: boolean;
}

export const CATALOG = raw.catalog as Entry[];
export const BY_ID: Record<string, Entry> = Object.fromEntries(CATALOG.map((x) => [x.id, x]));
export const SEED_CATEGORIES = raw.categories as Category[];
export const PEOPLE: Record<string, string> = Object.fromEntries(raw.people as [string, string][]);
export const POLLS = raw.polls as Poll[];

export const SIZE_STOPS = [5, 10, 20, 50];
export const PERIODS = ['This week', 'This month', '2026', 'All time'];

export const KIND_WORD: Record<Kind, string> = {
  video: 'Music video', song: 'Song', album: 'Album', artist: 'Artist', film: 'Film',
  director: 'Director', show: 'Show', team: 'Team', athlete: 'Athlete',
};
export const KIND_PL: Record<Kind, string> = {
  video: 'Videos', song: 'Songs', album: 'Albums', artist: 'Artists', film: 'Films',
  director: 'Directors', show: 'Shows', team: 'Teams', athlete: 'Athletes',
};

/** Desktop columns worth showing beside the title: the maker, then the album when there is one. */
export const COLS: Record<Kind, [string, 'm' | 'a'][]> = {
  video: [['Artist', 'm'], ['Album', 'a']], song: [['Artist', 'm'], ['Album', 'a']], album: [['Artist', 'm']],
  artist: [['Top song', 'a']], film: [['Director', 'm']], director: [['Known for', 'a']], show: [['Network', 'm']],
  team: [['League', 'm']], athlete: [['Sport', 'm']],
};

/** Last week's order for the lists people open first, so the move column has a story to tell. */
const PREV_SEED: Record<string, string[]> = {
  l1: ['v1', 'v0', 'v2', 'v5', 'v3', 'v4'],
  m1: ['f1', 'f0', 'f4', 'f2'],
};

function prevOf(lid: string, items: string[]): string[] {
  const keep: { x: string; k: number }[] = [];
  items.forEach((x, i) => {
    const h = hashOf(`${lid}>${x}`);
    if (i > 2 && h % 5 === 0) return;
    keep.push({ x, k: i + (((h >>> 3) % 7) - 3) * 1.1 });
  });
  keep.sort((a, b) => a.k - b.k);
  return keep.map((e) => e.x);
}

export function seedLists(): List[] {
  return (raw.lists as RawList[]).map((x) => ({
    id: x.id,
    cat: x.cat,
    name: x.name,
    n: SIZE_STOPS[x.cnt],
    per: x.per,
    items: x.items.slice(),
    prev: PREV_SEED[x.id] ?? prevOf(x.id, x.items),
    pinned: x.pinned,
    people: x.people,
    poll: x.poll,
    chips: x.chips,
  }));
}

/** What a list ranks: open until its first entry, then whatever its entries are. */
export function kindOf(L: List): Kind | 'mixed' | '' {
  const ks = new Set<Kind>();
  L.items.forEach((x) => {
    if (x && BY_ID[x]) ks.add(BY_ID[x].k);
  });
  if (ks.size === 1) return [...ks][0];
  return ks.size ? 'mixed' : '';
}

export interface Move {
  t: string;
  tone: 'up' | 'down' | 'same' | 'new' | 'none';
  aria: string;
}

/** How far an entry moved since the list's last period. */
export function moveOf(L: List, xid: string | null, ix: number): Move {
  if (!xid) return { t: '', tone: 'none', aria: '' };
  const p = L.prev.indexOf(xid);
  if (p < 0) return { t: 'NEW', tone: 'new', aria: 'New this week' };
  const d = p - ix;
  if (d > 0) return { t: `▲ ${d}`, tone: 'up', aria: `Up ${d}` };
  if (d < 0) return { t: `▼ ${-d}`, tone: 'down', aria: `Down ${-d}` };
  return { t: '–', tone: 'same', aria: 'Same place' };
}

export function pad2(n: number) {
  return (n < 10 ? '0' : '') + n;
}

export function makerOf(x: Entry) {
  if (x.k === 'artist') return `Top song: ${x.a}`;
  return x.m + (x.a && x.k !== 'album' ? ` · ${x.a}` : '');
}

/** Search the catalogue the way the Find pill does: title, maker, album and tags. */
export function search(q: string, kind?: Kind | 'mixed' | ''): Entry[] {
  const s = q.trim().toLowerCase();
  const pool = kind && kind !== 'mixed' ? CATALOG.filter((x) => x.k === kind) : CATALOG;
  if (!s) return pool.slice(0, 6);
  return pool.filter((x) => `${x.t} ${x.m} ${x.a} ${x.tags} ${x.g}`.toLowerCase().includes(s)).slice(0, 8);
}
