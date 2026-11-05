import { describe, expect, it } from 'vitest';
import { BY_ID, encodeTemplate, seedLists, templateOf } from '@see/core';
import { route, type Deps } from './routes';

const t = templateOf(seedLists().find((x) => x.id === 'l1')!, BY_ID, 'Videos');
function deps(userId: string, db: Map<string, Record<string, string>>, log: string[]): Deps {
  return {
    postId: 't3_abc',
    userId,
    code: encodeTemplate(t),
    subredditName: 'afrobeats',
    seeUrl: 'https://see.example/',
    hGetAll: async (k) => ({ ...(db.get(k) ?? {}) }),
    hSet: async (k, v) => void db.set(k, { ...(db.get(k) ?? {}), ...v }),
    submitPost: async (o) => (log.push(`post:${o.title}`), { url: 'https://reddit.com/r/afrobeats/comments/abc' }),
    comment: async (_p, text) => void log.push(`comment:${text.split('\n')[0]}`),
  };
}

describe('See on Reddit', () => {
  it('lets a moderator post a list from a See link', async () => {
    const log: string[] = [];
    const menu = await route('POST', '/internal/menu/post-list', {}, deps('t2_mod', new Map(), log));
    expect((menu.json as { showForm: { name: string } }).showForm.name).toBe('postList');
    const out = await route('POST', '/internal/form/post-list', { link: `https://see.example/t/${encodeTemplate(t)}` }, deps('t2_mod', new Map(), log));
    expect(out.json).toEqual({ navigateTo: 'https://reddit.com/r/afrobeats/comments/abc' });
    expect(log[0]).toBe('post:Rank the 7 videos: Videos of the year');
    const bad = await route('POST', '/internal/form/post-list', { link: 'nope' }, deps('t2_mod', new Map(), log));
    expect((bad.json as { showToast: string }).showToast).toContain('can’t be read');
  });

  it('keeps the community’s order closed until you lock in, then shows it beside yours', async () => {
    const db = new Map<string, Record<string, string>>();
    const log: string[] = [];
    const before = await route('GET', '/api/state', {}, deps('t2_a', db, log));
    expect((before.json as { crowd: unknown }).crowd).toBeNull();
    expect((await route('POST', '/api/lock', { order: [0, 1] }, deps('t2_a', db, log))).status).toBe(400);
    await route('POST', '/api/lock', { order: [2, 0, 1] }, deps('t2_a', db, log));
    const b = await route('POST', '/api/lock', { order: [2, 1, 0] }, deps('t2_b', db, log));
    const s = b.json as { mine: number[]; crowd: number[]; count: number; agree: number };
    expect(s.count).toBe(2);
    expect(s.crowd.slice(0, 1)).toEqual([2]);
    expect(s.agree).toBeGreaterThanOrEqual(1);
    // someone who hasn't locked in still can't see it
    expect(((await route('GET', '/api/state', {}, deps('t2_c', db, log))).json as { crowd: unknown }).crowd).toBeNull();
  });

  it('posts nothing on lock in; Reply with yours is the only comment', async () => {
    const db = new Map<string, Record<string, string>>();
    const log: string[] = [];
    await route('POST', '/api/lock', { order: [3, 2, 1] }, deps('t2_a', db, log));
    expect(log).toEqual([]);
    await route('POST', '/api/reply', {}, deps('t2_a', db, log));
    expect(log).toEqual(['comment:**Top 3 of 7 · locked**']);
  });
});
