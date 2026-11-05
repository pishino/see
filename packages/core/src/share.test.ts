import { describe, expect, it } from 'vitest';
import { BY_ID, seedLists } from './seed';
import {
  agreement,
  canLock,
  crowdOrder,
  decodeTemplate,
  embedSnippet,
  encodeTemplate,
  fillMarkdown,
  leftToPlace,
  lockIn,
  placeNext,
  postMarkdown,
  shareUrl,
  startRank,
  takeBack,
  templateOf,
  undoLast,
  withOrder,
} from './share';

const L = seedLists().find((x) => x.id === 'l1')!;
const t = templateOf(L, BY_ID, 'Videos');

describe('sharing a list out in the world', () => {
  it('carries the list, never the order, in a link that round-trips', () => {
    expect(t.items.length).toBe(L.items.filter(Boolean).length);
    expect(t.items).toEqual(t.items.slice().sort());
    const back = decodeTemplate(encodeTemplate(t));
    expect(back).toEqual(t);
    expect(decodeTemplate('nonsense')).toBeNull();
    const ord = decodeTemplate(encodeTemplate(withOrder(t, [2, 0, 1])));
    expect(ord?.order).toEqual([2, 0, 1]);
  });

  it('ranks by tapping: place, undo, take back, lock in after three', () => {
    let s = startRank();
    s = placeNext(placeNext(s, 4), 1);
    expect(canLock(s, t)).toBe(false);
    s = placeNext(s, 0);
    s = takeBack(s, 1);
    expect(s.order).toEqual([4, 0]);
    s = undoLast(placeNext(s, 6));
    s = placeNext(placeNext(s, 2), 5);
    expect(canLock(s, t)).toBe(true);
    s = lockIn(s, t);
    expect(s.locked).toBe(true);
    expect(placeNext(s, 3)).toBe(s);
    expect(leftToPlace(s, t)).toEqual([1, 3, 6]);
  });

  it('works out the crowd’s order, and how far you agree', () => {
    const crowd = crowdOrder([[0, 1, 2], [0, 2, 1], [1, 0, 2]], 4);
    expect(crowd).toEqual([0, 1, 2, 3]);
    expect(agreement([0, 2, 1], crowd)).toBe(1);
  });

  it('says it in each place’s words', () => {
    const link = 'https://see.app/t/x';
    const post = postMarkdown(t, link, BY_ID);
    expect(post.title).toBe(`Rank the 7 videos: Videos of the year`);
    expect(post.body).toContain('[Rank yours in See](https://see.app/t/x)');
    const fill = fillMarkdown({ template: t, order: [3, 0, 1, 2, 4, 5], agree: 2, crowdName: 'community' }, link, BY_ID);
    expect(fill.split('\n')[0]).toBe('**Top 5 of 7 · locked**');
    expect(fill).toContain('Agrees with the community on 2 of 7');
    expect(shareUrl('reddit', t, link, BY_ID)).toMatch(/^https:\/\/www\.reddit\.com\/submit\?/);
    expect(shareUrl('discord', t, link, BY_ID)).toBe('/see rank link:https://see.app/t/x');
    expect(embedSnippet('https://see.app/embed/x', 'A "quoted" name')).toContain('&quot;quoted&quot;');
  });
});
