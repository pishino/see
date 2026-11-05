/* The Reddit app's server: Devvit runs it; it hands each request to the routes with Reddit's redis, API and context. */
import { context, createServer, getServerPort, reddit, redis } from '@devvit/web/server';
import { route } from './routes';

const SEE_URL = 'https://pishino.github.io/see/';

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  let body: Record<string, unknown> = {};
  try {
    body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
  } catch {
    /* not JSON: an empty body */
  }
  const out = await route(req.method ?? 'GET', (req.url ?? '/').split('?')[0], body, {
    postId: context.postId,
    userId: context.userId,
    code: (context.postData as { code?: string } | undefined)?.code,
    subredditName: context.subredditName,
    seeUrl: SEE_URL,
    hGetAll: (k) => redis.hGetAll(k),
    hSet: async (k, v) => void (await redis.hSet(k, v)),
    submitPost: async ({ title, code, fallback }) =>
      reddit.submitCustomPost({ subredditName: context.subredditName, title, postData: { code }, textFallback: { text: fallback } }),
    // the reply is the person's own comment: the thread shows who; the card never does
    comment: async (postId, text) => void (await reddit.submitComment({ id: postId as `t3_${string}`, text, runAs: 'USER' })),
  }).catch((e: unknown) => ({ status: 500, json: { message: String(e) } }));
  res.writeHead(out.status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(out.json));
});

server.listen(getServerPort());
