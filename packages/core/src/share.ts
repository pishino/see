/*
 * Out in the world (V3IntMap, V3IntReddit, V3IntDiscord, V3IntEmbed, V3IntCards). A list goes out as a template:
 * its name, size and what's in it, never anybody's order and never a handle. Wherever it lands, people rank their
 * own by tapping, top first; Lock in saves to their See and posts nothing; the crowd's order opens only after that,
 * and never moves anyone's ranks. Reply with yours is the only thing that puts an order in a thread.
 *
 * Platform-free: the web's template page and embed, the phones, the Discord bot and the Reddit app all use this.
 * Only type imports, so Node can run it as it is (the bot's tests do).
 */
import type { Entry, List } from './seed';

/** What a shared list carries. Items are catalogue ids, or "~title|maker" for items See doesn't have. */
export interface Template {
  v: 1;
  name: string;
  /** the kind word, for "TEMPLATE · 10 VIDEOS" */
  kind: string;
  /** Top N */
  n: number;
  items: string[];
  /** someone's locked order (a fill's Full order link), as indexes into items */
  order?: number[];
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** A template in a link-safe string. */
export function encodeTemplate(t: Template): string {
  return b64(JSON.stringify([t.v, t.name, t.kind, t.n, t.items, t.order ?? null]));
}

export function decodeTemplate(code: string): Template | null {
  try {
    const [v, name, kind, n, items, order] = JSON.parse(unb64(code)) as [1, string, string, number, string[], number[] | null];
    if (v !== 1 || typeof name !== 'string' || !Array.isArray(items) || !items.every((x) => typeof x === 'string')) return null;
    return { v, name: name.slice(0, 80), kind: String(kind).slice(0, 24), n: Math.max(1, Math.min(50, Number(n) || 10)), items: items.slice(0, 50), ...(order ? { order } : {}) };
  } catch {
    return null;
  }
}

/** A list as a template: what's in it, in no particular order (the catalogue's), so nobody's order travels. */
export function templateOf(L: List, byId: Record<string, Entry>, kindPlural: string): Template {
  const items = L.items.filter((x): x is string => !!x && !!byId[x]);
  const ref = (id: string) => (byId[id].own ? `~${byId[id].t}|${byId[id].m}` : id);
  return { v: 1, name: L.name, kind: kindPlural, n: L.n, items: items.map(ref).sort() };
}

/** An item's title and maker, from the catalogue or from the template itself. */
export function itemOf(ref: string, byId: Record<string, Entry>): { t: string; m: string; id?: string } {
  if (ref.startsWith('~')) {
    const [t, m = ''] = ref.slice(1).split('|');
    return { t, m };
  }
  const x = byId[ref];
  return x ? { t: x.t, m: x.m, id: x.id } : { t: ref, m: '' };
}

/* ---------------------------------------------------------------- tap to rank */

/** Ranking in a post: top first, one tap per place. No dragging, because the feed scrolls. */
export interface RankSession {
  /** indexes into the template's items, in the order you placed them */
  order: number[];
  locked: boolean;
}

export const LOCK_MIN = 3;
export const startRank = (): RankSession => ({ order: [], locked: false });
export const placeNext = (s: RankSession, i: number): RankSession => (s.locked || s.order.includes(i) ? s : { ...s, order: [...s.order, i] });
export const undoLast = (s: RankSession): RankSession => (s.locked ? s : { ...s, order: s.order.slice(0, -1) });
/** Tap a placed one to take it back; the ones after it move up. */
export const takeBack = (s: RankSession, i: number): RankSession => (s.locked ? s : { ...s, order: s.order.filter((x) => x !== i) });
export const canLock = (s: RankSession, t: Template) => !s.locked && s.order.length >= Math.min(LOCK_MIN, t.items.length);
export const lockIn = (s: RankSession, t: Template): RankSession => (canLock(s, t) ? { ...s, locked: true } : s);
/** What's left to place, in the template's order. */
export const leftToPlace = (s: RankSession, t: Template) => t.items.map((_, i) => i).filter((i) => !s.order.includes(i));

/* ---------------------------------------------------------------- the crowd */

/** The crowd's order from everyone's locked fills (a Borda count: No. 1 of 10 scores 10). Ties keep template order. */
export function crowdOrder(fills: number[][], size: number): number[] {
  const score = new Array<number>(size).fill(0);
  for (const f of fills) f.forEach((i, rank) => i >= 0 && i < size && (score[i] += size - rank));
  return score.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(([, i]) => i);
}

/** How many places you and the crowd agree on (the same item at the same place). */
export function agreement(mine: number[], crowd: number[]): number {
  return mine.reduce((n, x, i) => n + (crowd[i] === x ? 1 : 0), 0);
}

/* ---------------------------------------------------------------- words for each place */

export interface Fill {
  template: Template;
  order: number[];
  agree: number | null;
  crowdName: string;
}

const titleLine = (t: Template) => `${t.name} · Top ${t.n}`;

/** The template as a post body (Reddit and other Markdown places): the list, never an order. */
export function postMarkdown(t: Template, link: string, byId: Record<string, Entry>): { title: string; body: string } {
  const lines = t.items.map((r) => {
    const x = itemOf(r, byId);
    return `- ${x.t}${x.m ? ` · ${x.m}` : ''}`;
  });
  return {
    title: `Rank the ${t.items.length} ${t.kind.toLowerCase()}: ${t.name}`,
    body: [`**${titleLine(t)}**`, '', ...lines, '', `[Rank yours in See](${link}). Nothing posts until you say so; the community’s order opens after you lock in.`].join('\n'),
  };
}

/** A fill as a reply (Reddit comment, Discord message, anywhere text goes): your top five, how far you agree, the link. */
export function fillMarkdown(f: Fill, link: string, byId: Record<string, Entry>): string {
  const top = f.order.slice(0, 5).map((i, k) => {
    const x = itemOf(f.template.items[i], byId);
    return `${k + 1}. ${x.t}${x.m ? ` · ${x.m}` : ''}`;
  });
  const head = `**Top ${top.length} of ${f.template.items.length} · locked**`;
  const agree = f.agree === null ? '' : `Agrees with the ${f.crowdName} on ${f.agree} of ${f.template.items.length} · `;
  return [head, '', ...top, '', `${agree}[Full order](${link})`].join('\n');
}

/** The full-order link: the template with your order, so whoever opens it sees it and ranks their own. */
export const withOrder = (t: Template, order: number[]): Template => ({ ...t, order });

export type Place = 'reddit' | 'x' | 'threads' | 'bluesky' | 'whatsapp' | 'email' | 'discord';

/** Where each place's "share" goes. Nothing posts until the person presses post there. */
export function shareUrl(place: Place, t: Template, link: string, byId: Record<string, Entry>): string {
  const e = encodeURIComponent;
  const line = `Rank the ${t.items.length} ${t.kind.toLowerCase()}: ${t.name}. Yours, top first:`;
  switch (place) {
    case 'reddit': {
      const p = postMarkdown(t, link, byId);
      return `https://www.reddit.com/submit?type=TEXT&title=${e(p.title)}&text=${e(p.body)}`;
    }
    case 'x':
      return `https://twitter.com/intent/tweet?text=${e(line)}&url=${e(link)}`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${e(`${line} ${link}`)}`;
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${e(`${line} ${link}`)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${e(`${line} ${link}`)}`;
    case 'email':
      return `mailto:?subject=${e(t.name)}&body=${e(`${line}\n\n${link}`)}`;
    case 'discord':
      return `/see rank link:${link}`;
  }
}

/** The embed a writer pastes into a page (V3IntEmbed): full ranks in place; compact shows a locked chart. */
export function embedSnippet(embedUrl: string, name: string, compact = false): string {
  const src = compact ? `${embedUrl}?v=compact` : embedUrl;
  return `<iframe src="${src}" title="${name.replace(/"/g, '&quot;')} · See" width="100%" height="${compact ? 380 : 680}" style="border:0;max-width:720px" loading="lazy"></iframe>`;
}
