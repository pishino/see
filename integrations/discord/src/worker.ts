/*
 * The Discord interactions endpoint, as a Cloudflare Worker: verify, handle, respond, then send any follow-up.
 * Fills, sessions and votes live in the FILLS KV namespace.
 */
import { handle, type Store } from './handler';
import { verifyDiscord } from './verify';

interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  SEE_URL: string;
  FILLS: {
    get(k: string): Promise<string | null>;
    put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void>;
    list(o: { prefix: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
  };
}

const DAY = 86_400;

export default {
  async fetch(req: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (req.method !== 'POST') return new Response('See on Discord', { status: 200 });
    const body = await req.text();
    const ok = await verifyDiscord(env.DISCORD_PUBLIC_KEY, req.headers.get('x-signature-ed25519'), req.headers.get('x-signature-timestamp'), body);
    if (!ok) return new Response('Bad signature', { status: 401 });

    const store: Store = {
      get: (k) => env.FILLS.get(k),
      // sessions fade after a day; lists, fills and votes after 90
      put: (k, v) => env.FILLS.put(k, v, { expirationTtl: k.startsWith('s:') ? DAY : 90 * DAY }),
      keys: async (prefix) => {
        const out: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await env.FILLS.list({ prefix, cursor });
          out.push(...page.keys.map((k) => k.name));
          cursor = page.list_complete ? undefined : page.cursor;
        } while (cursor);
        return out;
      },
    };
    const seeUrl = env.SEE_URL.endsWith('/') ? env.SEE_URL : `${env.SEE_URL}/`;
    const out = await handle(JSON.parse(body), { store, seeUrl, applicationId: env.DISCORD_APPLICATION_ID });
    if (out.after) {
      const a = out.after;
      ctx.waitUntil(
        fetch(`https://discord.com/api/v10${a.path}`, { method: a.method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(a.body) }),
      );
    }
    return new Response(JSON.stringify(out.response), { headers: { 'content-type': 'application/json' } });
  },
};
