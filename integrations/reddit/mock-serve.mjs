// Local stand-in for Reddit while developing the post page: serves dist/client and answers /api with the real routes.
// node --experimental-strip-types won't load @see/core's JSON import, so the routes are bundled first.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { rolldown } from 'rolldown';

const b = await rolldown({ input: 'src/server/routes.ts', platform: 'node' });
await b.write({ file: 'dist/mock/routes.mjs', format: 'esm' });
const { route } = await import(new URL('./dist/mock/routes.mjs', import.meta.url));
const db = new Map();
const code = process.argv[2];
http
  .createServer(async (req, res) => {
    const path = req.url.split('?')[0];
    if (path.startsWith('/api/')) {
      let body = '';
      for await (const c of req) body += c;
      const out = await route(req.method, path, body ? JSON.parse(body) : {}, {
        postId: 't3_local', userId: 't2_you', code, subredditName: 'local', seeUrl: 'https://pishino.github.io/see/',
        hGetAll: async (k) => ({ ...(db.get(k) ?? { t2_x: '[2,0,1,3]', t2_y: '[2,1,0]' }) }),
        hSet: async (k, v) => void db.set(k, { ...(db.get(k) ?? { t2_x: '[2,0,1,3]', t2_y: '[2,1,0]' }), ...v }),
        submitPost: async () => ({ url: '/' }), comment: async (_p, text) => console.log('COMMENT\n' + text),
      });
      res.writeHead(out.status, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(out.json));
    }
    try {
      const f = readFileSync(`dist/client${path === '/' ? '/index.html' : path}`);
      res.writeHead(200, { 'content-type': path.endsWith('.js') ? 'text/javascript' : 'text/html' });
      res.end(f);
    } catch {
      res.writeHead(404).end();
    }
  })
  .listen(4300, () => console.log('Post page on http://localhost:4300'));
