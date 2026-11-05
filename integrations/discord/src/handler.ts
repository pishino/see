/*
 * See on Discord (V3IntDiscord): /see rank drops a list; Rank yours opens a panel only you can see, where you tap
 * your order; Lock in unlocks the server's order for you alone; Reply with yours posts your fill. /see poll is a
 * poll: one tap, results after you vote, and it never moves anyone's chart. The post carries the list, never
 * anybody's order; no handles on cards (Discord already shows who replied).
 *
 * Pure: it takes an interaction and a store and returns Discord's response (and any follow-up to send).
 */
import {
  BY_ID,
  agreement,
  canLock,
  crowdOrder,
  decodeTemplate,
  encodeTemplate,
  itemOf,
  leftToPlace,
  lockIn,
  pad2,
  placeNext,
  undoLast,
  withOrder,
  type RankSession,
  type Template,
} from '@see/core';

export interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  /** keys starting with a prefix */
  keys(prefix: string): Promise<string[]>;
}

export interface Ctx {
  store: Store;
  /** where See's links open, ending in / */
  seeUrl: string;
  applicationId?: string;
}

export interface Interaction {
  type: number;
  token?: string;
  member?: { user: { id: string } };
  user?: { id: string };
  data?: {
    name?: string;
    options?: { name: string; type: number; options?: { name: string; value: string }[] }[];
    custom_id?: string;
  };
}

export interface Out {
  response: unknown;
  /** a follow-up request to Discord, made after responding */
  after?: { method: 'POST' | 'PATCH'; path: string; body: unknown };
}

const FLARE = 0xff4a1c;
const VIOLET = 0x7c6bff;
const EPHEMERAL = 64;
const T = { PING: 1, COMMAND: 2, COMPONENT: 3 };
const R = { PONG: 1, MESSAGE: 4, UPDATE: 7 };
const B = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, LINK: 5 };

/** A short, stable id for a template or a poll (custom_id has to stay under 100 characters). */
export function shortId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const userOf = (i: Interaction) => i.member?.user.id ?? i.user?.id ?? 'someone';
const say = (content: string): Out => ({ response: { type: R.MESSAGE, data: { content, flags: EPHEMERAL } } });
const linkTo = (ctx: Ctx, t: Template) => `${ctx.seeUrl}t/${encodeTemplate(t)}`;
const row = (components: unknown[]) => ({ type: 1, components });
const line = (t: Template, i: number, k: number) => {
  const x = itemOf(t.items[i], BY_ID);
  return `\`${pad2(k + 1)}\` **${x.t}**${x.m ? ` · ${x.m}` : ''}`;
};

async function template(ctx: Ctx, id: string): Promise<Template | null> {
  const code = await ctx.store.get(`t:${id}`);
  return code ? decodeTemplate(code) : null;
}

async function fills(ctx: Ctx, id: string): Promise<number[][]> {
  const keys = await ctx.store.keys(`f:${id}:`);
  const all = await Promise.all(keys.map((k) => ctx.store.get(k)));
  return all.filter((v): v is string => !!v).map((v) => JSON.parse(v) as number[]);
}

/** The private ranking panel: your order so far, what's left as buttons, Undo and Lock in. */
function panel(t: Template, id: string, s: RankSession) {
  const left = leftToPlace(s, t).slice(0, 20);
  const placed = s.order.map((i, k) => line(t, i, k)).join('\n');
  const content = [`**Your order · ${s.order.length} of ${t.items.length}**`, placed, s.order.length < t.items.length ? `Tap one for No. ${s.order.length + 1}.` : 'All placed.', '_Everyone ranks their own. Only you see this panel._']
    .filter(Boolean)
    .join('\n');
  const rows = [];
  for (let r = 0; r < left.length; r += 5)
    rows.push(row(left.slice(r, r + 5).map((i) => ({ type: 2, style: B.SECONDARY, label: itemOf(t.items[i], BY_ID).t.slice(0, 80), custom_id: `p:${id}:${i}` }))));
  rows.push(
    row([
      { type: 2, style: B.SECONDARY, label: 'Undo', custom_id: `u:${id}`, disabled: s.order.length === 0 },
      { type: 2, style: B.PRIMARY, label: 'Lock in', custom_id: `l:${id}`, disabled: !canLock(s, t) },
    ]),
  );
  return { content, components: rows, flags: EPHEMERAL };
}

export async function handle(i: Interaction, ctx: Ctx): Promise<Out> {
  if (i.type === T.PING) return { response: { type: R.PONG } };
  const who = userOf(i);

  if (i.type === T.COMMAND && i.data?.name === 'see') {
    const sub = i.data.options?.[0];
    const opt = (n: string) => sub?.options?.find((o) => o.name === n)?.value ?? '';
    if (sub?.name === 'rank') {
      const raw = opt('link').trim();
      const code = raw.includes('/t/') ? raw.split('/t/')[1].split(/[?#\s]/)[0] : raw;
      const t = decodeTemplate(code);
      if (!t) return say('That link can’t be read. Share the list from See (Share › Copy the link) and paste it here.');
      const id = shortId(code);
      await ctx.store.put(`t:${id}`, encodeTemplate({ ...t, order: undefined }));
      const inIt = t.items.slice(0, 10).map((r) => `• ${itemOf(r, BY_ID).t}`).join('\n');
      return {
        response: {
          type: R.MESSAGE,
          data: {
            embeds: [
              {
                color: FLARE,
                author: { name: `TEMPLATE · ${t.items.length} ${t.kind.toUpperCase()}` },
                title: t.name,
                description: `**TOP ${t.n}**\nRank yours. The server’s order opens after you lock in.`,
                fields: [{ name: 'In it', value: inIt + (t.items.length > 10 ? `\n…and ${t.items.length - 10} more` : '') }],
                footer: { text: 'Made in See · nothing posts until you say so' },
              },
            ],
            components: [
              row([
                { type: 2, style: B.PRIMARY, label: 'Rank yours', custom_id: `r:${id}` },
                { type: 2, style: B.SECONDARY, label: 'Server order', custom_id: `o:${id}` },
                { type: 2, style: B.LINK, label: 'Open in See', url: linkTo(ctx, t) },
              ]),
            ],
          },
        },
      };
    }
    if (sub?.name === 'poll') {
      const question = opt('question').trim().slice(0, 200);
      const options = opt('options')
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      if (!question || options.length < 2) return say('A poll needs a question and at least two options, separated by commas.');
      const id = shortId(`${question}|${options.join('|')}|${Date.now()}`);
      await ctx.store.put(`q:${id}`, JSON.stringify({ question, options }));
      return { response: { type: R.MESSAGE, data: pollMessage(id, question, options, 0) } };
    }
    return say('Try /see rank with a link from See, or /see poll.');
  }

  if (i.type === T.COMPONENT && i.data?.custom_id) {
    const [kind, id, arg] = i.data.custom_id.split(':');
    if (kind === 'v') return vote(i, ctx, id, Number(arg), who);
    const t = await template(ctx, id);
    if (!t) return say('That list has gone from this server’s See. Post it again with /see rank.');
    const sKey = `s:${id}:${who}`;
    const load = async (): Promise<RankSession> => JSON.parse((await ctx.store.get(sKey)) ?? '{"order":[],"locked":false}');
    const mine = await ctx.store.get(`f:${id}:${who}`);

    if (kind === 'r') {
      if (mine) return locked(ctx, t, id, JSON.parse(mine), R.MESSAGE);
      return { response: { type: R.MESSAGE, data: panel(t, id, await load()) } };
    }
    if (kind === 'p' || kind === 'u') {
      const s0 = await load();
      const s = kind === 'p' ? placeNext(s0, Number(arg)) : undoLast(s0);
      await ctx.store.put(sKey, JSON.stringify(s));
      return { response: { type: R.UPDATE, data: panel(t, id, s) } };
    }
    if (kind === 'l') {
      const s = lockIn(await load(), t);
      if (!s.locked) return { response: { type: R.UPDATE, data: panel(t, id, s) } };
      await ctx.store.put(`f:${id}:${who}`, JSON.stringify(s.order));
      return locked(ctx, t, id, s.order, R.UPDATE);
    }
    if (kind === 'o') {
      if (!mine) return say('The server’s order opens after you lock in. Press Rank yours first.');
      return locked(ctx, t, id, JSON.parse(mine), R.MESSAGE);
    }
    if (kind === 'y') {
      if (!mine) return say('Lock in first; then you can reply with yours.');
      const order = JSON.parse(mine) as number[];
      const all = await fills(ctx, id);
      const agree = agreement(order, crowdOrder(all, t.items.length));
      return {
        response: {
          type: R.MESSAGE,
          data: {
            embeds: [
              {
                color: FLARE,
                title: `Top ${Math.min(5, order.length)} of ${t.items.length} · locked`,
                description: order.slice(0, 5).map((ix, k) => line(t, ix, k)).join('\n'),
                footer: { text: `Agrees with the server on ${agree} of ${t.items.length}` },
              },
            ],
            components: [row([{ type: 2, style: B.LINK, label: 'Full order', url: linkTo(ctx, withOrder(t, order)) }])],
          },
        },
      };
    }
  }
  return say('That didn’t work. Try again in a moment.');
}

/** After you lock in: yours beside the server's, and how far you agree. Yours never moves. */
async function locked(ctx: Ctx, t: Template, id: string, order: number[], type: number): Promise<Out> {
  const all = await fills(ctx, id);
  const crowd = crowdOrder(all.length ? all : [order], t.items.length);
  const agree = agreement(order, crowd);
  const content = [
    '**Locked in**',
    '**Yours**',
    ...order.map((ix, k) => line(t, ix, k)),
    '',
    `**The server · ${all.length || 1}**`,
    ...crowd.slice(0, order.length).map((ix, k) => line(t, ix, k)),
    '',
    `You and the server agree on **${agree} of ${t.items.length}**. Yours stays exactly as you set it.`,
  ].join('\n');
  return {
    response: {
      type,
      data: {
        content,
        flags: EPHEMERAL,
        components: [
          row([
            { type: 2, style: B.PRIMARY, label: 'Reply with yours', custom_id: `y:${id}` },
            { type: 2, style: B.LINK, label: 'Open in See', url: linkTo(ctx, withOrder(t, order)) },
          ]),
        ],
      },
    },
  };
}

function pollMessage(id: string, question: string, options: string[], voted: number) {
  return {
    embeds: [{ color: VIOLET, author: { name: 'POLL · THE CROWD' }, title: question, footer: { text: `${voted} voted · results after you vote · it never moves anyone’s chart` } }],
    components: Array.from({ length: Math.ceil(options.length / 5) }, (_, r) =>
      row(options.slice(r * 5, r * 5 + 5).map((o, k) => ({ type: 2, style: B.SECONDARY, label: o.slice(0, 80), custom_id: `v:${id}:${r * 5 + k}` }))),
    ),
  };
}

/** A vote: the poll's count updates in place; your results come to you alone, after you vote. */
async function vote(i: Interaction, ctx: Ctx, id: string, choice: number, who: string): Promise<Out> {
  const raw = await ctx.store.get(`q:${id}`);
  if (!raw) return say('That poll has closed.');
  const { question, options } = JSON.parse(raw) as { question: string; options: string[] };
  await ctx.store.put(`w:${id}:${who}`, String(choice));
  const keys = await ctx.store.keys(`w:${id}:`);
  const votes = (await Promise.all(keys.map((k) => ctx.store.get(k)))).map(Number);
  const total = votes.length || 1;
  const results = options
    .map((o, k) => {
      const n = votes.filter((v) => v === k).length;
      const pct = Math.round((n / total) * 100);
      return `${k === choice ? '**' : ''}${o}${k === choice ? '** · yours' : ''}\n\`${'█'.repeat(Math.round(pct / 5)).padEnd(20, '░')}\` ${pct}%`;
    })
    .join('\n');
  return {
    response: { type: R.UPDATE, data: pollMessage(id, question, options, keys.length) },
    after:
      ctx.applicationId && i.token
        ? { method: 'POST', path: `/webhooks/${ctx.applicationId}/${i.token}`, body: { content: `**${question}**\n${results}\n_Change your vote any time._`, flags: EPHEMERAL } }
        : undefined,
  };
}
