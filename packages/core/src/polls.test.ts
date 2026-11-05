import { describe, expect, it } from 'vitest';
import { POLL_SEED, autoplay, endingOf, freshGame, gameOf, leftOf, newPoll, pairOf, pasteItems, pickSide, pollCard, pollGroups, type PollDef } from './polls';
import { reduce, seedState } from './store';

const mk = (mode: 'stay' | 'pairs', n: number): PollDef => ({ id: `t${mode}${n}`, q: 'Test?', cat: 'MUSIC', mode, by: 'ada', ends: '2 days left', items: Array.from({ length: n }, (_, i) => [`Item ${i}`, ''] as [string, string]) });

describe('polls, the whole way through', () => {
  it('seeds the board’s five polls', () => {
    expect(POLL_SEED.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(POLL_SEED[0].items.length).toBe(24);
  });

  it('plays One stays: your pick stays on and the next one comes in, until one is left', () => {
    const p = mk('stay', 5);
    let g = freshGame(p);
    expect(leftOf(g, 5)).toBe(5);
    const first = pairOf(g)[0];
    for (let i = 0; i < 4; i++) g = pickSide(g, 'a');
    expect(g.done).toBe(true);
    expect(g.winner).toBe(first);
    expect(g.out.length).toBe(4);
  });

  it('plays In pairs: round by round, with byes, until one is left', () => {
    const p = mk('pairs', 7);
    let g = freshGame(p);
    let picks = 0;
    while (!g.done) {
      g = pickSide(g, 'b');
      picks++;
    }
    expect(picks).toBe(6);
    expect(g.winner).not.toBeNull();
  });

  it('ends with what everyone picked, how yours compares, and your top 3', () => {
    const p = POLL_SEED[4];
    const g = autoplay(p);
    const e = endingOf(p, g);
    expect(e.top.length).toBe(5);
    expect(e.mine.map((m) => m.note)).toEqual(['your winner', 'last one out', '']);
    expect(e.match).toMatch(/^(The same as your winner\.|Yours came \d+ with everyone\.)$/);
  });

  it('sorts your polls into To play, Made by you and Played', () => {
    const g = pollGroups(POLL_SEED, {});
    expect(g.play.map((p) => p.id)).toEqual(['p2', 'p3']);
    expect(g.made.map((p) => p.id)).toEqual(['p1', 'p4']);
    expect(g.played.map((p) => p.id)).toEqual(['p5']);
    expect(pollCard(POLL_SEED[4], gameOf(POLL_SEED[4], {})).act).toBe('See results');
  });

  it('makes a poll from what you type or paste, and keeps it with your lists', () => {
    expect(pasteItems('1. Jollof rice\n2) Fried rice - Lagos\n• Ofada rice')).toEqual([['Jollof rice', ''], ['Fried rice', 'Lagos'], ['Ofada rice', '']]);
    const p = newPoll({ q: ' Best rice? ', cat: 'FOOD', items: pasteItems('a\nb\nc'), mode: 'pairs', who: 'Everyone', ends: 'In a week' });
    expect(p.ends).toBe('A week left');
    let s = reduce(seedState(), { type: 'addPoll', poll: p });
    s = reduce(s, { type: 'saveGame', id: p.id, game: pickSide(freshGame(p), 'a') });
    expect(s.polls?.[0].q).toBe('Best rice?');
    expect(s.games?.[p.id].out.length).toBe(1);
  });
});
