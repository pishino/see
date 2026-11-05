/*
 * Rank it in the post (V3IntReddit, V3IntRedditPhone): the list, Rank yours, one tap per place (no dragging: the
 * feed scrolls), Lock in, then yours beside the community's. Reply with yours is the only thing that posts.
 */
import { navigateTo } from '@devvit/web/client';
import { BY_ID, canLock, encodeTemplate, itemOf, leftToPlace, pad2, placeNext, startRank, takeBack, undoLast, withOrder, type RankSession } from '@see/core';
import type { State } from '../server/routes';

const SEE_URL = 'https://pishino.github.io/see/';
const app = document.getElementById('app')!;
let st: State | null = null;
let s: RankSession = startRank();
let ranking = false;
let note = '';

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const item = (i: number) => itemOf(st!.template.items[i], BY_ID);
const rowHtml = (i: number, k: number, extra = '', btn = false) =>
  `<${btn ? `button class="row" data-back="${i}"` : 'div class="row"'}><span class="n" style="color:${k === 0 ? 'var(--flare)' : 'inherit'}">${pad2(k + 1)}</span><span><b>${esc(item(i).t)}</b><br><span class="m">${esc(item(i).m)}</span></span><span>${extra}</span></${btn ? 'button' : 'div'}>`;

async function api(path: string, body?: unknown) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const j = await r.json();
  if (!r.ok) throw new Error(j.message ?? 'That didn’t work');
  return j;
}

function render() {
  if (!st) return;
  const t = st.template;
  const head = `<span class="k">Template · ${t.items.length} ${esc(t.kind)}</span><h1>${esc(t.name)}</h1><span class="k top">Top ${t.n}</span>`;
  if (st.mine) {
    const mine = st.mine;
    const crowd = st.crowd ?? [];
    app.innerHTML = `${head}<span class="k">Locked in · saved</span>
      <div class="cols"><div><span class="k">Yours</span>${mine.map((i, k) => rowHtml(i, k, crowd[k] === i ? '<span class="same">SAME</span>' : '')).join('')}</div>
      <div class="crowd"><span class="k">The community · ${st.count}</span>${crowd.slice(0, mine.length).map((i, k) => rowHtml(i, k)).join('')}</div></div>
      <p>You and the community agree on <b>${st.agree} of ${t.items.length}</b>. Yours stays exactly as you set it.</p>
      <div class="chips"><button class="go" id="reply">Reply with yours</button><button class="go quiet" id="open">Open in See</button></div>
      <p class="m">${esc(note)}</p>`;
    document.getElementById('reply')!.onclick = async () => {
      try {
        await api('/api/reply', {});
        note = 'Your fill is in the thread.';
      } catch (e) {
        note = (e as Error).message;
      }
      render();
    };
    document.getElementById('open')!.onclick = () => navigateTo(`${SEE_URL}t/${encodeTemplate(withOrder(t, mine))}`);
    return;
  }
  if (!ranking) {
    app.innerHTML = `${head}<span class="k">In it</span><div class="chips">${t.items.map((_, i) => `<span class="chip"><b>${esc(item(i).t)}</b><span>${esc(item(i).m)}</span></span>`).join('')}</div>
      <p>Your order, top first. The community’s order opens after you lock in.</p>
      <button class="go" id="rank">Rank yours</button><span class="m">Nothing posts until you say so. Made in See · ${st.count} ranked</span>`;
    document.getElementById('rank')!.onclick = () => ((ranking = true), render());
    return;
  }
  const left = leftToPlace(s, t);
  app.innerHTML = `${head}<div style="display:flex;justify-content:space-between;align-items:center"><span class="k">Your order · ${s.order.length} of ${t.items.length}</span>${s.order.length ? '<button class="go quiet" id="undo">Undo</button>' : ''}</div>
    <div>${s.order.map((i, k) => rowHtml(i, k, '', true)).join('')}</div>
    ${left.length ? `<span class="m">Tap one below for No. ${s.order.length + 1} · left to place · ${left.length}</span><div class="chips">${left.map((i) => `<button class="chip" data-place="${i}"><b>${esc(item(i).t)}</b><span>${esc(item(i).m)}</span></button>`).join('')}</div>` : ''}
    <span class="m">${s.order.length ? 'Tap a placed one to take it back.' : 'Nothing posts until you say so.'}</span>
    <button class="go" id="lock" ${canLock(s, t) ? '' : 'disabled'}>Lock in</button><p class="m">${esc(note)}</p>`;
  app.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((b) => (b.onclick = () => ((s = placeNext(s, Number(b.dataset.place))), render())));
  app.querySelectorAll<HTMLButtonElement>('[data-back]').forEach((b) => (b.onclick = () => ((s = takeBack(s, Number(b.dataset.back))), render())));
  const u = document.getElementById('undo');
  if (u) u.onclick = () => ((s = undoLast(s)), render());
  document.getElementById('lock')!.onclick = async () => {
    try {
      st = await api('/api/lock', { order: s.order });
      note = '';
    } catch (e) {
      note = (e as Error).message;
    }
    render();
  };
}

api('/api/state')
  .then((j: State) => {
    st = j;
    render();
  })
  .catch((e: Error) => (app.innerHTML = `<p class="m">${esc(e.message)}</p>`));
