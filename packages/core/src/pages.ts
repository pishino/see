/*
 * Everything is a page (V3Objects): every name leads somewhere. A maker (an artist, a director, a network, a team's
 * league) gets a page with what they made, where it sits on your lists and who they're ranked next to. Panels
 * (V3GroupWeb): a group whose locked ballots add up to one chart.
 */
import { CATALOG, KIND_WORD, type Entry, type List } from './seed';
import { slotsOf } from './model';

export interface MakerPage {
  name: string;
  /** "Artist", "Director", … */
  role: string;
  /** what they made, by kind, newest first */
  made: { kind: string; items: Entry[] }[];
  /** their things on your lists: list, rank, what */
  yours: { listId: string; list: string; rank: number; x: Entry }[];
  /** makers ranked next to them on your lists */
  related: string[];
  about: string;
}

const ROLE: Partial<Record<Entry['k'], string>> = { song: 'Artist', video: 'Artist', album: 'Artist', film: 'Director', show: 'Network' };

export function makerPage(name: string, lists: List[]): MakerPage | null {
  const mine = CATALOG.filter((x) => x.m === name);
  const self = CATALOG.find((x) => (x.k === 'artist' || x.k === 'director') && x.t === name);
  if (!mine.length && !self) return null;
  const byKind = new Map<string, Entry[]>();
  for (const x of mine) {
    const k = KIND_WORD[x.k];
    byKind.set(k, [...(byKind.get(k) ?? []), x]);
  }
  const made = [...byKind.entries()].map(([kind, items]) => ({ kind, items: items.sort((a, b) => (b.y || '').localeCompare(a.y || '')) }));
  const ids = new Set([...mine.map((x) => x.id), ...(self ? [self.id] : [])]);
  const yours: MakerPage['yours'] = [];
  const near = new Map<string, number>();
  for (const L of lists) {
    const slots = slotsOf(L);
    slots.forEach((xid, i) => {
      if (!xid || !ids.has(xid)) return;
      const x = CATALOG.find((y) => y.id === xid)!;
      yours.push({ listId: L.id, list: L.name, rank: i + 1, x });
      // who sits a place either side of them
      for (const j of [i - 1, i + 1]) {
        const o = slots[j] ? CATALOG.find((y) => y.id === slots[j]) : undefined;
        const m = o ? (o.k === 'artist' || o.k === 'director' ? o.t : o.m) : '';
        if (m && m !== name) near.set(m, (near.get(m) ?? 0) + 1);
      }
    });
  }
  // and the makers of the same kind and genre, so a page is never a dead end
  const g = (mine[0] ?? self)?.g;
  for (const x of CATALOG) if (x.m && x.m !== name && x.g && x.g === g && !x.own) near.set(x.m, (near.get(x.m) ?? 0) + 0.1);
  const role = self ? KIND_WORD[self.k] : ROLE[mine[0].k] ?? 'Maker';
  const where = [...new Set(mine.flatMap((x) => x.src))].length;
  return {
    name,
    role,
    made,
    yours: yours.sort((a, b) => a.rank - b.rank),
    related: [...near.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m).filter((m) => m !== 'Artist').slice(0, 6),
    about: `${role}. ${mine.length} ${mine.length === 1 ? 'thing' : 'things'} in See${where ? `, playing from ${where} ${where === 1 ? 'source' : 'sources'}` : ''}.`,
  };
}

/* ---------------------------------------------------------------- panels */

export interface Panel {
  id: string;
  name: string;
  /** what the panel ranks */
  list: string;
  n: number;
  members: string[];
  /** each member's locked ballot (catalogue ids, top first); 'you' while yours isn't locked is absent */
  ballots: Record<string, string[]>;
  /** last week's panel chart, for the moves */
  last: string[];
  deadline: string;
}

const songs = () => CATALOG.filter((x) => x.k === 'song' && !x.own).map((x) => x.id);

/** A panel to open on: the music desk, seven members, six ballots locked. */
export function seedPanel(): Panel {
  const s = songs().slice(0, 12);
  const rot = (k: number) => s.slice(k).concat(s.slice(0, k)).slice(0, 10);
  return {
    id: 'lagos-desk',
    name: 'The Lagos music desk',
    list: 'Songs of the week',
    n: 10,
    members: ['you', 'ada', 'tunde', 'zainab', 'kemi', 'femi', 'ifeoma'],
    ballots: { ada: rot(0), tunde: rot(1), zainab: [s[2], s[0], ...rot(3).slice(0, 8)], kemi: rot(2), femi: [s[1], s[2], s[0], ...rot(5).slice(0, 7)], ifeoma: rot(4) },
    last: rot(1),
    deadline: 'Sunday 18:00',
  };
}

/** The panel's chart: only ever the sum. No. 1 on a ballot is worth n points, the last place 1. */
export function panelChart(p: Panel): { id: string; points: number; move: string }[] {
  const points = new Map<string, number>();
  const firstSeen: string[] = [];
  for (const b of Object.values(p.ballots))
    b.forEach((id, i) => {
      if (!points.has(id)) firstSeen.push(id);
      points.set(id, (points.get(id) ?? 0) + Math.max(0, p.n - i));
    });
  // highest first; a tie keeps the order the ballots first named them
  const order = firstSeen.sort((a, b) => points.get(b)! - points.get(a)! || firstSeen.indexOf(a) - firstSeen.indexOf(b));
  return order.slice(0, p.n).map((id, rank) => {
    const before = p.last.indexOf(id);
    const move = before < 0 ? 'NEW' : before === rank ? '–' : before > rank ? `▲ ${before - rank}` : `▼ ${rank - before}`;
    return { id, points: points.get(id) ?? 0, move };
  });
}

/** It locks when every member has locked, or at the deadline. */
export const panelLocked = (p: Panel) => p.members.every((m) => p.ballots[m]?.length);
