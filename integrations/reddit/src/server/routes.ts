/*
 * See on Reddit (V3IntReddit): a post carries a list, not an answer. Everyone who scrolls past ranks it right there,
 * locks in, and only then sees how the community ranked it. Lock in posts nothing; Reply with yours drops the fill
 * into the thread as a comment from you. A community adds See once; a moderator's menu posts a list from a link.
 *
 * Pure routing, so it can be tested without Reddit: the server wires it to Devvit's redis, reddit and context.
 */
import {
  BY_ID,
  LOCK_MIN,
  agreement,
  crowdOrder,
  decodeTemplate,
  encodeTemplate,
  fillMarkdown,
  postMarkdown,
  withOrder,
  type Template,
} from '@see/core';

export interface Deps {
  postId?: string;
  userId?: string;
  code?: string;
  subredditName: string;
  seeUrl: string;
  hGetAll(key: string): Promise<Record<string, string>>;
  hSet(key: string, values: Record<string, string>): Promise<void>;
  submitPost(o: { title: string; code: string; fallback: string }): Promise<{ url: string }>;
  comment(postId: string, text: string): Promise<void>;
}

export interface State {
  template: Template;
  mine: number[] | null;
  crowd: number[] | null;
  count: number;
  agree: number | null;
}

type Out = { status: number; json: unknown };
const ok = (json: unknown): Out => ({ status: 200, json });
const no = (status: number, message: string): Out => ({ status, json: { message } });
const link = (d: Deps, t: Template) => `${d.seeUrl}t/${encodeTemplate(t)}`;

async function state(d: Deps, t: Template): Promise<State> {
  const all = await d.hGetAll(`f:${d.postId}`);
  const fills = Object.values(all).map((v) => JSON.parse(v) as number[]);
  const mine = d.userId && all[d.userId] ? (JSON.parse(all[d.userId]) as number[]) : null;
  // the community's order only opens to someone who has locked in
  const crowd = mine ? crowdOrder(fills, t.items.length) : null;
  return { template: t, mine, crowd, count: fills.length, agree: mine && crowd ? agreement(mine, crowd) : null };
}

export async function route(method: string, path: string, body: Record<string, unknown>, d: Deps): Promise<Out> {
  if (method === 'POST' && path === '/internal/menu/post-list') {
    return ok({
      showForm: {
        name: 'postList',
        form: {
          title: 'Post a See list',
          acceptLabel: 'Post',
          fields: [{ type: 'string', name: 'link', label: 'A list’s link from See', helpText: 'In See: Share › Copy the link', required: true }],
        },
      },
    });
  }
  if (method === 'POST' && path === '/internal/form/post-list') {
    const raw = String(body.link ?? '').trim();
    const code = raw.includes('/t/') ? raw.split('/t/')[1].split(/[?#\s]/)[0] : raw;
    const t = decodeTemplate(code);
    if (!t) return ok({ showToast: 'That link can’t be read. Share the list from See and paste its link.' });
    const plain = { ...t, order: undefined };
    const p = postMarkdown(plain, link(d, plain), BY_ID);
    const post = await d.submitPost({ title: p.title, code: encodeTemplate(plain), fallback: p.body });
    return ok({ navigateTo: post.url });
  }

  const t = d.code ? decodeTemplate(d.code) : null;
  if (!t || !d.postId) return no(404, 'This post has no list.');

  if (method === 'GET' && path === '/api/state') return ok(await state(d, t));

  if (method === 'POST' && path === '/api/lock') {
    if (!d.userId) return no(401, 'Log in to Reddit to lock in.');
    const order = Array.isArray(body.order) ? (body.order as unknown[]).map(Number) : [];
    const valid = order.length >= Math.min(LOCK_MIN, t.items.length) && new Set(order).size === order.length && order.every((i) => Number.isInteger(i) && i >= 0 && i < t.items.length);
    if (!valid) return no(400, 'That order can’t be saved.');
    await d.hSet(`f:${d.postId}`, { [d.userId]: JSON.stringify(order) });
    return ok(await state(d, t));
  }

  if (method === 'POST' && path === '/api/reply') {
    const s = await state(d, t);
    if (!s.mine) return no(400, 'Lock in first; then you can reply with yours.');
    await d.comment(d.postId, fillMarkdown({ template: t, order: s.mine, agree: s.agree, crowdName: 'community' }, link(d, withOrder(t, s.mine)), BY_ID));
    return ok({ posted: true });
  }

  return no(404, 'Not here.');
}
