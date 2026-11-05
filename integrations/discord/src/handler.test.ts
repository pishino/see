import { describe, expect, it } from 'vitest';
import { BY_ID, encodeTemplate, seedLists, templateOf } from '@see/core';
import { handle, shortId, type Ctx, type Interaction, type Store } from './handler';
import { verifyDiscord } from './verify';

function memory(): Store {
  const m = new Map<string, string>();
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), keys: async (p) => [...m.keys()].filter((k) => k.startsWith(p)) };
}
const ctx = (): Ctx => ({ store: memory(), seeUrl: 'https://see.example/', applicationId: 'app1' });
const t = templateOf(seedLists().find((x) => x.id === 'l1')!, BY_ID, 'Videos');
const code = encodeTemplate(t);
const id = shortId(code);
const cmd = (name: string, options: { name: string; value: string }[], user = 'u1'): Interaction => ({
  type: 2,
  member: { user: { id: user } },
  data: { name: 'see', options: [{ name, type: 1, options }] },
});
const press = (custom_id: string, user = 'u1'): Interaction => ({ type: 3, token: 'tok', member: { user: { id: user } }, data: { custom_id } });
const data = (o: { response: unknown }) => (o.response as { type: number; data: Record<string, unknown> }).data;
const type = (o: { response: unknown }) => (o.response as { type: number }).type;

describe('See on Discord', () => {
  it('answers Discord’s ping', async () => {
    expect((await handle({ type: 1 }, ctx())).response).toEqual({ type: 1 });
  });

  it('posts a list; everyone ranks privately; the server’s order opens after you lock in', async () => {
    const c = ctx();
    const post = await handle(cmd('rank', [{ name: 'link', value: `https://see.example/t/${code}` }]), c);
    const embed = (data(post).embeds as { title: string; author: { name: string } }[])[0];
    expect(embed.title).toBe('Videos of the year');
    expect(embed.author.name).toBe('TEMPLATE · 7 VIDEOS');

    // before locking in, the server's order stays closed
    expect(String(data(await handle(press(`o:${id}`), c)).content)).toContain('opens after you lock in');

    // u1 ranks: a private panel, one tap per place; Lock in only after three
    const panel = await handle(press(`r:${id}`), c);
    expect(data(panel).flags).toBe(64);
    await handle(press(`p:${id}:3`), c);
    let p = await handle(press(`p:${id}:0`), c);
    const lockBtn = () => ((data(p).components as { components: { custom_id?: string; disabled?: boolean }[] }[]).at(-1)!.components.find((b) => b.custom_id === `l:${id}`))!;
    expect(lockBtn().disabled).toBe(true);
    p = await handle(press(`p:${id}:5`), c);
    expect(type(p)).toBe(7);
    expect(lockBtn().disabled).toBe(false);
    const locked = await handle(press(`l:${id}`), c);
    expect(String(data(locked).content)).toContain('You and the server agree on');

    // u2 ranks differently; the server's order is everyone's who locked in
    for (const ix of [0, 3, 1]) await handle(press(`p:${id}:${ix}`, 'u2'), c);
    const l2 = await handle(press(`l:${id}`, 'u2'), c);
    expect(String(data(l2).content)).toContain('**The server · 2**');

    // Reply with yours: a public card, no handle on it
    const reply = await handle(press(`y:${id}`), c);
    expect(data(reply).flags).toBeUndefined();
    const card = (data(reply).embeds as { title: string; footer: { text: string } }[])[0];
    expect(card.title).toBe('Top 3 of 7 · locked');
    expect(card.footer.text).toMatch(/^Agrees with the server on \d of 7$/);
  });

  it('refuses a link it can’t read, kindly', async () => {
    const o = await handle(cmd('rank', [{ name: 'link', value: 'not a link' }]), ctx());
    expect(data(o).flags).toBe(64);
  });

  it('runs a poll: the count updates in place, your results come to you alone', async () => {
    const c = ctx();
    const post = await handle(cmd('poll', [{ name: 'question', value: 'Video of the year?' }, { name: 'options', value: 'Rush, Water, City Boys' }]), c);
    const btn = (data(post).components as { components: { custom_id: string }[] }[])[0].components[1].custom_id;
    const v = await handle(press(btn), c);
    expect(type(v)).toBe(7);
    expect(((data(v).embeds as { footer: { text: string } }[])[0]).footer.text).toMatch(/^1 voted/);
    expect(v.after?.path).toBe('/webhooks/app1/tok');
    expect(JSON.stringify(v.after?.body)).toContain('Water** · yours');
  });

  it('checks Discord’s signature', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pub = Buffer.from(await crypto.subtle.exportKey('raw', kp.publicKey)).toString('hex');
    const body = '{"type":1}';
    const sig = Buffer.from(await crypto.subtle.sign('Ed25519', kp.privateKey, new TextEncoder().encode('123' + body))).toString('hex');
    expect(await verifyDiscord(pub, sig, '123', body)).toBe(true);
    expect(await verifyDiscord(pub, sig, '124', body)).toBe(false);
    expect(await verifyDiscord(pub, null, '123', body)).toBe(false);
  });
});
