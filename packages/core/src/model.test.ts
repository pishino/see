import { describe, expect, it } from 'vitest';
import { addToList, belowTheLine, firstOpen, listSummary, moveEntry, placeAt, removeAt, resize, slotsOf, suggestCategory } from './model';
import { moveOf, seedLists, type List } from './seed';
import { reduce, seedState } from './store';

const list = (items: (string | null)[], n = 5): List => ({
  id: 't',
  cat: 'MUSIC',
  name: 'Test',
  n,
  per: 0,
  items,
  prev: [],
  pinned: false,
  people: [],
  poll: false,
  chips: false,
});

describe('places', () => {
  it('pads to the size with open places', () => {
    expect(slotsOf(list(['v0', 'v1']))).toEqual(['v0', 'v1', null, null, null]);
    expect(firstOpen(list(['v0', 'v1']))).toBe(2);
    expect(firstOpen(list(['v0', 'v1', 'v2', 'v3', 'v4']))).toBe(-1);
  });
});

describe('moveEntry', () => {
  it('moves an entry and shifts the rest', () => {
    expect(moveEntry(list(['a', 'b', 'c']), 2, 0).items.slice(0, 3)).toEqual(['c', 'a', 'b']);
  });
  it('ignores moves into open places or out of range', () => {
    const L = list(['a', 'b']);
    expect(moveEntry(L, 0, 3)).toBe(L);
    expect(moveEntry(L, -1, 0)).toBe(L);
  });
  it('keeps what sits below the line', () => {
    const L = list(['a', 'b', 'c', 'd', 'e', 'f'], 5);
    expect(moveEntry(L, 4, 0).items).toEqual(['e', 'a', 'b', 'c', 'd', 'f']);
  });
});

describe('adding', () => {
  it('fills the first open place', () => {
    const r = addToList(list(['a', null, 'c']), 'x');
    expect('already' in r).toBe(false);
    if (!('already' in r)) expect(r.at).toBe(1);
  });
  it('goes below the line when full', () => {
    const r = addToList(list(['a', 'b', 'c', 'd', 'e']), 'x');
    expect(!('already' in r) && r.below).toBe(true);
    expect(belowTheLine(r.list)).toBe(1);
  });
  it('refuses a duplicate', () => {
    expect('already' in addToList(list(['a']), 'a')).toBe(true);
    expect('already' in placeAt(list(['a']), 2, 'a')).toBe(true);
  });
});

describe('removing and resizing', () => {
  it('lets the ones below move up', () => {
    expect(removeAt(list(['a', 'b', 'c']), 0).items.slice(0, 2)).toEqual(['b', 'c']);
  });
  it('clamps size to 5..50 and keeps entries below the line', () => {
    const L = resize(list(['a', 'b', 'c', 'd', 'e', 'f'], 10), 2);
    expect(L.n).toBe(5);
    expect(belowTheLine(L)).toBe(1);
    expect(resize(L, 80).n).toBe(50);
  });
});

describe('reading', () => {
  it('summarises a seed list the way the cards do', () => {
    const l1 = seedLists().find((L) => L.id === 'l1')!;
    expect(listSummary(l1)).toBe('Top 10 videos · 7 ranked · you and 2 others');
  });
  it('tells how far an entry moved since last time', () => {
    const l1 = seedLists().find((L) => L.id === 'l1')!;
    expect(moveOf(l1, 'v0', 0)).toMatchObject({ t: '▲ 1', tone: 'up' });
    expect(moveOf(l1, 'v1', 1)).toMatchObject({ t: '▼ 1', tone: 'down' });
    expect(moveOf(l1, 'v6', 6)).toMatchObject({ t: 'NEW', tone: 'new' });
  });
  it('suggests a category from a name', () => {
    expect(suggestCategory('Albums of 2026', ['MUSIC', 'MOVIES'])).toBe('MUSIC');
    expect(suggestCategory('Best films of the summer', ['MUSIC', 'MOVIES'])).toBe('MOVIES');
    expect(suggestCategory('Things I love', ['MUSIC'])).toBeNull();
  });
});

describe('store', () => {
  it('pins, renames and resets', () => {
    let s = seedState();
    s = reduce(s, { type: 'togglePin', id: 'l2' });
    expect(s.lists.find((L) => L.id === 'l2')!.pinned).toBe(true);
    s = reduce(s, { type: 'rename', id: 'l2', name: '  ' });
    expect(s.lists.find((L) => L.id === 'l2')!.name).toBe('Summer in Lagos');
    s = reduce(s, { type: 'reset' });
    expect(s.lists.find((L) => L.id === 'l2')!.pinned).toBe(false);
  });
  it('does not add the same category twice', () => {
    const s = reduce(seedState(), { type: 'addCategory', category: { id: 'MUSIC', name: 'MUSIC' } });
    expect(s.categories.filter((c) => c.id === 'MUSIC')).toHaveLength(1);
  });
});

import { aboutOf, clock, durationOf, makerLine, nextInList, sourcesOf, whereItRanks } from './details';
import { BY_ID } from './seed';

describe('player details', () => {
  it('ranks an entry in your lists, best first', () => {
    const lists = seedLists();
    expect(whereItRanks('v0', lists)[0]).toMatchObject({ listId: 'l1', rank: 1 });
  });
  it('writes what it knows, nothing more', () => {
    expect(makerLine(BY_ID.v0)).toBe('By Asake · from Work Of Art');
    expect(aboutOf(BY_ID.v0)).toBe('A music video by Asake, from Work Of Art, 2023. Afrobeats.');
  });
  it('keeps the same length for the same entry, and formats it', () => {
    expect(durationOf(BY_ID.v0)).toBe(durationOf(BY_ID.v0));
    expect(clock(150)).toBe('2:30');
  });
  it('plays from your first choice when it has the item', () => {
    expect(sourcesOf(BY_ID.v0, ['Spotify', 'YouTube'])[0]).toBe('Spotify');
    expect(sourcesOf(BY_ID.v0, ['Netflix'])[0]).toBe('YouTube');
  });
  it('finds what plays next', () => {
    const l1 = seedLists().find((L) => L.id === 'l1')!;
    expect(nextInList(l1, 'v0')).toBe('v1');
    expect(nextInList(l1, 'v6')).toBeNull();
  });
});

import { didYouMean } from './details';
describe('search never ends at no', () => {
  it('offers the nearest real match', () => {
    expect(didYouMean('Lonley at the top')?.t).toBe('Lonely At The Top');
    expect(didYouMean('zzzzzzzz')).toBeNull();
  });
});

describe('your own items', () => {
  it('ranks something See does not have, and finds it again after a reload', async () => {
    const { ownEntry, registerOwn, BY_ID, search, kindFor } = await import('./seed');
    const { reduce, seedState } = await import('./store');
    const s0 = seedState();
    const L = s0.lists[0];
    const x = ownEntry('  Ozzeba  ', kindFor(L));
    expect(x.t).toBe('Ozzeba');
    expect(x.own).toBe(true);
    const s1 = reduce(s0, { type: 'addOwn', entry: x });
    expect(s1.own).toEqual([x]);
    expect(BY_ID[x.id]).toBe(x);
    expect(search('ozzeba').map((y) => y.id)).toContain(x.id);
    // a reload brings it back through load
    const copy = JSON.parse(JSON.stringify({ ...s1, own: [{ ...x, id: `${x.id}-b` }] }));
    reduce(s0, { type: 'load', state: copy });
    registerOwn(copy.own);
    expect(BY_ID[`${x.id}-b`]?.t).toBe('Ozzeba');
  });

  it('files a new item under the list’s kind, or its category’s', async () => {
    const { kindFor } = await import('./seed');
    const empty = { id: 'e', cat: 'MOVIES', name: 'x', n: 10, items: [], pinned: false, poll: false, people: [], per: 0 } as never;
    expect(kindFor(empty, 'MOVIES')).toBe('film');
    expect(kindFor(empty, 'TV')).toBe('show');
    expect(kindFor(empty, 'MUSIC')).toBe('song');
  });
});

describe('access, invites and the vote pause', () => {
  it('says why a list cannot be opened, and joins an invite once', async () => {
    const { accessOf, INVITES, joinInvite, ACCESS_SAYS } = await import('./access');
    expect(accessOf('best-of-wizkid')?.k).toBe('gone');
    expect(accessOf('lagos-nights')?.k).toBe('private');
    expect(accessOf('l1')).toBeNull();
    expect(ACCESS_SAYS.expired(INVITES['ada-roadtrip'])).toContain('last 7 days');
    const first = joinInvite(INVITES['ada-afrobeats'], []);
    expect(first.fresh).toBe(true);
    expect(first.list.people).toEqual(['ada']);
    expect(joinInvite(INVITES['ada-afrobeats'], [first.list]).fresh).toBe(false);
  });

  it('pauses a fast run of votes, then opens again', async () => {
    const { votePause, VOTE_SAYS } = await import('./votes');
    const t0 = 1_000_000;
    const run = Array.from({ length: 8 }, (_, i) => t0 + i * 1000);
    expect(votePause(run.slice(0, 7), t0 + 7000)).toBe(0);
    expect(votePause(run, t0 + 7000)).toBe(42);
    expect(votePause(run, t0 + 7000 + 42_000)).toBe(0);
    expect(VOTE_SAYS(42)).toContain('0:42');
  });
});
