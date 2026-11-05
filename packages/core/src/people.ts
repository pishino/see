/*
 * People and safety (V3Objects, V3Safety): every name is a page. Two ways to deal with someone: report what they
 * made, or block them. Both start from the same ··· menu, both are three taps, and neither tells them.
 */
import { PEOPLE, type List } from './seed';

export interface Person {
  handle: string;
  name: string;
  /** Their lists, by category, as their page shows them (names only until there is a server). */
  lists: [string, string[]][];
  polls: number;
}

/** The people the prototypes rank with, and what their pages show. */
const THEIR_LISTS: Record<string, [string, string[]][]> = {
  ada: [
    ['MUSIC', ['Songs on repeat', 'Albums of the year', 'Gym playlist']],
    ['TV', ['Comfort rewatches', 'Best finales']],
    ['SPORTS', ['Teams I follow']],
  ],
  tunde: [
    ['MUSIC', ['Afrobeats 2015', 'Producers to know']],
    ['SPORTS', ['Goals of the season', 'Derbies']],
  ],
  zainab: [['MUSIC', ['Summer 2026', 'Albums on repeat']]],
  kemi: [
    ['MOVIES', ['Films of 2025', 'Nollywood classics']],
    ['TV', ['Shows to start']],
  ],
  femi: [['MUSIC', ['Highlife forever']]],
  ifeoma: [['BOOKS', ['Books to start']]],
};

export function personOf(handle: string): Person | null {
  const h = handle.replace(/^@/, '').toLowerCase();
  if (!PEOPLE[h]) return null;
  const lists = THEIR_LISTS[h] ?? [];
  return { handle: h, name: PEOPLE[h], lists, polls: (h.length * 3) % 5 };
}

/** The lists you share with them. */
export function sharedLists(handle: string, lists: List[]): List[] {
  return lists.filter((L) => L.people.includes(handle));
}

/** Six reasons, one tap (Something else asks for a line). */
export const REPORT_REASONS = [
  'It’s spam or a scam',
  'It’s hateful or picks on someone',
  'It’s sexual or violent',
  'It shares someone’s private details',
  'It breaks the law',
  'Something else',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportTarget = { kind: 'person'; handle: string } | { kind: 'list'; id: string; maker: string } | { kind: 'poll'; id: string; maker: string };

export interface Report {
  target: ReportTarget;
  reason: ReportReason;
  note: string;
  /** Hide it from me while you look: on by default */
  hide: boolean;
  /** Also block the maker: one switch away */
  block: boolean;
  at: string;
}

export function newReport(target: ReportTarget, reason: ReportReason, opts: { note?: string; hide?: boolean; block?: boolean } = {}): Report {
  return { target, reason, note: (opts.note ?? '').slice(0, 280), hide: opts.hide ?? true, block: !!opts.block, at: new Date().toISOString() };
}

/** What blocking does, said before it happens. */
export const BLOCK_SAYS = {
  confirm: (h: string) => `@${h} can’t find you or see your lists.`,
  done: (h: string) => `You blocked @${h}`,
  cant: 'See your page, lists or polls; add you to a list; find you in search; vote in your polls.',
  lists: 'They leave the lists you made. You stay on theirs until you leave, which is one tap.',
  sent: (h: string) => `Thanks. Someone at See looks at every report, usually within a day. You won’t see @${h}’s lists or polls while we do.`,
};

/** Blocking someone takes them off the lists you made. */
export function withoutPerson(lists: List[], handle: string): List[] {
  return lists.map((L) => (L.people.includes(handle) ? { ...L, people: L.people.filter((p) => p !== handle) } : L));
}
