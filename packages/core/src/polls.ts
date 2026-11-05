/*
 * Polls, the whole way through (V3PollsApp, decided). A poll has as many items as you like (at least three).
 * You play it two at a time until one is left: One stays (your pick stays on and the next one comes in) or In pairs
 * (everything is paired; your picks go through, round by round). Undo is always there; Can't choose lets chance
 * pick. The winner fills the screen; then what everyone picked; then the results. A poll never moves a chart.
 * Platform-free: the web and the phones play the same games from the same state.
 */
import raw from './polls.json';
import type { List } from './seed';

export type Mode = 'stay' | 'pairs';

export interface PollDef {
  id: string;
  q: string;
  /** where it goes: a category name */
  cat: string;
  mode: Mode;
  /** 'you', or the handle that made it */
  by: string;
  /** "2 days left", "Ended", "Open" */
  ends: string;
  /** [title, by] */
  items: [string, string][];
  closed?: boolean;
  /** seeded as already played (finished polls open on the ending) */
  played?: boolean;
  who?: string;
}

export interface Game {
  mode: Mode;
  order: number[];
  champ: number;
  next: number;
  round: number[];
  nextRound: number[];
  k: number;
  roundNo: number;
  /** losers, in the order they went out */
  out: number[];
  done: boolean;
  winner: number | null;
}

export const POLL_SEED = raw as PollDef[];

export const MODES: [Mode, string, string][] = [
  ['stay', 'One stays', 'Pick between two. Your pick stays on and the next one comes in. Best for long lists.'],
  ['pairs', 'In pairs', 'Everything is paired up. Your picks go through to the next round, until the last two.'],
];
export const WHO = ['Everyone', 'Your people', 'Only you'] as const;
export const ENDS = ['In a day', 'In 3 days', 'In a week', 'Never'] as const;
export const MAKE_STEPS = ['Ask it', 'Fill it', 'Set it'] as const;
export const POLL_MIN = 3;

/** A seeded random from a string: the same poll always shuffles and settles the same way. */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = h >>> 0 || 1;
  return () => {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return (h % 10000) / 10000;
  };
}

function shuffle<T>(a: T[], seed: string): T[] {
  const r = seeded(seed);
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** What everyone has picked so far (until See has a server, a steady sample per poll). */
export function crowdOf(p: PollDef): { total: number; shares: number[] } {
  const r = seeded(p.id + p.q);
  const w = p.items.map((_, i) => Math.pow(r(), 2.2) * (i < 4 ? 3 : 1) + 0.0001);
  const s = w.reduce((a, b) => a + b, 0);
  return { total: 400 + Math.floor(r() * 1600), shares: w.map((v) => v / s) };
}

/** A game, ready to play: the items in a fair, fixed shuffle. */
export function freshGame(p: PollDef, salt = ''): Game {
  const order = shuffle(p.items.map((_, i) => i), p.id + salt);
  const g: Game = { mode: p.mode, order, champ: order[0], next: 1, round: order, nextRound: [], k: 0, roundNo: 1, out: [], done: false, winner: null };
  return settle(g);
}

/** The two in front of you. */
export function pairOf(g: Game): [number | null, number | null] {
  if (g.done) return [g.winner, null];
  if (g.mode === 'stay') return [g.champ, g.order[g.next] ?? null];
  return [g.round[g.k] ?? null, g.round[g.k + 1] ?? null];
}

/** In pairs: move past byes and finished rounds. */
function settle(g: Game): Game {
  if (g.mode !== 'pairs') return g;
  while (!g.done) {
    if (g.k >= g.round.length) {
      g.round = g.nextRound;
      g.nextRound = [];
      g.k = 0;
      g.roundNo += 1;
      if (g.round.length === 1) {
        g.done = true;
        g.winner = g.round[0];
      }
      continue;
    }
    if (g.k + 1 >= g.round.length) {
      g.nextRound.push(g.round[g.k]);
      g.k += 1;
      continue;
    }
    break;
  }
  return g;
}

/** Pick a side: 'a' or 'b'. */
export function pickSide(g0: Game, side: 'a' | 'b'): Game {
  if (g0.done) return g0;
  const g: Game = JSON.parse(JSON.stringify(g0));
  const [a, b] = pairOf(g);
  const win = side === 'a' ? a! : b!;
  const lose = side === 'a' ? b! : a!;
  g.out.push(lose);
  if (g.mode === 'stay') {
    g.champ = win;
    g.next += 1;
    if (g.next >= g.order.length) {
      g.done = true;
      g.winner = win;
    }
    return g;
  }
  g.nextRound.push(win);
  g.k += 2;
  return settle(g);
}

/** How many are still in it. */
export function leftOf(g: Game, n: number): number {
  if (g.done) return 1;
  if (g.mode === 'stay') return n - g.next + 1;
  return g.round.length - g.k + g.nextRound.length;
}

/** A finished poll seeded as played: settle it the same way every time. */
export function autoplay(p: PollDef): Game {
  const r = seeded(`auto${p.id}`);
  let g = freshGame(p);
  while (!g.done) g = pickSide(g, r() < 0.55 ? 'a' : 'b');
  return g;
}

export const gameOf = (p: PollDef, games: Record<string, Game>): Game => games[p.id] ?? (p.played ? autoplay(p) : freshGame(p));

/** The words on a poll's card in Your polls. */
export function pollCard(p: PollDef, g: Game) {
  const n = p.items.length;
  const started = g.out.length > 0 && !g.done;
  return {
    kick: `${p.cat}${p.by === 'you' ? ' · by you' : ` · by @${p.by}`}`,
    ends: p.ends,
    q: p.q,
    meta: `${n} in it · ${p.mode === 'stay' ? 'One stays' : 'In pairs'}${g.done && g.winner !== null ? ` · your winner: ${p.items[g.winner][0]}` : ''}`,
    act: g.done || (p.closed && !started) ? 'See results' : started ? `Keep going · ${leftOf(g, n)} left` : 'Play',
  };
}

export type PollTab = 'play' | 'made' | 'played';
export const POLL_TABS: [PollTab, string][] = [
  ['play', 'To play'],
  ['made', 'Made by you'],
  ['played', 'Played'],
];
export const POLL_EMPTY: Record<PollTab, string> = {
  play: 'You’re all caught up.',
  made: 'You haven’t made one yet.',
  played: 'Nothing played yet. Your finished polls land here.',
};

/** Your polls, by tab: to play (open, not yours, not finished), made by you, played (finished, not yours). */
export function pollGroups(all: PollDef[], games: Record<string, Game>): Record<PollTab, PollDef[]> {
  return {
    play: all.filter((p) => !p.closed && !gameOf(p, games).done && p.by !== 'you'),
    made: all.filter((p) => p.by === 'you'),
    played: all.filter((p) => (gameOf(p, games).done || p.closed) && p.by !== 'you'),
  };
}

/** The ending: what everyone picked, how yours compares, everyone's top 5 and your top 3. */
export function endingOf(p: PollDef, g: Game) {
  const c = crowdOf(p);
  const order = c.shares.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
  const cw = order[0][1];
  const top = order.slice(0, 5).map(([s, i], k) => ({ n: k + 1, i, t: p.items[i][0], by: p.items[i][1], pct: Math.round(s * 100), w: Math.round((s / order[0][0]) * 100), you: i === g.winner }));
  const mine = g.done && g.winner !== null ? [g.winner, ...g.out.slice().reverse()].slice(0, 3).map((i, k) => ({ n: k + 1, t: p.items[i][0], note: k === 0 ? 'your winner' : k === 1 ? 'last one out' : '' })) : [];
  return {
    crowd: `${p.items[cw][0]} · ${Math.round(c.shares[cw] * 100)}% of ${c.total.toLocaleString('en')}`,
    match: g.done ? (cw === g.winner ? 'The same as your winner.' : `Yours came ${order.findIndex(([, i]) => i === g.winner) + 1} with everyone.`) : '',
    people: `${c.total.toLocaleString('en')} people`,
    top,
    mine,
  };
}

/** A poll made from a list: its items, with their makers. */
export function itemsFromList(L: List, title: (id: string) => { t: string; m: string } | undefined): [string, string][] {
  return L.items
    .filter((x): x is string => !!x)
    .map((id) => title(id))
    .filter((x): x is { t: string; m: string } => !!x)
    .map((x) => [x.t, x.m]);
}

const ENDS_AS: Record<string, string> = { 'In a day': 'A day left', 'In 3 days': '3 days left', 'In a week': 'A week left', Never: 'Open' };

/** Making a poll: ask it, fill it (at least three), set it, start it. */
export function newPoll(d: { q: string; cat: string; items: [string, string][]; mode: Mode; who: string; ends: string }): PollDef {
  return { id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, q: d.q.trim().slice(0, 80), cat: d.cat, mode: d.mode, by: 'you', ends: ENDS_AS[d.ends] ?? d.ends, items: d.items.slice(0, 200), who: d.who };
}

/** "Best Afrobeats song?" plus a line of items pasted one per line, or "Title - Maker". */
export function pasteItems(text: string): [string, string][] {
  return text
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(/\s[-–—·]\s|\sby\s/i);
      return [m[0].trim().slice(0, 60), (m[1] ?? '').trim().slice(0, 60)] as [string, string];
    });
}
