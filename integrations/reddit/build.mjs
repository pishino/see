// Build the Reddit app: the post's page (dist/client) and its server (dist/server/index.cjs), each one file.
import { copyFileSync, mkdirSync } from 'node:fs';
import { rolldown } from 'rolldown';

mkdirSync('dist/client', { recursive: true });
const client = await rolldown({ input: 'src/client/main.ts', platform: 'browser' });
await client.write({ file: 'dist/client/main.js', format: 'esm', minify: true });
copyFileSync('src/client/index.html', 'dist/client/index.html');

const server = await rolldown({ input: 'src/server/index.ts', platform: 'node' });
await server.write({ file: 'dist/server/index.cjs', format: 'cjs', minify: true });
console.log('Built dist/client and dist/server/index.cjs');
