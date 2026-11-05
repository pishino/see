/*
 * Why you can't open something, and the one way in (V3ProblemStates 5, Access): a list that was deleted, a
 * private list, and invites (which last 7 days). Until there is a server these are seeded, so every state has a
 * real link that reaches it: see://list/best-of-wizkid, see://list/lagos-nights, see://join/ada-afrobeats,
 * see://join/ada-roadtrip.
 */
import { CATALOG, type List } from './seed';
import { newList } from './store';

export const INVITE_DAYS = 7;

export interface GoneList {
  name: string;
  by: string;
  when: string;
}
export interface PrivateList {
  name: string;
  owner: string;
}
export interface Invite {
  code: string;
  from: string;
  sent: string;
  expired: boolean;
  list: { name: string; cat: string; n: number; items: string[] };
}

export const GONE_LISTS: Record<string, GoneList> = {
  'best-of-wizkid': { name: 'Best of Wizkid', by: 'tunde', when: 'Oct 18' },
};

export const PRIVATE_LISTS: Record<string, PrivateList> = {
  'lagos-nights': { name: 'Lagos nights', owner: 'tunde' },
};

const songs = CATALOG.filter((x) => x.k === 'song').map((x) => x.id);

export const INVITES: Record<string, Invite> = {
  'ada-afrobeats': { code: 'ada-afrobeats', from: 'ada', sent: 'Nov 3', expired: false, list: { name: 'Afrobeats 2026', cat: 'MUSIC', n: 10, items: songs.slice(0, 6) } },
  'ada-roadtrip': { code: 'ada-roadtrip', from: 'ada', sent: 'Oct 9', expired: true, list: { name: 'Road trip songs', cat: 'MUSIC', n: 10, items: songs.slice(4, 9) } },
};

export type Access = { k: 'gone'; id: string; list: GoneList } | { k: 'private'; id: string; list: PrivateList } | null;

/** Why a list id can't be opened, if we know. */
export function accessOf(id: string): Access {
  if (GONE_LISTS[id]) return { k: 'gone', id, list: GONE_LISTS[id] };
  if (PRIVATE_LISTS[id]) return { k: 'private', id, list: PRIVATE_LISTS[id] };
  return null;
}

/** The access words, the same on every platform. */
export const ACCESS_SAYS = {
  gone: (g: GoneList) => `@${g.by} deleted “${g.name}” on ${g.when}. Lists you made from it keep their own order.`,
  private: (p: PrivateList) => `Only @${p.owner}’s people can open “${p.name}”. Ask to join and they’ll see your request.`,
  expired: (i: Invite) => `Invites to a list last ${INVITE_DAYS} days. @${i.from} sent this one on ${i.sent}. Ask for a new one and you’re in.`,
  invite: (i: Invite) => `@${i.from} invited you to rank “${i.list.name}” with them.`,
};

/** Join an invite: the list, ranked as they have it, with them on it. Already joined? The same list again. */
export function joinInvite(inv: Invite, lists: List[]): { list: List; fresh: boolean } {
  const have = lists.find((L) => L.name === inv.list.name && L.people.includes(inv.from));
  if (have) return { list: have, fresh: false };
  const L = newList(inv.list.cat, inv.list.name, inv.list.n);
  return { list: { ...L, items: inv.list.items.slice(), people: [inv.from] }, fresh: true };
}
